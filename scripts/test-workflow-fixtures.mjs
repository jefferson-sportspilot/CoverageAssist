/**
 * Fixture-based regression tests for CoverageAssist n8n workflow exports.
 * Run: node scripts/test-workflow-fixtures.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const workflows = [
  { name: "coverageassist", file: "coverageassist.json", pipeline: "3-stage" },
  {
    name: "coverage-with-serp",
    file: "coverage with serp.json",
    pipeline: "3-stage",
  },
  {
    name: "coverageassist-single",
    file: "CoverageAssistAI (1).json",
    pipeline: "single-flow",
  },
];

const fixtures = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/fixtures/workflow-fixtures.json"), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runValidate(validateCode, body) {
  const fn = new Function("$input", validateCode);
  const $input = {
    first: () => ({ json: { body } }),
  };
  const out = fn($input);
  assert(Array.isArray(out) && out[0]?.json, "Validate node did not return [{ json }]");
  return out[0].json;
}

let failures = 0;
for (const wf of workflows) {
  const full = path.join(root, wf.file);
  if (!fs.existsSync(full)) {
    console.log(`SKIP ${wf.name}: file not found (${wf.file})`);
    continue;
  }
  const json = JSON.parse(fs.readFileSync(full, "utf8"));
  const byName = Object.fromEntries((json.nodes || []).map((n) => [n.name, n]));

  try {
    const validate = byName["Validate & Normalize"]?.parameters?.jsCode;
    assert(typeof validate === "string", "Missing Validate & Normalize jsCode");
    assert(
      validate.includes("promptVersion") &&
        validate.includes("contractVersion") &&
        validate.includes("runStartedAtMs"),
      "Validate node missing prompt/contract/run fields"
    );

    if (wf.pipeline === "3-stage") {
      const shared = byName["Build Shared Context"]?.parameters?.jsCode;
      const assemble = byName["Assemble Full Article"]?.parameters?.jsCode;
      assert(
        typeof shared === "string" && shared.includes("PROMPT TRACKING (internal)"),
        "Build Shared Context missing prompt tracking line"
      );
      assert(
        typeof assemble === "string" &&
          assemble.includes("prompt_version") &&
          assemble.includes("run_duration_ms"),
        "Assemble Full Article missing run-log metadata"
      );
    } else {
      const prompt = byName["Build Prompt"]?.parameters?.jsCode;
      const format = byName["Format Output"]?.parameters?.jsCode;
      assert(
        typeof prompt === "string" && prompt.includes("PROMPT TRACKING (internal)"),
        "Build Prompt missing prompt tracking line"
      );
      assert(
        typeof format === "string" &&
          format.includes("promptVersion: meta.promptVersion") &&
          format.includes("runLog: {"),
        "Format Output missing prompt/run log fields"
      );
    }

    for (const fx of fixtures) {
      const out = runValidate(validate, fx.body);
      assert(out.promptVersion, `[${fx.name}] promptVersion missing`);
      assert(out.contractVersion, `[${fx.name}] contractVersion missing`);
      assert(
        typeof out.runStartedAtMs === "number" && out.runStartedAtMs > 0,
        `[${fx.name}] runStartedAtMs missing`
      );
      assert(out.quickFormat, `[${fx.name}] quickFormat missing`);
      assert(out.intentPreset, `[${fx.name}] intentPreset missing`);
      assert(out.qualityRules != null, `[${fx.name}] qualityRules missing`);
      assert(out.templateContract != null, `[${fx.name}] templateContract missing`);
      assert(out.structuredExtras != null, `[${fx.name}] structuredExtras missing`);
    }

    console.log(`PASS ${wf.name}`);
  } catch (err) {
    failures++;
    console.error(`FAIL ${wf.name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} workflow regression test suite(s) failed.`);
  process.exit(1);
}

console.log("\nAll workflow fixture regression tests passed.");
