/**
 * Adds intent preset + quality rules handling to workflow exports.
 * Run: node scripts/patch-intent-quality.mjs
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

const INTENT_INSERT_AFTER = "const quickFormat = validQuickFormats.includes(rawQf) ? rawQf : 'full';\n";
const INTENT_BLOCK =
  "const validIntentPresets = ['what_to_watch','injury_impact','coach_brief','fantasy_note','prop_preview'];\n" +
  "const rawIntentPreset = (body.intent_preset || 'what_to_watch').trim().toLowerCase().replace(/[\\s-]/g,'_');\n" +
  "const intentPreset = validIntentPresets.includes(rawIntentPreset) ? rawIntentPreset : 'what_to_watch';\n" +
  "const qualityRules = body.quality_rules && typeof body.quality_rules === 'object'\n" +
  "  ? body.quality_rules\n" +
  "  : { bannedPhrases: [], preferredPhrasesByMode: {} };\n";

const RETURN_ANCHOR = "quickFormat,\n    templateContract, structuredExtras,\n";
const RETURN_REPLACE =
  "quickFormat,\n    intentPreset, qualityRules,\n    templateContract, structuredExtras,\n";

const CONTEXT_ANCHOR =
  "if (quickFmt[d.quickFormat]) contentLines.push(quickFmt[d.quickFormat]);\n";
const CONTEXT_INSERT =
  "if (d.intentPreset) contentLines.push('\\nINTENT PRESET: ' + d.intentPreset);\n" +
  "if (d.qualityRules?.bannedPhrases?.length) contentLines.push('\\nBANNED PHRASES (never output verbatim):\\n' + d.qualityRules.bannedPhrases.map((x) => '  - ' + x).join('\\n'));\n" +
  "const __phrases = d.qualityRules?.preferredPhrasesByMode?.[d.mode];\n" +
  "if (Array.isArray(__phrases) && __phrases.length) contentLines.push('\\nPREFERRED PHRASE BANK (use naturally):\\n' + __phrases.map((x) => '  - ' + x).join('\\n'));\n";

for (const fp of files) {
  if (!fs.existsSync(fp)) {
    console.log("missing", path.basename(fp));
    continue;
  }

  const json = JSON.parse(fs.readFileSync(fp, "utf8"));
  let changed = false;

  for (const node of json.nodes || []) {
    let s = node.parameters?.jsCode;
    if (typeof s !== "string") continue;

    if (node.name === "Validate & Normalize") {
      if (!s.includes("const validIntentPresets =") && s.includes(INTENT_INSERT_AFTER)) {
        s = s.replace(INTENT_INSERT_AFTER, INTENT_INSERT_AFTER + INTENT_BLOCK);
        changed = true;
      }
      if (!s.includes("intentPreset, qualityRules") && s.includes(RETURN_ANCHOR)) {
        s = s.replace(RETURN_ANCHOR, RETURN_REPLACE);
        changed = true;
      }
    }

    if (
      (node.name === "Build Shared Context" || node.name === "Build Prompt") &&
      !s.includes("INTENT PRESET:")
    ) {
      if (s.includes(CONTEXT_ANCHOR)) {
        s = s.replace(CONTEXT_ANCHOR, CONTEXT_ANCHOR + CONTEXT_INSERT);
        changed = true;
      }
    }

    node.parameters.jsCode = s;
  }

  if (changed) {
    fs.writeFileSync(fp, JSON.stringify(json, null, 2), "utf8");
    console.log("updated", path.basename(fp));
  } else {
    console.log("skip", path.basename(fp));
  }
}
