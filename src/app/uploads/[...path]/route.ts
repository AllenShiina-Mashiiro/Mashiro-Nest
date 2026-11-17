import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_ROOT = path.resolve(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function readUploadedFile(context: RouteContext) {
  const { path: segments } = await context.params;

  if (
    !Array.isArray(segments) ||
    segments.length < 2 ||
    segments.some(
      (part) =>
        !part ||
        part === "." ||
        part === ".." ||
        part.includes("/") ||
        part.includes(String.fromCharCode(92)) ||
        part.includes(String.fromCharCode(0)),
    )
  ) {
    return null;
  }

  const extension = path.extname(segments[segments.length - 1]).toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) return null;

  const filePath = path.resolve(UPLOAD_ROOT, ...segments);
  const relativePath = path.relative(UPLOAD_ROOT, filePath);
  if (
    !relativePath ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  try {
    const [file, stats] = await Promise.all([
      fs.readFile(filePath),
      fs.stat(filePath),
    ]);
    if (!stats.isFile()) return null;
    return { file, contentType };
  } catch {
    return null;
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const result = await readUploadedFile(context);
  if (!result) return new Response("Not Found", { status: 404 });

  return new Response(new Uint8Array(result.file), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Length": String(result.file.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function HEAD(_request: Request, context: RouteContext) {
  const result = await readUploadedFile(context);
  if (!result) return new Response(null, { status: 404 });

  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Length": String(result.file.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
