export type ChannelIdentifierKind =
  | "handle"
  | "channelId"
  | "username"
  | "custom";

const SUPPORTED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
]);

const RESERVED_SEGMENTS = new Set([
  "watch",
  "playlist",
  "results",
  "feed",
  "shorts",
  "live",
]);

export type NormalizedInput =
  | {
      ok: true;
      normalizedUrl: string;
      identifier: string;
      kind: ChannelIdentifierKind;
    }
  | {
      ok: false;
      error: string;
    };

export function normalizeYouTubeChannelInput(input: string): NormalizedInput {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      ok: false,
      error: "Paste a YouTube channel URL to begin.",
    };
  }

  const withProtocol = /^[a-z]+:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;

  try {
    url = new URL(withProtocol);
  } catch {
    return {
      ok: false,
      error: "Use a valid YouTube channel URL.",
    };
  }

  if (!SUPPORTED_HOSTS.has(url.hostname.toLowerCase())) {
    return {
      ok: false,
      error: "Only YouTube channel URLs are supported here.",
    };
  }

  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length || RESERVED_SEGMENTS.has(segments[0])) {
    return {
      ok: false,
      error: "Paste a direct channel URL, not a video or playlist link.",
    };
  }

  let identifier = "";
  let normalizedPath = pathname;
  let kind: ChannelIdentifierKind = "custom";

  if (segments[0].startsWith("@")) {
    identifier = segments[0].slice(1);
    normalizedPath = `/${segments[0]}`;
    kind = "handle";
  } else if (segments[0] === "channel" && segments[1]) {
    identifier = segments[1];
    normalizedPath = `/channel/${segments[1]}`;
    kind = "channelId";
  } else if (segments[0] === "user" && segments[1]) {
    identifier = segments[1];
    normalizedPath = `/user/${segments[1]}`;
    kind = "username";
  } else if (segments[0] === "c" && segments[1]) {
    identifier = segments[1];
    normalizedPath = `/c/${segments[1]}`;
    kind = "custom";
  } else {
    identifier = segments[0];
    normalizedPath = `/${segments[0]}`;
    kind = "custom";
  }

  const cleanedIdentifier = identifier.replace(/[^\w.-]+/g, "");
  const normalizedIdentifier =
    kind === "channelId" ? cleanedIdentifier : cleanedIdentifier.toLowerCase();

  if (!normalizedIdentifier) {
    return {
      ok: false,
      error: "That URL does not look like a supported channel format.",
    };
  }

  return {
    ok: true,
    identifier: normalizedIdentifier,
    kind,
    normalizedUrl: `https://www.youtube.com${normalizedPath}`,
  };
}

export function identifierToDisplayName(identifier: string) {
  return identifier
    .replace(/[_.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
