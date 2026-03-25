import { Panel } from "@/components/ui/panel";
import { formatCompactNumber, formatDate } from "@/lib/formatters";
import type { ChannelAnalysis } from "@/types/youtube";

type ChannelHeaderProps = {
  analysis: ChannelAnalysis;
  onCopyBrief: () => void;
  copyLabel: string;
};

export function ChannelHeader({
  analysis,
  onCopyBrief,
  copyLabel,
}: ChannelHeaderProps) {
  return (
    <Panel className="fade-up rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          {analysis.channel.avatarUrl ? (
            <img
              src={analysis.channel.avatarUrl}
              alt={`${analysis.channel.name} avatar`}
              className="h-16 w-16 shrink-0 rounded-[22px] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[var(--accent-soft)] text-lg font-semibold text-[var(--ink)]">
              {analysis.channel.avatarText}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
                Channel overview
              </p>
              <span className="rounded-full border border-black/8 px-3 py-1 text-xs font-medium text-black/60">
                {analysis.channel.category}
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[var(--ink)]">
              {analysis.channel.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {analysis.channel.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {analysis.channel.focusTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-black/8 bg-white/70 px-3 py-1 text-xs font-medium text-black/62"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:items-end">
          <button
            type="button"
            onClick={onCopyBrief}
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white/72 px-5 text-sm font-medium text-[var(--ink)] transition hover:border-black/18 hover:bg-white"
          >
            {copyLabel}
          </button>
          <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2 lg:grid-cols-1">
            <p>
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                Subscribers
              </span>
              <span className="mt-1 block text-base font-medium text-[var(--ink)]">
                {analysis.channel.subscriberCount === null
                  ? "Hidden"
                  : formatCompactNumber(analysis.channel.subscriberCount)}
              </span>
            </p>
            <p>
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                Cadence
              </span>
              <span className="mt-1 block text-base font-medium text-[var(--ink)]">
                {analysis.channel.uploadCadence}
              </span>
            </p>
            <p>
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                Source
              </span>
              <span className="mono-data mt-1 block text-xs text-black/56">
                {analysis.channel.url}
              </span>
            </p>
            <p>
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                Generated
              </span>
              <span className="mt-1 block text-base font-medium text-[var(--ink)]">
                {formatDate(analysis.generatedAt)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
