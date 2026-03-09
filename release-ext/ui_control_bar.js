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

    findJobListContainers() {
        let lists = Array.from(document.querySelectorAll(
            '.jobs-search-results-list, .scaffold-layout__list, .jobs-search-results, ul.jobs-search__results-list, ul[aria-label*="Search results"]'
        ));
        if (lists.length === 0) {
            const card = document.querySelector('.job-card-container, .jobs-search-results__list-item, [data-occludable-job-id]');
            if (card) {
                const parentList = card.closest('ul') || card.closest('[role="list"]');
                if (parentList) lists = [parentList];
            }
        }
        return lists;
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

        const isInDetailPane = (el) => !!(el && (el.closest('.jobs-search__job-details') || el.closest('.scaffold-layout__detail')));
        const isVisibleTopBarButton = (btn) => {
            if (!btn) return false;
            const style = window.getComputedStyle(btn);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            const rect = btn.getBoundingClientRect();
            if (rect.width < 20 || rect.height < 20) return false;
            return rect.top > -120 && rect.top < 420 && rect.right > 0 && rect.left < window.innerWidth;
        };

        const findAllFiltersButton = () => {
            const scopedBars = Array.from(document.querySelectorAll(
                '.search-reusables__filters-bar-grouping, .search-reusables__primary-filter, [class*="search-reusables"]'
            )).filter(el => !isInDetailPane(el));

            for (const bar of scopedBars) {
                const direct = bar.querySelector('.search-reusables__all-filters-pill-button');
                if (direct && isVisibleTopBarButton(direct)) return direct;
                const textMatch = Array.from(bar.querySelectorAll('button')).find(b =>
                    b.innerText.trim().toLowerCase() === 'all filters' && isVisibleTopBarButton(b)
                );
                if (textMatch) return textMatch;
            }

            // Global fallback: visible top-row "All filters" only.
            return Array.from(document.querySelectorAll('button')).find(b =>
                b.innerText.trim().toLowerCase() === 'all filters' &&
                isVisibleTopBarButton(b) &&
                !isInDetailPane(b)
            ) || null;
        };

        const allFiltersBtn = findAllFiltersButton();

        let injectionTarget = null;
        let insertionMethod = 'append';
        let insertionAnchor = null;

        if (allFiltersBtn) {
            const wrapper = allFiltersBtn.closest('li') || allFiltersBtn.parentElement;
            if (wrapper && wrapper.parentElement) {
                injectionTarget = wrapper.parentElement;
                insertionAnchor = wrapper;
                insertionMethod = 'before-anchor';
            } else {
                injectionTarget = allFiltersBtn.parentElement;
                insertionAnchor = allFiltersBtn;
                insertionMethod = 'before-anchor';
            }
        } else {
            // Do not inject into list headers (blue strip) to avoid wrong placement.
            // Wait for top filters row to render instead.
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

            if (insertionMethod === 'before-anchor' && insertionAnchor && injectionTarget === insertionAnchor.parentElement) {
                this.container.style.display = 'inline-flex';
                this.container.style.marginRight = '8px';
                this.container.style.marginBottom = '0';
                this.container.style.padding = '0';
                injectionTarget.insertBefore(this.container, insertionAnchor);
            } else if (insertionMethod === 'prepend') {
                this.container.style.display = 'inline-flex';
                this.container.style.marginRight = '8px';
                this.container.style.marginBottom = '0';
                this.container.style.padding = '0';
                injectionTarget.prepend(this.container);
            } else {
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
                    if (action === 'reset-search') this.resetSearchFilters();
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
                    <span>Freshness</span>
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
                            ${toggle('jm-hide-applied', 'Dim Applied (tag)')}
                            ${toggle('jm-hide-viewed', 'Dim Viewed (tag)')}
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
            const lists = this.findJobListContainers();
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
                    <h2 class="job-mate-modal-title">Freshness</h2>
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
                </div>
                <div class="job-mate-modal-footer">
                    <button class="job-mate-btn job-mate-btn-secondary" id="jm-search-reset">Reset</button>
                    <button class="job-mate-btn job-mate-btn-primary" id="jm-search-apply">Search</button>
                </div>
            </div>
        `;
    }

    openSearchModal() {
        const params = new URLSearchParams(window.location.search);
        let hoursVal = "";
        const t = params.get('f_TPR');
        if (t && t.startsWith('r')) {
            const sec = parseInt(t.substring(1), 10);
            if (!isNaN(sec)) {
                hoursVal = Math.round(sec / 3600).toString();
            }
        }
        const s = this.settings.searchTweaks || {};
        if (hoursVal) {
            s.datePostedHours = hoursVal;
        } else if (!params.has('f_TPR')) {
            s.datePostedHours = "";
        }
        document.getElementById('jm-search-date-hours').value = s.datePostedHours || "";
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
        });

        document.getElementById('jm-search-apply').addEventListener('click', async () => {
            const hoursVal = document.getElementById('jm-search-date-hours').value.trim();
            this.settings.searchTweaks = { datePostedHours: hoursVal };
            await this.storage.saveSettings(this.settings);

            const url = new URL(window.location.href);
            if (hoursVal) {
                const sec = parseInt(hoursVal, 10) * 3600;
                url.searchParams.set('f_TPR', `r${sec}`);
            } else {
                url.searchParams.delete('f_TPR');
            }
            window.location.href = url.toString();
        });
    }

    updateSearchButtonState() {
        const btn = document.getElementById('jm-btn-search-tweaks');
        if (!btn) return;

        const params = new URLSearchParams(window.location.search);
        const tpr = params.get('f_TPR');

        if (tpr && tpr.startsWith('r')) {
            const sec = parseInt(tpr.substring(1), 10);
            if (!isNaN(sec) && sec > 0) {
                const hours = Math.round(sec / 3600);
                btn.innerHTML = `<span>${hours} hrs</span><span class="jm-dismiss-icon" data-action="reset-search">✕</span>`;
                btn.classList.add('jm-artdeco-pill--selected');
                btn.style.backgroundColor = '';
                btn.style.borderColor = '';
                btn.style.color = '';
                return;
            }
        }

        // No active freshness filter
        btn.innerHTML = `<span>Freshness</span>`;
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
        const lists = this.findJobListContainers();
        lists.forEach(l => this.filterEngine.applyFilters(l));
    }

    async resetSearchFilters() {
        this.settings.searchTweaks = { datePostedHours: "" };
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
