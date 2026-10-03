import type { Plan } from "@/db/schema";

export type PlanInfo = {
  id: Plan;
  name: string;
  priceKz: number; // por mês
  maxClients: number; // marcas/clientes activos
  maxPostsPerMonth: number; // por workspace, Infinity = ilimitado
  pitch: string;
  features: string[];
};

export const PLANS: Record<Plan, PlanInfo> = {
  gratis: {
    id: "gratis",
    name: "Grátis",
    priceKz: 0,
    maxClients: 1,
    maxPostsPerMonth: 15,
    pitch: "Para experimentar com uma marca.",
    features: ["1 marca", "15 posts por mês", "Link de aprovação para o cliente", "Calendário de conteúdo"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceKz: 9_900,
    maxClients: 5,
    maxPostsPerMonth: Number.POSITIVE_INFINITY,
    pitch: "Para gestores de redes sociais freelancer.",
    features: [
      "Até 5 marcas",
      "Posts ilimitados",
      "Contador de rondas de alterações",
      "Relatório mensal por cliente",
      "Envio para aprovação por WhatsApp",
    ],
  },
  agencia: {
    id: "agencia",
    name: "Agência",
    priceKz: 29_900,
    maxClients: 25,
    maxPostsPerMonth: Number.POSITIVE_INFINITY,
    pitch: "Para agências com várias contas.",
    features: [
      "Até 25 marcas",
      "Tudo do Pro",
      "Relatórios só com a marca da agência (sem «aprova»)",
      "Suporte prioritário por WhatsApp",
    ],
  },
};

/** Períodos de pagamento: meses → desconto */
export const PERIODS = [
  { months: 1, discount: 0, label: "1 mês" },
  { months: 3, discount: 0.1, label: "3 meses (−10%)" },
  { months: 12, discount: 0.2, label: "12 meses (−20%)" },
] as const;

export function priceFor(plan: Plan, months: number): number {
  const period = PERIODS.find((p) => p.months === months);
  if (!period || plan === "gratis") throw new Error("Plano ou período inválido");
  return Math.round(PLANS[plan].priceKz * months * (1 - period.discount));
}

/** Dias de tolerância depois do fim do período antes de cair para o Grátis */
export const GRACE_DAYS = 3;
