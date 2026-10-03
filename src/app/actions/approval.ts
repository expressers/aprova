"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

/**
 * Acções públicas da página de aprovação (/aprovar/[token]).
 * O cliente não tem conta: o token do link identifica a marca.
 * Só posts "em aprovação" dessa marca podem ser aprovados ou devolvidos.
 */

async function postForToken(token: string, postId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ post: schema.posts, client: schema.clients })
    .from(schema.posts)
    .innerJoin(schema.clients, eq(schema.clients.id, schema.posts.clientId))
    .where(and(eq(schema.clients.approvalToken, token), eq(schema.posts.id, postId)));
  return row;
}

async function rememberName(name: string) {
  (await cookies()).set("aprova_reviewer", name, { maxAge: 60 * 60 * 24 * 180, path: "/aprovar", sameSite: "lax" });
}

function cleanName(v: FormDataEntryValue | null) {
  return String(v ?? "").trim().slice(0, 80);
}

export type ReviewState = { error?: string; done?: "aprovado" | "alteracoes" } | undefined;

export async function reviewPost(token: string, postId: string, _: ReviewState, form: FormData): Promise<ReviewState> {
  const decision = form.get("decision");
  const name = cleanName(form.get("name"));
  const comment = String(form.get("comment") ?? "").trim().slice(0, 4000);
  if (!name) return { error: "Escreva o seu nome para registarmos quem aprovou." };

  const row = await postForToken(token, postId);
  if (!row) return { error: "Link inválido ou post removido." };
  if (row.post.status !== "em_aprovacao") return { error: "Este post já não está à espera de aprovação." };

  const db = await getDb();
  if (decision === "aprovar") {
    await db.transaction(async (tx) => {
      await tx
        .update(schema.posts)
        .set({ status: "aprovado", approvedBy: name, approvedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(schema.posts.id, postId), eq(schema.posts.status, "em_aprovacao")));
      if (comment) {
        await tx.insert(schema.comments).values({ postId, authorType: "cliente", authorName: name, body: comment });
      }
    });
    await rememberName(name);
    revalidatePath(`/aprovar/${token}`);
    return { done: "aprovado" };
  }

  if (decision === "alterar") {
    if (!comment) return { error: "Diga o que precisa de mudar." };
    await db.transaction(async (tx) => {
      await tx
        .update(schema.posts)
        .set({
          status: "alteracoes",
          revisionCount: sql`${schema.posts.revisionCount} + 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.posts.id, postId), eq(schema.posts.status, "em_aprovacao")));
      await tx.insert(schema.comments).values({ postId, authorType: "cliente", authorName: name, body: comment });
    });
    await rememberName(name);
    revalidatePath(`/aprovar/${token}`);
    return { done: "alteracoes" };
  }

  return { error: "Escolha aprovar ou pedir alterações." };
}
