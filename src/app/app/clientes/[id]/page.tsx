import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { ChevronLeft, ChevronRight, FileText, MessageCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import { getDb, schema } from "@/db";
import { requireSession } from "@/lib/auth";
import { appUrl, currentMonth, formatDate, isValidMonth, monthRange, shiftMonth, whatsappLink } from "@/lib/utils";
import { MonthCalendar } from "@/components/month-calendar";
import { ClientForm } from "@/components/client-form";
import { ConfirmSubmit, CopyButton } from "@/components/ui";
import { deleteClient, rotateApprovalLink } from "@/app/actions/clients";

export const metadata = { title: "Marca" };

export default async function ClientPage(props: PageProps<"/app/clientes/[id]">) {
  const { workspace } = await requireSession();
  const { id } = await props.params;
  const sp = await props.searchParams;
  const month = isValidMonth(sp.mes) ? sp.mes : currentMonth();

  const db = await getDb();
  const [client] = await db
    .select()
    .from(schema.clients)
    .where(and(eq(schema.clients.id, id), eq(schema.clients.workspaceId, workspace.id)));
  if (!client) notFound();

  const { start, end } = monthRange(month);
  const [monthPosts, waiting] = await Promise.all([
    db
      .select()
      .from(schema.posts)
      .where(and(eq(schema.posts.clientId, client.id), gte(schema.posts.scheduledFor, start), lte(schema.posts.scheduledFor, end)))
      .orderBy(asc(schema.posts.scheduledFor)),
    db
      .select({ id: schema.posts.id })
      .from(schema.posts)
      .where(and(eq(schema.posts.clientId, client.id), eq(schema.posts.status, "em_aprovacao"))),
  ]);

  const link = `${appUrl()}/aprovar/${client.approvalToken}`;
  const greeting = client.contactName ? `Olá ${client.contactName}` : "Olá";
  const waText =
    waiting.length > 0
      ? `${greeting}! Tem ${waiting.length} post(s) da ${client.name} à espera da sua aprovação. Pode ver e aprovar aqui: ${link}`
      : `${greeting}! Este é o link para ver e aprovar os posts da ${client.name}: ${link}`;
  const monthLabel = formatDate(`${month}-01`, { month: "long", year: "numeric" });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <span className="size-12 rounded-xl" style={{ background: client.color }} />
        <div className="flex-1">
          <Link href="/app" className="text-sm text-ink-2 hover:underline">← Painel</Link>
          <h1 className="font-display text-4xl leading-tight">{client.name}</h1>
        </div>
        <Link href={`/app/posts/novo?cliente=${client.id}`} className="btn-accent">
          <Plus className="size-4" /> Novo post
        </Link>
      </div>

      <section className="card flex flex-col gap-4 p-5 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Link de aprovação</h2>
          <p className="text-sm text-ink-2">
            {client.contactName ?? "O cliente"} abre no telemóvel, vê os posts e aprova — sem criar conta.
            {waiting.length > 0 && <strong className="text-amber-700"> {waiting.length} à espera agora.</strong>}
          </p>
          <code className="mt-2 block truncate rounded-md bg-paper px-2 py-1 text-xs">{link}</code>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={link} />
          <a href={whatsappLink(client.whatsapp, waText)} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1da851]">
            <MessageCircle className="size-4" /> Enviar por WhatsApp
          </a>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Link href={`?mes=${shiftMonth(month, -1)}`} className="btn-ghost px-2" aria-label="Mês anterior"><ChevronLeft className="size-4" /></Link>
          <h2 className="min-w-40 text-center text-lg font-semibold capitalize">{monthLabel}</h2>
          <Link href={`?mes=${shiftMonth(month, 1)}`} className="btn-ghost px-2" aria-label="Mês seguinte"><ChevronRight className="size-4" /></Link>
          <Link href={`/app/relatorio/${client.id}?mes=${month}`} className="btn-ghost ml-auto">
            <FileText className="size-4" /> Relatório do mês
          </Link>
        </div>
        <MonthCalendar month={month} posts={monthPosts} newHref={(d) => `/app/posts/novo?cliente=${client.id}&data=${d}`} />
      </section>

      <section className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Dados da marca</h2>
          <ClientForm client={client} />
        </div>
        <div className="space-y-3">
          <form action={rotateApprovalLink.bind(null, client.id)}>
            <ConfirmSubmit className="btn-ghost w-full" message="O link actual deixa de funcionar. Gerar um novo?">
              <RefreshCw className="size-4" /> Gerar novo link
            </ConfirmSubmit>
          </form>
          <form action={deleteClient.bind(null, client.id)}>
            <ConfirmSubmit className="btn-ghost w-full text-rose-700" message={`Apagar ${client.name} e todos os seus posts? Isto não pode ser desfeito.`}>
              <Trash2 className="size-4" /> Apagar marca
            </ConfirmSubmit>
          </form>
        </div>
      </section>
    </div>
  );
}
