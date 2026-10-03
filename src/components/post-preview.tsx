import { ExternalLink, ImageOff } from "lucide-react";
import type { Post } from "@/db/schema";
import { FORMATS, NETWORKS, formatDate, isVideo } from "@/lib/utils";

/** Pré-visualização do post tal como vai aparecer (formato próximo do Instagram) */
export function PostPreview({ post, brand, color }: { post: Post; brand: string; color: string }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white">
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <span className="grid size-8 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: color }}>
          {brand.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold">{brand}</div>
          <div className="text-xs text-ink-2">
            {NETWORKS[post.network]} · {FORMATS[post.format]} · {formatDate(post.scheduledFor, { weekday: "short", day: "numeric", month: "short" })}
          </div>
        </div>
      </header>

      {post.mediaFile ? (
        isVideo(post.mediaFile) ? (
          <video src={`/api/media/${post.mediaFile}`} controls playsInline className="aspect-square w-full bg-black object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/media/${post.mediaFile}`} alt={post.title} className="w-full bg-paper object-contain" />
        )
      ) : (
        <div className="grid aspect-[4/3] place-items-center bg-paper text-ink-2">
          <div className="flex flex-col items-center gap-1 text-sm">
            <ImageOff className="size-6" /> {post.mediaLink ? "Arte disponível no link abaixo" : "Sem arte anexada"}
          </div>
        </div>
      )}

      {post.mediaLink && (
        <a href={post.mediaLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 border-t border-line px-3 py-2 text-sm font-medium hover:bg-paper">
          <ExternalLink className="size-4" /> Abrir arte completa
        </a>
      )}

      <p className="whitespace-pre-wrap border-t border-line px-3 py-3 text-[15px] leading-relaxed">
        {post.caption || <span className="text-ink-2">Sem legenda.</span>}
      </p>
    </article>
  );
}
