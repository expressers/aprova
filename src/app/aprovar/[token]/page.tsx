import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { formatDate, todayLuanda } from "@/lib/utils";
import { PostPreview } from "@/components/post-preview";
import { ReviewForm } from "@/components/review-form";
import { StatusBadge } from "@/components/ui";

export const metadata = { title: "Aprovar posts", robots: { index: false, follow: false } };

export default async function ApprovalPage(props: PageProps<"/aprovar/[token]">) {
  const { token } = await props.params;
  const db = await getDb();
  const [row] = await db
    .select({ client: schema.clients, agency: schema.workspaces.name })
    .from(schema.clients)
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.clients.workspaceId))
    .where(eq(schema.clients.approvalToken, token));
  if (!row) notFound();
  const { client, agency } = row;

  const [pending, others] = await Promise.all([
    db
      .select()
      .from(schema.posts)
      .where(and(eq(schema.posts.clientId, client.id), eq(schema.posts.status, "em_aprovacao")))
      .orderBy(asc(schema.posts.scheduledFor)),
    db
      .select()
      .from(schema.posts)
      .where(and(eq(schema.posts.clientId, client.id), inArray(schema.posts.status, ["alteracoes", "aprovado", "publicado"])))
      .orderBy(desc(schema.posts.scheduledFor))
      .limit(30),
  ]);
  const commentsByPost = new Map<string, (typeof schema.comments.$inferSelect)[]>();
  if (pending.length) {
    const rows = await db
      .select()
      .from(schema.comments)
      .where(inArray(schema.comments.postId, pending.map((p) => p.id)))
      .orderBy(asc(schema.comments.createdAt));
    for (const c of rows) commentsByPost.set(c.postId, [...(commentsByPost.get(c.postId) ?? []), c]);
  }

  const reviewer = (await cookies()).get("aprova_reviewer")?.value ?? client.contactName ?? "";
  const today = todayLuanda();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-8">
      <header className="mb-8 text-center">
        <span className="mx-auto mb-3 block size-14 rounded-2xl" style={{ background: client.color }} />
        <h1 className="font-display text-4xl">{client.name}</h1>
        <p className="text-sm text-ink-2">Posts preparados por {agency}</p>
      </header>

      {pending.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="font-medium">Não há nada à espera de aprovação. 🎉</p>
          <p className="mt-1 text-sm text-ink-2">Quando houver posts novos, vai vê-los aqui neste mesmo link.</p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-center text-sm font-medium">
            {pending.length === 1 ? "1 post à espera da sua aprovação" : `${pending.length} posts à espera da sua aprovação`}
          </p>
          <ol className="space-y-10">
            {pending.map((post, i) => (
              <li key={post.id} className="space-y-3">
                <div className="flex items-center justify-between text-sm text-ink-2">
                  <span>{i + 1} de {pending.length}</span>
                  {post.scheduledFor < today && <span className="text-rose-700">Data já passou</span>}
                </div>
                <PostPreview post={post} brand={client.name} color={client.color} />
                {(commentsByPost.get(post.id) ?? []).length > 0 && (
                  <ul className="space-y-2">
                    {commentsByPost.get(post.id)!.map((c) => (
                      <li key={c.id} className="rounded-xl bg-paper-2 p-3 text-sm">
                        <strong>{c.authorName}:</strong> {c.body}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="card p-4">
                  <ReviewForm token={token} postId={post.id} defaultName={reviewer} />
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-2">Histórico</h2>
          <ul className="card divide-y divide-line">
            {others.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-16 shrink-0 text-ink-2">{formatDate(p.scheduledFor)}</span>
                <span className="min-w-0 flex-1 truncate">{p.title}</span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 text-center text-xs text-ink-2">
        Feito com <Link href="/" className="font-semibold text-ink">aprova</Link> — aprovação de conteúdo sem confusão.
      </p>
    </main>
  );
}
