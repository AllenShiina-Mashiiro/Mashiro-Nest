import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listUsers } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * `/user` —— 当前登录用户的个人主页快捷入口。
 * 没登录时退到站长的主页（再没有就回登录页）。
 */
export default async function MyProfileRedirect() {
  const session = await getSession();
  if (session) redirect(`/u/${session.username}`);

  const users = await listUsers();
  const owner = users.find((user) => user.role === "ADMIN") ?? users[0];
  redirect(owner ? `/u/${owner.username}` : "/login");
}
