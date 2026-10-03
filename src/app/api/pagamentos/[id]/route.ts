import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSession } from "@/lib/auth";
import { syncPayment } from "@/lib/billing";

/** Estado de um pagamento (a página de espera consulta isto a cada poucos segundos) */
export async function GET(_req: Request, ctx: RouteContext<"/api/pagamentos/[id]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;

  const db = await getDb();
  const [own] = await db
    .select({ id: schema.payments.id })
    .from(schema.payments)
    .where(and(eq(schema.payments.id, id), eq(schema.payments.workspaceId, session.workspace.id)));
  if (!own) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const payment = await syncPayment(id);
  return NextResponse.json({ status: payment?.status, reason: payment?.statusReason ?? null });
}
