/**
 * Adds ESPN-structure fields to Validate & Normalize + Build Shared Context
 * in 3-stage n8n workflow JSON files.
 * Usage: node scripts/patch-espn-n8n.mjs [path/to/workflow.json ...]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const defaultFiles = [
  path.join(root, "coverageassist.json"),
  path.join(root, "coverage with serp.json"),
  path.join(root, "CoverageAssistAI (1).json"),
];

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : defaultFiles;

const VALIDATE_INSERT_AFTER =
  "const serpContext = (body.serp_context || body.research_snippets || '').trim();\nconst pubName";

const VALIDATE_BLOCK =
  "const serpContext = (body.serp_context || body.research_snippets || '').trim();\n" +
  "const validSpines = ['stakes','timeline','matchup','identity','legacy','injury_subplot'];\n" +
  "const rawSpine = (body.story_spine || 'stakes').trim().toLowerCase().replace(/[\\s-]/g,'_');\n" +
  "const storySpine = validSpines.includes(rawSpine) ? rawSpine : 'stakes';\n" +
  "const momentAnchor1 = (body.moment_anchor_1 || '').trim();\n" +
  "const momentAnchor2 = (body.moment_anchor_2 || '').trim();\n" +
  "const momentAnchor3 = (body.moment_anchor_3 || '').trim();\n" +
  "const statLine = (body.stat_line || '').trim();\n" +
  "const verifiedFacts = (body.verified_facts || '').trim();\n" +
  "const quote1 = (body.quote_1 || '').trim();\n" +
  "const quote2 = (body.quote_2 || '').trim();\n" +
  "const quote3 = (body.quote_3 || '').trim();\n" +
  "const espnDepthMode = body.espn_depth_mode === true || body.espn_depth_mode === 'true';\n" +
  "const clampV = (x) => Math.min(10, Math.max(1, parseInt(x, 10) || 6));\n" +
  "const voicePunch = clampV(body.voice_punch);\n" +
  "const voiceAnalyticsDensity = clampV(body.voice_analytics_density);\n" +
  "const voiceSceneDetail = clampV(body.voice_scene_detail);\n" +
  "const pubName";

const RETURN_OLD_3STAGE =
  "    standoutTags, sliders, styleSample, styleSampleUrl, serpContext, pubName,\n" +
  "    regenerateInstructions, sectionRewrite, rewriteContent,";

const RETURN_NEW_3STAGE =
  "    standoutTags, sliders, styleSample, styleSampleUrl, serpContext, pubName,\n" +
  "    storySpine, momentAnchor1, momentAnchor2, momentAnchor3,\n" +
  "    statLine, verifiedFacts, quote1, quote2, quote3,\n" +
  "    espnDepthMode, voicePunch, voiceAnalyticsDensity, voiceSceneDetail,\n" +
  "    regenerateInstructions, sectionRewrite, rewriteContent,";

const RETURN_OLD_SINGLE =
  "    standoutTags, sliders, styleSample, styleSampleUrl, serpContext, pubName,\n" +
  "    sectionRewrite, rewriteContent,";

const RETURN_NEW_SINGLE =
  "    standoutTags, sliders, styleSample, styleSampleUrl, serpContext, pubName,\n" +
  "    storySpine, momentAnchor1, momentAnchor2, momentAnchor3,\n" +
  "    statLine, verifiedFacts, quote1, quote2, quote3,\n" +
  "    espnDepthMode, voicePunch, voiceAnalyticsDensity, voiceSceneDetail,\n" +
  "    sectionRewrite, rewriteContent,";

const BUILD_ANCHOR_3STAGE =
  "if (d.styleSampleUrl && d.styleSampleUrl.length > 8) {\n" +
  "  contentLines.push('\\nSTYLE SAMPLE SOURCE URL (reference only): ' + d.styleSampleUrl);\n" +
  "}\n" +
  "const contentBlock = contentLines.join('\\n');";

/** Single-flow "Build Prompt" uses slightly different URL line text. */
const BUILD_ANCHOR_SINGLE =
  "if (d.styleSampleUrl && d.styleSampleUrl.length > 8) {\n" +
  "  contentLines.push('\\nSTYLE SAMPLE SOURCE URL (reference only; voice comes from style_sample text): ' + d.styleSampleUrl);\n" +
  "}\n" +
  "const contentBlock = contentLines.join('\\n');";

const BUILD_INJECT =
  "if (d.styleSampleUrl && d.styleSampleUrl.length > 8) {\n" +
  "  contentLines.push('\\nSTYLE SAMPLE SOURCE URL (reference only): ' + d.styleSampleUrl);\n" +
  "}\n" +
  "const spineGuide = {\n" +
  "  stakes: 'Stakes — why this moment matters for standings/postseason pressure',\n" +
  "  timeline: 'Timeline — how recent performances set up this game',\n" +
  "  matchup: 'Matchup chess — counters, adjustments, and responses',\n" +
  "  identity: 'Identity — role, team style, and what this performance signals',\n" +
  "  legacy: 'Legacy/milestone framing (ONLY if supported by notes)',\n" +
  "  injury_subplot: 'Availability/workload subplot (ONLY if supported by notes)'\n" +
  "};\n" +
  "if (d.storySpine && spineGuide[d.storySpine]) {\n" +
  "  contentLines.push('\\nSTORY SPINE: ' + spineGuide[d.storySpine]);\n" +
  "}\n" +
  "if (d.momentAnchor1) contentLines.push('\\nMOMENT ANCHOR 1 (use as a concrete scene beat): ' + d.momentAnchor1);\n" +
  "if (d.momentAnchor2) contentLines.push('\\nMOMENT ANCHOR 2: ' + d.momentAnchor2);\n" +
  "if (d.momentAnchor3) contentLines.push('\\nMOMENT ANCHOR 3: ' + d.momentAnchor3);\n" +
  "if (d.statLine) contentLines.push('\\nSTAT LINE / BOX (treat as factual anchor — do not invent beyond notes + this block):\\n' + d.statLine);\n" +
  "if (d.verifiedFacts) contentLines.push('\\nVERIFIED FACTS:\\n' + d.verifiedFacts);\n" +
  "if (d.quote1 || d.quote2 || d.quote3) {\n" +
  "  const qs = [d.quote1, d.quote2, d.quote3].filter(Boolean);\n" +
  "  if (qs.length) contentLines.push('\\nQUOTES TO WEAVE (optional):\\n' + qs.join('\\n---\\n'));\n" +
  "}\n" +
  "if (d.espnDepthMode) {\n" +
  "  const targetW = Math.max(parseInt(d.wordCount,10) || 500, 650);\n" +
  "  contentLines.push('\\nESPN-DEPTH MODE: Target at least ' + targetW + ' words. Section budgets: lede ~80–120w; stakes/nut ~120–180w; 2–3 evidence paragraphs tied to moment anchors; closing ~60–120w with a forward look. Ban vague clichés unless tied to a specific play (e.g. avoid empty \"electric\", \"locked in\", \"stepped up\").');\n" +
  "  contentLines.push('VOICE MIX (1=subtle, 10=heavy): punch ' + (d.voicePunch||6) + '/10, analytics ' + (d.voiceAnalyticsDensity||6) + '/10, scene detail ' + (d.voiceSceneDetail||6) + '/10.');\n" +
  "}\n" +
  "const contentBlock = contentLines.join('\\n');";

function patchWorkflow(fp) {
  const j = JSON.parse(fs.readFileSync(fp, "utf8"));
  let changed = false;

  for (const node of j.nodes || []) {
    if (node.name === "Validate & Normalize" && node.parameters?.jsCode) {
      let s = node.parameters.jsCode;
      if (!s.includes("momentAnchor1")) {
        if (!s.includes(VALIDATE_INSERT_AFTER)) {
          throw new Error(`${fp}: Validate anchor not found`);
        }
        s = s.replace(VALIDATE_INSERT_AFTER, VALIDATE_BLOCK);
        changed = true;
      }
      if (!s.includes("momentAnchor1")) continue;
      if (s.includes(RETURN_OLD_3STAGE) && !s.includes("voiceSceneDetail")) {
        s = s.replace(RETURN_OLD_3STAGE, RETURN_NEW_3STAGE);
        changed = true;
      } else if (s.includes(RETURN_OLD_SINGLE) && !s.includes("voiceSceneDetail")) {
        s = s.replace(RETURN_OLD_SINGLE, RETURN_NEW_SINGLE);
        changed = true;
      }
      node.parameters.jsCode = s;
    }

    if (node.name === "Build Shared Context" && node.parameters?.jsCode) {
      let s = node.parameters.jsCode;
      if (!s.includes("spineGuide")) {
        if (!s.includes(BUILD_ANCHOR_3STAGE)) {
          throw new Error(`${fp}: Build Shared Context anchor not found`);
        }
        s = s.replace(BUILD_ANCHOR_3STAGE, BUILD_INJECT);
        changed = true;
      }
      node.parameters.jsCode = s;
    }

    if (node.name === "Build Prompt" && node.parameters?.jsCode) {
      let s = node.parameters.jsCode;
      if (!s.includes("spineGuide")) {
        if (!s.includes(BUILD_ANCHOR_SINGLE)) {
          throw new Error(`${fp}: Build Prompt anchor not found`);
        }
        s = s.replace(BUILD_ANCHOR_SINGLE, BUILD_INJECT);
        changed = true;
      }
      node.parameters.jsCode = s;
    }
  }

  if (changed) {
    fs.writeFileSync(fp, JSON.stringify(j, null, 2), "utf8");
  }
  console.log("OK:", fp, changed ? "(updated)" : "(already patched)");
}

for (const fp of files) {
  if (!fs.existsSync(fp)) {
    console.warn("Skip missing:", fp);
    continue;
  }
  patchWorkflow(fp);
}
