import { NextResponse } from "next/server";

import { normalizeYouTubeChannelInput } from "@/lib/channel-url";
import { applyRateLimit, getClientAddress } from "@/lib/rate-limit";
import {
  ANALYZE_INTENT_HEADER,
  ANALYZE_INTENT_VALUE,
  acceptsJsonResponse,
  buildNoStoreHeaders,
  hasJsonContentType,
  isPlainObject,
  isAllowedSameOriginRequest,
  parseJsonBody,
} from "@/lib/request-security";
import {
  analyzeChannel,
  type ChannelAnalysisError,
} from "@/services/channel-analysis";
import type {
  AnalyzeChannelRequest,
  AnalyzeChannelResponse,
} from "@/types/youtube";

const MAX_CHANNEL_URL_LENGTH = 2_048;

function jsonError(
  error: string,
  status: number,
  field: "channelUrl" | "general" = "general",
  headers?: HeadersInit,
) {
  return NextResponse.json<AnalyzeChannelResponse>(
    {
      ok: false,
      error,
      field,
    },
    {
      status,
      headers: buildNoStoreHeaders(headers),
    },
  );
}

function buildRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  resetAt: number;
}) {
  return {
    "X-RateLimit-Limit": `${result.limit}`,
    "X-RateLimit-Remaining": `${result.remaining}`,
    "X-RateLimit-Reset": `${Math.ceil(result.resetAt / 1000)}`,
  };
}

function validateAnalyzeRequest(
  value: unknown,
): { ok: true; channelUrl: string } | { ok: false; error: string; field: "channelUrl" | "general" } {
  if (!isPlainObject(value)) {
    return {
      ok: false,
      error: "Request body must be a JSON object.",
      field: "general",
    };
  }

  const keys = Object.keys(value);

  if (keys.length !== 1 || !keys.includes("channelUrl")) {
    return {
      ok: false,
      error: "Only the channelUrl field is accepted by this endpoint.",
      field: "general",
    };
  }

  if (typeof value.channelUrl !== "string") {
    return {
      ok: false,
      error: "Paste a YouTube channel URL to begin.",
      field: "channelUrl",
    };
  }

  const channelUrl = value.channelUrl.trim();

  if (!channelUrl) {
    return {
      ok: false,
      error: "Paste a YouTube channel URL to begin.",
      field: "channelUrl",
    };
  }

  return {
    ok: true,
    channelUrl,
  };
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 405,
    headers: buildNoStoreHeaders({
      Allow: "POST",
    }),
  });
}

export async function POST(request: Request) {
  const rateLimit = applyRateLimit(getClientAddress(request));

  try {
    if (!rateLimit.allowed) {
      return jsonError(
        "Too many analyze requests from this client. Please wait a minute and try again.",
        429,
        "general",
        {
          ...buildRateLimitHeaders(rateLimit),
          "Retry-After": `${Math.max(
            1,
            Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
          )}`,
        },
      );
    }

    if (!acceptsJsonResponse(request.headers.get("accept"))) {
      return jsonError(
        "This endpoint only returns JSON responses.",
        406,
        "general",
        buildRateLimitHeaders(rateLimit),
      );
    }

    if (!hasJsonContentType(request.headers.get("content-type"))) {
      return jsonError(
        "Only JSON requests are allowed for this endpoint.",
        415,
        "general",
        buildRateLimitHeaders(rateLimit),
      );
    }

    if (!isAllowedSameOriginRequest(request)) {
      return jsonError(
        "This request was blocked by the server's origin policy.",
        403,
        "general",
        buildRateLimitHeaders(rateLimit),
      );
    }

    if (request.headers.get(ANALYZE_INTENT_HEADER) !== ANALYZE_INTENT_VALUE) {
      return jsonError(
        "This request is missing a required application header.",
        403,
        "general",
        buildRateLimitHeaders(rateLimit),
      );
    }

    const parsedBody = await parseJsonBody<Partial<AnalyzeChannelRequest>>(request);

    if (!parsedBody.ok) {
      return jsonError(
        parsedBody.error,
        parsedBody.status,
        "general",
        buildRateLimitHeaders(rateLimit),
      );
    }

    const body = parsedBody.data;

    const validatedRequest = validateAnalyzeRequest(body);

    if (!validatedRequest.ok) {
      return jsonError(
        validatedRequest.error,
        400,
        validatedRequest.field,
        buildRateLimitHeaders(rateLimit),
      );
    }

    if (validatedRequest.channelUrl.length > MAX_CHANNEL_URL_LENGTH) {
      return jsonError(
        "That YouTube URL is longer than expected.",
        400,
        "channelUrl",
        buildRateLimitHeaders(rateLimit),
      );
    }

    const normalized = normalizeYouTubeChannelInput(validatedRequest.channelUrl);

    if (!normalized.ok) {
      return jsonError(
        normalized.error,
        400,
        "channelUrl",
        buildRateLimitHeaders(rateLimit),
      );
    }

    const analysis = await analyzeChannel(normalized.normalizedUrl);

    return NextResponse.json<AnalyzeChannelResponse>(
      {
        ok: true,
        data: analysis,
      },
      {
        headers: buildNoStoreHeaders(buildRateLimitHeaders(rateLimit)),
      },
    );
  } catch (caughtError) {
    if (
      caughtError &&
      typeof caughtError === "object" &&
      "message" in caughtError &&
      "field" in caughtError &&
      "status" in caughtError
    ) {
      const error = caughtError as ChannelAnalysisError;

      return jsonError(
        error.message,
        error.status,
        error.field,
        buildRateLimitHeaders(rateLimit),
      );
    }

    return jsonError(
      "Something went wrong while analyzing this channel.",
      500,
      "general",
      buildRateLimitHeaders(rateLimit),
    );
  }
}
