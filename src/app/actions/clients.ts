"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { requireSession } from "@/lib/auth";
import { canAddClient } from "@/lib/billing";
import { normalizeAoPhone } from "@/lib/utils";
import type { FormState } from "./auth";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Indique o nome da marca."),
  contactName: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

function token() {
  return randomBytes(18).toString("base64url");
}

function parse(form: FormData) {
  const parsed = clientSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;
  const { whatsapp, contactName, ...rest } = parsed.data;
  let phone: string | null = null;
  if (whatsapp) {
    phone = normalizeAoPhone(whatsapp);
    if (!phone) return { error: "Número de WhatsApp inválido (ex.: 923 456 789)." } as const;
  }
  return { data: { ...rest, contactName: contactName || null, whatsapp: phone } } as const;
}

export async function createClient(_: FormState, form: FormData): Promise<FormState> {
  const { workspace } = await requireSession();
  const limit = await canAddClient(workspace);
  if (!limit.ok) {
    return { error: `O plano ${limit.plan.name} permite ${limit.limit} marca(s). Mude de plano para adicionar mais.` };
  }
  const result = parse(form);
  if ("error" in result) return { error: result.error };

  const db = await getDb();
  const [client] = await db
    .insert(schema.clients)
    .values({ ...result.data, workspaceId: workspace.id, approvalToken: token() })
    .returning();
  redirect(`/app/clientes/${client.id}`);
}

export async function updateClient(clientId: string, _: FormState, form: FormData): Promise<FormState> {
  const { workspace } = await requireSession();
  const result = parse(form);
  if ("error" in result) return { error: result.error };
  const db = await getDb();
  await db
    .update(schema.clients)
    .set(result.data)
    .where(and(eq(schema.clients.id, clientId), eq(schema.clients.workspaceId, workspace.id)));
  revalidatePath(`/app/clientes/${clientId}`);
  return {};
}

/** Gera um novo link de aprovação (o antigo deixa de funcionar) */
export async function rotateApprovalLink(clientId: string) {
  const { workspace } = await requireSession();
  const db = await getDb();
  await db
    .update(schema.clients)
    .set({ approvalToken: token() })
    .where(and(eq(schema.clients.id, clientId), eq(schema.clients.workspaceId, workspace.id)));
  revalidatePath(`/app/clientes/${clientId}`);
}

export async function deleteClient(clientId: string) {
  const { workspace } = await requireSession();
  const db = await getDb();
  await db
    .delete(schema.clients)
    .where(and(eq(schema.clients.id, clientId), eq(schema.clients.workspaceId, workspace.id)));
  redirect("/app");
}
