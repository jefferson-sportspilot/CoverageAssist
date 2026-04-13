"use client";

import type { ArticleMode } from "./coverageAssistConstants";
import { MODE_LABELS } from "./coverageAssistConstants";

export type DownloadArticlePdfParams = {
  articleText: string;
  headlineFromState?: string;
  publicationName: string;
  playerName: string;
  eventName: string;
  mode?: string;
  modeLabel?: string;
  stylePreset: string;
  wordCount?: number;
};

/**
 * Client-only PDF export. jsPDF is loaded in a separate chunk so it is never
 * pulled into the server bundle.
 */
export async function downloadArticleAsPdf(
  params: DownloadArticlePdfParams
): Promise<void> {
  if (typeof window === "undefined") return;

  const raw = params.articleText.trim();
  if (!raw) return;

  const { jsPDF } = await import("jspdf");

  const lines = raw.split("\n").filter((l) => l.trim());
  const headline = params.headlineFromState || lines[0] || "Article";
  let body = lines.slice(1).join("\n\n").trim();
  if (!body) body = raw;

  const pub = params.publicationName || "SportsPilot Scout Report";
  const byline = `${pub}${params.playerName ? ` · ${params.playerName}` : ""}${params.eventName ? ` · ${params.eventName}` : ""}`;
  const modeKey = params.mode as ArticleMode | undefined;
  const metaBits = [
    (modeKey && MODE_LABELS[modeKey] ? MODE_LABELS[modeKey] : null) ||
      params.modeLabel ||
      params.mode,
    params.stylePreset,
    params.wordCount != null ? `${params.wordCount} words` : "",
  ].filter(Boolean) as string[];
  const metaBlock = [byline, metaBits.join(" · ")].filter(Boolean).join("\n");

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(headline, maxW);
  ensureSpace(titleLines.length * 22);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 22 + 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  if (metaBlock) {
    const metaLines = doc.splitTextToSize(metaBlock, maxW);
    ensureSpace(metaLines.length * 12);
    doc.text(metaLines, margin, y);
    y += metaLines.length * 12 + 18;
  }
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

  const paragraphs = body.split(/\n\s*\n/).filter((p) => p.trim());
  const lineH = 14;
  for (const para of paragraphs) {
    const normalized = para.replace(/\n/g, " ").trim();
    const wrapped = doc.splitTextToSize(normalized, maxW);
    ensureSpace(wrapped.length * lineH + 10);
    doc.text(wrapped, margin, y);
    y += wrapped.length * lineH + 10;
  }

  const safe = headline
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase()
    .slice(0, 40);
  doc.save(`coverageassist-${safe}.pdf`);
}
