"use client";

import { useActionState, useState } from "react";
import { createPost, updatePost } from "@/app/actions/posts";
import type { Client, Post } from "@/db/schema";
import { FORMATS, NETWORKS } from "@/lib/utils";
import { FormError, SubmitButton } from "./ui";

export function PostForm({
  clients,
  post,
  defaultClientId,
  defaultDate,
}: {
  clients: Pick<Client, "id" | "name">[];
  post?: Post;
  defaultClientId?: string;
  defaultDate?: string;
}) {
  const action = post ? updatePost.bind(null, post.id) : createPost;
  const [state, formAction] = useActionState(action, undefined);
  const [caption, setCaption] = useState(post?.caption ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const saved = post && state && !state.error;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="clientId">Marca</label>
          <select id="clientId" name="clientId" className="field" defaultValue={post?.clientId ?? defaultClientId} required>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="scheduledFor">Data de publicação</label>
          <input id="scheduledFor" name="scheduledFor" type="date" className="field" defaultValue={post?.scheduledFor ?? defaultDate} required />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="title">Título interno</label>
        <input id="title" name="title" className="field" defaultValue={post?.title} placeholder="Ex.: Promoção de Sexta — bolo de ginguba" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="network">Rede</label>
          <select id="network" name="network" className="field" defaultValue={post?.network ?? "instagram"}>
            {Object.entries(NETWORKS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="format">Formato</label>
          <select id="format" name="format" className="field" defaultValue={post?.format ?? "imagem"}>
            {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label className="label" htmlFor="caption">Legenda</label>
          <span className="text-xs text-ink-2">{caption.length} caracteres</span>
        </div>
        <textarea
          id="caption"
          name="caption"
          rows={7}
          className="field resize-y"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="A legenda exactamente como vai ser publicada, com hashtags."
        />
      </div>

      <div>
        <label className="label" htmlFor="media">Arte ou vídeo {post?.mediaFile && <span className="font-normal text-ink-2">(escolha outro ficheiro para substituir)</span>}</label>
        <input
          id="media"
          name="media"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
          className="field file:mr-3 file:rounded-md file:border-0 file:bg-paper-2 file:px-3 file:py-1 file:text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
          }}
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="mt-2 max-h-48 rounded-lg border border-line" />
        )}
        <p className="mt-1 text-xs text-ink-2">JPG, PNG, WEBP, GIF ou MP4 até 20 MB.</p>
      </div>

      <div>
        <label className="label" htmlFor="mediaLink">Ou link (Canva, Drive, carrossel completo…)</label>
        <input id="mediaLink" name="mediaLink" type="url" className="field" defaultValue={post?.mediaLink ?? ""} placeholder="https://" />
      </div>

      <FormError error={state?.error} />
      {post?.status === "aprovado" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Este post já foi aprovado. Se guardar alterações, volta a rascunho e precisa de nova aprovação.
        </p>
      )}
      <div className="flex items-center gap-3">
        <SubmitButton>{post ? "Guardar alterações" : "Criar post"}</SubmitButton>
        {saved && <span className="text-sm text-ok">Guardado.</span>}
      </div>
    </form>
  );
}
