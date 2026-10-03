import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { daysLeft, effectivePlan } from "@/lib/billing";
import { PLANS } from "@/lib/plans";
import { logout } from "@/app/actions/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, workspace } = await requireSession();
  const plan = effectivePlan(workspace);
  const left = daysLeft(workspace);
  const expiringSoon = workspace.plan !== "gratis" && left !== null && left <= 7;

  return (
    <div className="flex flex-1 flex-col">
      <header className="no-print sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Logo />
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/app" className="rounded-md px-2.5 py-1.5 hover:bg-paper-2">Painel</Link>
            <Link href="/app/plano" className="rounded-md px-2.5 py-1.5 hover:bg-paper-2">Plano</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/app/plano" className="hidden rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium sm:inline">
              {workspace.name} · {PLANS[plan].name}
            </Link>
            <form action={logout}>
              <button className="grid size-8 cursor-pointer place-items-center rounded-md hover:bg-paper-2" title={`Sair (${user.email})`}>
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {expiringSoon && (
        <div className="no-print border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2 text-sm text-amber-900">
            {left! > 0
              ? `O seu plano ${PLANS[workspace.plan].name} termina em ${left} dia(s).`
              : plan === "gratis"
                ? "O seu plano terminou e a conta voltou ao Grátis."
                : "O seu plano terminou. Tem alguns dias de tolerância para renovar."}
            <Link href="/app/plano" className="font-semibold underline">Renovar com Multicaixa Express</Link>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
