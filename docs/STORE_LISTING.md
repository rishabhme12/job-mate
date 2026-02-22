# Chrome Web Store listing copy

Use this when filling out the Chrome Web Store dashboard for JobMate.

---

## Single purpose (required field)

**Suggested text:**

JobMate has a single purpose: to improve the LinkedIn Jobs experience by adding on-page filters (e.g. hide viewed/applied jobs, keyword and company filters) and role-type tags plus company insights next to job listings. All processing and storage is on-device; no data is sent to external servers.

---

## Permission justifications (required per permission)

Paste these in the "Justification" fields for each permission in the CWS dashboard.

| Permission   | Justification |
|-------------|----------------|
| **activeTab** | Required so the extension can run on the user’s current tab when they are on LinkedIn jobs. Used only to inject the control bar and filters on LinkedIn job search and feed pages. |
| **scripting** | Required to inject the extension’s UI (control bar, modals, insight panel) and logic only on LinkedIn job and feed URLs. No scripts are run on other sites. |
| **storage**   | Required to save the user’s filter preferences (e.g. hide viewed/applied, keywords, company blacklist) and UI state locally. Data is stored only in the browser via `chrome.storage.local`; it is not sent off-device. |

---

## Privacy practices (dashboard checkboxes)

- **No data collected off-device.** The extension does not send any data to remote servers.
- **Local storage:** Filter and UI preferences are stored locally in the browser.
- **No personal or account data:** We do not collect or transmit LinkedIn account or profile data.

You must provide a **privacy policy URL** in the store. Options:

1. Host `docs/PRIVACY_POLICY.md` as a page (e.g. GitHub Pages, your site) and use that URL.
2. Copy the content of `docs/PRIVACY_POLICY.md` into a single page and use that URL.

The URL must be publicly accessible so reviewers and users can open it.
