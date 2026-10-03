"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";

type Status = "pendente" | "pago" | "falhou";

export function PaymentWaiter({ id, initial, initialReason }: { id: string; initial: Status; initialReason: string | null }) {
  const [status, setStatus] = useState<Status>(initial);
  const [reason, setReason] = useState(initialReason);
  const router = useRouter();

  useEffect(() => {
    if (status !== "pendente") return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/pagamentos/${id}`, { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as { status: Status; reason: string | null };
          if (!stop) {
            setStatus(json.status);
            setReason(json.reason);
            if (json.status === "pago") router.refresh();
          }
        }
      } catch {
        /* tenta de novo no próximo ciclo */
      }
    };
    const t = setInterval(tick, 3000);
    tick();
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [id, status, router]);

  if (status === "pago") {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-ok" />
        <h1 className="mt-4 font-display text-4xl">Pagamento confirmado</h1>
        <p className="mt-2 text-ink-2">O seu plano já está activo. Obrigado!</p>
        <Link href="/app" className="btn-primary mt-6">Ir para o painel</Link>
      </div>
    );
  }

  if (status === "falhou") {
    return (
      <div className="text-center">
        <XCircle className="mx-auto size-14 text-rose-600" />
        <h1 className="mt-4 font-display text-4xl">O pagamento não foi concluído</h1>
        <p className="mt-2 text-ink-2">{reason ?? "O pedido foi recusado ou expirou."}</p>
        <Link href="/app/plano" className="btn-primary mt-6">Tentar novamente</Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="relative mx-auto grid size-20 place-items-center rounded-2xl bg-ink text-paper">
        <Smartphone className="size-9" />
        <Loader2 className="absolute -right-2 -top-2 size-7 animate-spin rounded-full bg-paper p-1 text-accent" />
      </div>
      <h1 className="mt-6 font-display text-4xl">Confirme no telemóvel</h1>
      <p className="mx-auto mt-2 max-w-sm text-ink-2">
        Abra a app <strong>Multicaixa Express</strong>, aceite o pedido de pagamento da Aprova e confirme com o seu PIN. Esta página actualiza sozinha.
      </p>
    </div>
  );
}
