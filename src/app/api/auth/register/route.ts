import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createSession, hashPassword } from "@/lib/auth";
import { storeInstance } from "@/lib/data";
import type { PublicUser } from "@/lib/types";

export const runtime = "nodejs";

const USERNAME = /^[a-zA-Z0-9_-]{3,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const limiter = await rateLimit(`register:${clientKey(request)}`, 5, 300);
  if (!limiter.ok) {
    return NextResponse.json({ error: "注册过于频繁，请稍后再试" }, { status: 429 });
  }

  let body: {
    email?: string;
    username?: string;
    displayName?: string;
    password?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const username = (body.username ?? "").trim().toLowerCase();
  const displayName = (body.displayName ?? "").trim() || username;
  const password = body.password ?? "";

  if (!EMAIL.test(email)) return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  if (!USERNAME.test(username)) {
    return NextResponse.json({ error: "用户名需为 3-20 位字母、数字、- 或 _" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
  }

  const adminEmail = (
    process.env.ADMIN_EMAIL || (process.env.NODE_ENV !== "production" ? "admin@mizuki.dev" : "")
  ).trim().toLowerCase();
  const adminUsername = (process.env.ADMIN_USERNAME || "AllenShiina").trim().toLowerCase();
  if ((adminEmail && email === adminEmail) || username === adminUsername) {
    return NextResponse.json({ error: "该邮箱或用户名为站长账号预留" }, { status: 409 });
  }

  const store = await storeInstance();
  const [byEmail, byName] = await Promise.all([
    store.getUserByEmail(email),
    store.getUserByUsername(username),
  ]);

  if (byEmail) return NextResponse.json({ error: "这个邮箱已经注册过了" }, { status: 409 });
  if (byName) return NextResponse.json({ error: "这个用户名已被占用" }, { status: 409 });

  // Public registration must never grant administrator privileges. The first
  // administrator is created by the configured bootstrap credentials or seed.
  let user: PublicUser;
  try {
    user = await store.createUser({
      email,
      username,
      displayName,
      passwordHash: await hashPassword(password),
      role: "USER",
    });
  } catch {
    return NextResponse.json({ error: "注册失败，请稍后再试" }, { status: 500 });
  }

  await createSession({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });

  return NextResponse.json({ ok: true, user: { username: user.username, role: user.role } });
}
