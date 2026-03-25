"use client";

import type { FormEvent } from "react";

type ChannelFormProps = {
  value: string;
  isLoading: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onExampleSelect: (value: string) => void;
  examples: string[];
};

export function ChannelForm({
  value,
  isLoading,
  error,
  onChange,
  onSubmit,
  onExampleSelect,
  examples,
}: ChannelFormProps) {
  return (
    <form className="mt-10 space-y-4" onSubmit={onSubmit}>
      <label className="block space-y-2">
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-black/44">
          YouTube channel URL
        </span>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://www.youtube.com/@competitor"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            className="h-14 flex-1 rounded-full border border-black/10 bg-white/88 px-5 text-base text-[var(--ink)] outline-none transition focus:border-black/25"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-14 items-center justify-center rounded-full border border-[var(--accent)]/18 bg-[linear-gradient(135deg,rgba(255,107,74,0.18),rgba(255,255,255,0.96))] px-6 text-sm font-medium text-[var(--ink)] shadow-[0_12px_28px_rgba(255,107,74,0.12)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]/28 hover:shadow-[0_16px_34px_rgba(255,107,74,0.16)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Analyzing..." : "Analyze Channel"}
          </button>
        </div>
      </label>

      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <span>Try a sample:</span>
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onExampleSelect(example)}
            className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:border-black/20 hover:bg-white"
          >
            {example.replace("https://www.youtube.com/", "")}
          </button>
        ))}
      </div>

      <p className="text-sm leading-6 text-[var(--muted)]">
        Paste a public channel handle, custom URL, or channel ID. We fetch recent
        public uploads and rank them by momentum, reach, and recency.
      </p>

      {error ? (
        <p className="rounded-2xl border border-[var(--danger)]/12 bg-[var(--danger)]/6 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </form>
  );
}
