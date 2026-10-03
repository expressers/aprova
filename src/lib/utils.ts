import type { PostStatus } from "@/db/schema";

export function formatKz(value: number): string {
  return new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 }).format(value) + " Kz";
}

export function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  const d = typeof value === "string" ? new Date(value + (value.length === 10 ? "T12:00:00" : "")) : value;
  return new Intl.DateTimeFormat("pt-PT", { timeZone: "Africa/Luanda", ...opts }).format(d);
}

/** "2026-10" do mês actual em Luanda */
export function currentMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Luanda", year: "numeric", month: "2-digit" }).format(new Date());
  return parts.slice(0, 7);
}

export function todayLuanda(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Luanda" }).format(new Date());
}

export function daysFromToday(days: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Luanda" }).format(new Date(Date.now() + days * 864e5));
}

export function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${month}-01`, end: `${month}-${String(last).padStart(2, "0")}` };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isValidMonth(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}

/** Normaliza números angolanos para 9 dígitos começados por 9 (ex.: 923456789) */
export function normalizeAoPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "").replace(/^00/, "").replace(/^244/, "");
  return /^9\d{8}$/.test(digits) ? digits : null;
}

export function whatsappLink(phone: string | null | undefined, text: string): string {
  const n = phone ? normalizeAoPhone(phone) : null;
  const base = n ? `https://wa.me/244${n}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export const STATUS_META: Record<PostStatus, { label: string; tone: string }> = {
  rascunho: { label: "Rascunho", tone: "bg-stone-200 text-stone-700" },
  em_aprovacao: { label: "Em aprovação", tone: "bg-amber-100 text-amber-800" },
  alteracoes: { label: "Pediu alterações", tone: "bg-rose-100 text-rose-700" },
  aprovado: { label: "Aprovado", tone: "bg-emerald-100 text-emerald-800" },
  publicado: { label: "Publicado", tone: "bg-sky-100 text-sky-800" },
};

export const NETWORKS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  x: "X",
  youtube: "YouTube",
  whatsapp: "WhatsApp Status",
};

export const FORMATS: Record<string, string> = {
  imagem: "Imagem",
  carrossel: "Carrossel",
  video: "Vídeo",
  reels: "Reels",
  story: "Story",
  texto: "Texto",
};

export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function isVideo(name: string | null | undefined) {
  return !!name && name.endsWith(".mp4");
}

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
