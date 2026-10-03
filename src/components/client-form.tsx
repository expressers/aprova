"use client";

import { useActionState } from "react";
import { createClient, updateClient } from "@/app/actions/clients";
import type { Client } from "@/db/schema";
import { FormError, SubmitButton } from "./ui";

const COLORS = ["#FF5A1F", "#138A55", "#2563EB", "#9333EA", "#DB2777", "#CA8A04", "#161412"];

export function ClientForm({ client }: { client?: Client }) {
  const action = client ? updateClient.bind(null, client.id) : createClient;
  const [state, formAction] = useActionState(action, undefined);
  const saved = client && state && !state.error;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">Nome da marca</label>
        <input id="name" name="name" className="field" defaultValue={client?.name} placeholder="Ex.: Pastelaria Mukinda" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contactName">Quem aprova</label>
          <input id="contactName" name="contactName" className="field" defaultValue={client?.contactName ?? ""} placeholder="Ex.: Dona Teresa" />
        </div>
        <div>
          <label className="label" htmlFor="whatsapp">WhatsApp de quem aprova</label>
          <input id="whatsapp" name="whatsapp" inputMode="tel" className="field" defaultValue={client?.whatsapp ?? ""} placeholder="923 456 789" />
        </div>
      </div>
      <fieldset>
        <legend className="label">Cor</legend>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={(client?.color ?? COLORS[0]).toUpperCase() === c} className="peer sr-only" />
              <span className="block size-7 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-ink" style={{ background: c }} />
            </label>
          ))}
        </div>
      </fieldset>
      <FormError error={state?.error} />
      <div className="flex items-center gap-3">
        <SubmitButton>{client ? "Guardar" : "Adicionar marca"}</SubmitButton>
        {saved && <span className="text-sm text-ok">Guardado.</span>}
      </div>
    </form>
  );
}
