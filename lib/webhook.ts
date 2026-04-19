const DEFAULT_WEBHOOK =
  "https://n8n-production-bba0.up.railway.app/webhook/coverage-assist";
const DEFAULT_FEEDBACK_WEBHOOK =
  "https://n8n-production-bba0.up.railway.app/webhook/coverage-assist-feedback";

export function getWebhookUrl(): string {
  return (
    process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK
  );
}

export function getFeedbackWebhookUrl(): string {
  return (
    process.env.NEXT_PUBLIC_FEEDBACK_WEBHOOK_URL?.trim() ||
    DEFAULT_FEEDBACK_WEBHOOK
  );
}

export type WebhookPayload = Record<string, unknown>;

export type NormalizedArticleResponse = {
  sessionId?: string;
  article: string;
  headline?: string;
  mode?: string;
  stylePreset?: string;
  tone?: string;
  wordCount?: number;
  generatedAt?: string;
  hasStyleSample?: boolean;
  modeLabel?: string;
};

export type FeedbackPayload = {
  session_id?: string;
  sessionId?: string;
  mode?: string;
  rating?: number;
  feedback?: string;
  comment?: string;
  user?: string;
  email?: string;
  source?: string;
  workflow?: string;
};

/**
 * Turn n8n `article` payloads into a single plain-text article.
 * Supports: string, or object with full_article / headline + sections.
 */
export function structuredArticleToString(article: unknown): string {
  if (article == null) return "";
  if (typeof article === "string") return article;
  if (typeof article !== "object") return String(article);

  const o = article as Record<string, unknown>;

  if (typeof o.full_article === "string" && o.full_article.trim()) {
    return o.full_article;
  }

  const headline = typeof o.headline === "string" ? o.headline.trim() : "";
  const intro =
    typeof o.introduction === "string" ? o.introduction.trim() : "";
  const body = typeof o.main_body === "string" ? o.main_body.trim() : "";
  const conclusion =
    typeof o.conclusion === "string" ? o.conclusion.trim() : "";

  const parts = [headline, intro, body, conclusion].filter(Boolean);
  if (parts.length) return parts.join("\n\n");

  if (typeof o.text === "string") return o.text;
  if (typeof o.content === "string") return o.content;
  if (typeof o.body === "string") return o.body;
  if (typeof o.article === "string") return o.article;

  try {
    return JSON.stringify(article, null, 2);
  } catch {
    return String(article);
  }
}

function unwrapResponse(json: unknown): Record<string, unknown> {
  if (Array.isArray(json) && json[0] && typeof json[0] === "object") {
    return json[0] as Record<string, unknown>;
  }
  if (json && typeof json === "object") {
    return json as Record<string, unknown>;
  }
  return {};
}

function readMeta(raw: Record<string, unknown>): Record<string, unknown> {
  const m = raw.meta;
  if (m && typeof m === "object") return m as Record<string, unknown>;
  return {};
}

export function normalizeN8nResult(
  raw: Record<string, unknown>
): NormalizedArticleResponse {
  const meta = readMeta(raw);
  const articleObj = raw.article;
  const articleStr = structuredArticleToString(articleObj);

  let headline: string | undefined =
    typeof raw.headline === "string" ? raw.headline : undefined;
  if (!headline && articleObj && typeof articleObj === "object") {
    const h = (articleObj as Record<string, unknown>).headline;
    if (typeof h === "string") headline = h;
  }
  if (!headline && articleStr) {
    headline = articleStr.split("\n")[0]?.trim() || undefined;
  }

  const wordCount =
    typeof meta.word_count_actual === "number"
      ? meta.word_count_actual
      : typeof raw.wordCount === "number"
        ? raw.wordCount
        : typeof raw.word_count === "number"
          ? raw.word_count
          : undefined;

  const generatedAt =
    typeof meta.generated_at === "string"
      ? meta.generated_at
      : typeof raw.generatedAt === "string"
        ? raw.generatedAt
        : undefined;

  const stylePreset =
    (typeof raw.style_preset === "string" ? raw.style_preset : undefined) ||
    (typeof raw.stylePreset === "string" ? raw.stylePreset : undefined);

  return {
    sessionId:
      (typeof raw.sessionId === "string" ? raw.sessionId : undefined) ||
      (typeof raw.session_id === "string" ? raw.session_id : undefined),
    article: articleStr,
    headline,
    mode: typeof raw.mode === "string" ? raw.mode : undefined,
    stylePreset,
    tone: typeof raw.tone === "string" ? raw.tone : undefined,
    wordCount,
    generatedAt,
    hasStyleSample:
      typeof raw.hasStyleSample === "boolean" ? raw.hasStyleSample : undefined,
    modeLabel: typeof raw.modeLabel === "string" ? raw.modeLabel : undefined,
  };
}

export async function callN8nWebhook(
  payload: WebhookPayload
): Promise<NormalizedArticleResponse> {
  const url = getWebhookUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Server error ${res.status}`);
  }
  const rawJson: unknown = await res.json();
  const raw = unwrapResponse(rawJson);
  return normalizeN8nResult(raw);
}

export async function submitFeedback(
  payload: FeedbackPayload
): Promise<void> {
  const url = getFeedbackWebhookUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Feedback webhook error ${res.status}`);
  }
}
