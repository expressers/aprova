import Link from "next/link";
import { and, asc, count, eq, gte, lte, sql } from "drizzle-orm";
import { ArrowRight, Plus } from "lucide-react";
import { getDb, schema } from "@/db";
import { requireSession } from "@/lib/auth";
import { effectivePlan, usage } from "@/lib/billing";
import { PLANS } from "@/lib/plans";
import { daysFromToday, formatDate, todayLuanda, NETWORKS } from "@/lib/utils";
import { ClientForm } from "@/components/client-form";
import { StatusBadge } from "@/components/ui";

export const metadata = { title: "Painel" };

export default async function Dashboard() {
  const { user, workspace } = await requireSession();
  const db = await getDb();
  const today = todayLuanda();
  const in14 = daysFromToday(14);

  const [clients, statusCounts, upcoming, u] = await Promise.all([
    db
      .select({
        client: schema.clients,
        waiting: sql<number>`count(${schema.posts.id}) filter (where ${schema.posts.status} = 'em_aprovacao')`.mapWith(Number),
        changes: sql<number>`count(${schema.posts.id}) filter (where ${schema.posts.status} = 'alteracoes')`.mapWith(Number),
      })
      .from(schema.clients)
      .leftJoin(schema.posts, eq(schema.posts.clientId, schema.clients.id))
      .where(eq(schema.clients.workspaceId, workspace.id))
      .groupBy(schema.clients.id)
      .orderBy(asc(schema.clients.name)),
    db
      .select({ status: schema.posts.status, n: count() })
      .from(schema.posts)
      .where(eq(schema.posts.workspaceId, workspace.id))
      .groupBy(schema.posts.status),
    db
      .select({ post: schema.posts, clientName: schema.clients.name, color: schema.clients.color })
      .from(schema.posts)
      .innerJoin(schema.clients, eq(schema.clients.id, schema.posts.clientId))
      .where(
        and(
          eq(schema.posts.workspaceId, workspace.id),
          gte(schema.posts.scheduledFor, today),
          lte(schema.posts.scheduledFor, in14),
        ),
      )
      .orderBy(asc(schema.posts.scheduledFor))
      .limit(12),
    usage(workspace.id),
  ]);

  const byStatus = Object.fromEntries(statusCounts.map((s) => [s.status, Number(s.n)]));
  const plan = PLANS[effectivePlan(workspace)];
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-4xl">Olá, {firstName}.</h1>
        <p className="mt-1 text-ink-2">
          {plan.name} · {u.clients}/{plan.maxClients} marca(s)
          {Number.isFinite(plan.maxPostsPerMonth) && ` · ${u.postsThisMonth}/${plan.maxPostsPerMonth} posts este mês`}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "À espera do cliente", n: byStatus.em_aprovacao ?? 0, tone: "text-amber-700" },
            { label: "Alterações pedidas", n: byStatus.alteracoes ?? 0, tone: "text-rose-700" },
            { label: "Aprovados por publicar", n: byStatus.aprovado ?? 0, tone: "text-ok" },
            { label: "Publicados", n: byStatus.publicado ?? 0, tone: "text-sky-700" },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className={`font-display text-4xl ${s.tone}`}>{s.n}</div>
              <div className="text-sm text-ink-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Marcas</h2>
          {clients.length === 0 ? (
            <div className="card p-6 text-ink-2">Adicione a primeira marca para começar a planear posts.</div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {clients.map(({ client, waiting, changes }) => (
                <li key={client.id}>
                  <Link href={`/app/clientes/${client.id}`} className="card group flex items-center gap-3 p-4 hover:border-ink">
                    <span className="size-10 shrink-0 rounded-lg" style={{ background: client.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{client.name}</div>
                      <div className="text-sm text-ink-2">
                        {waiting} à espera · {changes} com alterações
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-ink-2 transition group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mb-3 mt-10 text-lg font-semibold">Próximos 14 dias</h2>
          {upcoming.length === 0 ? (
            <div className="card p-6 text-ink-2">Nada agendado para os próximos dias.</div>
          ) : (
            <ul className="card divide-y divide-line">
              {upcoming.map(({ post, clientName, color }) => (
                <li key={post.id}>
                  <Link href={`/app/posts/${post.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-paper">
                    <span className="w-14 shrink-0 text-sm font-medium">{formatDate(post.scheduledFor)}</span>
                    <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
                    <span className="min-w-0 flex-1 truncate">
                      {post.title} <span className="text-ink-2">· {clientName} · {NETWORKS[post.network]}</span>
                    </span>
                    <StatusBadge status={post.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Plus className="size-4" /> Nova marca
            </h2>
            <ClientForm />
          </div>
        </aside>
      </div>
    </div>
  );
}
