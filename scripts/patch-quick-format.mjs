/**
 * Adds quick_format (full | recap_short | preview_bullets | social_pack) to
 * Validate & Normalize + Build Shared Context / Build Prompt.
 * Run: node scripts/patch-quick-format.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const files = [
  path.join(root, "coverageassist.json"),
  path.join(root, "coverage with serp.json"),
  path.join(root, "CoverageAssistAI (1).json"),
];

const V_AFTER =
  "const voiceSceneDetail = clampV(body.voice_scene_detail);\nconst pubName";
const V_REPLACE =
  "const voiceSceneDetail = clampV(body.voice_scene_detail);\n" +
  "const validQuickFormats = ['full','recap_short','preview_bullets','social_pack'];\n" +
  "const rawQf = (body.quick_format || 'full').trim().toLowerCase().replace(/[\\s-]/g,'_');\n" +
  "const quickFormat = validQuickFormats.includes(rawQf) ? rawQf : 'full';\n" +
  "const pubName";

const RET_REG =
  "espnDepthMode, voicePunch, voiceAnalyticsDensity, voiceSceneDetail,\n    regenerateInstructions,";
const RET_REG_NEW =
  "espnDepthMode, voicePunch, voiceAnalyticsDensity, voiceSceneDetail,\n    quickFormat,\n    regenerateInstructions,";

const RET_SEC =
  "espnDepthMode, voicePunch, voiceAnalyticsDensity, voiceSceneDetail,\n    sectionRewrite,";
const RET_SEC_NEW =
  "espnDepthMode, voicePunch, voiceAnalyticsDensity, voiceSceneDetail,\n    quickFormat,\n    sectionRewrite,";

const QF_PREFIX =
  "const __ma = [d.momentAnchor1, d.momentAnchor2, d.momentAnchor3].filter(Boolean);\n" +
  "if (__ma.length) contentLines.push('\\nMOMENT ANCHORS (same beats in recap, bullets, social, and longform; paraphrase; do not invent new signature moments):\\n' + __ma.map((x, i) => '  ' + (i + 1) + '. ' + x).join('\\n'));\n" +
  "if (d.templateContract) contentLines.push('\\nARTICLE STRUCTURE CONTRACT (follow section order; scale per-section shares to the target word count):\\n' + d.templateContract);\n" +
  "if (d.structuredExtras) contentLines.push('\\nSTRUCTURED EXTRAS (optional mini box score, extra lines, or pasted JSON — factual only; do not extrapolate):\\n' + d.structuredExtras);\n\n";

const QF_BLOCK =
  "}\n" +
  QF_PREFIX +
  "const quickFmt = {\n" +
  "  recap_short: '\\nQUICK FORMAT — SHORT RECAP (200–350 words): Write a tight newspaper-style recap. Lead with outcome and one key performer line. If MOMENT ANCHORS are listed above, preserve the same numbered beats in shorter form. 2–3 short paragraphs maximum. No betting or fantasy angles unless explicitly in evaluator or game notes. Every stat must come from source data or STRUCTURED EXTRAS.',\n" +
  "  preview_bullets: '\\nQUICK FORMAT — PREVIEW (bullets): Write a 2–3 sentence hook, then 5–7 bullet lines. At least two bullets should map to the MOMENT ANCHORS above when present. Cover what is happening, who, stakes, one key matchup or player to watch, availability only if in notes. End with one forward-looking line. Do not invent odds, spreads, or betting lines.',\n" +
  "  social_pack: '\\nQUICK FORMAT — SOCIAL PACK: Use these exact headers on separate lines:\\nTWEET: (one line, max 280 characters)\\nTHREAD 1: / THREAD 2: / THREAD 3: (each max 280 characters; omit unused thread lines)\\nCAPTION 1: / CAPTION 2: / CAPTION 3: (each max 125 characters)\\nTHREAD lines should echo the same story beats as MOMENT ANCHORS when listed. Facts only from source data or STRUCTURED EXTRAS; no gambling unless in notes.',\n" +
  "};\n" +
  "if (quickFmt[d.quickFormat]) contentLines.push(quickFmt[d.quickFormat]);\n" +
  "const contentBlock = contentLines.join('\\n');";

const ANCHOR_3 =
  "}\nconst contentBlock = contentLines.join('\\n');\n\nconst presetGuides = {";
const ANCHOR_1 =
  "}\nconst contentBlock = contentLines.join('\\n');\n\n// ── Section rewrite mode ──";

function patch(fp) {
  const j = JSON.parse(fs.readFileSync(fp, "utf8"));
  let changed = false;

  for (const node of j.nodes || []) {
    if (node.name === "Validate & Normalize" && node.parameters?.jsCode) {
      let s = node.parameters.jsCode;
      if (!s.includes("validQuickFormats") && s.includes(V_AFTER)) {
        s = s.replace(V_AFTER, V_REPLACE);
        changed = true;
      }
      if (s.includes(RET_REG) && !s.includes("quickFormat,\n    regenerateInstructions")) {
        s = s.replace(RET_REG, RET_REG_NEW);
        changed = true;
      } else if (
        s.includes(RET_SEC) &&
        !s.includes("quickFormat,\n    sectionRewrite")
      ) {
        s = s.replace(RET_SEC, RET_SEC_NEW);
        changed = true;
      }
      node.parameters.jsCode = s;
    }

    if (node.name === "Build Shared Context" && node.parameters?.jsCode) {
      let s = node.parameters.jsCode;
      if (!s.includes("quickFmt") && s.includes(ANCHOR_3)) {
        s = s.replace(ANCHOR_3, QF_BLOCK + "\n\nconst presetGuides = {");
        changed = true;
      }
      node.parameters.jsCode = s;
    }

    if (node.name === "Build Prompt" && node.parameters?.jsCode) {
      let s = node.parameters.jsCode;
      if (!s.includes("quickFmt") && s.includes(ANCHOR_1)) {
        s = s.replace(
          ANCHOR_1,
          QF_BLOCK + "\n\n// ── Section rewrite mode ──"
        );
        changed = true;
      }
      node.parameters.jsCode = s;
    }
  }

  if (changed) fs.writeFileSync(fp, JSON.stringify(j, null, 2), "utf8");
  console.log(fp, changed ? "updated" : "skip");
}

for (const fp of files) {
  if (fs.existsSync(fp)) patch(fp);
  else console.log("missing", fp);
}
