import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getS3, isS3Configured, objectPublicUrl } from "@/lib/s3";
import type { MediaItem } from "@/lib/types";

/**
 * Server-side media upload with content-addressed keys:
 * `uploads/<year>/<sha256>.<ext>`. Uploading the same bytes twice returns the
 * existing object, which gives us de-duplication for free.
 */

const LOCAL_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
]);

export class MediaError extends Error {}

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function safeUploadKey(key: string) {
  if (
    !key ||
    key.includes("\\") ||
    key.startsWith("/") ||
    !key.startsWith("uploads/") ||
    key.split("/").some((part) => !part || part === "." || part === "..") ||
    path.posix.normalize(key) !== key
  ) {
    throw new MediaError("无效的媒体文件路径");
  }
  return key;
}

function localPath(key: string) {
  const safeKey = safeUploadKey(key);
  const publicRoot = path.resolve(process.cwd(), "public");
  const target = path.resolve(publicRoot, safeKey);
  const relative = path.relative(publicRoot, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new MediaError("无效的媒体文件路径");
  }
  return target;
}

export type StorageDriver = "s3" | "local";

/**
 * 存储驱动：默认「有 S3 配置就用 S3，否则用本地」；
 * 也可以用 STORAGE_DRIVER=local|s3 明确指定（想先本地跑、之后再切 S3 时用）。
 */
export function storageDriver(): StorageDriver {
  const forced = process.env.STORAGE_DRIVER?.trim().toLowerCase();
  if (forced === "local") return "local";
  if (forced === "s3") return isS3Configured() ? "s3" : "local";
  return isS3Configured() ? "s3" : "local";
}

export function storageStatus() {
  return {
    driver: storageDriver(),
    s3Configured: isS3Configured(),
    bucket: process.env.S3_BUCKET ?? null,
    endpoint: process.env.S3_ENDPOINT ?? null,
    publicBase: process.env.S3_PUBLIC_URL ?? null,
    localDir: "public/uploads",
  };
}

/** 连通性自检：本地看目录可写，S3 看桶能否访问。 */
export async function testStorage(): Promise<{ ok: boolean; message: string }> {
  if (storageDriver() === "local") {
    try {
      await fs.mkdir(LOCAL_DIR, { recursive: true });
      const probe = path.join(LOCAL_DIR, ".write-test");
      await fs.writeFile(probe, "ok");
      await fs.rm(probe, { force: true });
      return { ok: true, message: "本地目录可写：public/uploads" };
    } catch (error) {
      return { ok: false, message: (error as Error).message };
    }
  }

  const s3 = getS3();
  if (!s3) return { ok: false, message: "缺少 S3_BUCKET / 密钥配置" };
  try {
    await s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET }));
    return { ok: true, message: "S3 桶可访问" };
  } catch (error) {
    const name = (error as { name?: string }).name ?? "UnknownError";
    return { ok: false, message: `S3 访问失败：${name}` };
  }
}

export function publicUrlFor(key: string) {
  return storageDriver() === "s3" ? objectPublicUrl(key) : `/${key}`;
}

/** Pull the `uploads/...` object key out of any URL we hand out. */
export function keyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/uploads\/[^\s"'()?#]+/);
  return match ? match[0] : null;
}

async function exists(key: string) {
  if (storageDriver() !== "s3") {
    try {
      await fs.access(localPath(key));
      return true;
    } catch {
      return false;
    }
  }
  const s3 = getS3();
  if (!s3) return false;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function saveUpload(file: File): Promise<MediaItem> {
  const type = file.type || "";
  const ext = ALLOWED.get(type);
  if (!ext) {
    throw new MediaError("只支持 PNG / JPEG / WebP / GIF / AVIF 图片");
  }
  if (file.size > MAX_BYTES) {
    throw new MediaError("图片不能超过 8MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = sha256(buffer);
  const key = `uploads/${new Date().getFullYear()}/${hash}.${ext}`;
  const url = publicUrlFor(key);
  const now = new Date().toISOString();

  if (await exists(key)) {
    // Same bytes already stored — reuse it (dedupe).
    return { key, url, size: buffer.byteLength, hash, lastModified: now, kind: storageDriver() };
  }

  if (storageDriver() !== "s3") {
    const target = localPath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);
  } else {
    const s3 = getS3();
    if (!s3) throw new MediaError("对象存储未配置");
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: type,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }

  return {
    key,
    url,
    size: buffer.byteLength,
    hash,
    lastModified: now,
    kind: storageDriver(),
  };
}

async function walkLocal(dir: string, base = ""): Promise<MediaItem[]> {
  const items: MediaItem[] = [];
  let entries: import("node:fs").Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return items;
  }

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    const key = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      items.push(...(await walkLocal(absolute, key)));
      continue;
    }
    const stat = await fs.stat(absolute);
    items.push({
      key,
      url: `/${key}`,
      size: stat.size,
      hash: entry.name.replace(/\.[a-z0-9]+$/i, ""),
      lastModified: stat.mtime.toISOString(),
      kind: "local",
    });
  }
  return items;
}

export async function listMedia(): Promise<MediaItem[]> {
  if (storageDriver() !== "s3") {
    const items = await walkLocal(path.join(process.cwd(), "public", "uploads"), "uploads");
    return items.sort((a, b) => (b.lastModified ?? "").localeCompare(a.lastModified ?? ""));
  }

  const s3 = getS3();
  if (!s3) return [];
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      Prefix: "uploads/",
      MaxKeys: 500,
    }),
  );

  return (result.Contents ?? [])
    .filter((item) => item.Key)
    .map((item) => ({
      key: item.Key as string,
      url: publicUrlFor(item.Key as string),
      size: item.Size ?? 0,
      hash: (item.Key as string).replace(/^.*\//, "").replace(/\.[a-z0-9]+$/i, ""),
      lastModified: item.LastModified?.toISOString() ?? null,
      kind: "s3" as const,
    }))
    .sort((a, b) => (b.lastModified ?? "").localeCompare(a.lastModified ?? ""));
}

/** group by content hash so the UI can show "3 identical files -> 1 object". */
export function dedupeMedia(items: MediaItem[]) {
  const map = new Map<string, MediaItem & { copies: number }>();
  for (const item of items) {
    const existing = map.get(item.hash);
    if (existing) existing.copies += 1;
    else map.set(item.hash, { ...item, copies: 1 });
  }
  return [...map.values()];
}

export async function deleteMediaByKey(key: string) {
  safeUploadKey(key);
  if (storageDriver() !== "s3") {
    await fs.rm(localPath(key), { force: true });
    return;
  }
  const s3 = getS3();
  if (!s3) return;
  await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
}
