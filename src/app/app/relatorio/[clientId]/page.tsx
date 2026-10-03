import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireSession } from "@/lib/auth";
import { effectivePlan } from "@/lib/billing";
import { currentMonth, formatDate, isValidMonth, monthRange, NETWORKS, FORMATS, STATUS_META } from "@/lib/utils";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Relatório" };

export default async function ReportPage(props: PageProps<"/app/relatorio/[clientId]">) {
  const { workspace } = await requireSession();
  const { clientId } = await props.params;
  const sp = await props.searchParams;
  const month = isValidMonth(sp.mes) ? sp.mes : currentMonth();
  const plan = effectivePlan(workspace);

  const db = await getDb();
  const [client] = await db
    .select()
    .from(schema.clients)
    .where(and(eq(schema.clients.id, clientId), eq(schema.clients.workspaceId, workspace.id)));
  if (!client) notFound();

  if (plan === "gratis") {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="font-display text-3xl">Relatórios mensais</h1>
        <p className="mt-2 text-ink-2">
          Mostre ao cliente tudo o que foi entregue no mês — posts, aprovações e rondas de alterações. Disponível nos planos Pro e Agência.
        </p>
        <Link href="/app/plano" className="btn-accent mt-6">Ver planos</Link>
      </div>
    );
  }

  const { start, end } = monthRange(month);
  const posts = await db
    .select()
    .from(schema.posts)
    .where(and(eq(schema.posts.clientId, client.id), gte(schema.posts.scheduledFor, start), lte(schema.posts.scheduledFor, end)))
    .orderBy(asc(schema.posts.scheduledFor));

  const count = (s: string) => posts.filter((p) => p.status === s).length;
  const revisions = posts.reduce((n, p) => n + p.revisionCount, 0);
  const byNetwork = Object.entries(
    posts.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.network]: (acc[p.network] ?? 0) + 1 }), {}),
  );
  const monthLabel = formatDate(`${month}-01`, { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/app/clientes/${client.id}?mes=${month}`} className="text-sm text-ink-2 hover:underline">← {client.name}</Link>
        <PrintButton />
      </div>

      <article className="card p-8 print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-ink-2">Relatório de conteúdo</p>
            <h1 className="font-display text-4xl">{client.name}</h1>
            <p className="capitalize text-ink-2">{monthLabel}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{workspace.name}</p>
            <p className="text-ink-2">Gerado a {formatDate(new Date(), { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 border-b border-line py-6 sm:grid-cols-4">
          {[
            ["Posts planeados", posts.length],
            ["Publicados", count("publicado")],
            ["Aprovados", count("aprovado") + count("publicado")],
            ["Rondas de alterações", revisions],
          ].map(([label, n]) => (
            <div key={label}>
              <div className="font-display text-4xl">{n}</div>
              <div className="text-sm text-ink-2">{label}</div>
            </div>
          ))}
        </section>

        {byNetwork.length > 0 && (
          <p className="border-b border-line py-4 text-sm text-ink-2">
            Por rede: {byNetwork.map(([k, n]) => `${NETWORKS[k] ?? k} (${n})`).join(" · ")}
          </p>
        )}

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-2">
              <th className="py-2 pr-3 font-medium">Data</th>
              <th className="py-2 pr-3 font-medium">Post</th>
              <th className="py-2 pr-3 font-medium">Rede</th>
              <th className="py-2 pr-3 font-medium">Estado</th>
              <th className="py-2 font-medium">Aprovado por</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-line/70 align-top">
                <td className="py-2 pr-3 whitespace-nowrap">{formatDate(p.scheduledFor)}</td>
                <td className="py-2 pr-3">
                  {p.title}
                  <span className="block text-xs text-ink-2">{FORMATS[p.format]}{p.revisionCount > 0 && ` · ${p.revisionCount} ronda(s) de alterações`}</span>
                </td>
                <td className="py-2 pr-3">{NETWORKS[p.network]}</td>
                <td className="py-2 pr-3">{STATUS_META[p.status].label}</td>
                <td className="py-2">{p.approvedBy ?? "—"}</td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink-2">Sem posts neste mês.</td>
              </tr>
            )}
          </tbody>
        </table>

        {plan !== "agencia" && <p className="mt-8 text-center text-xs text-ink-2">Gerado com aprova</p>}
      </article>
    </div>
  );
}
