const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const signedPercentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
});

export function formatCompactNumber(value: number) {
  return compactFormatter.format(value);
}

export function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function formatPercent(value: number) {
  return percentFormatter.format(value);
}

export function formatSignedPercent(value: number) {
  return signedPercentFormatter.format(value);
}

export function formatRelativeDays(ageDays: number) {
  if (ageDays <= 0) {
    return "today";
  }

  if (ageDays === 1) {
    return "1 day ago";
  }

  return `${ageDays} days ago`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (!remainder) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}
