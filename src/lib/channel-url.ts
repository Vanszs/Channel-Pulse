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

type NormalizedInput =
  | {
      ok: true;
      normalizedUrl: string;
      identifier: string;
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

  if (segments[0].startsWith("@")) {
    identifier = segments[0].slice(1);
    normalizedPath = `/${segments[0]}`;
  } else if (["channel", "c", "user"].includes(segments[0]) && segments[1]) {
    identifier = segments[1];
    normalizedPath = `/${segments[0]}/${segments[1]}`;
  } else {
    identifier = segments[0];
    normalizedPath = `/${segments[0]}`;
  }

  const cleanedIdentifier = identifier.replace(/[^\w.-]+/g, "").toLowerCase();

  if (!cleanedIdentifier) {
    return {
      ok: false,
      error: "That URL does not look like a supported channel format.",
    };
  }

  return {
    ok: true,
    identifier: cleanedIdentifier,
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
