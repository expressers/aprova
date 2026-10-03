import Link from "next/link";
import type { Post } from "@/db/schema";
import { cx, monthRange, todayLuanda, STATUS_META, NETWORKS } from "@/lib/utils";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DOT: Record<string, string> = {
  rascunho: "bg-stone-400",
  em_aprovacao: "bg-amber-500",
  alteracoes: "bg-rose-500",
  aprovado: "bg-emerald-600",
  publicado: "bg-sky-600",
};

/** Calendário mensal (segunda a domingo). Em telemóvel mostra uma lista por dia. */
export function MonthCalendar({ month, posts, newHref }: { month: string; posts: Post[]; newHref: (date: string) => string }) {
  const { end } = monthRange(month);
  const daysInMonth = Number(end.slice(8));
  const [y, m] = month.split("-").map(Number);
  const firstWeekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // 0 = segunda
  const today = todayLuanda();

  const byDay = new Map<string, Post[]>();
  for (const p of posts) byDay.set(p.scheduledFor, [...(byDay.get(p.scheduledFor) ?? []), p]);

  const cells: (string | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7) cells.push(null);

  return (
    <>
      <div className="card hidden overflow-hidden md:block">
        <div className="grid grid-cols-7 border-b border-line bg-paper text-xs font-medium text-ink-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => (
            <div key={i} className={cx("group min-h-28 border-b border-r border-line p-1.5", !date && "bg-paper/60", i % 7 === 6 && "border-r-0")}>
              {date && (
                <>
                  <div className="flex items-center justify-between">
                    <span className={cx("grid size-6 place-items-center rounded-full text-xs", date === today && "bg-accent font-semibold text-white")}>
                      {Number(date.slice(8))}
                    </span>
                    <Link href={newHref(date)} className="rounded px-1 text-xs text-ink-2 opacity-0 hover:bg-paper-2 group-hover:opacity-100" title="Novo post neste dia">
                      +
                    </Link>
                  </div>
                  <ul className="mt-1 space-y-1">
                    {(byDay.get(date) ?? []).map((p) => (
                      <li key={p.id}>
                        <Link href={`/app/posts/${p.id}`} className="flex items-center gap-1.5 rounded-md bg-paper px-1.5 py-1 text-xs hover:bg-paper-2" title={STATUS_META[p.status].label}>
                          <span className={cx("size-1.5 shrink-0 rounded-full", DOT[p.status])} />
                          <span className="truncate">{p.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <ul className="card divide-y divide-line md:hidden">
        {posts.length === 0 && <li className="p-4 text-sm text-ink-2">Sem posts neste mês.</li>}
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/app/posts/${p.id}`} className="flex items-center gap-3 px-4 py-3">
              <span className="w-8 text-center font-display text-2xl">{Number(p.scheduledFor.slice(8))}</span>
              <span className={cx("size-2 shrink-0 rounded-full", DOT[p.status])} />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{p.title}</span>
                <span className="text-xs text-ink-2">{NETWORKS[p.network]} · {STATUS_META[p.status].label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        {Object.entries(STATUS_META).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={cx("size-2 rounded-full", DOT[k])} /> {v.label}
          </span>
        ))}
      </div>
    </>
  );
}
