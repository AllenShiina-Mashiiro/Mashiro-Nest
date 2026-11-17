"use client";

import { Eye } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ViewCounter({ slug, initial }: { slug: string; initial: number }) {
  const [views, setViews] = useState(initial);
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;

    const key = `viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode */
    }

    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { views?: number } | null) => {
        if (payload?.views) setViews((current) => Math.max(current, payload.views as number));
      })
      .catch(() => undefined);
  }, [slug]);

  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Eye className="h-3.5 w-3.5" />
      {views.toLocaleString("en-US")}
    </span>
  );
}
