# JobMate Test Case Registry

Single source of truth for all test cases (unit + E2E). Full regression = run every case listed here.

| ID | Description | Type | Area | Status | Notes |
|----|-------------|------|------|--------|-------|
| U-1 | FilterEngine: shouldShowJob hides promoted when hidePromoted=true | unit | filters | pass | Node |
| U-2 | FilterEngine: shouldShowJob hides applied when hideApplied=true | unit | filters | pass | Node |
| U-3 | FilterEngine: shouldShowJob hides viewed when hideViewed=true | unit | filters | pass | Node |
| U-4 | FilterEngine: titleKeywords positive match (OR logic) | unit | filters | pass | Node |
| U-5 | FilterEngine: negativeKeywords exclude matching titles | unit | filters | pass | Node |
| U-6 | FilterEngine: checkDetail passes/fails activelyReviewingOnly | unit | filters | pass | Node |
| U-7 | KeywordEngine: normalize lowercases and strips non-word chars | unit | tagging | pass | Node |
| U-8 | KeywordEngine: classify returns Backend for "Backend Engineer" | unit | tagging | pass | Node |
| U-9 | KeywordEngine: classify returns Data Engineering for ETL title | unit | tagging | pass | Node |
| U-10 | KeywordEngine: classify returns Not Sure for low/no match | unit | tagging | pass | Node |
| U-11 | Storage: getSettings returns defaults when empty | unit | storage | pass | Node, chrome mocked |
| U-12 | Storage: saveSettings merges with existing | unit | storage | pass | Node, chrome mocked |
| U-13 | KeywordEngine: golden-set tagging accuracy (20 JDs) ≥ 70% | unit | tagging | pass | Node, fixture job_tagging_golden_set.json |
| E-1 | On LinkedIn jobs search, open JobMate filters → set hide viewed → Apply → list updates | E2E | filters | pending | Chrome MCP |
| E-2 | Insight panel shows applicant/company stats when job selected | E2E | insights | pending | Chrome MCP |
| E-3 | Control bar appears next to "All filters" on jobs page (Freshness, Page Filters) | E2E | UI | pending | Chrome MCP |

## How to run

- **Unit:** `npm run test` (from project root).
- **Full regression:** `npm run regression` (runs unit then prompts for E2E). E2E steps are in [docs/REGRESSION_RUN.md](REGRESSION_RUN.md)—run them via Chrome DevTools MCP; document pass/fail in Status.

## Adding cases

- Every new feature or bugfix must add or update rows here.
- Use IDs: U-* for unit, E-* for E2E. Increment the number.
