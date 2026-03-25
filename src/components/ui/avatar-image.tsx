"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

type AvatarImageProps = {
  src?: string;
  alt: string;
  fallback: string;
  className?: string;
};

export function AvatarImage({
  src,
  alt,
  fallback,
  className,
}: AvatarImageProps) {
  const [hasFailed, setHasFailed] = useState(false);

  if (!src || hasFailed) {
    return (
      <div
        aria-label={alt}
        className={cn(
          "flex items-center justify-center rounded-[22px] bg-[var(--accent-soft)] text-lg font-semibold text-[var(--ink)]",
          className,
        )}
      >
        {fallback}
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
      className={cn("rounded-[22px] object-cover", className)}
      referrerPolicy="no-referrer"
    />
  );
}
