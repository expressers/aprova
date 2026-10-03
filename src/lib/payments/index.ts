import "server-only";
import type { PaymentProvider } from "./types";
import { VposProvider } from "./vpos";
import { SimulatedProvider } from "./simulated";

export function getPaymentProvider(): PaymentProvider {
  const choice = process.env.PAYMENTS_PROVIDER ?? (process.env.VPOS_TOKEN ? "vpos" : "simulado");

  if (choice === "vpos") {
    const token = process.env.VPOS_TOKEN;
    const posId = process.env.VPOS_POS_ID;
    if (!token || !posId) throw new Error("VPOS_TOKEN e VPOS_POS_ID são obrigatórios para o vPOS.");
    return new VposProvider(token, posId);
  }

  if (choice === "simulado") {
    if (process.env.NODE_ENV === "production" && process.env.PAYMENTS_PROVIDER !== "simulado") {
      throw new Error("Pagamentos não configurados: defina VPOS_TOKEN e VPOS_POS_ID.");
    }
    return new SimulatedProvider();
  }

  throw new Error(`Provedor de pagamentos desconhecido: ${choice}`);
}

export type { PaymentProvider } from "./types";
