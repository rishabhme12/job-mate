# Job Tagging Golden Set

Golden set for measuring **KeywordEngine** tagging accuracy: 20 JDs with mixed roles and intentional “confusing” cases (e.g. “Software Engineer” title with Data Engineer or Fullstack JD).

## Fixture

- **File:** `tests/fixtures/job_tagging_golden_set.json`
- **Schema:** `[{ "title", "description", "expectedTag" }, ...]`
- **expectedTag** values: Backend, Frontend, Fullstack, Data Engineering, Data Analytics, Data Science, DevOps, Mobile, AI/ML, QA, Security, Embedded/Systems, Product, Not Sure (must match `keyword_engine.js` buckets).

## Running the accuracy test

```bash
npm run test -- tests/unit/job_tagging_accuracy.test.js
```

Or run all unit tests (includes U-13):

```bash
npm run test
```

The test reports correct/total, accuracy %, and any mismatches (expected → predicted). It **fails** if accuracy is below 70% (configurable via `MIN_ACCURACY` in the test file).

## Refreshing the golden set

### Option A: Google Jobs (no login) — recommended

Google Jobs works without sign-in. Use Chrome DevTools MCP to collect JDs.

1. **Navigate:** Open `https://www.google.com/search?q=software+engineer+jobs`, then click the **Jobs** tab so the URL includes `udm=8`.
2. **Open a job:** Click any job card in the list. A dialog opens with the full job title and description.
3. **Extract:** In the page, run this script (e.g. via MCP `evaluate_script`):

```javascript
() => {
  const dialogs = document.querySelectorAll('[role="dialog"]');
  for (const d of dialogs) {
    if (!d.innerText.includes('Job description')) continue;
    const h1 = d.querySelector('h1');
    const title = h1 ? h1.innerText.trim() : '';
    const full = d.innerText;
    const idx = full.indexOf('Job description');
    const description = idx >= 0 ? full.slice(idx + 'Job description'.length).trim() : full;
    if (title) return { title, description };
  }
  return { title: null, description: null };
}
```

4. **Collect 20:** Repeat: click next job card (or close dialog and click another), run the script again. Append each `{ title, description }` to an array. Use a mix of searches if needed (e.g. `data+engineer+jobs`, `frontend+developer+jobs`) for variety and “confusing” cases (e.g. “Software Engineer” with a Data Engineer JD).
5. **Tag:** Assign **expectedTag** to each row from the JD content (Backend, Frontend, Data Engineering, etc.).
6. **Save:** Write the array to `tests/fixtures/job_tagging_golden_set.json` and run `npm run test -- tests/unit/job_tagging_accuracy.test.js`.

### Option B: LinkedIn (requires login)

If you have a logged-in session in the MCP browser:

1. Go to `https://www.linkedin.com/jobs/search/?keywords=software+engineer` (or data engineer, frontend, etc.).
2. For each job: click to open the right-hand detail panel, then read **title** from `.job-details-jobs-unified-top-card__job-title h1` (or `.jobs-unified-top-card__job-title h1`) and **description** from `.jobs-description__content` innerText.
3. Build the JSON with `expectedTag` and save as above.

### Current set

The fixture was initially built with hand-written JDs (mixed roles + confusing title-vs-JD cases) so the suite runs in CI without any job portal. You can replace or extend it using Google Jobs (Option A) or LinkedIn (Option B).
