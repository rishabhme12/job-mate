---
name: antigravity-browser-mcp
description: Refresh and use Antigravity's browser MCP for live browser work. Use when the user wants Codex to inspect, navigate, click, extract data from, or debug a real page in the Antigravity-managed browser instead of Playwright.
---

# Antigravity Browser MCP

## Overview

Use this skill for real-browser tasks through Antigravity's `chrome-devtools-mcp` endpoint. It is the right path for "open this URL", "tell me what is visible", "start this flow", and UI debugging against the actual Antigravity-managed browser.

Codex can open URLs and create tabs itself once Antigravity and its managed browser are healthy. Codex cannot reliably relaunch Antigravity's managed browser from MCP alone, so if the browser backend is down the user may need to relaunch the managed browser once.

## Quick Start

1. Refresh the dynamic MCP URL first:

```bash
./scripts/refresh_antigravity_mcp.sh
```

2. Use prompts that explicitly force the Antigravity server and exclude Playwright:

```text
Use only the antigravity-browser MCP server, not playwright. Open or use the current page in the connected Antigravity browser, inspect the live UI, then perform the requested browser task.
```

3. If the user wants navigation, Codex can do it itself:

```text
Use only the antigravity-browser MCP server, not playwright. Open https://example.com in the connected Antigravity browser, wait for the page to load, then describe what is visible.
```

## Workflow

1. Run `./scripts/refresh_antigravity_mcp.sh`.
2. If the script fails to find a URL, tell the user to open Antigravity and launch its managed browser once.
3. If the script succeeds, use `antigravity-browser` only for the task.
4. Prefer `new_page` or explicit navigation prompts when there is no selected page.
5. Stop before submitting purchases, payments, deletes, or other irreversible actions unless the user explicitly asks.

## Recovery

If the task fails, map the error to the fix:

- `Connection refused` or MCP startup failure to `127.0.0.1:<port>/mcp`
  - Run `./scripts/refresh_antigravity_mcp.sh` again. Antigravity rotated the port.
- `Could not connect to Chrome` or failure against `127.0.0.1:9222/json/version`
  - Antigravity is up but the managed browser backend is not. Ask the user to relaunch the managed browser in Antigravity, then rerun the refresh script.
- `No page selected`
  - Open a new page or explicitly navigate to the target URL.
- `The selected page has been closed`
  - Re-list pages or create a new page; the previous page handle is stale.

## When Codex Can Open The Browser Itself

Codex can open URLs and new tabs itself after both of these are true:

- Antigravity's `chrome-devtools-mcp` endpoint is live and configured as `antigravity-browser`.
- The Antigravity-managed browser is already running and reachable on the Chrome DevTools side.

Codex should not assume it can cold-start the full managed browser stack from scratch. In practice, the user may need to launch Antigravity and its managed browser once per fresh session if the browser backend is down.

## Example Prompts

Inspect a page:

```text
Use only the antigravity-browser MCP server, not playwright. Inspect the currently open page in the connected Antigravity browser and describe the visible UI.
```

Open a URL:

```text
Use only the antigravity-browser MCP server, not playwright. Open https://example.com in the connected Antigravity browser, wait for the page to load, then tell me what is visible.
```

Start a flow but stop before completion:

```text
Use only the antigravity-browser MCP server, not playwright. Start the requested journey in the connected Antigravity browser and proceed until the final confirmation or payment step, but do not submit or finalize anything.
```
