import type { PaymentProvider, ChargeStatus } from "./types";

/**
 * Provedor simulado para desenvolvimento e demonstrações.
 * - Aprova o pagamento ~6 segundos depois do pedido (como se o cliente confirmasse na app).
 * - Números terminados em 000 são recusados, para testar o caminho de erro.
 * Nunca é usado em produção, a menos que PAYMENTS_PROVIDER=simulado seja definido explicitamente.
 */
export class SimulatedProvider implements PaymentProvider {
  readonly id = "simulado";

  async createCharge({ paymentId }: Parameters<PaymentProvider["createCharge"]>[0]) {
    return { providerRef: `sim_${paymentId}` };
  }

  async fetchStatus(payment: Parameters<PaymentProvider["fetchStatus"]>[0]): Promise<ChargeStatus> {
    if (payment.phone.endsWith("000")) return { status: "falhou", reason: "Recusado pelo cliente (simulação)" };
    const elapsed = Date.now() - new Date(payment.createdAt).getTime();
    return elapsed > 6_000 ? { status: "pago" } : { status: "pendente" };
  }
}
