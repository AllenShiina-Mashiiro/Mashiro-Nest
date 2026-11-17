import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { testStorage } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "没有权限" }, { status: 403 });
  }

  const result = await testStorage();
  return NextResponse.json(result);
}
