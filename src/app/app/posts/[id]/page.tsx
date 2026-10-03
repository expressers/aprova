import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { CheckCircle2, MessageCircle, Send, Trash2, Undo2 } from "lucide-react";
import { getDb, schema } from "@/db";
import { requireSession } from "@/lib/auth";
import { appUrl, formatDate, whatsappLink } from "@/lib/utils";
import { addTeamComment, deletePost, setPostStatus } from "@/app/actions/posts";
import { PostPreview } from "@/components/post-preview";
import { PostForm } from "@/components/post-form";
import { ConfirmSubmit, StatusBadge, SubmitButton } from "@/components/ui";

export const metadata = { title: "Post" };

export default async function PostPage(props: PageProps<"/app/posts/[id]">) {
  const { workspace } = await requireSession();
  const { id } = await props.params;
  const db = await getDb();

  const [row] = await db
    .select({ post: schema.posts, client: schema.clients })
    .from(schema.posts)
    .innerJoin(schema.clients, eq(schema.clients.id, schema.posts.clientId))
    .where(and(eq(schema.posts.id, id), eq(schema.posts.workspaceId, workspace.id)));
  if (!row) notFound();
  const { post, client } = row;

  const [thread, clients] = await Promise.all([
    db.select().from(schema.comments).where(eq(schema.comments.postId, post.id)).orderBy(asc(schema.comments.createdAt)),
    db
      .select({ id: schema.clients.id, name: schema.clients.name })
      .from(schema.clients)
      .where(eq(schema.clients.workspaceId, workspace.id))
      .orderBy(asc(schema.clients.name)),
  ]);

  const link = `${appUrl()}/aprovar/${client.approvalToken}`;
  const wa = whatsappLink(
    client.whatsapp,
    `Olá${client.contactName ? ` ${client.contactName}` : ""}! O post "${post.title}" para ${formatDate(post.scheduledFor, { day: "numeric", month: "long" })} está pronto para aprovar: ${link}`,
  );
  const sendToApproval = setPostStatus.bind(null, post.id, "em_aprovacao");

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/app/clientes/${client.id}?mes=${post.scheduledFor.slice(0, 7)}`} className="text-sm text-ink-2 hover:underline">
          ← {client.name}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl">{post.title}</h1>
          <StatusBadge status={post.status} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <div className="space-y-6">
          <PostPreview post={post} brand={client.name} color={client.color} />

          <section className="card p-4">
            <h2 className="mb-3 font-semibold">Conversa ({thread.length})</h2>
            <ul className="space-y-3">
              {thread.map((c) => (
                <li key={c.id} className={c.authorType === "cliente" ? "rounded-xl bg-amber-50 p-3" : "rounded-xl bg-paper p-3"}>
                  <div className="mb-1 text-xs text-ink-2">
                    <strong className="text-ink">{c.authorName}</strong> · {c.authorType === "cliente" ? "cliente" : "equipa"} ·{" "}
                    {formatDate(c.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                </li>
              ))}
              {thread.length === 0 && <li className="text-sm text-ink-2">Sem comentários ainda.</li>}
            </ul>
            <form action={addTeamComment.bind(null, post.id)} className="mt-3 flex gap-2">
              <input name="body" className="field" placeholder="Responder ao cliente ou nota interna…" />
              <SubmitButton className="btn-primary px-3"><Send className="size-4" /></SubmitButton>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-2">
              <span>Rondas de alterações: <strong className="text-ink">{post.revisionCount}</strong></span>
              {post.approvedBy && post.approvedAt && (
                <span>
                  Aprovado por <strong className="text-ink">{post.approvedBy}</strong> em{" "}
                  {formatDate(post.approvedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(post.status === "rascunho" || post.status === "alteracoes") && (
                <form action={sendToApproval}>
                  <SubmitButton className="btn-accent"><Send className="size-4" /> Enviar para aprovação</SubmitButton>
                </form>
              )}
              {post.status === "em_aprovacao" && (
                <>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1da851]">
                    <MessageCircle className="size-4" /> Avisar no WhatsApp
                  </a>
                  <form action={setPostStatus.bind(null, post.id, "rascunho")}>
                    <SubmitButton className="btn-ghost"><Undo2 className="size-4" /> Voltar a rascunho</SubmitButton>
                  </form>
                </>
              )}
              {post.status === "aprovado" && (
                <form action={setPostStatus.bind(null, post.id, "publicado")}>
                  <SubmitButton className="btn-primary"><CheckCircle2 className="size-4" /> Marcar como publicado</SubmitButton>
                </form>
              )}
              {post.status === "publicado" && (
                <form action={setPostStatus.bind(null, post.id, "aprovado")}>
                  <SubmitButton className="btn-ghost"><Undo2 className="size-4" /> Desmarcar publicado</SubmitButton>
                </form>
              )}
            </div>
            {post.status === "em_aprovacao" && (
              <p className="text-sm text-ink-2">O cliente vê este post no link de aprovação da {client.name}.</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Editar</h2>
            <PostForm clients={clients} post={post} />
          </section>

          <form action={deletePost.bind(null, post.id)}>
            <ConfirmSubmit className="btn-ghost text-rose-700" message="Apagar este post?">
              <Trash2 className="size-4" /> Apagar post
            </ConfirmSubmit>
          </form>
        </div>
      </div>
    </div>
  );
}
