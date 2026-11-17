import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function databaseUrlWithPoolLimits() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) return undefined;

  const url = new URL(connectionString);

  // Keep one process from opening an unbounded number of PostgreSQL sessions.
  // Explicit URL settings always win, so hosted database providers can override them.
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "10");
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "20");
  }
  if (!url.searchParams.has("connect_timeout")) {
    url.searchParams.set("connect_timeout", "10");
  }

  return url.toString();
}

const datasourceUrl = databaseUrlWithPoolLimits();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Reuse a single Prisma engine across hot reloads and all Next.js server bundles
// within the same Node.js process. This does not share clients across processes.
globalForPrisma.prisma = prisma;

/** True when a PostgreSQL connection string is configured. */
export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
