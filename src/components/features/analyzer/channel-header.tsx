import { AvatarImage } from "@/components/ui/avatar-image";
import { Panel } from "@/components/ui/panel";
import {
  formatCompactNumber,
  formatDate,
  formatHostname,
  formatPercent,
  truncateText,
} from "@/lib/formatters";
import { pickFastestMover } from "@/lib/topics";
import type { ChannelAnalysis } from "@/types/youtube";

type ChannelHeaderProps = {
  analysis: ChannelAnalysis;
  onCopyBrief: () => void;
  copyLabel: string;
  onTagSelect: (tag: string) => void;
};

export function ChannelHeader({
  analysis,
  onCopyBrief,
  copyLabel,
  onTagSelect,
}: ChannelHeaderProps) {
  const winnerRate = analysis.metrics.videosThisMonth
    ? analysis.metrics.monthlyWinners / analysis.metrics.videosThisMonth
    : 0;
  const leadingVideo = pickFastestMover(analysis.videos);

  return (
    <Panel className="fade-up rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_340px]">
        <div className="min-w-0">
          <div className="flex min-w-0 gap-4 sm:gap-5">
            <AvatarImage
              src={analysis.channel.avatarUrl}
              alt={`${analysis.channel.name} avatar`}
              fallback={analysis.channel.avatarText}
              className="h-16 w-16 shrink-0 sm:h-20 sm:w-20"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
                  Channel overview
                </p>
                <span className="rounded-full border border-black/8 px-3 py-1 text-xs font-medium text-black/60">
                  {analysis.channel.category}
                </span>
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[var(--ink)] sm:text-[2.6rem]">
                {analysis.channel.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-black/54">
                {analysis.channel.handle}
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                {truncateText(analysis.channel.description, 210)}
              </p>
            </div>
          </div>

          {analysis.channel.focusTags.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {analysis.channel.focusTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagSelect(tag)}
                  className="rounded-full border border-black/8 bg-white/70 px-3 py-1.5 text-xs font-medium text-black/62 transition hover:border-black/18 hover:bg-white"
                >
                  {tag}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-[var(--muted)]">
              No repeated content themes are strong enough yet to turn into quick filters.
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-[24px] border border-black/8 bg-white/62 p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                Winner rate
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                {formatPercent(winnerRate)}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {analysis.metrics.monthlyWinners} of {analysis.metrics.videosThisMonth} recent
                uploads are currently beating the channel baseline.
              </p>
            </article>

            <article className="rounded-[24px] border border-black/8 bg-white/62 p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                Fastest mover
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                {leadingVideo
                  ? `${formatCompactNumber(leadingVideo.viewsPerDay)}/day`
                  : "No data"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {leadingVideo
                  ? truncateText(`Fastest upload right now: ${leadingVideo.title}`, 78)
                  : "No recent upload data is available for this channel yet."}
              </p>
            </article>

            <article className="rounded-[24px] border border-black/8 bg-white/62 p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                Monthly reach
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                {formatCompactNumber(analysis.metrics.totalRecentViews)}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Combined views from uploads published during the current 30-day scan window.
              </p>
            </article>
          </div>
        </div>

        <aside className="rounded-[30px] border border-black/8 bg-white/68 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <button
              type="button"
              onClick={onCopyBrief}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--accent)]/18 bg-[linear-gradient(135deg,rgba(255,107,74,0.16),rgba(255,255,255,0.96))] px-5 text-sm font-medium text-[var(--ink)] shadow-[0_10px_24px_rgba(255,107,74,0.1)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]/28 hover:shadow-[0_14px_30px_rgba(255,107,74,0.14)]"
            >
              {copyLabel}
            </button>
            <a
              href={analysis.channel.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white/74 px-5 text-sm font-medium text-[var(--ink)] transition hover:border-black/18 hover:bg-white"
            >
              Open channel
            </a>
          </div>

          <div className="section-divider my-5" />

          <div className="grid gap-4 text-sm text-[var(--muted)] sm:grid-cols-2 xl:grid-cols-1">
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
                Posting cadence
              </span>
              <span className="mt-1 block text-base font-medium text-[var(--ink)]">
                {analysis.channel.uploadCadence}
              </span>
            </p>
            <p>
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                Source
              </span>
              <a
                href={analysis.channel.url}
                target="_blank"
                rel="noreferrer"
                className="mono-data mt-1 block text-xs text-black/56 underline-offset-4 transition hover:text-[var(--ink)] hover:underline"
              >
                {formatHostname(analysis.channel.url)}
              </a>
            </p>
            <p>
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                Updated
              </span>
              <span className="mt-1 block text-base font-medium text-[var(--ink)]">
                {formatDate(analysis.generatedAt)}
              </span>
            </p>
          </div>
        </aside>
      </div>
    </Panel>
  );
}
