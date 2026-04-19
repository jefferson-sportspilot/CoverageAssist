/**
 * Adds automation tracking to workflow exports:
 * - Run log branch (success path)
 * - Feedback webhook + logger
 * - Error trigger + logger
 *
 * Sheets logging uses HTTP webhooks so you can point to Apps Script / SheetDB / n8n intake:
 * - GOOGLE_SHEETS_RUNLOG_WEBHOOK_URL
 * - GOOGLE_SHEETS_FEEDBACK_WEBHOOK_URL
 * - GOOGLE_SHEETS_ERRORLOG_WEBHOOK_URL
 *
 * Run: node scripts/patch-error-feedback-tracking.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  path.join(root, "coverage with serp.json"),
  path.join(root, "coverageassist.json"),
];

function uid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function hasNode(j, name) {
  return (j.nodes || []).some((n) => n.name === name);
}

for (const fp of files) {
  if (!fs.existsSync(fp)) {
    console.log("missing", fp);
    continue;
  }
  const j = JSON.parse(fs.readFileSync(fp, "utf8"));
  let changed = false;

  const ensureConnections = () => {
    if (!j.connections) j.connections = {};
  };
  ensureConnections();

  // 1) Success run-log branch from Assemble Full Article
  if (!hasNode(j, "Build Run Log Payload")) {
    j.nodes.push({
      parameters: {
        jsCode:
          "const d = $input.first().json;\n" +
          "const now = new Date().toISOString();\n" +
          "return [{ json: {\n" +
          "  ...d,\n" +
          "  runLogPayload: {\n" +
          "    log_type: 'run_success',\n" +
          "    logged_at: now,\n" +
          "    session_id: d.sessionId || '',\n" +
          "    mode: d.mode || '',\n" +
          "    mode_label: d.modeLabel || '',\n" +
          "    tone: d.tone || '',\n" +
          "    audience: d.audience || d.audienceLabel || '',\n" +
          "    confidence: d.confidence || '',\n" +
          "    prompt_version: d.meta?.prompt_version || d.promptVersion || '',\n" +
          "    contract_version: d.meta?.contract_version || d.contractVersion || '',\n" +
          "    pipeline: d.meta?.pipeline || '3-stage',\n" +
          "    run_duration_ms: d.meta?.run_duration_ms || null,\n" +
          "    word_count_target: d.meta?.word_count_target || null,\n" +
          "    word_count_actual: d.meta?.word_count_actual || null,\n" +
          "    success: d.success === true\n" +
          "  }\n" +
          "} }];",
      },
      id: uid(),
      name: "Build Run Log Payload",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [3504, 560],
    });
    changed = true;
  }

  if (!hasNode(j, "Send Run Log to Sheets")) {
    j.nodes.push({
      parameters: {
        method: "POST",
        url: "={{ $env.GOOGLE_SHEETS_RUNLOG_WEBHOOK_URL || '' }}",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify($json.runLogPayload || $json) }}",
        options: {},
      },
      id: uid(),
      name: "Send Run Log to Sheets",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [3730, 560],
      continueOnFail: true,
    });
    changed = true;
  }

  if (!j.connections["Assemble Full Article"]?.main?.[0]?.some((c) => c.node === "Build Run Log Payload")) {
    const base = j.connections["Assemble Full Article"]?.main?.[0] || [];
    base.push({ node: "Build Run Log Payload", type: "main", index: 0 });
    j.connections["Assemble Full Article"] = { main: [base] };
    changed = true;
  }

  if (!j.connections["Build Run Log Payload"]) {
    j.connections["Build Run Log Payload"] = {
      main: [[{ node: "Send Run Log to Sheets", type: "main", index: 0 }]],
    };
    changed = true;
  }

  // 2) Feedback endpoint branch
  if (!hasNode(j, "Feedback Webhook")) {
    j.nodes.push({
      parameters: {
        httpMethod: "POST",
        path: "coverage-assist-feedback",
        responseMode: "responseNode",
        options: {},
      },
      id: uid(),
      name: "Feedback Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 1,
      position: [208, 760],
      webhookId: "coverage-assist-feedback-webhook",
    });
    changed = true;
  }

  if (!hasNode(j, "Normalize Feedback")) {
    j.nodes.push({
      parameters: {
        jsCode:
          "const body = $input.first().json.body || $input.first().json;\n" +
          "const rating = Math.max(1, Math.min(5, parseInt(body.rating, 10) || 0));\n" +
          "const payload = {\n" +
          "  log_type: 'user_feedback',\n" +
          "  logged_at: new Date().toISOString(),\n" +
          "  session_id: String(body.session_id || body.sessionId || '').trim(),\n" +
          "  workflow: String(body.workflow || 'coverage-assist').trim(),\n" +
          "  mode: String(body.mode || '').trim(),\n" +
          "  rating: rating || null,\n" +
          "  feedback: String(body.feedback || body.comment || '').trim(),\n" +
          "  user: String(body.user || body.email || '').trim(),\n" +
          "  source: String(body.source || 'portal').trim()\n" +
          "};\n" +
          "if (!payload.session_id && !payload.feedback) {\n" +
          "  throw new Error('feedback payload requires session_id or feedback text');\n" +
          "}\n" +
          "return [{ json: payload }];",
      },
      id: uid(),
      name: "Normalize Feedback",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [432, 760],
    });
    changed = true;
  }

  if (!hasNode(j, "Send Feedback to Sheets")) {
    j.nodes.push({
      parameters: {
        method: "POST",
        url: "={{ $env.GOOGLE_SHEETS_FEEDBACK_WEBHOOK_URL || '' }}",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify($json) }}",
        options: {},
      },
      id: uid(),
      name: "Send Feedback to Sheets",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [656, 760],
      continueOnFail: true,
    });
    changed = true;
  }

  if (!hasNode(j, "Return Feedback Ack")) {
    j.nodes.push({
      parameters: {
        respondWith: "json",
        responseBody:
          "={{ JSON.stringify({ ok: true, logged: true, session_id: $json.session_id || '' }) }}",
        options: {
          responseCode: 200,
          responseHeaders: {
            entries: [{ name: "Content-Type", value: "application/json" }],
          },
        },
      },
      id: uid(),
      name: "Return Feedback Ack",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1,
      position: [880, 760],
    });
    changed = true;
  }

  if (!j.connections["Feedback Webhook"]) {
    j.connections["Feedback Webhook"] = {
      main: [[{ node: "Normalize Feedback", type: "main", index: 0 }]],
    };
    changed = true;
  }
  if (!j.connections["Normalize Feedback"]) {
    j.connections["Normalize Feedback"] = {
      main: [[{ node: "Send Feedback to Sheets", type: "main", index: 0 }]],
    };
    changed = true;
  }
  if (!j.connections["Send Feedback to Sheets"]) {
    j.connections["Send Feedback to Sheets"] = {
      main: [[{ node: "Return Feedback Ack", type: "main", index: 0 }]],
    };
    changed = true;
  }

  // 3) Error trigger branch
  if (!hasNode(j, "Workflow Error Trigger")) {
    j.nodes.push({
      parameters: {},
      id: uid(),
      name: "Workflow Error Trigger",
      type: "n8n-nodes-base.errorTrigger",
      typeVersion: 1,
      position: [208, 980],
    });
    changed = true;
  }

  if (!hasNode(j, "Build Error Log Payload")) {
    j.nodes.push({
      parameters: {
        jsCode:
          "const e = $input.first().json;\n" +
          "return [{ json: {\n" +
          "  log_type: 'workflow_error',\n" +
          "  logged_at: new Date().toISOString(),\n" +
          "  workflow_name: e.workflow?.name || 'CoverageAssist',\n" +
          "  execution_id: String(e.execution?.id || ''),\n" +
          "  last_node: e.execution?.lastNodeExecuted || '',\n" +
          "  error_message: e.execution?.error?.message || e.error?.message || 'Unknown error',\n" +
          "  error_stack: e.execution?.error?.stack || '',\n" +
          "  raw: JSON.stringify(e).slice(0, 7000)\n" +
          "} }];",
      },
      id: uid(),
      name: "Build Error Log Payload",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [432, 980],
    });
    changed = true;
  }

  if (!hasNode(j, "Send Error Log to Sheets")) {
    j.nodes.push({
      parameters: {
        method: "POST",
        url: "={{ $env.GOOGLE_SHEETS_ERRORLOG_WEBHOOK_URL || '' }}",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify($json) }}",
        options: {},
      },
      id: uid(),
      name: "Send Error Log to Sheets",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [656, 980],
      continueOnFail: true,
    });
    changed = true;
  }

  if (!j.connections["Workflow Error Trigger"]) {
    j.connections["Workflow Error Trigger"] = {
      main: [[{ node: "Build Error Log Payload", type: "main", index: 0 }]],
    };
    changed = true;
  }
  if (!j.connections["Build Error Log Payload"]) {
    j.connections["Build Error Log Payload"] = {
      main: [[{ node: "Send Error Log to Sheets", type: "main", index: 0 }]],
    };
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fp, JSON.stringify(j, null, 2), "utf8");
    console.log("updated", fp);
  } else {
    console.log("skip", fp);
  }
}
