# agent-runner

Lightweight CLI wrapper for the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) with session resume support.

## Why

We built this for an AI agent that codes in a GitHub Codespace via SSH. The old approach — piping prompts to `claude-code --print` over SSH — was fragile: stdout buffering, PTY hangs, no structured output, and no way to have multi-turn conversations.

This wrapper gives us:
- **Structured output** instead of raw stdout
- **Session resume** for multi-turn coding (read code → review → implement → fix)
- **Reliability** — no hanging, no buffering, no PTY hacks
- **Simple CLI** that an AI agent can invoke via `exec` over SSH

The typical flow: AI agent SSHs into a Codespace, runs `agent-runner "implement feature X"`, gets structured results + a session ID, then resumes with `agent-runner "fix the issue on line 42" SESSION_ID`.

## Install

```bash
npm install github:edlio/agent-runner
```

Or run directly:

```bash
npx github:edlio/agent-runner "your prompt here"
```

## Usage

```bash
# One-shot task
agent-runner "Read src/index.ts and summarize what it does"

# Resume a previous session for multi-turn
agent-runner "Now refactor the error handling" SESSION_ID

# Custom working directory
AGENT_CWD=/path/to/project agent-runner "Fix the failing tests"

# Custom model
AGENT_MODEL=claude-sonnet-4-20250514 agent-runner "Quick review of utils.ts"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `AGENT_CWD` | No | Working directory for Claude (default: current directory) |
| `AGENT_MODEL` | No | Model to use (default: SDK default) |

## Output

```
📌 SESSION: ea2d10d9-75f3-4d04-9397-8d854f38850e

💬 I'll read the file and summarize it...
🔧 Read: {"file_path":"src/index.ts"}
  ↳ [file contents]
💬 This file sets up the Express server...

✅ RESULT: The file configures an Express server with middleware...

📌 To resume: agent-runner "your next prompt" ea2d10d9-75f3-4d04-9397-8d854f38850e
```

## How It Works

- Wraps `@anthropic-ai/claude-agent-sdk` with a simple CLI interface
- Auto-approves file edits (`permissionMode: "acceptEdits"`)
- Built-in tools: Read, Write, Edit, Bash, Glob, Grep
- Session IDs enable multi-turn conversations — Claude remembers previous context
- Streams structured output (assistant text, tool calls, results)

## License

MIT
