"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import type { PostStatus } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { canAddPost } from "@/lib/billing";
import { saveUpload } from "@/lib/storage";
import { FORMATS, NETWORKS } from "@/lib/utils";
import type { FormState } from "./auth";

const postSchema = z.object({
  clientId: z.uuid(),
  title: z.string().trim().min(1, "Dê um título ao post."),
  caption: z.string().default(""),
  network: z.enum(Object.keys(NETWORKS) as [string, ...string[]]),
  format: z.enum(Object.keys(FORMATS) as [string, ...string[]]),
  scheduledFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data de publicação."),
  mediaLink: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\//.test(v), "O link deve começar por http:// ou https://"),
});

async function ownedClient(workspaceId: string, clientId: string) {
  const db = await getDb();
  const [client] = await db
    .select()
    .from(schema.clients)
    .where(and(eq(schema.clients.id, clientId), eq(schema.clients.workspaceId, workspaceId)));
  return client;
}

async function mediaFrom(form: FormData): Promise<{ file?: string; error?: string }> {
  const media = form.get("media");
  if (!(media instanceof File) || media.size === 0) return {};
  try {
    return { file: await saveUpload(media) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function createPost(_: FormState, form: FormData): Promise<FormState> {
  const { workspace } = await requireSession();
  const limit = await canAddPost(workspace);
  if (!limit.ok) {
    return { error: `Chegou ao limite de ${limit.limit} posts este mês no plano ${limit.plan.name}. Mude de plano para continuar.` };
  }
  const parsed = postSchema.safeParse(Object.fromEntries([...form.entries()].filter(([k]) => k !== "media")));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await ownedClient(workspace.id, parsed.data.clientId))) return { error: "Marca não encontrada." };

  const media = await mediaFrom(form);
  if (media.error) return { error: media.error };

  const db = await getDb();
  const [post] = await db
    .insert(schema.posts)
    .values({
      ...parsed.data,
      mediaLink: parsed.data.mediaLink || null,
      mediaFile: media.file ?? null,
      workspaceId: workspace.id,
    })
    .returning();
  redirect(`/app/posts/${post.id}`);
}

export async function updatePost(postId: string, _: FormState, form: FormData): Promise<FormState> {
  const { workspace } = await requireSession();
  const parsed = postSchema.safeParse(Object.fromEntries([...form.entries()].filter(([k]) => k !== "media")));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await ownedClient(workspace.id, parsed.data.clientId))) return { error: "Marca não encontrada." };

  const media = await mediaFrom(form);
  if (media.error) return { error: media.error };

  const db = await getDb();
  await db
    .update(schema.posts)
    .set({
      ...parsed.data,
      mediaLink: parsed.data.mediaLink || null,
      ...(media.file ? { mediaFile: media.file } : {}),
      // Se o conteúdo muda depois de aprovado, a aprovação deixa de valer
      status: sql`case when ${schema.posts.status} = 'aprovado' then 'rascunho'::post_status else ${schema.posts.status} end`,
      approvedBy: sql`case when ${schema.posts.status} = 'aprovado' then null else ${schema.posts.approvedBy} end`,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.posts.id, postId), eq(schema.posts.workspaceId, workspace.id)));
  revalidatePath(`/app/posts/${postId}`);
  return { error: undefined };
}

const TEAM_TRANSITIONS: Record<string, PostStatus[]> = {
  em_aprovacao: ["rascunho", "alteracoes"],
  rascunho: ["em_aprovacao", "alteracoes"],
  publicado: ["aprovado"],
  aprovado: ["publicado"],
};

export async function setPostStatus(postId: string, to: PostStatus) {
  const { workspace } = await requireSession();
  const allowedFrom = TEAM_TRANSITIONS[to];
  if (!allowedFrom) throw new Error("Transição não permitida");
  const db = await getDb();
  await db
    .update(schema.posts)
    .set({ status: to, updatedAt: new Date() })
    .where(
      and(
        eq(schema.posts.id, postId),
        eq(schema.posts.workspaceId, workspace.id),
        inArray(schema.posts.status, allowedFrom),
      ),
    );
  revalidatePath(`/app/posts/${postId}`);
}

export async function addTeamComment(postId: string, form: FormData) {
  const { user, workspace } = await requireSession();
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;
  const db = await getDb();
  const [post] = await db
    .select({ id: schema.posts.id })
    .from(schema.posts)
    .where(and(eq(schema.posts.id, postId), eq(schema.posts.workspaceId, workspace.id)));
  if (!post) return;
  await db.insert(schema.comments).values({ postId, authorType: "equipa", authorName: user.name, body });
  revalidatePath(`/app/posts/${postId}`);
}

export async function deletePost(postId: string) {
  const { workspace } = await requireSession();
  const db = await getDb();
  const [post] = await db
    .delete(schema.posts)
    .where(and(eq(schema.posts.id, postId), eq(schema.posts.workspaceId, workspace.id)))
    .returning({ clientId: schema.posts.clientId });
  redirect(post ? `/app/clientes/${post.clientId}` : "/app");
}
