import { NextResponse } from "next/server";
import { createSession, verifyCredentials } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limiter = await rateLimit(`login:${clientKey(request)}`, 8, 60);
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "尝试次数过多，请一分钟后再试。" },
      { status: 429 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "请求格式不正确" }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "请填写邮箱与密码" }, { status: 400 });
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 401 });
  }

  await createSession(user);
  return NextResponse.json({ ok: true, user: { name: user.displayName, email: user.email } });
}
