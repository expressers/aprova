"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { startPayment } from "@/lib/billing";
import { PERIODS } from "@/lib/plans";
import { normalizeAoPhone } from "@/lib/utils";
import type { FormState } from "./auth";

const checkoutSchema = z.object({
  plan: z.enum(["pro", "agencia"]),
  months: z.coerce.number().refine((m) => PERIODS.some((p) => p.months === m), "Período inválido."),
  phone: z.string(),
});

export async function checkout(_: FormState, form: FormData): Promise<FormState> {
  const { workspace } = await requireSession();
  const parsed = checkoutSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const phone = normalizeAoPhone(parsed.data.phone);
  if (!phone) return { error: "Indique o número associado ao Multicaixa Express (ex.: 923 456 789)." };

  let paymentId: string;
  try {
    const payment = await startPayment(workspace, parsed.data.plan, parsed.data.months, phone);
    paymentId = payment.id;
  } catch (e) {
    console.error("[checkout]", e);
    return { error: "Os pagamentos estão temporariamente indisponíveis. Tente mais tarde." };
  }
  redirect(`/app/plano/pagamento/${paymentId}`);
}
