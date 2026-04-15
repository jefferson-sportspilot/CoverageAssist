import { NextRequest, NextResponse } from "next/server";

type SerperOrganic = { title?: string; snippet?: string; link?: string };

export async function POST(req: NextRequest) {
  const key =
    process.env.SERPER_API_KEY?.trim() || process.env.SERPAPI_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      {
        error:
          "SERPER_API_KEY is not set on the server. Add it to .env.local for web research (legacy SERPAPI_KEY is also accepted).",
      },
      { status: 501 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const q =
    typeof body === "object" && body && "query" in body
      ? String((body as { query?: unknown }).query ?? "").trim()
      : "";
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q, num: 8 }),
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Serper returned ${res.status}${errText ? `: ${errText.slice(0, 200)}` : ""}`,
        },
        { status: 502 }
      );
    }
    const data = (await res.json()) as {
      organic?: SerperOrganic[];
      error?: string;
      message?: string;
    };
    if (data.error || data.message) {
      return NextResponse.json(
        { error: data.error || data.message || "Serper error" },
        { status: 502 }
      );
    }
    const organic = data.organic ?? [];
    const snippets = organic
      .slice(0, 5)
      .map(
        (r) =>
          `${r.title ?? ""}\n${r.snippet ?? ""}\n${r.link ?? ""}`.trim()
      )
      .filter(Boolean)
      .join("\n---\n");
    if (!snippets) {
      return NextResponse.json(
        { error: "No organic results for this query" },
        { status: 404 }
      );
    }
    return NextResponse.json({ text: snippets });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Serper request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
