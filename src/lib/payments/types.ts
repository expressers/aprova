import type { Payment } from "@/db/schema";

export type ChargeStatus = { status: "pendente" | "pago" | "falhou"; reason?: string };

/**
 * Um provedor de pagamentos Multicaixa Express.
 * O cliente recebe um pedido na app MCX Express (push pelo número de telemóvel)
 * e confirma com o PIN. O resultado chega por callback e/ou por consulta.
 */
export interface PaymentProvider {
  readonly id: string;
  createCharge(input: {
    paymentId: string;
    phone: string; // 9 dígitos, ex.: 923456789
    amountKz: number;
    callbackUrl: string;
  }): Promise<{ providerRef: string }>;
  fetchStatus(payment: Payment): Promise<ChargeStatus>;
}
