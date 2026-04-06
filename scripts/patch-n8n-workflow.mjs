import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const file =
  process.argv[2] || path.join(root, "CoverageAssistAI (1).json");

const j = JSON.parse(fs.readFileSync(file, "utf8"));

for (const node of j.nodes) {
  if (node.name === "Validate & Normalize" && node.parameters?.jsCode) {
    let s = node.parameters.jsCode;
    const insertAfter =
      "const styleSample    = (body.style_sample    || '').trim();\n";
    if (!s.includes(insertAfter)) {
      throw new Error("Validate: expected styleSample line not found");
    }
    if (!s.includes("const styleSampleUrl")) {
      s = s.replace(
        insertAfter,
        insertAfter +
          "const styleSampleUrl = (body.style_sample_url || '').trim();\n" +
          "const serpContext = (body.serp_context || body.research_snippets || '').trim();\n"
      );
    }
    s = s.replace(
      "    standoutTags, sliders, styleSample, pubName,\n",
      "    standoutTags, sliders, styleSample, styleSampleUrl, serpContext, pubName,\n"
    );
    node.parameters.jsCode = s;
  }

  if (node.name === "Build Prompt" && node.parameters?.jsCode) {
    let s = node.parameters.jsCode;
    const needle = "const contentBlock = contentLines.join('\\n');\n\n//";
    if (!s.includes(needle)) {
      throw new Error("Build Prompt: contentBlock anchor not found");
    }
    if (!s.includes("d.serpContext")) {
      const block =
        "if (d.serpContext && d.serpContext.length > 10) {\n" +
        "  contentLines.push('\\nWEB RESEARCH SNIPPETS (SerpAPI — external context only; do NOT treat as verified facts about the player/event unless consistent with evaluator notes):\\n' + d.serpContext.slice(0, 2500));\n" +
        "}\n" +
        "if (d.styleSampleUrl && d.styleSampleUrl.length > 8) {\n" +
        "  contentLines.push('\\nSTYLE SAMPLE SOURCE URL (reference only; voice comes from style_sample text): ' + d.styleSampleUrl);\n" +
        "}\n" +
        "const contentBlock = contentLines.join('\\n');\n\n//";
      s = s.replace(
        "const contentBlock = contentLines.join('\\n');\n\n//",
        block
      );
    }
    node.parameters.jsCode = s;
  }
}

fs.writeFileSync(file, JSON.stringify(j, null, 2), "utf8");
console.log("Patched:", file);
