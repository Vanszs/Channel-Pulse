import type { InsightTone } from "@/types/youtube";

import { cn } from "@/lib/cn";

type ToneBadgeProps = {
  tone: InsightTone;
};

const labels: Record<InsightTone, string> = {
  signal: "High signal",
  neutral: "Pattern",
  watch: "Watch",
};

export function ToneBadge({ tone }: ToneBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
        tone === "signal" &&
          "border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--ink)]",
        tone === "neutral" && "border-black/8 bg-black/4 text-black/68",
        tone === "watch" && "border-[var(--signal)]/20 bg-[var(--signal-soft)] text-black/70",
      )}
    >
      {labels[tone]}
    </span>
  );
}
