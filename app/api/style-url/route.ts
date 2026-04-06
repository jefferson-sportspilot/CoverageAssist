import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 500_000;

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const raw =
    typeof body === "object" && body && "url" in body
      ? String((body as { url?: unknown }).url ?? "").trim()
      : "";
  if (!raw) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid URL" }, { status: 400 });
  }
  if (!["http:", "https:"].includes(u.protocol)) {
    return NextResponse.json(
      { error: "only http(s) URLs are allowed" },
      { status: 400 }
    );
  }

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 20000);
  try {
    const res = await fetch(u.toString(), {
      signal: ac.signal,
      headers: {
        "User-Agent": "CoverageAssistAI/1.0 (style sample fetch)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Page returned ${res.status}` },
        { status: 502 }
      );
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "page too large" }, { status: 413 });
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const text = stripHtml(html);
    if (!text || text.length < 40) {
      return NextResponse.json(
        { error: "Could not extract readable text from this page" },
        { status: 422 }
      );
    }
    return NextResponse.json({ text, finalUrl: res.url });
  } catch (e) {
    clearTimeout(t);
    const msg = e instanceof Error ? e.message : "fetch failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
