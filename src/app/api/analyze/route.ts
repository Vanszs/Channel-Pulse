import { NextResponse } from "next/server";

import { normalizeYouTubeChannelInput } from "@/lib/channel-url";
import {
  analyzeChannel,
  type ChannelAnalysisError,
} from "@/services/channel-analysis";
import type {
  AnalyzeChannelRequest,
  AnalyzeChannelResponse,
} from "@/types/youtube";

const MAX_REQUEST_BYTES = 4_096;
const REQUIRED_REQUEST_HEADER = "x-channel-pulse-request";
const REQUIRED_REQUEST_HEADER_VALUE = "analyze";

function jsonError(
  error: string,
  status: number,
  field: "channelUrl" | "general" = "general",
) {
  return NextResponse.json<AnalyzeChannelResponse>(
    {
      ok: false,
      error,
      field,
    },
    { status },
  );
}

function hasValidOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  return origin === new URL(request.url).origin;
}

function hasAllowedFetchSite(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");

  if (!fetchSite) {
    return true;
  }

  return ["same-origin", "same-site", "none"].includes(fetchSite);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    const requestMarker = request.headers.get(REQUIRED_REQUEST_HEADER);

    if (!contentType.toLowerCase().startsWith("application/json")) {
      return jsonError(
        "Only JSON requests are allowed for this endpoint.",
        415,
      );
    }

    if (!hasValidOrigin(request) || !hasAllowedFetchSite(request)) {
      return jsonError(
        "This request was blocked by the server's origin policy.",
        403,
      );
    }

    if (requestMarker !== REQUIRED_REQUEST_HEADER_VALUE) {
      return jsonError(
        "This request is missing a required application header.",
        403,
      );
    }

    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return jsonError(
        "Request body is too large for this endpoint.",
        413,
      );
    }

    const rawBody = await request.text();

    if (rawBody.length > MAX_REQUEST_BYTES) {
      return jsonError(
        "Request body is too large for this endpoint.",
        413,
      );
    }

    let body: Partial<AnalyzeChannelRequest>;

    try {
      body = JSON.parse(rawBody) as Partial<AnalyzeChannelRequest>;
    } catch {
      return jsonError(
        "The request body must be valid JSON.",
        400,
      );
    }

    if (!body.channelUrl || typeof body.channelUrl !== "string") {
      return jsonError("Paste a YouTube channel URL to begin.", 400, "channelUrl");
    }

    if (body.channelUrl.length > 2_048) {
      return jsonError(
        "That YouTube URL is longer than expected.",
        400,
        "channelUrl",
      );
    }

    const normalized = normalizeYouTubeChannelInput(body.channelUrl);

    if (!normalized.ok) {
      return jsonError(normalized.error, 400, "channelUrl");
    }

    const analysis = await analyzeChannel(normalized.normalizedUrl);

    return NextResponse.json<AnalyzeChannelResponse>(
      {
        ok: true,
        data: analysis,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
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

      return jsonError(error.message, error.status, error.field);
    }

    return jsonError(
      "Something went wrong while analyzing this channel.",
      500,
    );
  }
}
