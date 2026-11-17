import { cn } from "@/lib/utils";

const GRADIENTS = [
  "linear-gradient(140deg,#f7a8c4,#f490b6)",
  "linear-gradient(140deg,#7dd3b8,#4cba9b)",
  "linear-gradient(140deg,#8fb8f4,#6d90e0)",
  "linear-gradient(140deg,#f4b78f,#e89a6d)",
  "linear-gradient(140deg,#b79bf4,#9b7ae8)",
  "linear-gradient(140deg,#8fe0f4,#5fc4de)",
];

function pick(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 9973;
  return GRADIENTS[hash % GRADIENTS.length];
}

export function UserAvatar({
  user,
  size = 40,
  className,
  rounded = "rounded-full",
}: {
  user: { displayName: string; avatarUrl: string | null } | null | undefined;
  size?: number;
  className?: string;
  rounded?: string;
}) {
  const name = user?.displayName?.trim() || "?";
  const style = { width: size, height: size };

  if (user?.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={name}
        style={style}
        className={cn("shrink-0 object-cover", rounded, className)}
      />
    );
  }

  return (
    <span
      style={{ ...style, background: pick(name) }}
      className={cn(
        "grid shrink-0 place-items-center font-bold text-white",
        rounded,
        className,
      )}
    >
      <span style={{ fontSize: Math.max(11, size * 0.42) }}>{name.slice(0, 1).toUpperCase()}</span>
    </span>
  );
}
