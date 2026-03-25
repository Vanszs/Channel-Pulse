import type { LifecycleLabel, TrendDirection } from "@/types/youtube";

import { cn } from "@/lib/cn";

type TrendBadgeProps = {
  trend: TrendDirection;
  lifecycle: LifecycleLabel;
};

function TrendArrow({ trend }: { trend: TrendDirection }) {
  if (trend === "up") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill="none"
      >
        <path
          d="M4 11L11 4M6 4H11V9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (trend === "down") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill="none"
      >
        <path
          d="M4 5L11 12M11 7V12H6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
    >
      <path
        d="M3.5 8H12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TrendBadge({ trend, lifecycle }: TrendBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        lifecycle === "Breakout" &&
          "border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--ink)]",
        lifecycle === "Steady" &&
          "border-[var(--signal)]/20 bg-[var(--signal-soft)] text-[var(--ink)]",
        lifecycle === "Cooling" &&
          "border-black/10 bg-white/78 text-black/54",
      )}
    >
      <TrendArrow trend={trend} />
      <span>{lifecycle}</span>
    </span>
  );
}
