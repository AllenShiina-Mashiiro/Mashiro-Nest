import {
  Archive,
  House,
  Info,
  MessageSquareText,
  Tv,
  Users,
} from "lucide-react";
import type { NavItem } from "@/lib/types";

const NAV_ICONS = {
  home: House,
  archive: Archive,
  about: Info,
  friends: Users,
  anime: Tv,
  moments: MessageSquareText,
} as const;

export type NavIconName = keyof typeof NAV_ICONS;

/** 导航项的小图标：没配置图标时返回 null。 */
export function NavIcon({
  item,
  className = "h-3.5 w-3.5",
}: {
  item: Pick<NavItem, "icon">;
  className?: string;
}) {
  const Icon = item.icon ? NAV_ICONS[item.icon as NavIconName] : undefined;
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}
