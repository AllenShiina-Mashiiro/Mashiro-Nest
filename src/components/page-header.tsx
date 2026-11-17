import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden pb-10 pt-28 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,black_45%,transparent_92%)]">
        <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_0%,rgba(255,255,255,0.9),transparent_70%)] dark:bg-[radial-gradient(60%_70%_at_50%_0%,rgba(125,211,184,0.10),transparent_70%)]" />
        <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-sakura-200/40 blur-3xl dark:bg-sakura-400/10" />
        <div className="absolute -right-16 top-0 h-64 w-64 rounded-full bg-mint-200/40 blur-3xl dark:bg-mint-400/10" />
      </div>

      <div className="mx-auto max-w-[1180px] px-4">
        {eyebrow ? (
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-mint-500 dark:text-mint-300">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl dark:text-white">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500 dark:text-ink-300/85">
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
