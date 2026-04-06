/**
 * Patches the 3-stage n8n workflow (`coverageassist.json`) with
 * style_sample_url + serp_context — same contract as the Next.js app.
 * Pass a path as argv[2] to patch another export (e.g. Downloads copy).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const file = process.argv[2] || path.join(root, "coverageassist.json");

const j = JSON.parse(fs.readFileSync(file, "utf8"));

for (const node of j.nodes) {
  if (node.name === "Validate & Normalize" && node.parameters?.jsCode) {
    let s = node.parameters.jsCode;
    const a =
      "const styleSample  = (body.style_sample    || '').trim();\nconst pubName";
    const b =
      "const styleSample  = (body.style_sample    || '').trim();\n" +
      "const styleSampleUrl = (body.style_sample_url || '').trim();\n" +
      "const serpContext = (body.serp_context || body.research_snippets || '').trim();\n" +
      "const pubName";
    if (!s.includes("const styleSampleUrl")) {
      if (!s.includes(a)) throw new Error("Validate: anchor A not found");
      s = s.replace(a, b);
    }
    s = s.replace(
      "standoutTags, sliders, styleSample, pubName,",
      "standoutTags, sliders, styleSample, styleSampleUrl, serpContext, pubName,"
    );
    node.parameters.jsCode = s;
  }

  if (node.name === "Build Shared Context" && node.parameters?.jsCode) {
    let s = node.parameters.jsCode;
    const needle =
      "if (d.standoutTags.length) contentLines.push('\\nSTANDOUT TAGS: ' + d.standoutTags.join(' · '));\nconst contentBlock = contentLines.join('\\n');";
    const inject =
      "if (d.standoutTags.length) contentLines.push('\\nSTANDOUT TAGS: ' + d.standoutTags.join(' · '));\n" +
      "if (d.serpContext && d.serpContext.length > 10) {\n" +
      "  contentLines.push('\\nWEB RESEARCH SNIPPETS (SerpAPI — external context only; do NOT treat as verified facts unless consistent with evaluator notes):\\n' + d.serpContext.slice(0, 2500));\n" +
      "}\n" +
      "if (d.styleSampleUrl && d.styleSampleUrl.length > 8) {\n" +
      "  contentLines.push('\\nSTYLE SAMPLE SOURCE URL (reference only): ' + d.styleSampleUrl);\n" +
      "}\n" +
      "const contentBlock = contentLines.join('\\n');";
    if (!s.includes("d.serpContext && d.serpContext")) {
      if (!s.includes(needle)) throw new Error("Build Shared Context: anchor not found");
      s = s.replace(needle, inject);
    }
    node.parameters.jsCode = s;
  }
}

fs.writeFileSync(file, JSON.stringify(j, null, 2), "utf8");
console.log("Patched improved workflow:", file);
