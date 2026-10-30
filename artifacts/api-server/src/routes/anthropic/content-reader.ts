import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_PAGE_BYTES = 1_500_000;
const MAX_LINK_TEXT = 4_000;
const MAX_LINKS_PER_MESSAGE = 3;
const REQUEST_TIMEOUT_MS = 10_000;

type PublicResource = {
  body: string;
  contentType: string;
  url: URL;
};

type LinkResult = {
  url: string;
  title: string;
  text: string;
  note?: string;
};

export async function addPublicLinkContext(
  message: string,
): Promise<string> {
  const urls = [...new Set(extractUrls(message))].slice(
    0,
    MAX_LINKS_PER_MESSAGE,
  );
  if (!urls.length) return message;

  const results = await Promise.all(urls.map(readLink));
  const context = results
    .map((result, index) => {
      const lines = [
        `Link ${index + 1}: ${result.title || result.url}`,
        `URL: ${result.url}`,
        result.text ? `Accessible content:\n${result.text}` : "",
        result.note ? `Reading note: ${result.note}` : "",
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n");

  return `${message}\n\n[Public link reading]\n${context}`;
}

function extractUrls(message: string): string[] {
  return (message.match(/https?:\/\/[^\s<>"'`]+/gi) ?? []).map((url) =>
    url.replace(/[),.!?;:]+$/, ""),
  );
}

async function readLink(rawUrl: string): Promise<LinkResult> {
  try {
    const page = await fetchPublicText(rawUrl);
    const title =
      getMetaValue(page.body, ["og:title", "twitter:title"]) ||
      extractTitle(page.body) ||
      page.url.hostname;
    const description = getMetaValue(page.body, [
      "og:description",
      "twitter:description",
      "description",
    ]);

    let text = "";
    let note: string | undefined;
    const transcript = await readYouTubeTranscript(rawUrl, page.body);
    if (transcript) {
      text = `Available video captions/transcript:\n${transcript}`;
    } else {
      text = extractPageText(page.body);
      if (!text && description) text = description;
      if (isSocialUrl(page.url) && text.length < 180) {
        note =
          "Only a short public preview was available; the full post may require sign-in or be restricted.";
      }
      if (isYouTubeUrl(page.url)) {
        note =
          "The public video page was reached, but captions/transcripts were not available to the reader.";
      }
    }

    if (description && !text.includes(description)) {
      text = [description, text].filter(Boolean).join("\n\n");
    }

    return {
      url: page.url.href,
      title: decodeHtml(title).slice(0, 300),
      text: decodeHtml(text).slice(0, MAX_LINK_TEXT),
      note,
    };
  } catch {
    return {
      url: rawUrl,
      title: "Link content unavailable",
      text: "",
      note:
        "The page could not be read. It may require sign-in, subscription, CAPTCHA, or block automated access. Do not infer or claim to have read its contents; ask the user to paste the text or attach a screenshot.",
    };
  }
}

async function fetchPublicText(rawUrl: string): Promise<PublicResource> {
  let currentUrl = await validatePublicUrl(rawUrl);

  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml,application/json,text/xml",
          "User-Agent":
            "Mozilla/5.0 (compatible; DailyDefenseReader/1.0; +https://replit.com)",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location || redirectCount === 3) {
          throw new Error("The page redirected too many times.");
        }
        currentUrl = await validatePublicUrl(
          new URL(location, currentUrl).href,
        );
        continue;
      }

      if (!response.ok) throw new Error("The public page was not available.");
      const contentType = response.headers.get("content-type") ?? "";
      if (
        !contentType.includes("text/html") &&
        !contentType.includes("application/xhtml+xml") &&
        !contentType.includes("application/json") &&
        !contentType.includes("text/xml") &&
        !contentType.includes("application/xml")
      ) {
        throw new Error("The link did not return readable text.");
      }

      const declaredLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(declaredLength) && declaredLength > MAX_PAGE_BYTES) {
        throw new Error("The page is too large to read.");
      }

      return {
        body: await readResponseBody(response, MAX_PAGE_BYTES),
        contentType,
        url: currentUrl,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("The public page could not be reached.");
}

async function validatePublicUrl(rawUrl: string): Promise<URL> {
  const url = new URL(rawUrl);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    !url.hostname
  ) {
    throw new Error("Only public HTTPS links can be read.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    isIP(hostname)
  ) {
    throw new Error("Private network links cannot be read.");
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new Error("Private network links cannot be read.");
  }

  url.hash = "";
  return url;
}

function isBlockedAddress(address: string): boolean {
  const mappedV4 = address.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mappedV4) return isBlockedAddress(mappedV4[1]!);

  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a! >= 224 ||
      (a === 100 && b! >= 64 && b! <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b! >= 16 && b! <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113)
    );
  }

  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb") ||
      lower.startsWith("ff")
    );
  }

  return true;
}

async function readResponseBody(
  response: Response,
  maxBytes: number,
): Promise<string> {
  if (!response.body) throw new Error("The page did not contain readable text.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error("The page is too large to read.");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readYouTubeTranscript(
  rawUrl: string,
  html: string,
): Promise<string> {
  const videoId = getYouTubeVideoId(rawUrl);
  if (!videoId) return "";

  const playerData = extractJsonAfterMarker(
    html,
    "ytInitialPlayerResponse",
  ) as {
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: Array<{ baseUrl?: string; languageCode?: string }>;
      };
    };
  } | null;

  const tracks =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  const selectedTrack =
    tracks.find((track) => track.languageCode?.startsWith("en")) ?? tracks[0];
  if (!selectedTrack?.baseUrl) return "";

  try {
    const captionsUrl = new URL(selectedTrack.baseUrl);
    captionsUrl.searchParams.set("fmt", "json3");
    const captions = await fetchPublicText(captionsUrl.href);
    const jsonTranscript = parseJson3Transcript(captions.body);
    if (jsonTranscript) return jsonTranscript.slice(0, 12_000);
    return parseXmlTranscript(captions.body).slice(0, 12_000);
  } catch {
    return "";
  }
}

function getYouTubeVideoId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    if (host === "youtu.be" || host.endsWith(".youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }
    if (!host.includes("youtube.com")) return null;
    return (
      url.searchParams.get("v") ??
      url.pathname.match(/\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ??
      null
    );
  } catch {
    return null;
  }
}

function extractJsonAfterMarker(
  source: string,
  marker: string,
): unknown | null {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = source.indexOf("{", markerIndex + marker.length);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(source.slice(start, index + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function parseJson3Transcript(source: string): string {
  try {
    const data = JSON.parse(source) as {
      events?: Array<{ segs?: Array<{ utf8?: string }> }>;
    };
    return (data.events ?? [])
      .flatMap((event) => event.segs ?? [])
      .map((segment) => segment.utf8 ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

function parseXmlTranscript(source: string): string {
  return [...source.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi)]
    .map((match) => decodeHtml(match[1] ?? ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMetaValue(html: string, names: string[]): string {
  for (const match of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const attributes = new Map<string, string>();
    for (const attribute of (match[1] ?? "").matchAll(
      /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
    )) {
      attributes.set(
        (attribute[1] ?? "").toLowerCase(),
        attribute[2] ?? attribute[3] ?? attribute[4] ?? "",
      );
    }
    const key = (
      attributes.get("property") ??
      attributes.get("name") ??
      ""
    ).toLowerCase();
    if (names.includes(key)) return attributes.get("content") ?? "";
  }
  return "";
}

function extractTitle(html: string): string {
  return html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
}

function extractPageText(html: string): string {
  return decodeHtml(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(
        /<(script|style|svg|noscript|iframe|header|footer|nav)\b[^>]*>[\s\S]*?<\/\1>/gi,
        " ",
      )
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, MAX_LINK_TEXT);
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function isYouTubeUrl(url: URL): boolean {
  return url.hostname.toLowerCase().includes("youtube.com") ||
    url.hostname.toLowerCase() === "youtu.be";
}

function isSocialUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (
    host === "x.com" ||
    host.endsWith(".x.com") ||
    host === "twitter.com" ||
    host.endsWith(".twitter.com") ||
    host === "facebook.com" ||
    host.endsWith(".facebook.com") ||
    host === "fb.watch" ||
    host.endsWith(".fb.watch")
  );
}
