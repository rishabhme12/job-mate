// JobMate Content Script (v9.1 - Throttled Fixed)

let lastUrl = location.href;
let debounceTimer = null;
let lastClickTime = 0;
let isNavigating = false;
let lastScrapedTitle = '';

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
        return document.querySelector('.job-details-jobs-unified-top-card__job-title h1') ||
            document.querySelector('.jobs-unified-top-card__job-title h1') ||
            document.querySelector('h1.t-24');
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
        const lowerText = topText.toLowerCase();
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

        // Lazy Filter Validation
        if (window.jmFilterEngine) {
            const check = window.jmFilterEngine.checkDetail(data);
            if (!check.pass) {
                const errorSpan = document.createElement('span');
                errorSpan.className = 'job-mate-stat-tag';
                // Inline styles for high visibility error
                errorSpan.style.backgroundColor = '#fff0f0';
                errorSpan.style.color = '#d32f2f';
                errorSpan.style.border = '1px solid #d32f2f';
                errorSpan.innerText = `⚠️ ${check.reason}`;
                row.appendChild(errorSpan);
            }
        }
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

            const rightPaneTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title h1');
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

// Start UI with robust retry logic
// LinkedIn often lazily loads the filter bar. We need to wait for it.
(async function initJobMate() {
    await jmControlBar.init();

    // Initial Attempt
    let injected = jmControlBar.inject();

    // Retry Loop (up to 10 seconds)
    if (!injected) {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            injected = jmControlBar.inject();
            if (injected || attempts > 20) { // 20 * 500ms = 10s
                clearInterval(interval);
                if (injected) console.log("JobMate: Injection successful after retry.");
            }
        }, 500);
    }
})();

const runDebounced = debounce(() => JobMate.handleMutation(), 200);
const runThrottled = throttle(() => JobMate.handleMutation(), 100);

const observer = new MutationObserver((mutations) => {
    if (!window.location.href.includes('/jobs/')) return;

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
        const listContainers = document.querySelectorAll('.jobs-search-results-list, .scaffold-layout__list, .jobs-search-results, ul.jobs-search__results-list');
        listContainers.forEach(container => {
            jmFilterEngine.applyFilters(container);
        });
    }

    // Attempt Injection (Reactive)
    jmControlBar.inject();
};

console.log("JobMate: Content Script (v10.1 Event-Driven) Loaded");
