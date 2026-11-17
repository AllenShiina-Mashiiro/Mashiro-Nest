import { Github, Mail, Play, Rss, Send, Twitter, Link2 } from "lucide-react";
import type { SocialIcon } from "@/lib/types";

const ICONS = {
  mail: Mail,
  github: Github,
  rss: Rss,
  twitter: Twitter,
  bilibili: Play,
  telegram: Send,
  link: Link2,
} as const;

export function SocialIconView({ icon, className }: { icon: SocialIcon; className?: string }) {
  const Icon = ICONS[icon] ?? Link2;
  return <Icon className={className} />;
}
