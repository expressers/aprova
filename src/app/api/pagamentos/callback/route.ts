import { NextResponse, type NextRequest } from "next/server";
import { syncPayment, verifyPaymentSignature } from "@/lib/billing";

/**
 * Callback do provedor (vPOS / EMIS GPO).
 * Não confiamos no corpo do pedido: o URL leva o id do pagamento assinado (HMAC)
 * e o estado é sempre confirmado consultando o provedor.
 */
export async function POST(req: NextRequest) {
  const pid = req.nextUrl.searchParams.get("pid") ?? "";
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!pid || !sig || !verifyPaymentSignature(pid, sig)) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }
  const payment = await syncPayment(pid);
  if (!payment) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true, status: payment.status });
}
