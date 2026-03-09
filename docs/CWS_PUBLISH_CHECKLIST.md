# Chrome Web Store Publish Checklist (JobMate)

**Prepared on:** March 9, 2026
**Competitor reference:** [Hide Applied Jobs - LinkedIn](https://chromewebstore.google.com/detail/hide-applied-jobs-linkedi/jkoegkdeggghnoenfgjoklfkmihkighf)

## 1) Submission blockers to clear first

- [x] Keep permissions minimal (`storage` only).
- [x] Restrict host scope to required URLs only (`linkedin.com/jobs/*`, `linkedin.com/feed/*`).
- [x] Add extension icons in manifest (`16`, `48`, `128`) and include files in package.
- [x] Host privacy policy on a public URL (required by CWS): `https://rishabhme12.github.io/job-mate/privacy-policy.html`.
- [x] Prepare a support URL: `https://github.com/rishabhme12/job-mate/issues`.
- [x] Set homepage URL: `https://github.com/rishabhme12/job-mate`.

## 2) Store listing assets

- [ ] `1280x800` or `640x400` screenshots (minimum 1; recommend 4-5).
- [ ] Optional 1 short demo video (30-60s) showing before/after.
- [ ] Store icon (`128x128`), plus extension icon set for toolbar.
- [ ] Small promo tile (`440x280`) for listing graphics.
- [ ] Optional marquee tile (`1400x560`) for featuring opportunities.
- [ ] Final short description (<=132 chars) and long description.

## 3) Suggested screenshot set (conversion-focused)

- [ ] Screenshot 1: before/after job list cleanup (viewed/applied/promoted dimmed/hidden).
- [ ] Screenshot 2: filter control bar open with active filters.
- [ ] Screenshot 3: role tag and company insight chips in job details pane.
- [ ] Screenshot 4: keyword + company blacklist workflow.
- [ ] Screenshot 5: privacy-first claim (local storage only) in options/help view.

## 4) Competitor snapshot and positioning

Snapshot from the listing on March 3, 2026:
- Competitor rating shown: `4.2` (`47` ratings).
- Users shown: `20,000`.
- Last updated shown: `August 22, 2025`.
- Current version shown: `1.8.3`.
- Primary promise: hide applied jobs and promoted jobs on LinkedIn.

Position JobMate as:
- Broader than simple hide/dim: multi-filter pipeline + keyword/company controls.
- More informative: role tagging and company insight chips.
- Privacy-forward: local-only processing and storage.

## 5) Recommended listing copy angle

Headline angle:
- "Declutter LinkedIn Jobs and triage faster with filters + role tags."

Proof points:
- "Hide/dim viewed, applied, promoted, and low-signal cards."
- "Filter by include/exclude keywords and company blacklist."
- "Auto-tag roles (Backend, Frontend, Data, DevOps, AI/ML, Security, QA, Product)."
- "Runs locally in your browser; no external data collection."

## 6) Pre-publish QA gate

- [ ] `npm test` passes.
- [ ] Manual regression on LinkedIn Jobs search results.
- [ ] Manual regression on LinkedIn Feed job cards.
- [ ] Verify no console errors on page transitions.
- [x] Zip package only includes required extension files (no secrets, no local artifacts).
- [ ] Listing is not missing icon/screenshot/description (missing assets can cause rejection).
- [ ] Privacy fields in dashboard exactly match extension behavior and privacy policy.

## 7) First 2 version milestones after launch

- **v1.0.1 (fast follow):** bugfixes from first-user reports + selector resilience.
- **v1.1.0:** saved filter presets + lightweight onboarding tips.

## References

- Chrome listing requirements: https://developer.chrome.com/docs/webstore/program-policies/listing-requirements
- CWS dashboard listing fields: https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- CWS permissions policy: https://developer.chrome.com/docs/webstore/program-policies/permissions/
