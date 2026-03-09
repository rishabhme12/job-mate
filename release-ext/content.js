// JobMate Content Script (v9.1 - Throttled Fixed)

let lastUrl = location.href;
let debounceTimer = null;
let lastClickTime = 0;
let isNavigating = false;
let lastScrapedTitle = '';
let pendingStickyEnable = false;

// --- Performance Utilities ---
function debounce(func, wait) {
    return function () {
        const context = this, args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function findJobListContainers() {
    let containers = Array.from(document.querySelectorAll(
        '.jobs-search-results-list, .scaffold-layout__list, .jobs-search-results, ul.jobs-search__results-list, ul[aria-label*="Search results"]'
    ));

    if (containers.length === 0) {
        const card = document.querySelector('.job-card-container, .jobs-search-results__list-item, [data-occludable-job-id]');
        if (card) {
            const parentList = card.closest('ul') || card.closest('[role="list"]');
            if (parentList) containers = [parentList];
        }
    }

    return containers;
}

// --- Helper: Tagging Logic ---
function getTagClass(tag) {
    const cleanTag = tag.toLowerCase().replace(/\s/g, '-');
    if (cleanTag.includes('backend')) return 'backend';
    if (cleanTag.includes('frontend')) return 'frontend';
    if (cleanTag.includes('fullstack')) return 'fullstack';
    if (cleanTag.includes('data')) return 'data';
    if (cleanTag.includes('devops') || cleanTag.includes('sre')) return 'devops';
    if (cleanTag.includes('ai') || cleanTag.includes('machine') || cleanTag.includes('learning')) return 'ai-ml';
    if (cleanTag.includes('security')) return 'security';
    if (cleanTag.includes('product')) return 'product';
    return 'unknown';
}

function injectTag(titleElement, jobDescription) {
    if (!titleElement) return;

    // Create a simplified signature based on Title Only for the tag
    const jobSignature = titleElement.innerText.trim();
    if (titleElement.dataset.lastJobTagSignature === jobSignature) return;

    const cleanTitle = titleElement.innerText.trim();
    if (!window.KeywordEngine) return;

    const classification = window.KeywordEngine.classify(cleanTitle, cleanTitle + " " + jobDescription);
    if (classification === 'Not Sure' || classification === 'Not a Job') return;

    let tagEl = titleElement.querySelector('.job-mate-tag');
    if (!tagEl) {
        tagEl = document.createElement('span');
        titleElement.appendChild(tagEl);
    }

    tagEl.className = `job-mate-tag ${getTagClass(classification)}`;
    tagEl.innerText = classification;
    titleElement.dataset.lastJobTagSignature = jobSignature;
}

// --- Insight Panel (Granular Loading) ---
const InsightPanel = {
    // Fast Selector Cache
    getTitleElement() {
        // Classic LinkedIn layout
        const classic = document.querySelector('.job-details-jobs-unified-top-card__job-title h1') ||
            document.querySelector('.jobs-unified-top-card__job-title h1') ||
            document.querySelector('h1.t-24');
        if (classic) return classic;

        return document.querySelector('.job-view-layout h1') ||
            document.querySelector('.job-details h1') ||
            document.querySelector('main h1');
    },

    // 1. Instant Shimmer Injection
    showSkeleton(force = false) {
        const titleH1 = this.getTitleElement();
        if (!titleH1) return;

        const container = titleH1.parentElement.parentElement;
        if (!container) return;

        let row = container.querySelector('.job-mate-stats-row');

        // Optimize: If we have a row, handle force logic without destroying DOM
        if (row) {
            // If we are already shimmering, don't touch anything (Stabilize)
            if (row.dataset.state === 'loading') return;

            // If forced (e.g. click), wipe it to prepare for shimmer
            if (force) {
                row.innerHTML = '';
                row.dataset.state = 'loading';
            }
        } else {
            // Create new if missing
            row = document.createElement('div');
            row.className = 'job-mate-stats-row';
            row.dataset.state = 'loading';
            container.appendChild(row);
        }

        // Add Skeletons if empty
        if (row.innerHTML === '') {
            for (let i = 0; i < 3; i++) {
                const skel = document.createElement('span');
                skel.className = 'job-mate-stat-tag job-mate-skeleton';
                skel.style.width = (80 + Math.random() * 40) + 'px'; // Random widths
                row.appendChild(skel);
            }
        }
    },

    // 2. Data Fetch & Render
    run() {
        const titleH1 = this.getTitleElement();
        if (!titleH1) return;

        const currentTitle = titleH1.innerText.trim();

        // Critical: Detection of Stale Content
        if (isNavigating && currentTitle === lastScrapedTitle) {
            this.showSkeleton(true);
            return;
        }

        // Title Changed -> We are live!
        isNavigating = false;
        lastScrapedTitle = currentTitle;

        const layoutType = document.querySelector('.job-details-jobs-unified-top-card__job-title h1') ? 'split' : 'standalone';
        const container = titleH1.parentElement.parentElement;
        if (!container) return;

        let row = container.querySelector('.job-mate-stats-row');
        if (!row) {
            this.showSkeleton();
            row = container.querySelector('.job-mate-stats-row');
        }

        const descriptionEl = document.querySelector('.jobs-description__content') || document.querySelector('#job-details');
        if (!descriptionEl) return;

        const data = this.scrape(layoutType);

        if (data.size === 'N/A' && data.industry === 'N/A' && data.linkedinCount === 'N/A') {
            if (Date.now() - lastClickTime < 2500) {
                setTimeout(() => this.run(), 200);
                return;
            }
        }

        this.render(row, data, currentTitle);
    },

    scrape(layoutType) {
        const data = { industry: 'N/A', size: 'N/A', linkedinCount: 'N/A' };
        let topText = '';

        try {
            const topNode = document.querySelector('.job-details-jobs-unified-top-card__content-wrapper') ||
                document.querySelector('.jobs-unified-top-card__content-wrapper') ||
                document.body;
            topText = topNode ? topNode.innerText : '';
        } catch (e) {
            console.warn('JobMate: Error reading topNode', e);
        }

        const headings = document.getElementsByTagName('h2');
        for (let i = 0; i < headings.length; i++) {
            if (headings[i].innerText.includes('About the company')) {
                const container = headings[i].closest('section') || headings[i].parentElement;
                if (container) {
                    const text = container.innerText;
                    const sizeMatch = text.match(/([\d,]+\+?|[\d,]+-[\d,]+)\s+employees/i);
                    if (sizeMatch) data.size = sizeMatch[0].replace(' employees', '');
                    const liMatch = text.match(/([\d,]+)\s+on\s+LinkedIn/i);
                    if (liMatch) data.linkedinCount = liMatch[1] + " on LI";

                    const lines = text.split('\n').filter(l => l.includes('employees') && l.includes('·'));
                    if (lines.length > 0) data.industry = lines[0].split('·')[0].trim();
                }
                break;
            }
        }

        const lowerText = (topText || '').toLowerCase();
        data.hasActivelyRecruiting = lowerText.includes('actively recruiting');
        data.hasEarlyApplicant = lowerText.includes('early applicant') || lowerText.includes('be one of the first');
        data.hasReviewTime = lowerText.includes('time to hear back') || lowerText.includes('responds within');

        return data;
    },

    render(row, data, signature) {
        row.innerHTML = '';
        row.dataset.state = 'loaded';
        row.dataset.jobSignature = signature;

        const appendTag = (text, type, icon) => {
            if (text && text !== 'N/A') {
                const span = document.createElement('span');
                span.className = `job-mate-stat-tag`;
                span.dataset.type = type;
                span.innerHTML = `<i>${icon}</i>${text}`;
                row.appendChild(span);
            }
        };


        appendTag(data.size, 'company', '🏢');
        appendTag(data.industry, 'industry', '🏭');
        appendTag(data.linkedinCount, 'company', '🔗');

        if (row.innerHTML === '') {
            appendTag('Scanning...', 'company', '⏳');
        }

        // Detail warning chips disabled by request.
    }
};

// --- Click Listener for Instant Feedback ---
function setupClickListeners() {
    document.addEventListener('click', (e) => {
        const jobCard = e.target.closest('.job-card-container') ||
            e.target.closest('.jobs-search-results__list-item');

        if (jobCard) {
            isNavigating = true;
            lastClickTime = Date.now();
            console.log("JobMate: Click detected");
            if (window.jmFilterEngine && typeof window.jmFilterEngine.getJobId === 'function') {
                const jobId = window.jmFilterEngine.getJobId(jobCard);
                window.jmFilterEngine.setSessionViewed(jobId);
            }

            const rightPaneTitle = InsightPanel.getTitleElement();
            if (rightPaneTitle) {
                lastScrapedTitle = rightPaneTitle.innerText.trim();

                // 1. Wipe Stats Row
                const row = rightPaneTitle.parentElement.parentElement.querySelector('.job-mate-stats-row');
                if (row) {
                    row.innerHTML = '';
                    InsightPanel.showSkeleton(true);
                }

                // 2. Wipe Role Tag (Fixes Flash/Jump)
                const oldTag = rightPaneTitle.querySelector('.job-mate-tag');
                if (oldTag) oldTag.remove();
            }
        }
    }, true);
}

// --- Main Coordinator ---
const JobMate = {
    _timerSet: false,

    handleMutation() {
        // Enforce 1s Layout Stabilization (Covers User's "Jerky" request)
        const elapsed = Date.now() - lastClickTime;
        if (elapsed < 1000) {
            InsightPanel.showSkeleton();

            if (!this._timerSet) {
                this._timerSet = true;
                setTimeout(() => {
                    this._timerSet = false;
                    JobMate.handleMutation();
                }, 1000 - elapsed + 20);
            }
            return;
        }

        const titleEl = InsightPanel.getTitleElement();
        if (titleEl) {
            const desc = document.querySelector('.jobs-description__content');
            if (desc) injectTag(titleEl, desc.innerText);
            InsightPanel.run();
        }
    }
};

// --- Init ---
// --- Init ---
setupClickListeners();

// Initialize Modules
const jmStorage = JobMateStorage;
const jmFilterEngine = new FilterEngine();
window.jmFilterEngine = jmFilterEngine; // Expose for InsightPanel
const jmControlBar = new JobMateControlBar(jmStorage, jmFilterEngine);

let injectionInterval = null;

function ensureInjectedWithRetry() {
    if (document.getElementById('job-mate-control-bar')) {
        jmControlBar.updateSearchButtonState();
        jmControlBar.updatePageButtonState();
        return true;
    }

    let injected = jmControlBar.inject();
    if (injected) {
        // Ensure state is updated if injected immediately
        jmControlBar.updateSearchButtonState();
        jmControlBar.updatePageButtonState();
        return true;
    }

    // Keep an existing retry loop running; don't reset it on every mutation.
    if (injectionInterval) return false;

    let attempts = 0;
    injectionInterval = setInterval(() => {
        attempts++;
        injected = jmControlBar.inject();
        if (injected || attempts > 240) { // 240 * 500ms = 120s
            clearInterval(injectionInterval);
            injectionInterval = null;
            if (injected) {
                jmControlBar.updateSearchButtonState();
                jmControlBar.updatePageButtonState();
                console.log("JobMate: Injection successful after retry.");
            }
        }
    }, 500);

    return false;
}

function handleUrlChange() {
    if (!window.location.href.includes('/jobs/')) return;
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        if (window.jmFilterEngine) {
            window.jmFilterEngine.setStickyViewedApplied(false);
            window.jmFilterEngine.clearSessionViewed();
            pendingStickyEnable = true;
        }
    }
    ensureInjectedWithRetry();
    JobMate.handleMutation();
}

// Start UI with robust retry logic
// LinkedIn often lazily loads the filter bar. We need to wait for it.
(async function initJobMate() {
    await jmControlBar.init();
    // Delay first injection attempt to let LinkedIn stabilize
    setTimeout(() => {
        ensureInjectedWithRetry();
    }, 1500);
    // Ensure tags/filters run on first page load even without additional DOM mutations.
    JobMate.handleMutation();
    setTimeout(() => JobMate.handleMutation(), 1000);
    setTimeout(() => JobMate.handleMutation(), 3000);
})();

// LinkedIn uses SPA navigation paths that may not always trigger useful mutations quickly.
window.addEventListener('popstate', handleUrlChange);
const _jmPushState = history.pushState;
history.pushState = function () {
    const res = _jmPushState.apply(this, arguments);
    setTimeout(handleUrlChange, 0);
    return res;
};
const _jmReplaceState = history.replaceState;
history.replaceState = function () {
    const res = _jmReplaceState.apply(this, arguments);
    setTimeout(handleUrlChange, 0);
    return res;
};

const runDebounced = debounce(() => JobMate.handleMutation(), 200);
const runThrottled = throttle(() => JobMate.handleMutation(), 100);

const observer = new MutationObserver((mutations) => {
    if (!window.location.href.includes('/jobs/')) return;

    if (window.location.href !== lastUrl) {
        handleUrlChange();
    }

    if (Date.now() - lastClickTime < 2500) {
        runThrottled();
    } else {
        runDebounced();
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Override handleMutation to also run filters
const originalHandleMutation = JobMate.handleMutation;
JobMate.handleMutation = function () {
    // Run original logic (Insight Panel)
    originalHandleMutation.call(JobMate);

    // Run Filter Logic
    // OPTIMIZATION: Do not run filters if user just clicked (navigation).
    // This prevents the job from vanishing immediately when "Hide Viewed" is ON.
    if (Date.now() - lastClickTime > 1500 && !isNavigating) {
        const listContainers = findJobListContainers();
        listContainers.forEach(container => {
            jmFilterEngine.applyFilters(container);
        });
    }
    if (pendingStickyEnable) {
        jmFilterEngine.setStickyViewedApplied(true);
        pendingStickyEnable = false;
    }

    // Attempt Injection (Reactive)
    ensureInjectedWithRetry();

    // Ensure button states match current URL/Settings (Fixes SPA navigation issues)
    jmControlBar.updateSearchButtonState();
    jmControlBar.updatePageButtonState();
};

console.log("JobMate: Content Script (v10.2 Dual Modals) Ready");
