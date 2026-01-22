// JobMate Content Script

let processing = new WeakSet();

function getTagClass(tag) {
    const map = {
        'Backend': 'backend',
        'Frontend': 'frontend',
        'Fullstack': 'fullstack',
        'Mobile': 'mobile',
        'Data': 'data',
        'DevOps': 'devops',
        'Cloud': 'cloud',
        'Security': 'security',
        'AI/ML': 'ai-ml',
        'QA': 'qa',
        'Product Manager': 'product',
        'Non-Engineering': 'unknown',
        'Not Sure': 'unknown',
        'Not a Job': 'not-job'
    };
    return map[tag] || 'unknown';
}

// Stronger de-duplication
function injectTag(titleElement, jobDescription) {
    // 1. Check if we are already processing this specific DOM node
    if (processing.has(titleElement)) return;

    // 2. Check if it already HAS a tag (finished or loading)
    if (titleElement.querySelector('.job-mate-tag')) return;

    // 3. Signature check (incase DOM node was recycled but text is same)
    const jobSignature = (titleElement.innerText + jobDescription.substring(0, 50)).replace(/\s/g, '');
    if (titleElement.dataset.lastJobSignature === jobSignature) return;

    // Lock it
    processing.add(titleElement);
    titleElement.dataset.lastJobSignature = jobSignature;

    const tagEl = document.createElement('span');
    tagEl.className = 'job-mate-tag loading';
    tagEl.innerText = 'Analyzing...';
    titleElement.appendChild(tagEl);

    const fullText = titleElement.innerText + "\n" + jobDescription;

    console.log("JobMate: Requesting classification for", titleElement.innerText);
    chrome.runtime.sendMessage({ action: 'classify', text: fullText }, (response) => {
        // Release the lock when processing is complete (or errors)
        processing.delete(titleElement);

        // Check for runtime errors (like channel closed)
        if (chrome.runtime.lastError) {
            console.error("JobMate Error:", chrome.runtime.lastError.message);
            tagEl.innerText = 'Error';
            tagEl.title = chrome.runtime.lastError.message;
            tagEl.classList.add('time-out');
            return;
        }

        console.log("JobMate: Received response", response);
        const classification = response && response.result ? response.result : 'Error';

        if (classification === 'Not a Job') {
            tagEl.remove();
            return;
        }

        tagEl.innerText = classification;
        tagEl.classList.remove('loading');
        tagEl.classList.add(getTagClass(classification));
    });
}

// === Strategy for Job View Page ===
function handleJobViewPage() {
    // Standardize on the H1
    const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title h1');
    const descriptionEl = document.querySelector('.jobs-description__content');

    if (titleEl && descriptionEl) {
        // LinkedIn often puts the full text in a span inside .jobs-description__content, 
        // or it might be truncated with a "See more" button.
        // However, for classification, the first ~20 lines are usually enough.
        // We won't force-click "See more" to avoid disrupting user layout, 
        // unless we find the text is extremely short (< 100 chars).

        const descText = descriptionEl.innerText;
        if (descText.length > 50) {
            injectTag(titleEl, descText);
        }
    }
}


// === Strategy for Job List / Search Page (Right rail view) ===
function handleJobSearchPage() {
    const detailContainer = document.querySelector('.jobs-search__job-details--container');
    if (!detailContainer) return;

    // Consistency: Get the H1, irrelevant of whether it has an 'a' tag inside
    const titleEl = detailContainer.querySelector('.job-details-jobs-unified-top-card__job-title h1');

    // Description is in a separate container
    const descriptionEl = detailContainer.querySelector('.jobs-description__content');

    if (titleEl && descriptionEl) {
        const descText = descriptionEl.innerText;
        // Same logic: use what we have, usually enough for a classification
        if (descText.length > 50) {
            injectTag(titleEl, descText);
        }
    }
}

// === Main Observer ===
// Monitor for DOM changes because LinkedIn is an SPA
const observer = new MutationObserver((mutations) => {
    // Debounce or just run checks? LinkedIn is chatty. Simple check is fine.

    // Check if we are on a page where we want to act
    if (window.location.href.includes('/jobs/')) {
        handleJobViewPage();
        handleJobSearchPage();
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial check
if (window.location.href.includes('/jobs/')) {
    setTimeout(handleJobViewPage, 2000); // Give it a sec to settle
    setTimeout(handleJobSearchPage, 2000);
}
console.log("JobMate: Content Script Loaded");
