import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireSession } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { formatKz } from "@/lib/utils";
import { PaymentWaiter } from "@/components/payment-waiter";

export const metadata = { title: "Pagamento" };

export default async function PaymentPage(props: PageProps<"/app/plano/pagamento/[id]">) {
  const { workspace } = await requireSession();
  const { id } = await props.params;
  const db = await getDb();
  const [payment] = await db
    .select()
    .from(schema.payments)
    .where(and(eq(schema.payments.id, id), eq(schema.payments.workspaceId, workspace.id)));
  if (!payment) notFound();

  return (
    <div className="card mx-auto max-w-lg p-8 sm:p-10">
      <PaymentWaiter id={payment.id} initial={payment.status} initialReason={payment.statusReason} />
      <dl className="mt-8 grid grid-cols-2 gap-y-2 border-t border-line pt-6 text-sm">
        <dt className="text-ink-2">Plano</dt>
        <dd className="text-right">{PLANS[payment.plan].name} · {payment.months} {payment.months === 1 ? "mês" : "meses"}</dd>
        <dt className="text-ink-2">Valor</dt>
        <dd className="text-right font-semibold">{formatKz(payment.amountKz)}</dd>
        <dt className="text-ink-2">Número</dt>
        <dd className="text-right">+244 {payment.phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}</dd>
        {payment.provider === "simulado" && (
          <dd className="col-span-2 mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Modo de simulação: nenhum dinheiro real é cobrado. Configure o vPOS para pagamentos reais.
          </dd>
        )}
      </dl>
    </div>
  );
}
