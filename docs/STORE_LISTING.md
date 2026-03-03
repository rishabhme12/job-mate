# Chrome Web Store listing copy

Use this when filling out the Chrome Web Store dashboard for JobMate.

---

## Single purpose (required field)

**Suggested text:**

JobMate has a single purpose: to improve the LinkedIn Jobs experience by adding on-page filters (e.g. hide viewed/applied jobs, keyword and company filters) plus role-type tags and company insight chips directly in the jobs UI. All processing and storage is on-device; no data is sent to external servers.

---

## Permission justifications (required per permission)

Paste these in the "Justification" fields for each permission in the CWS dashboard.

| Permission   | Justification |
|-------------|----------------|
| **storage**   | Required to save the user’s filter preferences (e.g. hide viewed/applied, keywords, company blacklist) and UI state locally. Data is stored only in the browser via `chrome.storage.local`; it is not sent off-device. |

---

## Privacy practices (dashboard checkboxes)

- **No data collected off-device.** The extension does not send any data to remote servers.
- **Local storage:** Filter and UI preferences are stored locally in the browser.
- **No personal or account data:** We do not collect or transmit LinkedIn account or profile data.

You must provide a **privacy policy URL** in the store. Options:

1. Host `docs/privacy-policy.html` (recommended) on GitHub Pages or your site and use that URL.
2. Copy the content of `docs/PRIVACY_POLICY.md` into a single public page and use that URL.

The URL must be publicly accessible so reviewers and users can open it.

---

## Suggested Store Description

Use this as a baseline long description and customize as needed.

JobMate helps you triage LinkedIn job search faster with practical filters and role tagging directly on the page.

What it does:
- Filter or dim jobs by viewed/applied, promoted, Easy Apply, and review-time signals.
- Add include/exclude keyword filters for job titles and snippets.
- Hide jobs from specific companies with a company blacklist.
- Add on-page role tags (Backend, Frontend, Data, DevOps, AI/ML, Security, QA, Product, and more).
- Show lightweight company insight chips in the job details pane.

Privacy-first by design:
- No remote API calls for your job data.
- No account scraping or data selling.
- Preferences are saved locally via Chrome storage.

Works on:
- LinkedIn Jobs pages (`linkedin.com/jobs/*`)
- LinkedIn Feed pages where job cards appear (`linkedin.com/feed/*`)
