"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/types";

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.length) return;
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -68% 0px", threshold: [0, 1] },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav aria-label="目录" className="card-soft p-4">
      <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-400">
        On this page
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`block truncate rounded-lg py-1 pr-1 text-[11.5px] leading-snug transition ${
                item.level === 3 ? "pl-5" : "pl-2.5"
              } ${
                active === item.id
                  ? "bg-mint-50 font-semibold text-mint-600 dark:bg-mint-400/10 dark:text-mint-300"
                  : "text-ink-400 hover:text-ink-700 dark:hover:text-white/80"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
