# Jobs Hero – Extension Vitals Report

**Last run:** 2026-03-13 (run 2)  
**Browser:** Antigravity (Chrome DevTools MCP)  
**Page:** LinkedIn jobs search (`/jobs/search/?keywords=engineer`)  
**Extension ID:** `gllkblgmfdjoglibjdhbdofpahcpbgea`

---

## Summary

| Area | Status | Notes |
|------|--------|--------|
| **Console (errors)** | OK | No Jobs Hero–originated errors; 53 errors in sample, all LinkedIn/third‑party (net::ERR_FAILED, CSP). |
| **Extension errors page** | OK | No runtime errors reported for Jobs Hero at `chrome://extensions/?errors=...` |
| **UI (control bar + insight)** | OK | Freshness, Page Filters, and insight panel (role tag "Data Engineering", company stats) present. |
| **Page performance (CWV)** | Recorded | LCP 2,159 ms, TTFB 336 ms, CLS 0.45 (latest run; page-level). |
| **JS heap (page)** | Recorded | ~314 MB used, ~367 MB total (latest run; varies with page state). |
| **Heap snapshot / leak check** | Not run | Not available via MCP; use DevTools Memory panel manually if needed. |

---

## Actionables

**For now: no issues; keep doing the weekly check.**

---

## Weekly check (10 min)

A simple routine that catches **most extension issues**:

1. Open a **LinkedIn jobs page** (e.g. `/jobs/search/?keywords=engineer`).
2. Open **DevTools** and enable the **Console** tab.
3. **Scroll** the jobs list and open a few job details (so the extension runs).
4. Check the console for **errors** or obvious **performance** problems.

Optionally: open `chrome://extensions/?errors=gllkblgmfdjoglibjdhbdofpahcpbgea` and confirm no errors for Jobs Hero.

---

## 1. Console

- **Sample:** First 100 error-level messages on LinkedIn jobs page.
- **Result:** All observed errors are **LinkedIn/third‑party** (e.g. `net::ERR_FAILED`, CSP blocks to `google.co.in`). None reference Jobs Hero scripts or `chrome-extension://` URLs for this extension.
- **Note:** `chrome-extension://invalid/` errors, when present, come from **another** extension (e.g. one that intercepts `fetch`), not Jobs Hero.

---

## 2. Extension errors page

- **URL:** `chrome://extensions/?errors=gllkblgmfdjoglibjdhbdofpahcpbgea`
- **Result:** Errors tab shows no error list content for Jobs Hero → **no runtime errors** reported for the extension.

---

## 3. UI (Jobs Hero on LinkedIn jobs)

- **Control bar:** Present next to “Show all filters” (buttons: **Freshness**, **Page Filters**).
- **Insight panel:** On job detail (e.g. Data Engineer III – IN), visible: role tag “Data Engineering”, company size “5,001–10,000”, “7,200 on LI”, “55 people clicked apply”.

---

## 4. Performance (Core Web Vitals, full page load)

Trace with reload (page + extension loaded). **Latest run (2):**

| Metric | Value |
|--------|--------|
| **LCP** | 2,159 ms |
| **TTFB** | 336 ms |
| **CLS** | 0.45 |

*(Run 1: LCP 3,886 ms, CLS 0.26. Variance is normal for LinkedIn.)*

These are **page-level** numbers (LinkedIn + all extensions). No A/B with extension disabled was run, so extension-specific impact is not isolated.

---

## 5. Memory (JS heap, page context)

- **Source:** `performance.memory` on the LinkedIn jobs tab (evaluated in page).
- **Latest run (2):** `usedJSHeapSize` ≈ 314 MB, `totalJSHeapSize` ≈ 367 MB. (Run 1: ~3.5 MB / ~4.4 MB; heap grows with page content and time.)
- **Heap snapshot / leak check:** Not run (not available via this MCP). For leak checks, use DevTools → Memory → Heap snapshot before/after using the extension (e.g. open/close job details, change filters).

---

## How to re-run (manual / MCP)

1. **Console:** DevTools → Console; filter by level (Errors). Confirm no messages from Jobs Hero scripts.
2. **Extension errors:** Open `chrome://extensions/?errors=gllkblgmfdjoglibjdhbdofpahcpbgea`; ensure no errors listed for Jobs Hero.
3. **Performance:** DevTools → Performance; record page load (with reload); check LCP/CLS in summary.
4. **Memory:** DevTools → Memory; take heap snapshots before/after interaction with the extension; compare for growth.
5. **Recommended stack (Chrome built-in):** Console, `chrome://extensions/?errors=...`, Performance Monitor, Performance trace, Memory panel (see project notes on avoiding deprecated Web Vitals extension).

---

*Report generated from automated checks via Antigravity browser (Chrome DevTools MCP).*
