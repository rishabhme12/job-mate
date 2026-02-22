# JobMate Full Regression Runbook

Single place to run **full regression**: unit tests (automated) + E2E (browser-led via Chrome DevTools MCP). All cases are defined in [TEST_CASES.md](TEST_CASES.md).

---

## How to run full regression

| Who runs it | What to do |
|-------------|------------|
| **You (terminal)** | `npm run regression` — runs unit tests, then reminds you to run E2E. |
| **You (in Cursor)** | Ask the agent: **"Run full regression"** or **"Run regression"** or **"Sign-off check"**. The agent will run `npm run test`, then run E2E from this runbook via Chrome DevTools MCP and report pass/fail. |
| **You (manual E2E)** | After `npm run regression`, open this file and do Step 2 yourself in a browser (no MCP). |

---

## Scope: what is automated vs browser MCP vs user-only

| Layer | What | Who runs it | Fully automated? |
|-------|------|-------------|------------------|
| **Unit tests (U-1 … U-12)** | FilterEngine, KeywordEngine, Storage logic in Node (chrome mocked). | `npm run test` (you or agent). | **Yes** — no browser, no LinkedIn. |
| **E2E (E-1, E-2, E-3)** | Real LinkedIn + JobMate: control bar, filters, insight panel. | **Browser MCP** when the agent runs regression (agent drives Chrome), or **you** by hand using this runbook. | **No** — needs a real browser and (for MCP) the agent to execute the runbook steps. |
| **Full regression** | Unit + all E2E. | You run `npm run regression` then either (a) ask the agent to run E2E via Chrome MCP, or (b) run E2E yourself. | **Half:** unit is automated; E2E is scripted in this runbook but not headless (no Playwright). |

**What you still need to do to “test everything”:**

1. **Unit:** Already automated. Run `npm run test` (or `npm run regression`); ensure all 12 pass.
2. **E2E:** Either (a) **ask the agent** “Run full regression” so it runs unit + E2E via Chrome MCP, or (b) **you** open LinkedIn jobs in Chrome (with JobMate installed), follow Step 2 in this runbook for E-1, E-2, E-3, and set Status in [TEST_CASES.md](TEST_CASES.md) to pass/fail.
3. **User-only (out of scope for automation/MCP):** Real-world checks only you can do — e.g. “Does this feel right on my account?”, “Do filters work with my actual viewed/applied list?”, cross-browser, performance, accessibility. Those stay manual.

---

## Prerequisites

- JobMate extension loaded in Chrome (used by the MCP browser).
- **Logged-in LinkedIn session** — E2E require you to be signed in to LinkedIn; otherwise the jobs page shows a sign-in modal and the extension UI cannot be verified.
- Chrome DevTools MCP available when an agent runs E2E steps (optional; you can run Step 2 manually).
- For local run: `npm run test` must pass before considering E2E.

**To green E2E for Chrome Web Store:** Run Step 2 in a Chrome window where you are logged into LinkedIn and JobMate is installed. After running E-1, E-2, E-3, set each Status in [TEST_CASES.md](TEST_CASES.md) to **pass** or **fail**.

---

## Step 1: Unit tests (automated)

From project root:

```bash
npm run test
```

- **Pass:** Continue to Step 2.
- **Fail:** Do not sign off. Fix failing unit tests, then re-run.

---

## Step 2: E2E cases (browser-led via Chrome MCP)

Run each E2E case below in order. Use Chrome DevTools MCP to navigate, click, and verify. Report each as **pass** or **fail** and update the Status column in `docs/TEST_CASES.md` if needed.

**Base URL:** Use a LinkedIn jobs search page, e.g.  
`https://www.linkedin.com/jobs/search/?keywords=engineer`  
(Logged-in session required; extension only runs on `/jobs/` and `/feed/`.)

---

### E-1: Filters – Hide Viewed → Apply → list updates

| ID  | Description |
|-----|-------------|
| E-1 | On LinkedIn jobs search, open JobMate filters → set hide viewed → Apply → list updates |

**Steps:**

1. Navigate to a LinkedIn jobs search URL (see Base URL above). Wait for the jobs list to load.
2. Take a snapshot; confirm the JobMate control bar is visible (e.g. "Page Filters" / "Freshness" next to "All filters").
3. Click the **Page Filters** button (id: `jm-btn-page-filters`). Modal "Page Filters (Visual)" should open.
4. In the modal, check **Hide Viewed** (checkbox id: `jm-hide-viewed`).
5. Click **Show results** (button id: `jm-page-apply`). Modal closes.
6. Take a snapshot. Verify the job list has updated (e.g. some cards hidden or count changed). Optional: inspect DOM for hidden/removed viewed items.
7. **Pass:** Modal opened, Hide Viewed toggled, Apply clicked, list updated. **Fail:** Any step fails or list does not update.

---

### E-2: Insight panel – applicant/company stats when job selected

| ID  | Description |
|-----|-------------|
| E-2 | Insight panel shows applicant/company stats when job selected |

**Steps:**

1. On the same LinkedIn jobs search page, ensure the JobMate control bar is present.
2. Click a job card in the list to open the job details (right-hand panel or similar).
3. Take a snapshot of the job details area. Verify that the JobMate insight panel (applicant count, company stats, or similar) is visible in or near the job details.
4. **Pass:** Insight content appears when a job is selected. **Fail:** No insight panel or stats visible.

---

### E-3: UI – Control bar next to "All filters"

| ID  | Description |
|-----|-------------|
| E-3 | Control bar appears next to "All filters" on jobs page |

**Steps:**

1. Navigate to a LinkedIn jobs search URL. Wait for the page to load.
2. Take a snapshot. Locate the "All filters" button (or pill) in the UI.
3. Verify that the JobMate control bar (element id: `job-mate-control-bar`) is present and appears next to or near "All filters" (e.g. same row, before or after it). It should contain at least "Page Filters" and "Freshness" buttons.
4. **Pass:** Control bar is visible next to "All filters". **Fail:** Control bar missing or not next to "All filters".

---

## Reporting

- **Unit:** Report `npm run test` result (pass/fail and failing file/spec if any).
- **E2E:** For each E-1, E-2, E-3 report pass/fail. If any fail, say: **Do not sign off until these are fixed.**
- Optionally update the Status column in `docs/TEST_CASES.md` for E-1, E-2, E-3 after the run.

## Quick reference – E2E selectors

| Purpose        | Selector / ID                    |
|----------------|-----------------------------------|
| Control bar    | `#job-mate-control-bar`           |
| Page Filters   | `#jm-btn-page-filters`            |
| Hide Viewed    | `#jm-hide-viewed`                 |
| Apply (modal)   | `#jm-page-apply`                  |
| Page modal     | `#jm-modal-overlay-page`          |
