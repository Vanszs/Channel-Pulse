export type PaginationState = {
  page: number;
  pageSize: number;
};

export const pageSizeOptions = [10, 20, 50] as const;

export const defaultPaginationState: PaginationState = {
  page: 1,
  pageSize: pageSizeOptions[0],
};

export function sanitizePage(page: number | undefined) {
  if (!page || !Number.isFinite(page)) {
    return 1;
  }

  return Math.max(1, Math.floor(page));
}

export function sanitizePageSize(pageSize: number | undefined) {
  if (!pageSize || !Number.isFinite(pageSize)) {
    return defaultPaginationState.pageSize;
  }

  const normalizedPageSize = Math.floor(pageSize);

  if (pageSizeOptions.includes(normalizedPageSize as (typeof pageSizeOptions)[number])) {
    return normalizedPageSize;
  }

  return defaultPaginationState.pageSize;
}

export function getTotalPages(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
}

export function clampPage(page: number, totalItems: number, pageSize: number) {
  return Math.min(sanitizePage(page), getTotalPages(totalItems, pageSize));
}

export function paginateItems<T>(items: T[], pagination: PaginationState) {
  const totalItems = items.length;
  const pageSize = sanitizePageSize(pagination.pageSize);
  const currentPage = clampPage(pagination.page, totalItems, pageSize);
  const startIndex = totalItems ? (currentPage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    items: items.slice(startIndex, endIndex),
    totalItems,
    totalPages: getTotalPages(totalItems, pageSize),
    currentPage,
    pageSize,
    startIndex,
    endIndex,
  };
}
