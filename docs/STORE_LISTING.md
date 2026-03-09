# Chrome Web Store listing copy

Use this when filling out the Chrome Web Store dashboard for Jobs Hero.

---

## Additional fields (Dashboard)

- **Homepage URL:** `https://github.com/rishabhme12/job-mate`
- **Support URL:** `https://github.com/rishabhme12/job-mate/issues`
- **Privacy policy URL:** `https://rishabhme12.github.io/job-mate/privacy-policy.html`
- **Official URL:** `None` (optional unless you want Search Console ownership verification)

---

## Single purpose (required field)

**Suggested text:**

Jobs Hero has a single purpose: to improve the LinkedIn Jobs experience by adding on-page filters (e.g. hide viewed/applied jobs, keyword and company filters) plus role-type tags and company insight chips directly in the jobs UI. All processing and storage is on-device; no data is sent to external servers.

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

Use this **privacy policy URL** in CWS:

`https://rishabhme12.github.io/job-mate/privacy-policy.html`

It must remain publicly accessible so reviewers and users can open it.

---

## Suggested Store Description

Use this as a baseline long description and customize as needed.

Jobs Hero helps you triage LinkedIn job search faster with practical filters and role tagging directly on the page.

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
