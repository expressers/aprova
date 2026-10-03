"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, register } from "@/app/actions/auth";
import { FormError, SubmitButton } from "./ui";

export function RegisterForm() {
  const [state, action] = useActionState(register, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">O seu nome</label>
        <input id="name" name="name" className="field" autoComplete="name" required />
      </div>
      <div>
        <label className="label" htmlFor="workspace">Agência ou marca pessoal</label>
        <input id="workspace" name="workspace" className="field" placeholder="Ex.: Kianda Social" required />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Palavra-passe</label>
        <input id="password" name="password" type="password" minLength={8} className="field" autoComplete="new-password" required />
      </div>
      <FormError error={state?.error} />
      <SubmitButton className="btn-accent w-full">Criar conta grátis</SubmitButton>
      <p className="text-center text-sm text-ink-2">
        Já tem conta? <Link href="/entrar" className="font-medium text-ink underline">Entrar</Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Palavra-passe</label>
        <input id="password" name="password" type="password" className="field" autoComplete="current-password" required />
      </div>
      <FormError error={state?.error} />
      <SubmitButton className="btn-primary w-full">Entrar</SubmitButton>
      <p className="text-center text-sm text-ink-2">
        Ainda não tem conta? <Link href="/registar" className="font-medium text-ink underline">Criar conta</Link>
      </p>
    </form>
  );
}
