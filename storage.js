/**
 * JobMate Storage Utility
 * Handles saving and retrieving user preferences for filters and UI state.
 */
const JobMateStorage = {
    defaults: {
        filters: {
            hidePromoted: false,
            hideApplied: false,
            hideViewed: false,
            hideEasyApply: false,
            easyApplyOnly: false,
            maxApplicants: null,
            titleKeywords: [], // Positive match (OR logic)
            negativeKeywords: [], // Negative match
            companyBlacklist: []
        },
        searchTweaks: {
            datePostedHours: ""
        },
        ui: {
            expanded: true
        }
    },

    /**
     * Get all settings with defaults applied
     * @returns {Promise<Object>}
     */
    getSettings() {
        return new Promise((resolve) => {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage) {
                    resolve(JSON.parse(JSON.stringify(this.defaults))); // Fallback for non-extension env
                    return;
                }
                chrome.storage.local.get(['jobMateSettings'], (result) => {
                    if (chrome.runtime.lastError) {
                        // Silently resolve defaults on error (e.g. invalidation)
                        resolve(JSON.parse(JSON.stringify(this.defaults)));
                        return;
                    }
                    const saved = result.jobMateSettings || {};
                    // Deep merge with defaults to ensure structure
                    const merged = {
                        filters: { ...this.defaults.filters, ...saved.filters },
                        searchTweaks: { ...this.defaults.searchTweaks, ...saved.searchTweaks },
                        ui: { ...this.defaults.ui, ...saved.ui }
                    };
                    resolve(merged);
                });
            } catch (e) {
                resolve(JSON.parse(JSON.stringify(this.defaults)));
            }
        });
    },

    /**
     * Save settings partial or complete
     * @param {Object} newSettings 
     */
    async saveSettings(newSettings) {
        try {
            const current = await this.getSettings();
            const updated = {
                filters: { ...current.filters, ...(newSettings.filters || {}) },
                searchTweaks: { ...current.searchTweaks, ...(newSettings.searchTweaks || {}) },
                ui: { ...current.ui, ...(newSettings.ui || {}) }
            };

            return new Promise((resolve) => {
                try {
                    if (typeof chrome === 'undefined' || !chrome.storage) {
                        resolve(updated);
                        return;
                    }
                    chrome.storage.local.set({ jobMateSettings: updated }, () => {
                        if (chrome.runtime.lastError) {
                            console.warn('JobMate: Save failed', chrome.runtime.lastError);
                        }
                        resolve(updated);
                    });
                } catch (e) { resolve(updated); }
            });
        } catch (e) { return {}; }
    }
};
if (typeof module !== 'undefined' && module.exports) module.exports = { JobMateStorage };