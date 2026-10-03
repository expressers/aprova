import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Criar conta" };

export default async function Page() {
  if (await getSession()) redirect("/app");
  return (
    <>
      <h1 className="font-display text-3xl">Comece grátis</h1>
      <p className="mb-6 mt-1 text-sm text-ink-2">Sem cartão. Uma marca incluída para sempre.</p>
      <RegisterForm />
    </>
  );
}
