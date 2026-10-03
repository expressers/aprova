"use client";

import { useActionState, useState } from "react";
import { Smartphone } from "lucide-react";
import { checkout } from "@/app/actions/billing";
import { PERIODS, PLANS } from "@/lib/plans";
import { cx, formatKz } from "@/lib/utils";
import { FormError, SubmitButton } from "./ui";

type PaidPlan = "pro" | "agencia";

function price(plan: PaidPlan, months: number) {
  const p = PERIODS.find((x) => x.months === months)!;
  return Math.round(PLANS[plan].priceKz * months * (1 - p.discount));
}

export function CheckoutForm({ defaultPlan }: { defaultPlan: PaidPlan }) {
  const [state, action] = useActionState(checkout, undefined);
  const [plan, setPlan] = useState<PaidPlan>(defaultPlan);
  const [months, setMonths] = useState(1);

  return (
    <form action={action} className="space-y-5">
      <fieldset>
        <legend className="label">Plano</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["pro", "agencia"] as const).map((p) => (
            <label key={p} className={cx("cursor-pointer rounded-xl border p-3", plan === p ? "border-ink bg-paper" : "border-line")}>
              <input type="radio" name="plan" value={p} checked={plan === p} onChange={() => setPlan(p)} className="sr-only" />
              <span className="block font-semibold">{PLANS[p].name}</span>
              <span className="text-sm text-ink-2">{formatKz(PLANS[p].priceKz)}/mês</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Período</legend>
        <div className="grid grid-cols-3 gap-2">
          {PERIODS.map((p) => (
            <label key={p.months} className={cx("cursor-pointer rounded-xl border p-3 text-center text-sm", months === p.months ? "border-ink bg-paper" : "border-line")}>
              <input type="radio" name="months" value={p.months} checked={months === p.months} onChange={() => setMonths(p.months)} className="sr-only" />
              <span className="block font-medium">{p.months === 1 ? "1 mês" : `${p.months} meses`}</span>
              {p.discount > 0 && <span className="text-xs text-ok">−{p.discount * 100}%</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="phone">Número do Multicaixa Express</label>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-line bg-paper px-3 py-2.5 text-[15px] text-ink-2">+244</span>
          <input id="phone" name="phone" inputMode="tel" className="field" placeholder="923 456 789" required />
        </div>
        <p className="mt-1 text-xs text-ink-2">Vai receber um pedido de pagamento na app Multicaixa Express para confirmar com o seu PIN.</p>
      </div>

      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-ink-2">Total</span>
        <span className="font-display text-4xl">{formatKz(price(plan, months))}</span>
      </div>

      <FormError error={state?.error} />
      <SubmitButton className="btn-accent w-full py-3">
        <Smartphone className="size-4" /> Pagar com Multicaixa Express
      </SubmitButton>
    </form>
  );
}
