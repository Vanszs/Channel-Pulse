import { NextResponse } from "next/server";

import { normalizeYouTubeChannelInput } from "@/lib/channel-url";
import { analyzeChannel } from "@/services/channel-analysis";
import type {
  AnalyzeChannelRequest,
  AnalyzeChannelResponse,
} from "@/types/youtube";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AnalyzeChannelRequest>;

    if (!body.channelUrl || typeof body.channelUrl !== "string") {
      return NextResponse.json<AnalyzeChannelResponse>(
        {
          ok: false,
          error: "Paste a YouTube channel URL to begin.",
          field: "channelUrl",
        },
        { status: 400 },
      );
    }

    const normalized = normalizeYouTubeChannelInput(body.channelUrl);

    if (!normalized.ok) {
      return NextResponse.json<AnalyzeChannelResponse>(
        {
          ok: false,
          error: normalized.error,
          field: "channelUrl",
        },
        { status: 400 },
      );
    }

    const analysis = await analyzeChannel(normalized.normalizedUrl);

    return NextResponse.json<AnalyzeChannelResponse>({
      ok: true,
      data: analysis,
    });
  } catch {
    return NextResponse.json<AnalyzeChannelResponse>(
      {
        ok: false,
        error: "Something went wrong while analyzing this channel.",
        field: "general",
      },
      { status: 500 },
    );
  }
}
