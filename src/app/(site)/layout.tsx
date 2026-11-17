import { BackToTop } from "@/components/back-to-top";
import { Live2D } from "@/components/live2d/live2d";
import { MusicPlayer } from "@/components/music-player/music-player";
import SakuraPetals from "@/components/sakura-petals";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";
import { getSettings, unreadNotificationCount } from "@/lib/data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([getSession(), getSettings()]);
  const unread = session ? await unreadNotificationCount(session.id) : 0;

  return (
    <>
      <SakuraPetals count={28} opacity={0.62} wind={0.9} zIndex={40} />
      <SiteHeader
        user={session}
        siteName={settings.siteName}
        siteIcon={settings.siteIcon}
        github={settings.githubUrl}
        unread={unread}
      />
      <main className="relative min-h-[70vh]">{children}</main>
      <SiteFooter
        siteName={settings.siteName}
        icp={settings.icp}
        github={settings.githubUrl}
      />
      <BackToTop />
      <MusicPlayer settings={settings.music} />
      <Live2D settings={settings.live2d} />
    </>
  );
}
