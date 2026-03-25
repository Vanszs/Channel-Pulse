export const ANALYZE_INTENT_HEADER = "x-channel-pulse-intent";
export const ANALYZE_INTENT_VALUE = "analyze-channel";

const MAX_REQUEST_BYTES = 4_096;

type ParsedJsonBody<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

export function buildNoStoreHeaders(init?: HeadersInit) {
  const headers = new Headers(init);

  headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  headers.set("Pragma", "no-cache");

  return headers;
}

export function hasJsonContentType(contentType: string | null) {
  return contentType?.toLowerCase().includes("application/json") ?? false;
}

export function isAllowedSameOriginRequest(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite === "cross-site") {
    return false;
  }

  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");

  if (origin) {
    try {
      return new URL(origin).origin === requestOrigin;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");

  if (referer) {
    try {
      return new URL(referer).origin === requestOrigin;
    } catch {
      return false;
    }
  }

  return fetchSite === null || fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "none";
}

export async function parseJsonBody<T>(request: Request): Promise<ParsedJsonBody<T>> {
  const rawBody = await request.text();

  if (rawBody.length > MAX_REQUEST_BYTES) {
    return {
      ok: false,
      error: "Request body is too large.",
      status: 413,
    };
  }

  if (!rawBody.trim()) {
    return {
      ok: false,
      error: "Request body is required.",
      status: 400,
    };
  }

  try {
    return {
      ok: true,
      data: JSON.parse(rawBody) as T,
    };
  } catch {
    return {
      ok: false,
      error: "Request body must be valid JSON.",
      status: 400,
    };
  }
}
