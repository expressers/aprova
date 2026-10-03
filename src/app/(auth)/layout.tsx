import type { ReactNode } from "react";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Logo className="mb-8" />
      <div className="card w-full max-w-sm p-6 sm:p-8">{children}</div>
    </main>
  );
}
