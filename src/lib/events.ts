import type { NotificationItem } from "@/lib/types";

/**
 * 进程内的事件总线：给「通知」做实时推送用。
 *
 * 单实例（本地 dev / 单机自托管）足够；多实例部署时应换成 Redis pub/sub，
 * 这里保留了和缓存层一致的降级思路。
 */

export type NotificationEvent = {
  count: number;
  item?: NotificationItem;
};

type Listener = (event: NotificationEvent) => void;

/**
 * 挂在 globalThis 上：Next 在 dev 下会给每个 route 单独打包，
 * 普通模块级变量在「点赞路由」和「SSE 路由」里是两份不同的实例，
 * 只有进程级全局对象才能共享同一个订阅表。
 */
const globalForEvents = globalThis as unknown as {
  __mashiroEvents?: Map<string, Set<Listener>>;
};

const channels: Map<string, Set<Listener>> =
  globalForEvents.__mashiroEvents ?? new Map<string, Set<Listener>>();
globalForEvents.__mashiroEvents = channels;

export function subscribeUser(userId: string, listener: Listener): () => void {
  let set = channels.get(userId);
  if (!set) {
    set = new Set();
    channels.set(userId, set);
  }
  set.add(listener);

  return () => {
    set?.delete(listener);
    if (set && set.size === 0) channels.delete(userId);
  };
}

export function publishToUser(userId: string, event: NotificationEvent): void {
  const set = channels.get(userId);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(event);
    } catch {
      // 单个订阅者出错不影响其他订阅者
    }
  }
}
