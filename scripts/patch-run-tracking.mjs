/**
 * Adds prompt/contract version tracking + run logging metadata to workflows.
 * Run: node scripts/patch-run-tracking.mjs
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

const VERSION_INSERT_AFTER =
  "const structuredExtras = String(body.structured_extras || '').trim();\n";
const VERSION_BLOCK =
  "const promptVersion = String(body.prompt_version || 'cai-prompt-2026.04.16.1').trim() || 'cai-prompt-2026.04.16.1';\n" +
  "const contractVersion = String(body.contract_version || 'cai-contract-2026.04.16.1').trim() || 'cai-contract-2026.04.16.1';\n";

const SESSION_LINE =
  "const sessionId = 'CAI-' + Date.now() + '-' + Math.random().toString(36).substring(2,8).toUpperCase();";
const SESSION_WITH_START =
  "const sessionId = 'CAI-' + Date.now() + '-' + Math.random().toString(36).substring(2,8).toUpperCase();\nconst runStartedAtMs = Date.now();";

const RET_3 = "templateContract, structuredExtras,\n    regenerateInstructions,";
const RET_3_NEW =
  "templateContract, structuredExtras,\n    promptVersion, contractVersion, runStartedAtMs,\n    regenerateInstructions,";

const RET_SINGLE = "templateContract, structuredExtras,\n    sectionRewrite,";
const RET_SINGLE_NEW =
  "templateContract, structuredExtras,\n    promptVersion, contractVersion, runStartedAtMs,\n    sectionRewrite,";

const BUILD_TRACK_LINE =
  "if (d.promptVersion || d.contractVersion) contentLines.push('\\nPROMPT TRACKING (internal): prompt ' + (d.promptVersion || 'n/a') + ' · contract ' + (d.contractVersion || 'n/a'));";

const META_3_OLD =
  "      generated_at:         d.timestamp,\n      pipeline: '3-stage'";
const META_3_NEW =
  "      generated_at:         d.timestamp,\n      pipeline: '3-stage',\n      prompt_version:      d.promptVersion || 'unknown',\n      contract_version:    d.contractVersion || 'unknown',\n      run_duration_ms:     Math.max(0, Date.now() - (d.runStartedAtMs || Date.now())),\n      run_log: {\n        session_id: d.sessionId,\n        run_started_at_ms: d.runStartedAtMs || null,\n        run_finished_at_ms: Date.now()\n      }";

const FORMAT_INSERT_AFTER = "  confidence:  meta.confidence,\n";
const FORMAT_INSERT =
  "  promptVersion: meta.promptVersion,\n  contractVersion: meta.contractVersion,\n";
const FORMAT_INSERT_AFTER_2 = "  generatedAt: new Date().toISOString()\n";
const FORMAT_INSERT_2 =
  "  generatedAt: new Date().toISOString(),\n  runLog: {\n    pipeline: 'single-flow',\n    promptVersion: meta.promptVersion || 'unknown',\n    contractVersion: meta.contractVersion || 'unknown',\n    runStartedAtMs: meta.runStartedAtMs || null,\n    runFinishedAtMs: Date.now(),\n    runDurationMs: Math.max(0, Date.now() - (meta.runStartedAtMs || Date.now()))\n  }\n";

for (const fp of files) {
  if (!fs.existsSync(fp)) {
    console.log("missing", fp);
    continue;
  }
  const j = JSON.parse(fs.readFileSync(fp, "utf8"));
  let changed = false;
  for (const node of j.nodes || []) {
    if (!node.parameters?.jsCode) continue;
    let s = node.parameters.jsCode;

    if (node.name === "Validate & Normalize") {
      if (!s.includes("const promptVersion =") && s.includes(VERSION_INSERT_AFTER)) {
        s = s.replace(VERSION_INSERT_AFTER, VERSION_INSERT_AFTER + VERSION_BLOCK);
        changed = true;
      }
      if (!s.includes("runStartedAtMs") && s.includes(SESSION_LINE)) {
        s = s.replace(SESSION_LINE, SESSION_WITH_START);
        changed = true;
      }
      if (s.includes(RET_3) && !s.includes("promptVersion, contractVersion")) {
        s = s.replace(RET_3, RET_3_NEW);
        changed = true;
      }
      if (s.includes(RET_SINGLE) && !s.includes("promptVersion, contractVersion")) {
        s = s.replace(RET_SINGLE, RET_SINGLE_NEW);
        changed = true;
      }
    }

    if ((node.name === "Build Shared Context" || node.name === "Build Prompt") && !s.includes("PROMPT TRACKING (internal)")) {
      const anchor = "const contentBlock = contentLines.join('\\n');";
      if (s.includes(anchor)) {
        s = s.replace(anchor, `${BUILD_TRACK_LINE}\n${anchor}`);
        changed = true;
      }
    }

    if (node.name === "Assemble Full Article") {
      if (s.includes(META_3_OLD) && !s.includes("prompt_version")) {
        s = s.replace(META_3_OLD, META_3_NEW);
        changed = true;
      }
    }

    if (node.name === "Format Output") {
      if (!s.includes("promptVersion: meta.promptVersion") && s.includes(FORMAT_INSERT_AFTER)) {
        s = s.replace(FORMAT_INSERT_AFTER, FORMAT_INSERT_AFTER + FORMAT_INSERT);
        changed = true;
      }
      if (!s.includes("runLog: {") && s.includes(FORMAT_INSERT_AFTER_2)) {
        s = s.replace(FORMAT_INSERT_AFTER_2, FORMAT_INSERT_2);
        changed = true;
      }
    }

    node.parameters.jsCode = s;
  }
  if (changed) {
    fs.writeFileSync(fp, JSON.stringify(j, null, 2), "utf8");
    console.log("updated", fp);
  } else {
    console.log("skip", fp);
  }
}
