import "server-only";
import path from "node:path";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
};
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function uploadDir() {
  return process.env.UPLOAD_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "uploads");
}

/** Guarda o ficheiro e devolve o nome (aleatório, não adivinhável) */
export async function saveUpload(file: File): Promise<string> {
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Formato não suportado. Use JPG, PNG, WEBP, GIF ou MP4.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Ficheiro demasiado grande (máx. 20 MB).");
  const name = `${randomBytes(16).toString("hex")}.${ext}`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(uploadDir(), name), Buffer.from(await file.arrayBuffer()));
  return name;
}

export async function readUpload(name: string): Promise<{ data: Buffer; type: string } | null> {
  const m = /^[a-f0-9]{32}\.(jpg|png|webp|gif|mp4)$/.exec(name);
  if (!m) return null;
  const type = Object.entries(ALLOWED).find(([, e]) => e === m[1])![0];
  try {
    return { data: await readFile(path.join(uploadDir(), name)), type };
  } catch {
    return null;
  }
}

export { isVideo } from "./utils";
