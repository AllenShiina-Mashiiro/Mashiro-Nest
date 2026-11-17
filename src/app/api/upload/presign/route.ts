import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { buildObjectKey, createPresignedUpload, isS3Configured, objectPublicUrl } from "@/lib/s3";

export const runtime = "nodejs";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!isS3Configured()) {
    return NextResponse.json(
      {
        error: "S3 未配置",
        hint: "在 .env 中填写 S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY 后即可启用直传。",
      },
      { status: 501 },
    );
  }

  let body: { filename?: string; contentType?: string };
  try {
    body = (await request.json()) as { filename?: string; contentType?: string };
  } catch {
    return NextResponse.json({ error: "请求格式不正确" }, { status: 400 });
  }

  const contentType = body.contentType ?? "";
  if (!ALLOWED.includes(contentType)) {
    return NextResponse.json({ error: "只允许上传图片" }, { status: 400 });
  }

  const key = buildObjectKey(body.filename ?? "file");
  const uploadUrl = await createPresignedUpload({ key, contentType });

  return NextResponse.json({
    uploadUrl,
    key,
    publicUrl: objectPublicUrl(key),
    expiresIn: 600,
  });
}
