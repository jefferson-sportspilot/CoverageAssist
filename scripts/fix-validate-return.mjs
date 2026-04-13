/**
 * Ensures Validate & Normalize return json includes ESPN + quick_format fields.
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

const BAD =
  "    standoutTags, sliders, styleSample, styleSampleUrl, serpContext, pubName,\n" +
  "    regenerateInstructions, sectionRewrite, rewriteContent,";

const GOOD_3 =
  "    standoutTags, sliders, styleSample, styleSampleUrl, serpContext, pubName,\n" +
  "    storySpine, momentAnchor1, momentAnchor2, momentAnchor3,\n" +
  "    statLine, verifiedFacts, quote1, quote2, quote3,\n" +
  "    espnDepthMode, voicePunch, voiceAnalyticsDensity, voiceSceneDetail,\n" +
  "    quickFormat,\n" +
  "    templateContract, structuredExtras,\n" +
  "    regenerateInstructions, sectionRewrite, rewriteContent,";

const BAD_SINGLE =
  "    standoutTags, sliders, styleSample, styleSampleUrl, serpContext, pubName,\n" +
  "    sectionRewrite, rewriteContent,";

const GOOD_SINGLE =
  "    standoutTags, sliders, styleSample, styleSampleUrl, serpContext, pubName,\n" +
  "    storySpine, momentAnchor1, momentAnchor2, momentAnchor3,\n" +
  "    statLine, verifiedFacts, quote1, quote2, quote3,\n" +
  "    espnDepthMode, voicePunch, voiceAnalyticsDensity, voiceSceneDetail,\n" +
  "    quickFormat,\n" +
  "    templateContract, structuredExtras,\n" +
  "    sectionRewrite, rewriteContent,";

const UPGRADE_REG =
  "    quickFormat,\n    regenerateInstructions,";
const UPGRADE_REG_NEW =
  "    quickFormat,\n    templateContract, structuredExtras,\n    regenerateInstructions,";
const UPGRADE_SING =
  "    quickFormat,\n    sectionRewrite,";
const UPGRADE_SING_NEW =
  "    quickFormat,\n    templateContract, structuredExtras,\n    sectionRewrite,";

for (const fp of files) {
  if (!fs.existsSync(fp)) continue;
  const j = JSON.parse(fs.readFileSync(fp, "utf8"));
  let changed = false;
  for (const node of j.nodes || []) {
    if (node.name !== "Validate & Normalize" || !node.parameters?.jsCode) continue;
    let s = node.parameters.jsCode;
    if (s.includes("templateContract, structuredExtras")) {
      /* already upgraded return */
    } else if (s.includes(BAD)) {
      s = s.replace(BAD, GOOD_3);
      changed = true;
    } else if (s.includes(BAD_SINGLE)) {
      s = s.replace(BAD_SINGLE, GOOD_SINGLE);
      changed = true;
    } else if (s.includes(UPGRADE_REG)) {
      s = s.replace(UPGRADE_REG, UPGRADE_REG_NEW);
      changed = true;
    } else if (s.includes(UPGRADE_SING)) {
      s = s.replace(UPGRADE_SING, UPGRADE_SING_NEW);
      changed = true;
    }
    node.parameters.jsCode = s;
  }
  if (changed) {
    fs.writeFileSync(fp, JSON.stringify(j, null, 2), "utf8");
    console.log("fixed", fp);
  } else console.log("ok", fp);
}
