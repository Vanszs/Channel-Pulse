import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  emphasis?: boolean;
  actionLabel?: string;
  onClick?: () => void;
};

export function MetricCard({
  label,
  value,
  detail,
  emphasis = false,
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
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-black/48">
          {actionLabel}
        </p>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-left"
      >
        <Panel
          className={cn(
            "rounded-[28px] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-black/16 hover:bg-white/86",
            emphasis && "border-black/15 bg-[var(--surface-strong)]",
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
      )}
    >
      {content}
    </Panel>
  );
}
