"use client";

import { useEffect, useState } from "react";
import { msUntilNextBucket } from "@/lib/hero";

/**
 * 主视觉图片：服务端先按时间桶给定初始图（SSR 一致），
 * 客户端在下一个时间桶边界自动换成下一张，不用刷新页面。
 */
export function HeroImage({
  images,
  initial,
  rotateMinutes,
  className,
}: {
  images: string[];
  initial: string;
  rotateMinutes: number;
  className: string;
}) {
  const [src, setSrc] = useState(initial);

  useEffect(() => {
    if (images.length < 2) return;

    let timer = 0;
    let cancelled = false;
    const key = images.join("|");

    const schedule = () => {
      if (cancelled) return;
      timer = window.setTimeout(() => {
        const list = key.split("|");
        const period = rotateMinutes * 60 * 1000;
        const bucket = Math.floor(Date.now() / period);
        setSrc(list[((bucket % list.length) + list.length) % list.length]);
        schedule();
      }, msUntilNextBucket(rotateMinutes) + 250);
    };

    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [images, rotateMinutes]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden="true" className={className} />
  );
}
