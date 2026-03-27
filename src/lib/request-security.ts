export const ANALYZE_INTENT_HEADER = "x-channel-pulse-intent";
export const ANALYZE_INTENT_VALUE = "analyze-channel";

const MAX_REQUEST_BYTES = 4_096;
const JSON_CONTENT_TYPE_PATTERN = /^application\/(?:[\w.+-]+\+)?json(?:;|$)/i;
const JSON_ACCEPT_PATTERN =
  /(?:^|,)\s*(?:application\/(?:[\w.+-]+\+)?json|application\/\*|\*\/\*)\s*(?:;|,|$)/i;
const TRUST_SAME_SITE_UNSAFE_REQUESTS = false;
const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

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
  headers.set("Expires", "0");

  const varyParts = new Set(
    (headers.get("Vary") ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );

  for (const value of ["Origin", "Referer", "Sec-Fetch-Site", "Accept"]) {
    varyParts.add(value);
  }

  headers.set("Vary", Array.from(varyParts).join(", "));

  return headers;
}

export function hasJsonContentType(contentType: string | null) {
  return contentType ? JSON_CONTENT_TYPE_PATTERN.test(contentType) : false;
}

export function isAllowedSameOriginRequest(request: Request) {
  const method = request.method.toUpperCase();
  const isUnsafeMethod = !SAFE_HTTP_METHODS.has(method);
  const fetchSite = request.headers.get("sec-fetch-site");
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

  if (fetchSite === "cross-site") {
    return false;
  }

  if (fetchSite === "same-origin") {
    return true;
  }

  if (fetchSite === "same-site") {
    return TRUST_SAME_SITE_UNSAFE_REQUESTS || !isUnsafeMethod;
  }

  if (fetchSite === "none") {
    return !isUnsafeMethod;
  }

  return false;
}

export function acceptsJsonResponse(accept: string | null) {
  return accept === null || JSON_ACCEPT_PATTERN.test(accept);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export async function parseJsonBody<T>(request: Request): Promise<ParsedJsonBody<T>> {
  const rawBody = await request.text();
  const bodyBytes = new TextEncoder().encode(rawBody).byteLength;

  if (bodyBytes > MAX_REQUEST_BYTES) {
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
