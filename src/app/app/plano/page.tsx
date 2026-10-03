import { desc, eq } from "drizzle-orm";
import { Check } from "lucide-react";
import { getDb, schema } from "@/db";
import { requireSession } from "@/lib/auth";
import { daysLeft, effectivePlan, usage } from "@/lib/billing";
import { PLANS } from "@/lib/plans";
import { cx, formatDate, formatKz } from "@/lib/utils";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata = { title: "Plano" };

const PAYMENT_LABEL = { pendente: "Pendente", pago: "Pago", falhou: "Falhou" } as const;

export default async function PlanPage() {
  const { workspace } = await requireSession();
  const plan = effectivePlan(workspace);
  const left = daysLeft(workspace);
  const db = await getDb();
  const [u, history] = await Promise.all([
    usage(workspace.id),
    db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.workspaceId, workspace.id))
      .orderBy(desc(schema.payments.createdAt))
      .limit(10),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-4xl">Plano e pagamentos</h1>
        <p className="mt-1 text-ink-2">
          Está no plano <strong className="text-ink">{PLANS[plan].name}</strong>
          {plan !== "gratis" && workspace.planExpiresAt && (
            <> até {formatDate(workspace.planExpiresAt, { day: "numeric", month: "long", year: "numeric" })}{left !== null && left >= 0 && ` (${left} dias)`}</>
          )}
          . Usa {u.clients} de {PLANS[plan].maxClients} marca(s).
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <section className="grid gap-4 sm:grid-cols-3">
          {Object.values(PLANS).map((p) => (
            <div key={p.id} className={cx("card flex flex-col p-5", p.id === plan && "border-ink ring-1 ring-ink")}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{p.name}</h2>
                {p.id === plan && <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-paper">Actual</span>}
              </div>
              <div className="mt-2 font-display text-3xl">{p.priceKz ? formatKz(p.priceKz) : "0 Kz"}</div>
              <div className="text-xs text-ink-2">{p.priceKz ? "por mês" : "para sempre"}</div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-ok" /> {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="card p-6">
          <h2 className="mb-1 text-lg font-semibold">{plan === "gratis" ? "Fazer upgrade" : "Renovar ou mudar de plano"}</h2>
          <p className="mb-5 text-sm text-ink-2">
            Pagamento único por período, sem débito automático. Os dias que ainda tem são somados ao novo período.
          </p>
          <CheckoutForm defaultPlan={plan === "agencia" ? "agencia" : "pro"} />
        </section>
      </div>

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Pagamentos</h2>
          <ul className="card divide-y divide-line text-sm">
            {history.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <span className="w-28 text-ink-2">{formatDate(p.createdAt, { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="flex-1">{PLANS[p.plan].name} · {p.months} {p.months === 1 ? "mês" : "meses"}</span>
                <span className="font-medium">{formatKz(p.amountKz)}</span>
                <span className={cx("rounded-full px-2 py-0.5 text-xs", p.status === "pago" ? "bg-emerald-100 text-emerald-800" : p.status === "falhou" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800")}>
                  {PAYMENT_LABEL[p.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
