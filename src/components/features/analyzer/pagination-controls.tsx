import { pageSizeOptions } from "@/lib/pagination";

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

function buildPageItems(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-end", totalPages] as const;
  }

  if (page >= totalPages - 3) {
    return [
      1,
      "ellipsis-start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    "ellipsis-start",
    page - 1,
    page,
    page + 1,
    "ellipsis-end",
    totalPages,
  ] as const;
}

export function PaginationControls({
  page,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  if (!totalItems) {
    return null;
  }

  const pageItems = buildPageItems(page, totalPages);

  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-black/8 bg-white/58 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-medium text-[var(--ink)]">
          Showing {startIndex + 1}-{endIndex} of {totalItems} ranked uploads
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Page {page} of {totalPages}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number.parseInt(event.target.value, 10))}
            className="h-10 rounded-full border border-black/10 bg-white/80 px-4 text-sm text-[var(--ink)] outline-none transition focus:border-black/20"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white/72 px-4 text-xs font-medium text-[var(--ink)] transition hover:border-black/18 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            First
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white/72 px-4 text-xs font-medium text-[var(--ink)] transition hover:border-black/18 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Prev
          </button>

          {pageItems.map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-xs font-medium transition ${
                  item === page
                    ? "border-[var(--accent)]/22 bg-[var(--accent-soft)] text-[var(--ink)]"
                    : "border-black/10 bg-white/72 text-[var(--ink)] hover:border-black/18 hover:bg-white"
                }`}
              >
                {item}
              </button>
            ) : (
              <span
                key={item}
                className="inline-flex h-10 items-center justify-center px-1 text-xs text-[var(--muted)]"
              >
                …
              </span>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white/72 px-4 text-xs font-medium text-[var(--ink)] transition hover:border-black/18 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white/72 px-4 text-xs font-medium text-[var(--ink)] transition hover:border-black/18 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
