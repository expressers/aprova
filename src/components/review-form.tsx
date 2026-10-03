"use client";

import { useActionState } from "react";
import { Check, PencilLine } from "lucide-react";
import { reviewPost } from "@/app/actions/approval";
import { FormError, SubmitButton } from "./ui";

export function ReviewForm({ token, postId, defaultName }: { token: string; postId: string; defaultName: string }) {
  const [state, action] = useActionState(reviewPost.bind(null, token, postId), undefined);

  if (state?.done === "aprovado") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 font-medium text-emerald-800">
        <Check className="size-5" /> Aprovado. Obrigado!
      </div>
    );
  }
  if (state?.done === "alteracoes") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 font-medium text-rose-800">
        <PencilLine className="size-5" /> Pedido de alterações enviado à equipa.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor={`name-${postId}`}>O seu nome</label>
        <input id={`name-${postId}`} name="name" className="field" defaultValue={defaultName} required autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor={`comment-${postId}`}>Comentário <span className="font-normal text-ink-2">(obrigatório para pedir alterações)</span></label>
        <textarea id={`comment-${postId}`} name="comment" rows={3} className="field" placeholder="Ex.: Trocar o preço para 2.500 Kz e usar a foto da loja do Kilamba." />
      </div>
      <FormError error={state?.error} />
      <div className="grid grid-cols-2 gap-2">
        <SubmitButton name="decision" value="alterar" className="btn-ghost py-3">
          <PencilLine className="size-4" /> Pedir alterações
        </SubmitButton>
        <SubmitButton name="decision" value="aprovar" className="btn bg-ok py-3 text-white hover:bg-ok/85">
          <Check className="size-4" /> Aprovar
        </SubmitButton>
      </div>
    </form>
  );
}
