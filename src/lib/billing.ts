import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, count, eq, gte } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Plan, Payment, Workspace } from "@/db/schema";
import { GRACE_DAYS, PLANS, priceFor } from "./plans";
import { getPaymentProvider } from "./payments";
import { appUrl } from "./utils";

const DAY = 24 * 60 * 60 * 1000;
const PENDING_TIMEOUT_MS = 10 * 60 * 1000; // um pedido MCX Express não confirmado em 10 min expira

/** Plano em vigor (cai para Grátis depois do período + tolerância) */
export function effectivePlan(ws: Pick<Workspace, "plan" | "planExpiresAt">): Plan {
  if (ws.plan === "gratis" || !ws.planExpiresAt) return "gratis";
  return ws.planExpiresAt.getTime() + GRACE_DAYS * DAY > Date.now() ? ws.plan : "gratis";
}

export function daysLeft(ws: Pick<Workspace, "planExpiresAt">): number | null {
  if (!ws.planExpiresAt) return null;
  return Math.ceil((ws.planExpiresAt.getTime() - Date.now()) / DAY);
}

export async function usage(workspaceId: string) {
  const db = await getDb();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [[c], [p]] = await Promise.all([
    db.select({ n: count() }).from(schema.clients).where(eq(schema.clients.workspaceId, workspaceId)),
    db
      .select({ n: count() })
      .from(schema.posts)
      .where(and(eq(schema.posts.workspaceId, workspaceId), gte(schema.posts.createdAt, monthStart))),
  ]);
  return { clients: Number(c.n), postsThisMonth: Number(p.n) };
}

export async function canAddClient(ws: Workspace) {
  const plan = PLANS[effectivePlan(ws)];
  const u = await usage(ws.id);
  return { ok: u.clients < plan.maxClients, limit: plan.maxClients, plan };
}

export async function canAddPost(ws: Workspace) {
  const plan = PLANS[effectivePlan(ws)];
  const u = await usage(ws.id);
  return { ok: u.postsThisMonth < plan.maxPostsPerMonth, limit: plan.maxPostsPerMonth, plan };
}

// ---------- assinatura do callback ----------
function callbackSecret() {
  return process.env.PAYMENTS_CALLBACK_SECRET ?? process.env.AUTH_SECRET ?? "dev-only-callback-secret";
}
export function signPaymentId(id: string) {
  return createHmac("sha256", callbackSecret()).update(id).digest("hex");
}
export function verifyPaymentSignature(id: string, sig: string) {
  const expected = Buffer.from(signPaymentId(id));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// ---------- fluxo de pagamento ----------
export async function startPayment(ws: Workspace, plan: Plan, months: number, phone: string): Promise<Payment> {
  const amountKz = priceFor(plan, months);
  const provider = getPaymentProvider();
  const db = await getDb();
  const [payment] = await db
    .insert(schema.payments)
    .values({ workspaceId: ws.id, plan, months, amountKz, phone, provider: provider.id })
    .returning();

  const callbackUrl = `${appUrl()}/api/pagamentos/callback?pid=${payment.id}&sig=${signPaymentId(payment.id)}`;
  try {
    const { providerRef } = await provider.createCharge({ paymentId: payment.id, phone, amountKz, callbackUrl });
    const [updated] = await db
      .update(schema.payments)
      .set({ providerRef })
      .where(eq(schema.payments.id, payment.id))
      .returning();
    return updated;
  } catch (err) {
    console.error("[pagamentos] falha ao criar cobrança", err);
    const [failed] = await db
      .update(schema.payments)
      .set({ status: "falhou", statusReason: "Não foi possível contactar o Multicaixa Express. Tente novamente." })
      .where(eq(schema.payments.id, payment.id))
      .returning();
    return failed;
  }
}

/**
 * Consulta o provedor e, se pago, activa o plano.
 * Idempotente: só um pedido consegue passar o pagamento de "pendente" para "pago".
 */
export async function syncPayment(paymentId: string): Promise<Payment | null> {
  const db = await getDb();
  const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.id, paymentId)).limit(1);
  if (!payment || payment.status !== "pendente") return payment ?? null;

  let result;
  try {
    result = await getPaymentProvider().fetchStatus(payment);
  } catch (err) {
    console.error("[pagamentos] falha ao consultar estado", err);
    return payment;
  }

  if (result.status === "pendente") {
    if (Date.now() - payment.createdAt.getTime() > PENDING_TIMEOUT_MS) {
      const [expired] = await db
        .update(schema.payments)
        .set({ status: "falhou", statusReason: "O pedido expirou sem confirmação na app Multicaixa Express." })
        .where(and(eq(schema.payments.id, payment.id), eq(schema.payments.status, "pendente")))
        .returning();
      return expired ?? payment;
    }
    return payment;
  }

  if (result.status === "falhou") {
    const [failed] = await db
      .update(schema.payments)
      .set({ status: "falhou", statusReason: result.reason ?? "Pagamento recusado" })
      .where(and(eq(schema.payments.id, payment.id), eq(schema.payments.status, "pendente")))
      .returning();
    return failed ?? payment;
  }

  return db.transaction(async (tx) => {
    const [paid] = await tx
      .update(schema.payments)
      .set({ status: "pago", paidAt: new Date() })
      .where(and(eq(schema.payments.id, payment.id), eq(schema.payments.status, "pendente")))
      .returning();
    if (!paid) {
      const [current] = await tx.select().from(schema.payments).where(eq(schema.payments.id, payment.id));
      return current;
    }
    const [ws] = await tx.select().from(schema.workspaces).where(eq(schema.workspaces.id, paid.workspaceId));
    const base = ws.planExpiresAt && ws.planExpiresAt.getTime() > Date.now() ? ws.planExpiresAt : new Date();
    const expires = new Date(base);
    expires.setUTCMonth(expires.getUTCMonth() + paid.months);
    await tx
      .update(schema.workspaces)
      .set({ plan: paid.plan, planExpiresAt: expires })
      .where(eq(schema.workspaces.id, ws.id));
    return paid;
  });
}
