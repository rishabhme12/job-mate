/**
 * JobMate Filter Engine
 * responsible for deciding which jobs to show/hide based on settings.
 */
class FilterEngine {
    constructor(settings) {
        this.settings = settings || {};
        // Cache regexes for performance
        this.positiveRegex = null;
        this.negativeRegex = null;
        this.isFilteringEnabled = false; // By default, filtering is OFF until "Show results" is clicked
        this.suppressViewedApplied = false; // Sticky mode: prevent hide-viewed/applied during a session
        this.sessionViewedJobIds = new Set(); // Stable per-page memory of clicked/viewed jobs
        this.updateRegex();
    }

    updateSettings(newSettings, enableFiltering = false) {
        this.settings = newSettings;
        if (enableFiltering) this.isFilteringEnabled = true;
        this.updateRegex();
    }

    setStickyViewedApplied(enabled) {
        this.suppressViewedApplied = !!enabled;
    }

    setSessionViewed(jobId) {
        if (!jobId) return;
        this.sessionViewedJobIds.add(String(jobId));
    }

    clearSessionViewed() {
        this.sessionViewedJobIds.clear();
    }

    getJobId(jobCard) {
        if (!jobCard || !jobCard.getAttribute) return '';

        // LinkedIn uses varying wrappers; check current node first.
        const direct =
            jobCard.getAttribute('data-occludable-job-id') ||
            jobCard.getAttribute('data-job-id');
        if (direct) return String(direct);

        // Check nearest id-bearing ancestor.
        const parentWithId = jobCard.closest('[data-occludable-job-id], [data-job-id]');
        if (parentWithId) {
            return String(
                parentWithId.getAttribute('data-occludable-job-id') ||
                parentWithId.getAttribute('data-job-id') ||
                ''
            );
        }

        // Virtualized list wrappers can hold ids on descendants.
        if (jobCard.querySelector) {
            const childWithId = jobCard.querySelector('[data-occludable-job-id], [data-job-id]');
            if (childWithId && childWithId.getAttribute) {
                const childId =
                    childWithId.getAttribute('data-occludable-job-id') ||
                    childWithId.getAttribute('data-job-id');
                if (childId) return String(childId);
            }

            // Last fallback: extract numeric id from canonical job links.
            const linkEl = jobCard.querySelector('a[href*="/jobs/view/"]');
            if (linkEl && linkEl.getAttribute) {
                const href = linkEl.getAttribute('href') || '';
                const match = href.match(/\/jobs\/view\/(\d+)/);
                if (match && match[1]) return String(match[1]);
            }
        }

        return '';
    }

    updateRegex() {
        const { titleKeywords, negativeKeywords } = this.settings;

        if (titleKeywords && titleKeywords.length > 0) {
            // "OR" logic for positive match
            const pattern = titleKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            this.positiveRegex = new RegExp(pattern, 'i');
        } else {
            this.positiveRegex = null;
        }

        if (negativeKeywords && negativeKeywords.length > 0) {
            // "OR" logic for negative match
            const pattern = negativeKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            this.negativeRegex = new RegExp(pattern, 'i');
        } else {
            this.negativeRegex = null;
        }
    }

    /**
     * Check if a job *Detail View* passes the filters.
     * This is used for "Lazy Filtering" when the list view lacks data.
     * @param {Object} data - Scraped data { applicants: string, hasActivelyRecruiting: bool, ... }
     * @returns {Object} result - { pass: boolean, reason: string }
     */
    checkDetail(data) {
        if (!data) return { pass: true };



        // 2. Flags
        if (this.settings.activelyReviewingOnly && !data.hasActivelyRecruiting) {
            return { pass: false, reason: "Not Recruiting" };
        }

        if (this.settings.earlyApplicantOnly && !data.hasEarlyApplicant) {
            return { pass: false, reason: "Late Applicant" };
        }

        if (this.settings.reviewTimeOnly && !data.hasReviewTime) {
            return { pass: false, reason: "No Review Time" };
        }

        return { pass: true };
    }

    /**
     * Main Apply Function
     * @param {HTMLElement} jobCard - The DOM element of the job card
     * @returns {boolean} - True if job should be VISIBLE, False if HIDDEN
     */
    shouldShowJob(jobCard, options = {}) {
        const text = jobCard.innerText;
        const lowerText = text.toLowerCase();
        const ignoreSticky = !!options.ignoreStickyViewedApplied;
        const treatViewedAppliedAsDim = !!options.treatViewedAppliedAsDim;
        const jobId = this.getJobId(jobCard);
        const isSessionViewed = !!(jobId && this.sessionViewedJobIds.has(jobId));
        const allowViewedAppliedFilter = !this.suppressViewedApplied || ignoreSticky || !isSessionViewed;

        // 1. Ghost Protocol: Promoted
        if (this.settings.hidePromoted) {
            // Look for "Promoted" text which usually appears in specific sub-elements
            // Checking raw text is risky but fast. Better to check specific classes if possible.
            // .job-card-container__footer-item or similar.
            // For now, simple text check, but sophisticated enough to avoid false positives?
            // "Promoted" usually appears on its own line or in a specific tag.
            // Heuristic section check:
            if (text.includes('Promoted')) {
                // Verify it's actually the promoted label
                const promotedLabel = Array.from(jobCard.querySelectorAll('li, span, div')).find(el => el.innerText.trim() === 'Promoted');
                if (promotedLabel) return false;
            }
        }

        // 2. Ghost Protocol: Applied / Viewed
        if (this.settings.hideApplied && allowViewedAppliedFilter && !treatViewedAppliedAsDim) {
            if (lowerText.includes('applied')) return false;
            // Also check for specific "Applied" checkmark icon if text is missing?
            // Usually text "Applied X days ago" is present.
        }

        if (this.settings.hideViewed && allowViewedAppliedFilter && !treatViewedAppliedAsDim) {
            if (lowerText.includes('viewed')) return false;
        }

        // 3. Ghost Protocol: Easy Apply
        // If "Easy Apply Only" is ON, hide if NOT Easy Apply
        if (this.settings.easyApplyOnly) {
            if (!lowerText.includes('easy apply')) return false;
        }
        // If "Hide Easy Apply" is ON, hide if IT IS Easy Apply
        if (this.settings.hideEasyApply) {
            if (lowerText.includes('easy apply')) return false;
        }

        // 4. Actively Reviewing / Early Applicant / Review Time
        // Text is available in .job-card-container__job-insight-text
        if (this.settings.activelyReviewingOnly) {
            if (!lowerText.includes('actively recruiting') && !lowerText.includes('actively reviewing')) return false;
        }

        if (this.settings.earlyApplicantOnly) {
            if (!lowerText.includes('early applicant') && !lowerText.includes('be one of the first')) return false;
        }

        if (this.settings.reviewTimeOnly) {
            const hasReviewTime = lowerText.includes('time to hear back') ||
                lowerText.includes('responds within') ||
                lowerText.includes('company review time');
            if (!hasReviewTime) return false;
        }

        // 5. Company Blacklist
        if (this.settings.companyBlacklist && this.settings.companyBlacklist.length > 0) {
            // Find company name element specifically to avoid false positives
            // Selectors: .job-card-container__primary-description, .artdeco-entity-lockup__subtitle
            const companyEl = jobCard.querySelector('.job-card-container__primary-description') ||
                jobCard.querySelector('.artdeco-entity-lockup__subtitle') ||
                jobCard.querySelector('.job-card-list__company-name');

            if (companyEl) {
                const companyName = companyEl.innerText.trim().toLowerCase();
                for (const blocked of this.settings.companyBlacklist) {
                    if (companyName.includes(blocked.toLowerCase())) return false;
                }
            }
        }

        // 6. Title Keywords (Precision Search)
        // Find title element
        const titleEl = jobCard.querySelector('.job-card-list__title') ||
            jobCard.querySelector('.job-card-container__link') ||
            jobCard.querySelector('strong'); // fallback

        if (titleEl) {
            const titleText = titleEl.innerText.trim();

            // Positive Match (Must have at least one if set)
            if (this.positiveRegex) {
                if (!this.positiveRegex.test(titleText)) return false;
            }

            // Negative Match (Must NOT have any)
            if (this.negativeRegex) {
                if (this.negativeRegex.test(titleText)) return false;
            }
        }

        // 7. Applicants (Removed from List View)
        // Count is not reliably available in the list view.
        // filtering is handled by the lazy check in Detail View.

        return true;
    }

    updateViewedAppliedVisual(jobCard) {
        if (!jobCard) return;

        const lowerText = (jobCard.innerText || '').toLowerCase();
        const reasons = [];
        if (this.settings.hideApplied && lowerText.includes('applied')) reasons.push('Applied');
        if (this.settings.hideViewed && lowerText.includes('viewed')) reasons.push('Viewed');

        const shouldDim = reasons.length > 0;
        const existingBadge = jobCard.querySelector('.job-mate-status-badge');

        if (!shouldDim) {
            jobCard.classList.remove('job-mate-dimmed');
            if (existingBadge) existingBadge.remove();
            return;
        }

        jobCard.classList.add('job-mate-dimmed');

        const badgeText = reasons.join(' + ');
        const host =
            jobCard.querySelector('.job-card-list__title') ||
            jobCard.querySelector('.job-card-container__link') ||
            jobCard.querySelector('strong') ||
            jobCard;

        const badge = existingBadge || document.createElement('span');
        badge.className = 'job-mate-status-badge';
        badge.innerText = badgeText;

        if (!existingBadge) {
            host.appendChild(badge);
        }
    }

    /**
     * Run the filter on a container of jobs
     * @param {HTMLElement} listContainer 
     */
    applyFilters(listContainer, options = {}) {
        if (!listContainer) return;
        if (!this.isFilteringEnabled) return; // Respect the flag!

        // Identify job items. Selectors vary between Search and Feed.
        // Search: .jobs-search-results__list-item
        // Feed: .job-card-container (often wrapped in div)
        const jobItems = listContainer.querySelectorAll('.jobs-search-results__list-item, [data-occludable-job-id], .job-card-container--clickable');

        if (jobItems.length === 0) {
            // console.log("JobMate: No jobs found in container to filter.");
            return;
        }

        let hiddenCount = 0;
        jobItems.forEach(item => {
            this.updateViewedAppliedVisual(item);

            // SAFETY: Do not hide the currently selected job!
            const isActive = item.classList.contains('jobs-search-results-list__list-item--active') ||
                item.classList.contains('job-card-container--active') ||
                item.matches('.jobs-search-results-list__list-item--active');

            if (isActive) {
                item.classList.remove('job-mate-hidden');
                return;
            }

            const show = this.shouldShowJob(item, { ...options, treatViewedAppliedAsDim: true });
            if (show) {
                item.classList.remove('job-mate-hidden');
            } else {
                item.classList.add('job-mate-hidden');
                hiddenCount++;
            }
        });

        if (hiddenCount > 0) {
            console.log(`JobMate: Filtered ${hiddenCount} / ${jobItems.length} jobs.`);
        }
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { FilterEngine };
