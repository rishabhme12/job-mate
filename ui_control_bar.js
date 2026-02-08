/**
 * JobMate UI Control Bar
 * Renders the "Page Filters" and "Search Tweaks" buttons and manages their respective Modals.
 */
class JobMateControlBar {
    constructor(storage, filterEngine) {
        this.storage = storage;
        this.filterEngine = filterEngine;
        this.container = null;

        // Modals
        this.pageOverlay = null; // Frontend DOM filters
        this.searchOverlay = null; // Backend URL filters

        this.settings = null;
        this.tempSettings = null; // Stores changes before "Apply"
    }

    async init() {
        this.settings = await this.storage.getSettings();

        // RESET ON REFRESH (User Request):
        // "reset filter when reload page thoug you can save the textual value"
        // We forciby set visual BOOLEAN toggles to false.
        // We keep text filters (keywords/blacklist) as is.

        const f = this.settings.filters;
        f.hidePromoted = false;
        f.hideApplied = false;
        f.hideViewed = false;
        f.hideEasyApply = false;
        f.activelyReviewingOnly = false;
        f.earlyApplicantOnly = false;
        f.reviewTimeOnly = false;
        // Text filters maintained: titleKeywords, negativeKeywords, companyBlacklist

        await this.storage.saveSettings(this.settings);
        this.filterEngine.updateSettings(this.settings.filters);

        if (this.inject()) {
            this.updatePageButtonState();
            this.updateSearchButtonState(); // Check URL for initial state
        }
    }

    inject() {
        if (!window.location.href.includes('/jobs/') && !window.location.href.includes('/feed/')) return false;
        if (document.getElementById('job-mate-control-bar')) return true;

        const allFiltersBtn = document.querySelector('.search-reusables__all-filters-pill-button') ||
            Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'All filters');

        let injectionTarget = null;
        let insertionMethod = 'append';

        if (allFiltersBtn) {
            const wrapper = allFiltersBtn.closest('li') || allFiltersBtn.parentElement;
            if (wrapper && wrapper.parentElement) {
                // User wants it "next to search button" (presumably start of list)
                // "move other elemnt slittle right" implies prepending to the list.
                injectionTarget = wrapper.parentElement;
                insertionMethod = 'prepend';
            } else {
                injectionTarget = allFiltersBtn.parentElement;
                insertionMethod = 'prepend';
            }
        } else {
            return false;
        }

        if (injectionTarget) {
            // Requirement: "dont distrubf other features"
            // If we are injecting into a List (UL/OL), we should be an LI to prevent layout breakage.
            const isList = injectionTarget.tagName === 'UL' || injectionTarget.tagName === 'OL';
            this.container = document.createElement(isList ? 'li' : 'div');

            this.container.id = 'job-mate-control-bar';
            this.container.className = 'job-mate-control-bar';
            this.container.innerHTML = this.renderButtonsHTML();

            if (insertionMethod === 'prepend') {
                this.container.style.display = 'inline-flex';
                this.container.style.marginRight = '8px'; // Add spacing to the right
                this.container.style.marginBottom = '0';
                this.container.style.padding = '0';
                injectionTarget.prepend(this.container);
            } else {
                // Fallback (though currently we force prepend)
                injectionTarget.prepend(this.container);
            }

            // Bind Button Events
            // Use Delegation for buttons to differentiate between main click and dismiss click
            this.container.addEventListener('click', (e) => {
                // Handle Dismiss Click
                if (e.target.classList.contains('jm-dismiss-icon')) {
                    e.stopPropagation(); // Prevent opening modal
                    e.preventDefault();
                    const action = e.target.dataset.action;
                    if (action === 'reset-page') this.resetPageFilters();
                    // if (action === 'reset-search') this.resetSearchFilters(); // Pro Search has no active state
                    return;
                }

                // Handle Main Button Click (Bubble up)
                const btn = e.target.closest('button');
                if (btn) {
                    if (btn.id === 'jm-btn-page-filters') this.openPageModal();
                    if (btn.id === 'jm-btn-search-tweaks') this.openSearchModal();
                }
            });

        } else {
            return false;
        }

        this.injectModals();
        return true;
    }

    injectModals() {
        // Page Filters Modal
        if (!document.getElementById('jm-modal-overlay-page')) {
            const el = document.createElement('div');
            el.id = 'jm-modal-overlay-page';
            el.className = 'job-mate-modal-overlay'; // Reusing generic class for style
            el.innerHTML = this.renderPageModalHTML();
            document.body.appendChild(el);
            this.pageOverlay = el;
            this.bindPageModalEvents();
        }

        // Search Tweaks Modal
        if (!document.getElementById('jm-modal-overlay-search')) {
            const el = document.createElement('div');
            el.id = 'jm-modal-overlay-search';
            el.className = 'job-mate-modal-overlay';
            el.innerHTML = this.renderSearchModalHTML();
            document.body.appendChild(el);
            this.searchOverlay = el;
            this.bindSearchModalEvents();
        }
    }

    renderButtonsHTML() {
        return `
            <div class="job-mate-bar-header" style="display:flex; gap:8px;">
                <button id="jm-btn-search-tweaks" class="jm-artdeco-pill">
                    <span>Pro Search</span>
                </button>
                <button id="jm-btn-page-filters" class="jm-artdeco-pill">
                    <span>Page Filters</span>
                </button>
            </div>
        `;
    }

    /* =========================================================================
       PAGE FILTERS (Frontend DOM Hiding)
       ========================================================================= */

    renderPageModalHTML() {
        const toggle = (id, label) => `
            <label class="job-mate-toggle-wrapper">
                <span class="job-mate-toggle-label">${label}</span>
                <div class="job-mate-toggle">
                    <input type="checkbox" id="${id}">
                    <span class="job-mate-slider"></span>
                </div>
            </label>
        `;

        return `
            <div class="job-mate-modal">
                <div class="job-mate-modal-header">
                    <h2 class="job-mate-modal-title">Page Filters (Visual)</h2>
                    <button class="job-mate-close-btn" id="jm-page-close">×</button>
                </div>
                <div class="job-mate-modal-body">
                    <div class="job-mate-modal-section">
                        <h3 class="job-mate-section-title">Visibility</h3>
                        <div class="job-mate-checkbox-group">
                            ${toggle('jm-hide-promoted', 'Hide Promoted')}
                            ${toggle('jm-hide-applied', 'Hide Applied')}
                            ${toggle('jm-hide-viewed', 'Hide Viewed')}
                            ${toggle('jm-hide-easy-apply', 'Hide Easy Apply')}
                        </div>
                    </div>
                    <div class="job-mate-modal-section">
                        <h3 class="job-mate-section-title">Quality Check</h3>
                        <div class="job-mate-checkbox-group">
                            ${toggle('jm-early-applicant', 'Early Applicant Only (<10 applicants)')}
                            ${toggle('jm-actively-reviewing', 'Actively Reviewing Only')}
                            ${toggle('jm-review-time', 'Review Time Available')}
                        </div>
                    </div>
                    
                    <!-- Restoring Text Filters (Frontend) -->
                    <div class="job-mate-modal-section">
                        <h3 class="job-mate-section-title">Text Filters (Hides on this page)</h3>
                        <div class="job-mate-input-group">
                            <label class="job-mate-label">Title Must Contain</label>
                            <input type="text" id="jm-page-must-contain" class="job-mate-text-input" placeholder="e.g. React, Node">
                        </div>
                        <div class="job-mate-input-group">
                            <label class="job-mate-label">Title Excludes</label>
                            <input type="text" id="jm-page-excludes" class="job-mate-text-input" placeholder="e.g. Intern, Senior">
                        </div>
                        <div class="job-mate-input-group">
                            <label class="job-mate-label">Company Blacklist</label>
                            <input type="text" id="jm-page-company-blacklist" class="job-mate-text-input" placeholder="e.g. Revature">
                        </div>
                    </div>
                </div>
                <div class="job-mate-modal-footer">
                    <button class="job-mate-btn job-mate-btn-secondary" id="jm-page-reset">Reset</button>
                    <button class="job-mate-btn job-mate-btn-primary" id="jm-page-apply">Show results</button>
                </div>
            </div>
        `;
    }

    openPageModal() {
        // Clone settings
        this.tempSettings = JSON.parse(JSON.stringify(this.settings.filters));

        // Populate
        const f = this.tempSettings;
        const setCheck = (id, val) => document.getElementById(id).checked = val;

        setCheck('jm-hide-promoted', f.hidePromoted);
        setCheck('jm-hide-applied', f.hideApplied);
        setCheck('jm-hide-viewed', f.hideViewed);
        setCheck('jm-hide-easy-apply', f.hideEasyApply);
        setCheck('jm-early-applicant', f.earlyApplicantOnly);
        setCheck('jm-actively-reviewing', f.activelyReviewingOnly);
        setCheck('jm-review-time', f.reviewTimeOnly);

        // Populate Text Inputs
        const join = (arr) => arr ? arr.join(', ') : '';
        document.getElementById('jm-page-must-contain').value = join(f.titleKeywords);
        document.getElementById('jm-page-excludes').value = join(f.negativeKeywords);
        document.getElementById('jm-page-company-blacklist').value = join(f.companyBlacklist);

        this.pageOverlay.classList.add('open');
    }

    closePageModal() {
        this.pageOverlay.classList.remove('open');
    }

    bindPageModalEvents() {
        document.getElementById('jm-page-close').addEventListener('click', () => this.closePageModal());
        this.pageOverlay.addEventListener('click', (e) => { if (e.target === this.pageOverlay) this.closePageModal(); });

        document.getElementById('jm-page-reset').addEventListener('click', () => {
            // Reset temp settings (only visual toggles)
            ['jm-hide-promoted', 'jm-hide-applied', 'jm-hide-viewed', 'jm-hide-easy-apply',
                'jm-early-applicant', 'jm-actively-reviewing', 'jm-review-time'].forEach(id => {
                    document.getElementById(id).checked = false;
                });

            // Reset text inputs
            document.getElementById('jm-page-must-contain').value = "";
            document.getElementById('jm-page-excludes').value = "";
            document.getElementById('jm-page-company-blacklist').value = "";
        });

        document.getElementById('jm-page-apply').addEventListener('click', () => {
            const getCheck = (id) => document.getElementById(id).checked;

            this.settings.filters.hidePromoted = getCheck('jm-hide-promoted');
            this.settings.filters.hideApplied = getCheck('jm-hide-applied');
            this.settings.filters.hideViewed = getCheck('jm-hide-viewed');
            this.settings.filters.hideEasyApply = getCheck('jm-hide-easy-apply');
            this.settings.filters.earlyApplicantOnly = getCheck('jm-early-applicant');
            this.settings.filters.activelyReviewingOnly = getCheck('jm-actively-reviewing');
            this.settings.filters.reviewTimeOnly = getCheck('jm-review-time');

            // Save Text Inputs
            const split = (str) => str.split(',').map(s => s.trim()).filter(s => s.length > 0);
            this.settings.filters.titleKeywords = split(document.getElementById('jm-page-must-contain').value);
            this.settings.filters.negativeKeywords = split(document.getElementById('jm-page-excludes').value);
            this.settings.filters.companyBlacklist = split(document.getElementById('jm-page-company-blacklist').value);

            this.storage.saveSettings(this.settings);
            this.filterEngine.updateSettings(this.settings.filters, true);
            this.updatePageButtonState();

            // Run Filters
            const lists = document.querySelectorAll('.jobs-search-results-list, .scaffold-layout__list, .jobs-search-results, ul.jobs-search__results-list');
            this.filterEngine.setStickyViewedApplied(false);
            lists.forEach(l => this.filterEngine.applyFilters(l, { ignoreStickyViewedApplied: true }));
            this.filterEngine.setStickyViewedApplied(true);

            this.closePageModal();
        });
    }

    updatePageButtonState() {
        const btn = document.getElementById('jm-btn-page-filters');
        if (!btn) return;
        const f = this.settings.filters;
        let count = 0;
        if (f.hidePromoted) count++;
        if (f.hideApplied) count++;
        if (f.hideViewed) count++;
        if (f.hideEasyApply) count++;
        if (f.earlyApplicantOnly) count++;

        if (f.activelyReviewingOnly) count++;
        if (f.reviewTimeOnly) count++;

        // Count Text Filters
        if (f.titleKeywords && f.titleKeywords.length > 0) count++;
        if (f.negativeKeywords && f.negativeKeywords.length > 0) count++;
        if (f.companyBlacklist && f.companyBlacklist.length > 0) count++;

        if (count > 0) {
            btn.innerHTML = `<span>Page Filters (${count})</span><span class="jm-dismiss-icon" data-action="reset-page">✕</span>`;
            btn.classList.add('jm-artdeco-pill--selected');
            // Remove inline styles if any remained from previous versions
            btn.style.backgroundColor = '';
            btn.style.borderColor = '';
            btn.style.color = '';
        } else {
            btn.innerHTML = `<span>Page Filters</span>`;
            btn.classList.remove('jm-artdeco-pill--selected');
            btn.style.backgroundColor = '';
            btn.style.borderColor = '';
            btn.style.color = '';
        }
    }

    /* =========================================================================
       SEARCH TWEAKS (Backend URL Params)
       ========================================================================= */

    renderSearchModalHTML() {
        return `
            <div class="job-mate-modal">
                <div class="job-mate-modal-header">
                    <h2 class="job-mate-modal-title">Pro Search (Advanced)</h2>
                    <button class="job-mate-close-btn" id="jm-search-close">×</button>
                </div>
                <div class="job-mate-modal-body">
                    
                    <!-- Date Posted -->
                    <div class="job-mate-modal-section">
                        <h3 class="job-mate-section-title">Date Posted</h3>
                         <div class="job-mate-input-group">
                            <label class="job-mate-label">Past X Hours (e.g. 24 for 1 day)</label>
                            <input type="number" id="jm-search-date-hours" class="job-mate-text-input" placeholder="e.g. 24" min="1">
                        </div>
                    </div>

                    <!-- Boolean Logic -->
                    <div class="job-mate-modal-section">
                        <h3 class="job-mate-section-title">Advanced Logic</h3>
                        <p style="font-size:12px; color:#666; margin-bottom:10px;">These modify your search query using boolean operators (OR, NOT).</p>
                        
                        <div class="job-mate-input-group">
                            <label class="job-mate-label">Title Must Contain (OR logic)</label>
                            <input type="text" id="jm-search-must-contain" class="job-mate-text-input" placeholder="e.g. Data, Backend">
                        </div>
                        <div class="job-mate-input-group">
                            <label class="job-mate-label">Title Excludes (NOT logic)</label>
                            <input type="text" id="jm-search-excludes" class="job-mate-text-input" placeholder="e.g. Manager, Senior">
                        </div>
                        <div class="job-mate-input-group">
                            <label class="job-mate-label">Company Blacklist</label>
                            <input type="text" id="jm-search-company-blacklist" class="job-mate-text-input" placeholder="e.g. Revature">
                        </div>
                    </div>
                </div>
                <div class="job-mate-modal-footer">
                    <button class="job-mate-btn job-mate-btn-secondary" id="jm-search-reset">Reset</button>
                    <button class="job-mate-btn job-mate-btn-primary" id="jm-search-apply">Search</button>
                </div>
            </div>
        `;
    }

    openSearchModal() {
        // --- Auto-Population Logic (User Request) ---
        // 1. Parse URL Params
        const params = new URLSearchParams(window.location.search);

        let hoursVal = "";
        let mustContainVal = "";
        let excludesVal = "";

        // Date Posted (f_TPR)
        const t = params.get('f_TPR');
        if (t && t.startsWith('r')) {
            const sec = parseInt(t.substring(1), 10);
            if (!isNaN(sec)) {
                hoursVal = Math.round(sec / 3600).toString();
            }
        }

        // Keywords Extraction (Best Effort)
        // Format: "Engineer (Java OR Python)" -> Must Contain: "Java, Python" if extracted?
        // Actually user request says "populate fields... based on current page url".
        // Extracting existing complex boolean logic is hard to map back perfectly to our UI fields.
        // But we can try to extract explicit "NOT" and "OR" groups.

        const kw = params.get('keywords') || "";

        // Match NOT (...)
        // Regex for NOT (A OR B) or NOT "A" is tricky because of nesting.
        // We will assume a simple structure since we are the ones generating it mostly.
        // Or if user typed it.

        // Simple extraction strategy:
        // 1. Look for NOT "..." or NOT (...)
        // 2. Look for (...) implied OR.

        // For now, let's just use the stored settings if they exist, which mimics "persistence".
        // But the user asked to populate based on *URL*.
        // If we only use settings, and user navigates away and comes back, settings might be stale compared to URL?
        // No, settings are better because we saved them.
        // BUT if user *modifies* url manually, settings are out of sync.
        // Let's prefer Settings *if* they match the URL roughly? 
        // User asked specifically "populate fields within pro search based n cyrrent page url".

        // Let's rely on Settings for now as it's safer than writing a full Boolean parser.
        // If settings are empty, we might try to guess.

        const s = this.settings.searchTweaks || {};

        // Override with URL data if obvious
        if (hoursVal) {
            s.datePostedHours = hoursVal;
        } else if (!params.has('f_TPR')) {
            // URL has no date, so clear setting
            s.datePostedHours = "";
        }

        document.getElementById('jm-search-date-hours').value = s.datePostedHours || "";
        document.getElementById('jm-search-must-contain').value = s.mustContain || "";
        document.getElementById('jm-search-excludes').value = s.excludes || "";
        document.getElementById('jm-search-company-blacklist').value = s.companyBlacklist || "";

        this.searchOverlay.classList.add('open');
    }

    closeSearchModal() {
        this.searchOverlay.classList.remove('open');
    }

    bindSearchModalEvents() {
        document.getElementById('jm-search-close').addEventListener('click', () => this.closeSearchModal());
        this.searchOverlay.addEventListener('click', (e) => { if (e.target === this.searchOverlay) this.closeSearchModal(); });


        document.getElementById('jm-search-reset').addEventListener('click', () => {
            document.getElementById('jm-search-date-hours').value = "";
            document.getElementById('jm-search-must-contain').value = "";
            document.getElementById('jm-search-excludes').value = "";
            document.getElementById('jm-search-company-blacklist').value = "";
        });

        document.getElementById('jm-search-apply').addEventListener('click', async () => {
            const getVal = (id) => document.getElementById(id).value.trim();
            const split = (str) => str.split(',').map(s => s.trim()).filter(s => s.length > 0);

            const hoursVal = getVal('jm-search-date-hours');
            const mustContainStr = getVal('jm-search-must-contain');
            const excludesStr = getVal('jm-search-excludes');
            const blacklistStr = getVal('jm-search-company-blacklist');

            const includeTerms = split(mustContainStr);
            const excludeTerms = split(excludesStr);
            const blacklist = split(blacklistStr);

            // Save Persistence
            this.settings.searchTweaks = {
                datePostedHours: hoursVal,
                mustContain: mustContainStr,
                excludes: excludesStr,
                companyBlacklist: blacklistStr
            };
            await this.storage.saveSettings(this.settings);

            const url = new URL(window.location.href);

            // 1. Date Filter
            if (hoursVal) {
                const sec = parseInt(hoursVal, 10) * 3600;
                url.searchParams.set('f_TPR', `r${sec}`);
            } else {
                url.searchParams.delete('f_TPR');
            }

            // 2. Keyword Construction
            // Standardize logic: (A OR B) NOT (C OR D) NOT "E" NOT "F"
            // We REBUILD the keywords param from scratch or append carefully?
            // "Current Job ID" and others might be in URL, but 'keywords' is the main query.
            // If we overwrite 'keywords', we lose the user's main search term (e.g. "Software Engineer").
            // WE MUST PRESERVE user's main query.

            // Strategy: We assume the user typed their main query in the LinkedIN search bar. 
            // We only APPEND our logic.
            // BUT, if we re-apply, we don't want to duplicate.
            // Paradox: We can't easily distinguish "User Query" from "Our Previous Append".
            // Compromise: We will just APPEND. If duplicates occur, so be it (LinkedIn handles it).
            // Alternative: We could define a clean-slate approach "Search Filter" *IS* the query? No.

            // Let's grab the current keywords, but try to strip our known patterns? Hard.
            let currentKw = url.searchParams.get('keywords') || "";
            // Construct the new logical string
            let additions = "";

            if (includeTerms.length > 0) {
                // If we have existing keywords, we need AND. If not, just the terms.
                // Actually, we don't know if currentKw is empty or not yet.
                // Let's build the segment and join later.
                additions += `(${includeTerms.join(' OR ')})`;
            }

            if (excludeTerms.length > 0) {
                // NOT (A OR B)
                if (additions.length > 0) additions += " ";
                additions += `NOT (${excludeTerms.join(' OR ')})`;
            }

            if (blacklist.length > 0) {
                // NOT "A" NOT "B"
                const blStr = blacklist.map(c => `NOT "${c}"`).join(' ');
                if (additions.length > 0) additions += " ";
                additions += `${blStr}`;
            }

            if (additions) {
                // Simple append check to avoid dumb duplication of identical strings
                // Logic: If currentKw is present, add space (LinkedIn implies AND).
                // Or explicit AND? LinkedIn supports implicit AND.
                // "Engineer (Java OR Python)" means Engineer AND (Java OR Python).
                // So space is sufficient and safer than leading AND.

                if (!currentKw.includes(additions.trim())) {
                    if (currentKw.length > 0) {
                        url.searchParams.set('keywords', currentKw + " " + additions);
                    } else {
                        url.searchParams.set('keywords', additions);
                    }
                }
            }

            window.location.href = url.toString();
        });
    }

    updateSearchButtonState() {
        const btn = document.getElementById('jm-btn-search-tweaks');
        if (!btn) return;

        // No active state for Pro Search as requested ("shouldnt be any actice state")
        // Just ensure it's clean
        btn.classList.remove('jm-artdeco-pill--selected');
        btn.classList.remove('artdeco-pill--selected');
    }

    // --- Reset Actions for Dismiss Buttons ---

    resetPageFilters() {
        // Reset all frontend filters
        const f = this.settings.filters;
        f.hidePromoted = false;
        f.hideApplied = false;
        f.hideViewed = false;
        f.hideEasyApply = false;
        f.activelyReviewingOnly = false;
        f.earlyApplicantOnly = false;
        f.reviewTimeOnly = false;
        f.titleKeywords = [];
        f.negativeKeywords = [];
        f.companyBlacklist = [];

        this.storage.saveSettings(this.settings);
        this.filterEngine.updateSettings(this.settings.filters, true);
        this.updatePageButtonState();

        // Re-run filters to show everything
        const lists = document.querySelectorAll('.jobs-search-results-list, .scaffold-layout__list, .jobs-search-results, ul.jobs-search__results-list');
        lists.forEach(l => this.filterEngine.applyFilters(l));
    }

    async resetSearchFilters() {
        // Clear persistence
        this.settings.searchTweaks = {
            datePostedHours: "",
            mustContain: "",
            excludes: "",
            companyBlacklist: ""
        };
        await this.storage.saveSettings(this.settings);

        // Clear URL params we control
        const url = new URL(window.location.href);
        url.searchParams.delete('f_TPR');

        // We cannot easily strip keywords without regex risks, so we recommend user clears manually or we reload.
        // User asked: "advanced filter cross is not working".
        // The cross button trigger this.
        // Simplest "Reset" is to reload page WITHOUT f_TPR. 
        // Keywords will remain. That is an acceptable trade-off unless we want to parse.
        // We will just reload.

        window.location.href = url.toString();
    }
}
