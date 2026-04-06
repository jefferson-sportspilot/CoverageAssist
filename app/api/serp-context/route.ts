import { NextRequest, NextResponse } from "next/server";

type Organic = { title?: string; snippet?: string; link?: string };

export async function POST(req: NextRequest) {
  const key = process.env.SERPAPI_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      {
        error:
          "SERPAPI_KEY is not set on the server. Add it to .env.local for web research.",
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

  const params = new URLSearchParams({
    engine: "google",
    q,
    api_key: key,
    num: "8",
  });

  try {
    const res = await fetch(`https://serpapi.com/search?${params}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `SerpAPI returned ${res.status}` },
        { status: 502 }
      );
    }
    const data = (await res.json()) as {
      organic_results?: Organic[];
      error?: string;
    };
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 502 });
    }
    const organic = data.organic_results ?? [];
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
    const msg = e instanceof Error ? e.message : "SerpAPI request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
