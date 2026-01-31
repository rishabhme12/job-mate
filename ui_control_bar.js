/**
 * JobMate UI Control Bar
 * Renders the "Advanced Filters" button and manages the Filter Modal.
 */
class JobMateControlBar {
    constructor(storage, filterEngine) {
        this.storage = storage;
        this.filterEngine = filterEngine;
        this.container = null;
        this.modal = null;
        this.overlay = null;
        this.settings = null;
        this.tempSettings = null; // Stores changes before "Apply"
    }

    async init() {
        this.settings = await this.storage.getSettings();

        // RESET ON REFRESH: Force all specific job-property toggles to OFF.
        // We keep text-based filters (Keywords, Blacklist) as they are likely long-term preferences.
        const f = this.settings.filters;
        f.hidePromoted = false;
        f.hideApplied = false;
        f.hideViewed = false;
        f.hideEasyApply = false;
        f.easyApplyOnly = false;
        f.activelyReviewingOnly = false;
        f.earlyApplicantOnly = false;
        f.reviewTimeOnly = false;
        f.postedWaitHours = null;


        // Save this "Session Reset" state
        await this.storage.saveSettings(this.settings);
        this.filterEngine.updateSettings(this.settings.filters);

        if (this.inject()) {
            this.updateButtonState();
        }

        // NOTE: We do NOT call filterEngine.applyFilters() here.
        // Filters should only apply when user clicks "Show Results" or if we decide to auto-apply persistent text filters later.
        // For now, per requirement: "filters shouldnt be in applied state unless user got and sbmit".
    }

    inject() {
        // 1. Safety Check: Only run on Jobs pages
        if (!window.location.href.includes('/jobs/') && !window.location.href.includes('/feed/')) {
            return false;
        }

        // 2. Prevent Duplicate Injection
        if (document.getElementById('job-mate-control-bar')) {
            return true;
        }

        // 3. Find Injection Point: Target native "All filters" button
        // Common class for the "All filters" button in Search V2 / Reusables
        // We look for the button, then go up to its flex item wrapper, then append after it.
        const allFiltersBtn = document.querySelector('.search-reusables__all-filters-pill-button') ||
            Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'All filters');

        let injectionTarget = null;
        let insertionMethod = 'append'; // 'append' or 'prepend'

        if (allFiltersBtn) {
            // Found the button!
            // Usually wrapped in a div/li. Let's find the closest list item or flex wrapper.
            // Structure: ul > li > button  OR  div.flex > div > button
            const wrapper = allFiltersBtn.closest('li') || allFiltersBtn.parentElement;

            if (wrapper && wrapper.parentElement) {
                injectionTarget = wrapper; // We will insert AFTER this wrapper
                insertionMethod = 'after';
            } else {
                injectionTarget = allFiltersBtn;
                insertionMethod = 'after';
            }
        } else {
            // STRICT INJECTION: Do not try to guess. If "All filters" isn't there, we don't inject.
            // This prevents the button from appearing in random places (like the feed or nav bar).
            return false;
        }

        if (injectionTarget) {
            this.container = document.createElement('div');
            this.container.id = 'job-mate-control-bar';
            this.container.className = 'job-mate-control-bar'; // Styles handled in CSS
            this.container.innerHTML = this.renderButtonHTML();

            // Adjust style to fit inline if we are in the filter bar
            if (insertionMethod === 'after') {
                this.container.style.display = 'inline-flex';
                this.container.style.marginBottom = '0';
                this.container.style.padding = '0 0 0 8px'; // Add some left spacing

                injectionTarget.insertAdjacentElement('afterend', this.container);
            } else {
                injectionTarget.prepend(this.container);
            }

            // Bind Button Events immediately
            const btn = document.getElementById('job-mate-adv-filter-btn');
            if (btn) btn.addEventListener('click', () => this.openModal());

        } else {
            return false;
        }

        // 4. Inject Modal (if not exists)
        if (!document.getElementById('job-mate-modal-overlay')) {
            const modalContainer = document.createElement('div');
            modalContainer.id = 'job-mate-modal-overlay';
            modalContainer.className = 'job-mate-modal-overlay';
            modalContainer.innerHTML = this.renderModalHTML();
            document.body.appendChild(modalContainer);

            this.overlay = modalContainer;
            this.modal = modalContainer.querySelector('.job-mate-modal');
            this.bindModalEvents();
        }

        return true;
    }

    renderButtonHTML() {
        return `
            <div class="job-mate-bar-header">
                <button id="job-mate-adv-filter-btn" class="job-mate-adv-filter-btn">
                    <span>Advanced Filters</span>
                </button>
            </div>
        `;
    }

    renderModalHTML() {
        const toggle = (id, label, style = "margin-bottom:0;") => `
            <label class="job-mate-toggle-wrapper" style="${style}">
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
                    <h2 class="job-mate-modal-title">Filter jobs</h2>
                    <button class="job-mate-close-btn" id="jm-modal-close">×</button>
                </div>
                <div class="job-mate-modal-body">
                    
                    <!-- Section: Keywords -->
                    <div class="job-mate-modal-section">
                        <h3 class="job-mate-section-title">Keywords</h3>
                        <div class="job-mate-input-group">
                            <label class="job-mate-label">Title Must Contain (OR logic)</label>
                            <input type="text" id="jm-title-keywords" class="job-mate-text-input" placeholder="e.g. Data, Backend, Staff">
                        </div>
                        <div class="job-mate-input-group">
                            <label class="job-mate-label">Title Excludes (Hide these)</label>
                            <input type="text" id="jm-negative-keywords" class="job-mate-text-input" placeholder="e.g. Intern, Manager, Senior">
                        </div>
                        <div class="job-mate-input-group">
                            <label class="job-mate-label">Company Blacklist</label>
                            <input type="text" id="jm-company-blacklist" class="job-mate-text-input" placeholder="e.g. Revature, CyberCoders">
                        </div>
                    </div>

                    <!-- Section: Job Properties -->
                    <div class="job-mate-modal-section">
                        <h3 class="job-mate-section-title">Job Properties</h3>
                        <div class="job-mate-checkbox-group">
                            ${toggle('jm-hide-promoted', 'Hide Promoted')}
                            ${toggle('jm-hide-applied', 'Hide Applied')}
                            ${toggle('jm-hide-viewed', 'Hide Viewed')}
                            ${toggle('jm-easy-apply-only', 'Easy Apply Only')}
                            ${toggle('jm-hide-easy-apply', 'Hide Easy Apply')}
                            ${toggle('jm-actively-reviewing', 'Actively Reviewing')}
                            ${toggle('jm-early-applicant', 'Early Applicant')}
                            ${toggle('jm-review-time', 'Review Time Available')}
                        </div>
                    </div>

                    <!-- Section: Time Filter -->
                    <div class="job-mate-modal-section">
                        <h3 class="job-mate-section-title">Time Filter</h3>
                        <div class="job-mate-input-group">
                            <label class="job-mate-label">Posted within X Hours</label>
                            <input type="number" id="jm-posted-hours" class="job-mate-text-input" placeholder="e.g. 12, 24" style="width: 120px;">
                        </div>
                    </div>



                </div>
                <div class="job-mate-modal-footer">
                    <button class="job-mate-btn job-mate-btn-secondary" id="jm-modal-reset">Reset</button>
                    <button class="job-mate-btn job-mate-btn-primary" id="jm-modal-apply">Show results</button>
                </div>
            </div>
        `;
    }

    openModal() {
        // 1. Clone current settings to tempSettings
        this.tempSettings = JSON.parse(JSON.stringify(this.settings.filters));

        // 2. Populate inputs from tempSettings
        this.updateModalInputs();

        // 3. Show Modal
        if (this.overlay) {
            this.overlay.classList.add('open');
        }
    }

    closeModal() {
        if (this.overlay) {
            this.overlay.classList.remove('open');
        }
    }

    updateModalInputs() {
        const f = this.tempSettings;
        if (!f) return;

        const setVal = (id, val) => document.getElementById(id).value = val;
        const setCheck = (id, val) => document.getElementById(id).checked = val;
        const join = (arr) => arr ? arr.join(', ') : '';

        setCheck('jm-hide-promoted', f.hidePromoted);
        setCheck('jm-hide-applied', f.hideApplied);
        setCheck('jm-hide-viewed', f.hideViewed);
        setCheck('jm-hide-easy-apply', f.hideEasyApply);
        setCheck('jm-easy-apply-only', f.easyApplyOnly);
        setCheck('jm-actively-reviewing', f.activelyReviewingOnly);
        setCheck('jm-early-applicant', f.earlyApplicantOnly);
        setCheck('jm-review-time', f.reviewTimeOnly);

        setVal('jm-posted-hours', f.postedWaitHours || '');

        setVal('jm-title-keywords', join(f.titleKeywords));
        setVal('jm-company-blacklist', join(f.companyBlacklist));
        setVal('jm-negative-keywords', join(f.negativeKeywords));

    }

    readModalInputs() {
        const getVal = (id) => document.getElementById(id).value;
        const getCheck = (id) => document.getElementById(id).checked;
        const split = (str) => str.split(',').map(s => s.trim()).filter(s => s.length > 0);

        const values = {
            hidePromoted: getCheck('jm-hide-promoted'),
            hideApplied: getCheck('jm-hide-applied'),
            hideViewed: getCheck('jm-hide-viewed'),
            hideEasyApply: getCheck('jm-hide-easy-apply'),
            easyApplyOnly: getCheck('jm-easy-apply-only'),
            activelyReviewingOnly: getCheck('jm-actively-reviewing'),
            earlyApplicantOnly: getCheck('jm-early-applicant'),
            reviewTimeOnly: getCheck('jm-review-time'),
            postedWaitHours: getVal('jm-posted-hours') ? parseInt(getVal('jm-posted-hours')) : null,
            titleKeywords: split(getVal('jm-title-keywords')),
            companyBlacklist: split(getVal('jm-company-blacklist')),
            negativeKeywords: split(getVal('jm-negative-keywords')),

        };
        return values;
    }

    bindModalEvents() {
        // Close
        document.getElementById('jm-modal-close').addEventListener('click', () => this.closeModal());

        // Close on Click Outside
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.closeModal();
        });

        // Reset
        document.getElementById('jm-modal-reset').addEventListener('click', () => {
            this.tempSettings = {
                hidePromoted: false,
                hideApplied: false,
                hideViewed: false,
                hideEasyApply: false,
                easyApplyOnly: false,
                activelyReviewingOnly: false,
                earlyApplicantOnly: false,
                reviewTimeOnly: false,
                postedWaitHours: null,
                titleKeywords: [],
                companyBlacklist: [],
                negativeKeywords: [],

            };
            this.updateModalInputs();
            // Note: We don't update the button state here yet, only on "Show results".
            // Or should reset clear immediately? Usually Reset just clears the FORM. 
            // User still needs to click apply. But wait, "Reset" in modal usually implies resetting inputs.
        });

        // Apply
        document.getElementById('jm-modal-apply').addEventListener('click', () => {
            // 1. Read latest values
            const finalSettings = this.readModalInputs();

            // 2. Commit to persistent settings
            this.settings.filters = finalSettings;
            this.storage.saveSettings(this.settings);

            // 3. Handle Time Filter (URL Redirect)
            if (finalSettings.postedWaitHours) {
                const hours = parseInt(finalSettings.postedWaitHours);
                if (hours > 0) {
                    const seconds = hours * 3600;
                    const url = new URL(window.location.href);
                    url.searchParams.set('f_TPR', `r${seconds}`);
                    window.location.href = url.toString();
                    return; // Stop here, page will reload
                }
            }

            // 4. Update Engine (Client Side)
            this.filterEngine.updateSettings(this.settings.filters, true);

            // 5. Update Button State (Count)
            this.updateButtonState();

            // 6. Apply Filters
            const lists = document.querySelectorAll('.jobs-search-results-list, .scaffold-layout__list, .jobs-search-results, ul.jobs-search__results-list');
            lists.forEach(l => this.filterEngine.applyFilters(l));

            // 7. Close
            this.closeModal();
        });
    }

    updateButtonState() {
        const btn = document.getElementById('job-mate-adv-filter-btn');
        if (!btn) return;

        const f = this.settings.filters;
        if (!f) return;

        let count = 0;
        if (f.hidePromoted) count++;
        if (f.hideApplied) count++;
        if (f.hideViewed) count++;
        if (f.hideEasyApply) count++;
        if (f.easyApplyOnly) count++;
        if (f.activelyReviewingOnly) count++;
        if (f.earlyApplicantOnly) count++;
        if (f.reviewTimeOnly) count++;
        if (f.postedWaitHours) count++;
        if (f.titleKeywords && f.titleKeywords.length > 0) count++;
        if (f.companyBlacklist && f.companyBlacklist.length > 0) count++;
        if (f.negativeKeywords && f.negativeKeywords.length > 0) count++;


        if (count > 0) {
            btn.innerHTML = `<span>Advanced Filters (${count})</span><div class="job-mate-reset-icon" title="Clear all filters">✕</div>`;
            btn.classList.add('artdeco-pill--selected');
            btn.style.backgroundColor = '#057642'; // LinkedIn Green
            btn.style.color = 'white';
            btn.style.border = '1px solid transparent';

            // Attach listener to the new reset icon
            const resetIcon = btn.querySelector('.job-mate-reset-icon');
            if (resetIcon) {
                resetIcon.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent opening modal
                    e.preventDefault();

                    // Reset Settings
                    this.settings.filters = {
                        hidePromoted: false,
                        hideApplied: false,
                        hideViewed: false,
                        hideEasyApply: false,
                        easyApplyOnly: false,
                        titleKeywords: [],
                        companyBlacklist: [],
                        negativeKeywords: [],

                        activelyReviewingOnly: false,
                        earlyApplicantOnly: false,
                        reviewTimeOnly: false,
                        postedWaitHours: null
                    };
                    this.storage.saveSettings(this.settings);
                    this.filterEngine.updateSettings(this.settings.filters);

                    // Re-apply (clear) filters on DOM
                    const lists = document.querySelectorAll('.jobs-search-results-list, .scaffold-layout__list, .jobs-search-results, ul.jobs-search__results-list');
                    lists.forEach(l => this.filterEngine.applyFilters(l));

                    this.updateButtonState();
                });
            }

        } else {
            btn.innerHTML = `<span>Advanced Filters</span>`;
            btn.classList.remove('artdeco-pill--selected');

            // Remove inline styles to revert to CSS defaults
            btn.style.backgroundColor = '';
            btn.style.color = '';
            btn.style.border = '';
        }
    }
}
