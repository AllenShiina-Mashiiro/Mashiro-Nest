import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { listUsers, storeInstance } from "@/lib/data";
import type { PublicUser, Role } from "@/lib/types";

export const SESSION_COOKIE = "mizuki_session";
const MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET ?? "mizuki-development-secret-please-change-me-32chars";
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    sub: user.id,
    username: user.username,
    name: user.displayName,
    email: user.email,
    role: user.role,
    avatar: user.avatarUrl ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Only mark the cookie secure when the site is actually served over HTTPS,
    // otherwise `next start` on http://localhost can never log in.
    secure: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let email = "";
  try {
    const { payload } = await jwtVerify(token, secretKey());
    email = String(payload.email ?? "");
    if (!payload.sub || !email) return null;
  } catch {
    return null;
  }

  // 以数据库里的最新记录为准：改过用户名/角色、或账号已被删除时，
  // 旧 token 不会让页面/权限判断停留在过期状态。
  try {
    const { storeInstance } = await import("@/lib/data");
    const record = await (await storeInstance()).getUserByEmail(email);
    if (!record) return null;
    return {
      id: record.id,
      username: record.username,
      displayName: record.displayName,
      email: record.email,
      role: record.role,
      avatarUrl: record.avatarUrl,
    };
  } catch {
    return null;
  }
}

export function demoCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "admin@mizuki.dev",
    password: process.env.ADMIN_PASSWORD ?? "mizuki",
  };
}

export function toSessionUser(user: PublicUser, email: string): SessionUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const store = await storeInstance();
  const record = await store.getUserByEmail(email.trim().toLowerCase());
  if (!record) {
    // A fresh database may not have been seeded yet: allow the env credentials
    // to bootstrap the very first admin.
    const demo = demoCredentials();
    if (email.trim().toLowerCase() !== demo.email.toLowerCase() || password !== demo.password) {
      return null;
    }
    const users = await listUsers();
    if (users.length) return null;
    return {
      id: "bootstrap-admin",
      username: "mizuki",
      displayName: "Mizuki",
      email: demo.email,
      role: "ADMIN",
      avatarUrl: null,
    };
  }

  const ok = await compare(password, record.passwordHash);
  if (!ok) return null;

  return toSessionUser(record, record.email);
}

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("FORBIDDEN");
  return session;
}

/** Users can only touch their own content; admins can touch everything. */
export function canManage(session: SessionUser, authorId: string | null | undefined) {
  return session.role === "ADMIN" || (authorId ? session.id === authorId : false);
}
