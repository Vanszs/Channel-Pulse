import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  emphasis?: boolean;
  active?: boolean;
  actionLabel?: string;
  onClick?: () => void;
};

export function MetricCard({
  label,
  value,
  detail,
  emphasis = false,
  active = false,
  actionLabel,
  onClick,
}: MetricCardProps) {
  const content = (
    <>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-black/42">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
      {actionLabel ? (
        <p
          className={cn(
            "mt-4 text-xs font-medium uppercase tracking-[0.22em]",
            active ? "text-[var(--accent)]" : "text-black/48",
          )}
        >
          {active ? "Active view" : actionLabel}
        </p>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className="w-full text-left"
      >
        <Panel
          className={cn(
            "rounded-[28px] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-black/16 hover:bg-white/86",
            emphasis && "border-black/15 bg-[var(--surface-strong)]",
            active &&
              "border-[var(--accent)]/30 bg-[linear-gradient(180deg,rgba(255,107,74,0.12),rgba(255,255,255,0.92))] shadow-[0_18px_36px_rgba(255,107,74,0.1)]",
          )}
        >
          {content}
        </Panel>
      </button>
    );
  }

  return (
    <Panel
      className={cn(
        "rounded-[28px] p-5",
        emphasis && "border-black/15 bg-[var(--surface-strong)]",
        active &&
          "border-[var(--accent)]/30 bg-[linear-gradient(180deg,rgba(255,107,74,0.12),rgba(255,255,255,0.92))]",
      )}
    >
      {content}
    </Panel>
  );
}
