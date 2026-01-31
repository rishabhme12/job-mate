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
        this.updateRegex();
    }

    updateSettings(newSettings, enableFiltering = false) {
        this.settings = newSettings;
        if (enableFiltering) this.isFilteringEnabled = true;
        this.updateRegex();
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
     * Main Apply Function
     * @param {HTMLElement} jobCard - The DOM element of the job card
     * @returns {boolean} - True if job should be VISIBLE, False if HIDDEN
     */
    shouldShowJob(jobCard) {
        const text = jobCard.innerText;
        const lowerText = text.toLowerCase();

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
        if (this.settings.hideApplied) {
            if (lowerText.includes('applied')) return false;
            // Also check for specific "Applied" checkmark icon if text is missing?
            // Usually text "Applied X days ago" is present.
        }

        if (this.settings.hideViewed) {
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

        // 4. Company Blacklist
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

        // 5. Title Keywords (Precision Search)
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

        // 6. Applicant Count (Best Effort)
        if (this.settings.maxApplicants) {
            // "123 applicants" or "Over 200 applicants"
            const applicantMatch = text.match(/(\d+)\s+applicants/);
            if (applicantMatch) {
                const count = parseInt(applicantMatch[1], 10);
                if (count > this.settings.maxApplicants) {
                    console.log(`JobMate: Hidden (Max Applicants: ${count} > ${this.settings.maxApplicants})`);
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Run the filter on a container of jobs
     * @param {HTMLElement} listContainer 
     */
    applyFilters(listContainer) {
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
            const show = this.shouldShowJob(item);
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
