#!/usr/bin/env bash
set -euo pipefail

CODEX_BIN="${CODEX_BIN:-/Applications/Codex.app/Contents/Resources/codex}"
LOG_ROOT="${HOME}/Library/Application Support/Antigravity/logs"
MCP_NAME="${MCP_NAME:-antigravity-browser}"

latest_log="$(
  find "$LOG_ROOT" -type f -name 'Chrome DevTools MCP.log' -print0 2>/dev/null |
    xargs -0 ls -t 2>/dev/null |
    head -n 1
)"

if [[ -z "${latest_log:-}" ]]; then
  echo "No Antigravity Chrome DevTools MCP log found."
  echo "Open Antigravity and launch its managed browser first."
  exit 1
fi

url="$(rg -o 'http://127\.0\.0\.1:[0-9]+/mcp' "$latest_log" | tail -n 1)"

if [[ -z "${url:-}" ]]; then
  echo "No MCP URL found in: $latest_log"
  echo "Open Antigravity and launch its managed browser first."
  exit 1
fi

"$CODEX_BIN" mcp remove "$MCP_NAME" >/dev/null 2>&1 || true
"$CODEX_BIN" mcp add "$MCP_NAME" --url "$url" >/dev/null

echo "Configured $MCP_NAME -> $url"
"$CODEX_BIN" mcp get "$MCP_NAME" --json
