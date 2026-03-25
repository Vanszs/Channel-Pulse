"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

type VideoThumbnailProps = {
  src: string;
  alt: string;
  className?: string;
};

export function VideoThumbnail({
  src,
  alt,
  className,
}: VideoThumbnailProps) {
  const [hasFailed, setHasFailed] = useState(false);

  if (!src || hasFailed) {
    return (
      <div
        aria-label={alt}
        className={cn(
          "flex items-center justify-center rounded-[18px] border border-black/8 bg-[linear-gradient(135deg,rgba(17,17,15,0.08),rgba(255,107,74,0.14))] text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-black/52",
          className,
        )}
      >
        Video
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasFailed(true)}
      loading="lazy"
      decoding="async"
      className={cn("rounded-[18px] object-cover", className)}
      referrerPolicy="no-referrer"
    />
  );
}
