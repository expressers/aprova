"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" className="btn-primary" onClick={() => window.print()}>
      <Printer className="size-4" /> Imprimir / guardar PDF
    </button>
  );
}
