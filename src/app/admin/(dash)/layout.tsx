import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSession } from "@/lib/auth";
import { dataMode, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [mode, settings] = await Promise.all([dataMode(), getSettings()]);

  return (
    <AdminShell user={session} mode={mode} siteName={settings.siteName}>
      {children}
    </AdminShell>
  );
}
