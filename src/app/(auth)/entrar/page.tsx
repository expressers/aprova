import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Entrar" };

export default async function Page() {
  if (await getSession()) redirect("/app");
  return (
    <>
      <h1 className="mb-6 font-display text-3xl">Bem-vindo de volta</h1>
      <LoginForm />
    </>
  );
}
