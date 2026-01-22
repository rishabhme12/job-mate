// JobMate Content Script

let processing = new WeakSet();
let lastUrl = location.href;

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
        'Product': 'product',
        'Non-Engineering': 'unknown',
        'Not Sure': 'unknown',
        'Not a Job': 'not-job'
    };
    return map[tag] || 'unknown';
}



function injectTag(titleElement, jobDescription) {
    // 1. Basic Locks
    if (processing.has(titleElement)) return;

    // 3. Signature check
    const jobSignature = (titleElement.innerText + jobDescription.substring(0, 50)).replace(/\s/g, '');
    if (titleElement.dataset.lastJobSignature === jobSignature) return;

    // Clear stale tag
    const oldTag = titleElement.querySelector('.job-mate-tag');
    if (oldTag) oldTag.remove();

    // 4. Capture Text BEFORE modifying DOM (CRITICAL FIX)
    const cleanTitle = titleElement.innerText.trim();
    const fullText = cleanTitle + "\n" + jobDescription;

    // Lock and Mark
    processing.add(titleElement);
    titleElement.dataset.lastJobSignature = jobSignature;

    // Synchronous Classification (Instant)
    const classification = window.KeywordEngine.classify(cleanTitle, fullText);

    // Remove temporary lock immediately since we are done
    processing.delete(titleElement);

    if (classification === 'Not Sure' || classification === 'Not a Job') {
        // Optional: Show nothing if not sure, or show '?'
        if (oldTag) oldTag.remove();
        return;
    }

    // 5. Add/Update UI
    let tagEl = titleElement.querySelector('.job-mate-tag');
    if (!tagEl) {
        tagEl = document.createElement('span');
        tagEl.className = 'job-mate-tag';
        titleElement.appendChild(tagEl);
    }

    tagEl.innerText = classification;
    tagEl.className = `job-mate-tag ${getTagClass(classification)}`;
    tagEl.classList.remove('loading'); // Just in case
}

// === Strategy for Job View Page ===
function handleJobViewPage() {
    const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title h1');
    const descriptionEl = document.querySelector('.jobs-description__content');

    if (titleEl && descriptionEl) {
        const descText = descriptionEl.innerText;
        if (descText.length > 50) {
            injectTag(titleEl, descText);
        }
    }
}

// === Strategy for Job List / Search Page ===
function handleJobSearchPage() {
    const detailContainer = document.querySelector('.jobs-search__job-details--container');
    if (!detailContainer) return;

    const titleEl = detailContainer.querySelector('.job-details-jobs-unified-top-card__job-title h1');
    const descriptionEl = detailContainer.querySelector('.jobs-description__content');

    if (titleEl && descriptionEl) {
        const descText = descriptionEl.innerText;
        if (descText.length > 50) {
            injectTag(titleEl, descText);
        }
    }
}

// === Main Observer ===
const observer = new MutationObserver((mutations) => {
    // 1. Detect URL Change
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log("JobMate: URL Changed");
        setTimeout(handleJobViewPage, 1000);
        setTimeout(handleJobSearchPage, 1000);
    }

    // 2. DOM Changes
    if (window.location.href.includes('/jobs/')) {
        handleJobViewPage();
        handleJobSearchPage();
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial check
if (window.location.href.includes('/jobs/')) {
    setTimeout(handleJobViewPage, 2000);
    setTimeout(handleJobSearchPage, 2000);
}
console.log("JobMate: Content Script Loaded (Clean Build)");
