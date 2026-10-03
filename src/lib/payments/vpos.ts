import type { PaymentProvider, ChargeStatus } from "./types";

/**
 * vPOS (https://vpos.ao) — agregador certificado para EMIS GPO / Multicaixa Express.
 * Requisitos (pedidos ao banco + vPOS):
 *   VPOS_TOKEN        token gerado no portal merchant.vpos.ao
 *   VPOS_POS_ID       POS ID atribuído pela EMIS
 * Fluxo:
 *   POST /api/v1/transactions  → 202 + Location: /api/v1/requests/{id}
 *   GET  /api/v1/requests/{id} → 200 (ainda a processar) | 303 Location: /api/v1/transactions/{id}
 *   GET  /api/v1/transactions/{id} → { status: "accepted" | "rejected" | ... }
 */
export class VposProvider implements PaymentProvider {
  readonly id = "vpos";
  private host = process.env.VPOS_HOST ?? "https://api.vpos.ao";

  constructor(
    private token: string,
    private posId: string,
  ) {}

  private headers(extra: Record<string, string> = {}) {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
      ...extra,
    };
  }

  async createCharge({ paymentId, phone, amountKz, callbackUrl }: Parameters<PaymentProvider["createCharge"]>[0]) {
    const res = await fetch(`${this.host}/api/v1/transactions`, {
      method: "POST",
      redirect: "manual",
      headers: this.headers({ "Idempotency-Key": paymentId }),
      body: JSON.stringify({
        type: "payment",
        pos_id: Number(this.posId),
        mobile: phone,
        amount: amountKz.toFixed(2),
        callback_url: callbackUrl,
      }),
    });
    const location = res.headers.get("location");
    if (res.status !== 202 || !location) {
      const body = await res.text().catch(() => "");
      throw new Error(`vPOS recusou o pedido (${res.status}) ${body.slice(0, 200)}`);
    }
    return { providerRef: location.split("/").pop()! };
  }

  async fetchStatus(payment: Parameters<PaymentProvider["fetchStatus"]>[0]): Promise<ChargeStatus> {
    const ref = payment.providerRef;
    if (!ref) return { status: "falhou", reason: "Sem referência do provedor" };

    let transactionId = ref;
    const req = await fetch(`${this.host}/api/v1/requests/${ref}`, {
      redirect: "manual",
      headers: this.headers(),
    });
    if (req.status === 200) return { status: "pendente" };
    if (req.status === 303) {
      transactionId = req.headers.get("location")?.split("/").pop() ?? ref;
    }

    const tx = await fetch(`${this.host}/api/v1/transactions/${transactionId}`, { headers: this.headers() });
    if (tx.status === 404) return { status: "pendente" };
    if (!tx.ok) throw new Error(`vPOS respondeu ${tx.status}`);
    const json = (await tx.json()) as { data?: { status?: string; status_reason?: unknown }; status?: string; status_reason?: unknown };
    const data = json.data ?? json;
    const status = String(data.status ?? "").toLowerCase();
    if (status === "accepted") return { status: "pago" };
    if (status === "rejected" || status === "failed") {
      return { status: "falhou", reason: data.status_reason ? String(data.status_reason) : "Pagamento recusado" };
    }
    return { status: "pendente" };
  }
}
