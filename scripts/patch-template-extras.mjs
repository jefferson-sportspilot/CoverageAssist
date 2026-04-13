/**
 * Adds template_contract + structured_extras through Validate, injects moment/contract
 * lines into Build Shared Context / Build Prompt, and tightens quickFmt copy.
 * Run: node scripts/patch-template-extras.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  path.join(root, "coverageassist.json"),
  path.join(root, "coverage with serp.json"),
  path.join(root, "CoverageAssistAI (1).json"),
];

const AFTER_QUICK =
  "const quickFormat = validQuickFormats.includes(rawQf) ? rawQf : 'full';\nconst pubName";

const WITH_TEMPLATE =
  "const quickFormat = validQuickFormats.includes(rawQf) ? rawQf : 'full';\n" +
  "const templateContract = String(body.template_contract || '').trim();\n" +
  "const structuredExtras = String(body.structured_extras || '').trim();\n" +
  "const pubName";

const RET_REG = "quickFormat,\n    regenerateInstructions,";
const RET_REG_NEW =
  "quickFormat,\n    templateContract, structuredExtras,\n    regenerateInstructions,";

const RET_SINGLE = "quickFormat,\n    sectionRewrite,";
const RET_SINGLE_NEW =
  "quickFormat,\n    templateContract, structuredExtras,\n    sectionRewrite,";

const BEFORE_QUICKFMT = "const quickFmt = {";

const PREFIX_QUICKFMT =
  "const __ma = [d.momentAnchor1, d.momentAnchor2, d.momentAnchor3].filter(Boolean);\n" +
  "if (__ma.length) contentLines.push('\\nMOMENT ANCHORS (same beats in recap, bullets, social, and longform; paraphrase; do not invent new signature moments):\\n' + __ma.map((x, i) => '  ' + (i + 1) + '. ' + x).join('\\n'));\n" +
  "if (d.templateContract) contentLines.push('\\nARTICLE STRUCTURE CONTRACT (follow section order; scale per-section shares to the target word count):\\n' + d.templateContract);\n" +
  "if (d.structuredExtras) contentLines.push('\\nSTRUCTURED EXTRAS (optional mini box score, extra lines, or pasted JSON — factual only; do not extrapolate):\\n' + d.structuredExtras);\n\n" +
  "const quickFmt = {";

const OLD_RECAP =
  "recap_short: '\\nQUICK FORMAT — SHORT RECAP (200–350 words): Write a tight newspaper-style recap. Lead with outcome and one key performer line. 2–3 short paragraphs maximum. No betting or fantasy angles unless explicitly in evaluator or game notes. Every stat must come from source data.',";

const NEW_RECAP =
  "recap_short: '\\nQUICK FORMAT — SHORT RECAP (200–350 words): Write a tight newspaper-style recap. Lead with outcome and one key performer line. If MOMENT ANCHORS are listed above, preserve the same numbered beats in shorter form. 2–3 short paragraphs maximum. No betting or fantasy angles unless explicitly in evaluator or game notes. Every stat must come from source data or STRUCTURED EXTRAS.',";

const OLD_PREVIEW =
  "preview_bullets: '\\nQUICK FORMAT — PREVIEW (bullets): Write a 2–3 sentence hook, then 5–7 bullet lines: what is happening, who, stakes, one key matchup or player to watch, availability only if in notes. End with one forward-looking line. Do not invent odds, spreads, or betting lines.',";

const NEW_PREVIEW =
  "preview_bullets: '\\nQUICK FORMAT — PREVIEW (bullets): Write a 2–3 sentence hook, then 5–7 bullet lines. At least two bullets should map to the MOMENT ANCHORS above when present. Cover what is happening, who, stakes, one key matchup or player to watch, availability only if in notes. End with one forward-looking line. Do not invent odds, spreads, or betting lines.',";

const OLD_SOCIAL =
  "social_pack: '\\nQUICK FORMAT — SOCIAL PACK: Use these exact headers on separate lines:\\nTWEET: (one line, max 280 characters)\\nTHREAD 1: / THREAD 2: / THREAD 3: (each max 280 characters; omit unused thread lines)\\nCAPTION 1: / CAPTION 2: / CAPTION 3: (each max 125 characters)\\nFacts only from source data; no gambling unless in notes.',";

const NEW_SOCIAL =
  "social_pack: '\\nQUICK FORMAT — SOCIAL PACK: Use these exact headers on separate lines:\\nTWEET: (one line, max 280 characters)\\nTHREAD 1: / THREAD 2: / THREAD 3: (each max 280 characters; omit unused thread lines)\\nCAPTION 1: / CAPTION 2: / CAPTION 3: (each max 125 characters)\\nTHREAD lines should echo the same story beats as MOMENT ANCHORS when listed. Facts only from source data or STRUCTURED EXTRAS; no gambling unless in notes.',";

for (const fp of files) {
  if (!fs.existsSync(fp)) {
    console.log("missing", fp);
    continue;
  }
  const j = JSON.parse(fs.readFileSync(fp, "utf8"));
  let changed = false;
  for (const node of j.nodes || []) {
    const name = node.name;
    let s = node.parameters?.jsCode;
    if (typeof s !== "string") continue;

    if (name === "Validate & Normalize") {
      if (s.includes(AFTER_QUICK) && !s.includes("const templateContract =")) {
        s = s.replace(AFTER_QUICK, WITH_TEMPLATE);
        changed = true;
      }
      if (s.includes(RET_REG) && !s.includes("templateContract, structuredExtras")) {
        s = s.replace(RET_REG, RET_REG_NEW);
        changed = true;
      } else if (
        s.includes(RET_SINGLE) &&
        !s.includes("templateContract, structuredExtras")
      ) {
        s = s.replace(RET_SINGLE, RET_SINGLE_NEW);
        changed = true;
      }
    }

    if (name === "Build Shared Context" || name === "Build Prompt") {
      if (s.includes(BEFORE_QUICKFMT) && !s.includes("const __ma = [d.momentAnchor1")) {
        s = s.replace(BEFORE_QUICKFMT, PREFIX_QUICKFMT);
        changed = true;
      }
      if (s.includes(OLD_RECAP)) {
        s = s.replace(OLD_RECAP, NEW_RECAP);
        changed = true;
      }
      if (s.includes(OLD_PREVIEW)) {
        s = s.replace(OLD_PREVIEW, NEW_PREVIEW);
        changed = true;
      }
      if (s.includes(OLD_SOCIAL)) {
        s = s.replace(OLD_SOCIAL, NEW_SOCIAL);
        changed = true;
      }
    }

    node.parameters.jsCode = s;
  }
  if (changed) {
    fs.writeFileSync(fp, JSON.stringify(j, null, 2), "utf8");
    console.log("updated", fp);
  } else console.log("skip", fp);
}
