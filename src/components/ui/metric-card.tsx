import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  emphasis?: boolean;
};

export function MetricCard({
  label,
  value,
  detail,
  emphasis = false,
}: MetricCardProps) {
  return (
    <Panel
      className={cn(
        "rounded-[28px] p-5",
        emphasis && "border-black/15 bg-[var(--surface-strong)]",
      )}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-black/42">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </Panel>
  );
}
