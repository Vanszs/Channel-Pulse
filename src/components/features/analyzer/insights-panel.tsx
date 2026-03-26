import { Panel } from "@/components/ui/panel";
import { ToneBadge } from "@/components/ui/tone-badge";
import type { ChannelAnalysis, ScoreVector } from "@/types/youtube";

type InsightsPanelProps = {
  analysis: ChannelAnalysis;
  activeSort: "performance" | "views" | "viewsPerDay" | "recency" | "momentum";
};

const weightLabels: Record<keyof ScoreVector, string> = {
  viewReach: "View reach",
  velocity: "Views / day",
  engagement: "Engagement proxy",
  acceleration: "Velocity proxy",
  recency: "Recency",
};

function getSortDescription(sort: InsightsPanelProps["activeSort"]) {
  if (sort === "views") {
    return "The shortlist is currently ranked by total views.";
  }

  if (sort === "viewsPerDay") {
    return "The shortlist is currently ranked by daily view velocity.";
  }

  if (sort === "recency") {
    return "The shortlist is currently ranked by newest publish date.";
  }

  if (sort === "performance") {
    return "The shortlist is currently ranked by performance score.";
  }

  return "The shortlist is currently ranked by momentum score.";
}

export function InsightsPanel({ analysis, activeSort }: InsightsPanelProps) {
  const weightEntries = Object.entries(
    analysis.scoreExplanation.weights,
  ) as Array<[keyof ScoreVector, number]>;

  return (
    <Panel className="fade-up rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
          Strategy notes
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          What this channel is signaling
        </h3>
      </div>

      <div className="mt-6 space-y-4">
        {analysis.insights.map((insight) => (
          <article
            key={insight.title}
            className="rounded-[28px] border border-black/8 bg-white/58 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-base font-medium text-[var(--ink)]">
                {insight.title}
              </h4>
              <ToneBadge tone={insight.tone} />
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {insight.detail}
            </p>
          </article>
        ))}
      </div>

      <div className="section-divider my-6" />

      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-black/42">
          Current ranking
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {getSortDescription(activeSort)}
        </p>

        <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-black/42">
          Scoring model
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {analysis.scoreExplanation.formula}
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {analysis.scoreExplanation.note}
        </p>

        <div className="mt-5 space-y-3">
          {weightEntries.map(([key, value]) => (
            <div key={key} className="grid gap-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-[var(--muted)]">{weightLabels[key]}</span>
                <span className="mono-data font-medium text-[var(--ink)]">
                  {value}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/6">
                <div
                  className="bar-grow h-full rounded-full bg-[linear-gradient(90deg,var(--accent),rgba(217,119,6,0.8))]"
                  style={{ width: `${value * 2.8}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
