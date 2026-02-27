#!/usr/bin/env node

import { query } from "@anthropic-ai/claude-agent-sdk";

const prompt = process.argv[2];
const resumeId = process.argv[3] || undefined;

if (!prompt) {
  console.error("Usage: agent-runner <prompt> [session-id]");
  console.error("");
  console.error("  prompt       Task for Claude to execute");
  console.error("  session-id   Resume a previous session (optional)");
  console.error("");
  console.error("Environment:");
  console.error("  ANTHROPIC_API_KEY   Required. Your Anthropic API key.");
  console.error("  AGENT_CWD           Working directory for Claude (default: cwd)");
  console.error("  AGENT_MODEL         Model to use (default: SDK default)");
  process.exit(1);
}

const cwd = process.env.AGENT_CWD || process.cwd();
const model = process.env.AGENT_MODEL || undefined;

const options = {
  allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  permissionMode: "acceptEdits",
  cwd,
};

if (model) options.model = model;
if (resumeId) options.resume = resumeId;

let sessionId = null;

try {
  for await (const message of query({ prompt, options })) {
    // Capture session ID
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
      console.log(`\n📌 SESSION: ${sessionId}\n`);
    }

    // Assistant text
    if (message.type === "assistant") {
      for (const block of message.content || []) {
        if (block.type === "text") {
          console.log(`💬 ${block.text}`);
        }
        if (block.type === "tool_use") {
          console.log(`🔧 ${block.name}: ${JSON.stringify(block.input).slice(0, 200)}`);
        }
      }
    }

    // Tool results (abbreviated)
    if (message.type === "tool_result") {
      const text =
        typeof message.content === "string"
          ? message.content.slice(0, 200)
          : JSON.stringify(message.content).slice(0, 200);
      console.log(`  ↳ ${text}`);
    }

    // Final result
    if (message.type === "result") {
      console.log(
        `\n✅ RESULT: ${message.result || message.text || JSON.stringify(message).slice(0, 500)}`
      );
    }
  }
} catch (err) {
  console.error(`\n❌ ERROR: ${err.message}`);
  process.exit(1);
}

if (sessionId) {
  console.log(`\n📌 To resume: agent-runner "your next prompt" ${sessionId}`);
}
