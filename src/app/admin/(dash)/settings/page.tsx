import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CheckCircle2, Sparkles } from "lucide-react";
import { saveSettingsAction } from "@/app/admin/actions";
import { MediaField } from "@/components/admin/media-field";
import { MultiMediaField } from "@/components/admin/multi-media-field";
import { StatusPicker } from "@/components/admin/status-picker";
import { getPage, getSettings, listUsers } from "@/lib/data";
import { listLive2dModels } from "@/lib/live2d-models";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "站点设置",
  robots: { index: false, follow: false },
};

const STATUS_PRESETS = ["写代码中", "玩游戏", "睡觉中", "加班中", "摸鱼中", "在旅行"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/admin");

  const [settings, about, users, live2dModels] = await Promise.all([
    getSettings(),
    getPage("about"),
    listUsers(),
    listLive2dModels(),
  ]);
  const owner = users.find((user) => user.role === "ADMIN") ?? users[0] ?? null;

  return (
    <form action={saveSettingsAction} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">站点设置</h1>
          <p className="mt-1 text-[11.5px] text-ink-400">
            站点名称、图标、主视觉、关于页与站长资料都在这里，保存后前台立即同步。
          </p>
        </div>
        <button
          type="submit"
          className="rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-4 py-2 text-[12px] font-semibold text-white shadow-[0_14px_26px_-16px_rgba(76,186,155,0.95)] transition hover:-translate-y-0.5"
        >
          保存设置
        </button>
      </div>

      {params.saved ? (
        <p className="flex items-center gap-1.5 rounded-xl bg-mint-50 px-3 py-2 text-[11.5px] font-medium text-mint-600 dark:bg-mint-400/10 dark:text-mint-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          已保存并同步到前台。
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <h2 className="section-title">站点信息</h2>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">网站名称</span>
            <input
              name="siteName"
              defaultValue={settings.siteName}
              className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">副标题</span>
            <input
              name="siteSubtitle"
              defaultValue={settings.siteSubtitle}
              className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">站点描述（SEO）</span>
            <textarea
              name="siteDescription"
              rows={2}
              defaultValue={settings.siteDescription}
              className="w-full resize-none rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>
          <MediaField
            name="siteIcon"
            label="网站图标"
            defaultValue={settings.siteIcon}
            previewClassName="h-14 w-14"
          />
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">备案号</span>
            <input
              name="icp"
              defaultValue={settings.icp}
              className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">
                联系邮箱（名片上的信封）
              </span>
              <input
                name="contactEmail"
                defaultValue={settings.contactEmail}
                placeholder="hello@example.com"
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">
                GitHub 链接（导航栏）
              </span>
              <input
                name="githubUrl"
                defaultValue={settings.githubUrl}
                placeholder="https://github.com/…"
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">
              Telegram 链接（名片上的纸飞机）
            </span>
            <input
              name="telegramUrl"
              defaultValue={settings.telegramUrl}
              placeholder="https://t.me/…（留空则不显示）"
              className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>
        </section>

        <section className="space-y-3 rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <h2 className="section-title">首页主视觉</h2>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">大标题</span>
            <input
              name="heroTitle"
              defaultValue={settings.heroTitle}
              className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">副标题</span>
            <input
              name="heroSubtitle"
              defaultValue={settings.heroSubtitle}
              className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>
          <MultiMediaField
            name="heroImages"
            label="首页背景图（按天轮换）"
            defaultValue={settings.heroImages.join("\n")}
            hint="从媒体库选图或上传；第一张是主图，可调整顺序。"
          />
          <label className="flex items-center gap-2 text-[11.5px] text-ink-500 dark:text-ink-300">
            <input
              type="checkbox"
              name="heroBeam"
              defaultChecked={settings.heroBeam}
              className="h-3.5 w-3.5 accent-mint-500"
            />
            显示斜切光束与分界线
          </label>
          <MediaField
            name="loginBackground"
            label="登录页背景"
            defaultValue={settings.loginBackground}
          />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <h2 className="section-title">站长资料（同步到首页名片与侧边栏）</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">昵称</span>
              <input
                name="ownerName"
                defaultValue={owner?.displayName ?? ""}
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
            <StatusPicker
              name="ownerStatus"
              defaultValue={owner?.status ?? "写代码中"}
              presets={STATUS_PRESETS}
            />
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">简介</span>
            <textarea
              name="ownerBio"
              rows={2}
              defaultValue={owner?.bio ?? ""}
              className="w-full resize-none rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">位置</span>
              <input
                name="ownerLocation"
                defaultValue={owner?.location ?? ""}
                placeholder="杭州"
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">GitHub</span>
              <input
                name="ownerGithub"
                defaultValue={owner?.github ?? ""}
                placeholder="https://github.com/…"
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">Telegram</span>
            <input
              name="ownerTelegram"
              defaultValue={owner?.telegram ?? ""}
              placeholder="https://t.me/…"
              className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>
          <MediaField
            name="ownerAvatar"
            label="站长头像"
            defaultValue={owner?.avatarUrl ?? ""}
            previewClassName="h-20 w-20"
          />
        </section>

        <section className="space-y-3 rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <h2 className="section-title">关于页</h2>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">标题</span>
            <input
              name="aboutTitle"
              defaultValue={settings.aboutTitle}
              className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">正文（Markdown）</span>
            <textarea
              name="aboutContent"
              rows={16}
              defaultValue={about?.content ?? ""}
              className="w-full resize-y rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 font-mono text-[11.5px] leading-relaxed outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>
          <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-ink-400">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
            关于页顶部复用首页的背景图区域，位置信息取自站长资料。
          </p>
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <h2 className="section-title">音乐播放器</h2>
          <label className="flex items-center gap-2 text-[11.5px] text-ink-500 dark:text-ink-300">
            <input
              type="checkbox"
              name="musicEnabled"
              defaultChecked={settings.music.enabled}
              className="h-3.5 w-3.5 accent-mint-500"
            />
            在前台显示播放器
          </label>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">曲目来源</span>
              <select
                name="musicSource"
                defaultValue={settings.music.source}
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              >
                <option value="local">本地 / 直链</option>
                <option value="netease">网易云歌单（Meting）</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">初始音量（0~1）</span>
              <input
                type="number"
                name="musicVolume"
                min={0}
                max={1}
                step={0.05}
                defaultValue={settings.music.volume}
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-[11.5px] text-ink-500 dark:text-ink-300">
              <input
                type="checkbox"
                name="musicAutoplay"
                defaultChecked={settings.music.autoplay}
                className="h-3.5 w-3.5 accent-mint-500"
              />
              自动播放（多数浏览器会拦截）
            </label>
            <label className="flex items-center gap-2 text-[11.5px] text-ink-500 dark:text-ink-300">
              <input
                type="checkbox"
                name="musicShuffle"
                defaultChecked={settings.music.shuffle}
                className="h-3.5 w-3.5 accent-mint-500"
              />
              默认随机播放
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">
              本地曲目（一行一首：标题 | 歌手 | 封面地址 | 音频地址）
            </span>
            <textarea
              name="musicTracks"
              rows={5}
              defaultValue={settings.music.tracks
                .map((track) => [track.title, track.artist, track.cover, track.url].join(" | "))
                .join("\n")}
              placeholder="风铃 | Mashiro Nest | /music/covers/demo.svg | /music/tracks/demo-chime.wav"
              className="w-full resize-y rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 font-mono text-[11px] leading-relaxed outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">Meting 接口地址</span>
              <input
                name="neteaseApi"
                defaultValue={settings.music.netease.api}
                placeholder="https://api.injahow.cn/meting/"
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">网易云歌单 ID</span>
              <input
                name="neteasePlaylistId"
                defaultValue={settings.music.netease.playlistId}
                placeholder="歌单链接里 id= 后面那串数字"
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
          </div>
          <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-ink-400">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
            选「网易云歌单」后，服务端会向 Meting 接口请求歌单并缓存 10 分钟；接口不通时播放器会显示错误提示。
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <h2 className="section-title">看板娘（Live2D）</h2>
          <label className="flex items-center gap-2 text-[11.5px] text-ink-500 dark:text-ink-300">
            <input
              type="checkbox"
              name="live2dEnabled"
              defaultChecked={settings.live2d.enabled}
              className="h-3.5 w-3.5 accent-mint-500"
            />
            在前台显示看板娘
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">模型路径</span>
            <input
              name="live2dModelPath"
              list="live2d-model-options"
              defaultValue={settings.live2d.modelPath}
              placeholder="/live2d/models/character-01/model.json"
              className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 font-mono text-[11px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
            <datalist id="live2d-model-options">
              {live2dModels.map((model) => (
                <option key={model.path} value={model.path}>
                  {model.name}（{model.format === "cubism4" ? "Cubism 3/4" : "Cubism 2"}）
                </option>
              ))}
            </datalist>
          </label>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">显示位置</span>
              <select
                name="live2dPosition"
                defaultValue={settings.live2d.position}
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              >
                <option value="bottom-left">左下角</option>
                <option value="bottom-right">右下角</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">尺寸（px）</span>
              <input
                type="number"
                name="live2dSize"
                min={160}
                max={480}
                step={20}
                defaultValue={settings.live2d.size}
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-[11.5px] text-ink-500 dark:text-ink-300">
            <input
              type="checkbox"
              name="live2dMobile"
              defaultChecked={settings.live2d.mobile}
              className="h-3.5 w-3.5 accent-mint-500"
            />
            手机端也显示
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">欢迎语（一行一条，随机显示）</span>
            <textarea
              name="live2dWelcome"
              rows={2}
              defaultValue={settings.live2d.welcome.join("\n")}
              className="w-full resize-y rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">循环提示语（一行一条）</span>
            <textarea
              name="live2dMessages"
              rows={3}
              defaultValue={settings.live2d.messages.join("\n")}
              className="w-full resize-y rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>
          <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-ink-400">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
            把模型文件夹放进 public/live2d/models/ 后刷新本页，路径框会自动提示可选模型；Cubism 2 / 3 / 4 都支持。
          </p>
        </section>
      </div>
    </form>
  );
}
