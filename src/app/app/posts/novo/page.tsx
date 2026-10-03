import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireSession } from "@/lib/auth";
import { canAddPost } from "@/lib/billing";
import { PostForm } from "@/components/post-form";

export const metadata = { title: "Novo post" };

export default async function NewPostPage(props: PageProps<"/app/posts/novo">) {
  const { workspace } = await requireSession();
  const sp = await props.searchParams;
  const db = await getDb();
  const clients = await db
    .select({ id: schema.clients.id, name: schema.clients.name })
    .from(schema.clients)
    .where(eq(schema.clients.workspaceId, workspace.id))
    .orderBy(asc(schema.clients.name));
  if (clients.length === 0) redirect("/app");

  const limit = await canAddPost(workspace);
  const clientId = typeof sp.cliente === "string" ? sp.cliente : undefined;
  const date = typeof sp.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.data) ? sp.data : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={clientId ? `/app/clientes/${clientId}` : "/app"} className="text-sm text-ink-2 hover:underline">← Voltar</Link>
      <h1 className="mb-6 font-display text-4xl">Novo post</h1>
      {!limit.ok && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Chegou ao limite de {limit.limit} posts este mês no plano {limit.plan.name}.{" "}
          <Link href="/app/plano" className="font-semibold underline">Mudar de plano</Link>
        </p>
      )}
      <div className="card p-6">
        <PostForm clients={clients} defaultClientId={clientId} defaultDate={date} />
      </div>
    </div>
  );
}
