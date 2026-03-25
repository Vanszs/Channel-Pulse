import { MetricCard } from "@/components/ui/metric-card";
import { formatCompactNumber } from "@/lib/formatters";
import type { ChannelAnalysis } from "@/types/youtube";

type SummaryCardsProps = {
  analysis: ChannelAnalysis;
  onPresetSelect: (preset: "winners" | "views" | "fresh" | "velocity" | "breakout") => void;
};

export function SummaryCards({ analysis, onPresetSelect }: SummaryCardsProps) {
  const { metrics } = analysis;

  return (
    <div className="fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        label="Winners this month"
        value={`${metrics.monthlyWinners}`}
        detail={`${metrics.monthlyWinners} videos are beating the current channel baseline.`}
        emphasis
        actionLabel="Open winner set"
        onClick={() => onPresetSelect("winners")}
      />
      <MetricCard
        label="Monthly views"
        value={formatCompactNumber(metrics.totalRecentViews)}
        detail="Total views from videos published in the last 30 days."
        actionLabel="Sort by total reach"
        onClick={() => onPresetSelect("views")}
      />
      <MetricCard
        label="Uploads this month"
        value={`${metrics.videosThisMonth}`}
        detail="Recent uploads included in the month window."
        actionLabel="Focus on fresh uploads"
        onClick={() => onPresetSelect("fresh")}
      />
      <MetricCard
        label="Avg views / day"
        value={formatCompactNumber(metrics.averageViewsPerDay)}
        detail="Average daily velocity across the analyzed set."
        actionLabel="Sort by velocity"
        onClick={() => onPresetSelect("velocity")}
      />
      <MetricCard
        label="Breakout count"
        value={`${metrics.breakoutCount}`}
        detail="Uploads in the current month window that are still accelerating above baseline."
        actionLabel="Show breakout only"
        onClick={() => onPresetSelect("breakout")}
      />
    </div>
  );
}
