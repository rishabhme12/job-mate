import { describe, it, expect, beforeEach } from 'vitest';
import { FilterEngine } from '../../filter_engine.js';

function mockJobCard(overrides = {}) {
    const base = {
        innerText: '',
        dataset: {},
        getAttribute: () => null,
        closest: () => null,
        classList: { add: () => {}, remove: () => {} },
        querySelector: () => null,
        querySelectorAll: () => []
    };
    return { ...base, ...overrides };
}

describe('FilterEngine', () => {
    let engine;

    beforeEach(() => {
        engine = new FilterEngine({});
        engine.isFilteringEnabled = true;
    });

    it('U-1: shouldShowJob hides promoted when hidePromoted=true', () => {
        engine.updateSettings({ hidePromoted: true }, true);
        const card = mockJobCard({
            innerText: 'Promoted\nSoftware Engineer at Acme',
            querySelector: (sel) => (sel.includes('li') || sel.includes('span') || sel.includes('div') ? { innerText: 'Promoted' } : null),
            querySelectorAll: () => [{ innerText: 'Promoted' }]
        });
        expect(engine.shouldShowJob(card)).toBe(false);
    });

    it('U-2: shouldShowJob hides applied when hideApplied=true', () => {
        engine.updateSettings({ hideApplied: true }, true);
        const card = mockJobCard({ innerText: 'Applied 2 days ago\nBackend Engineer' });
        expect(engine.shouldShowJob(card)).toBe(false);
    });

    it('U-3: shouldShowJob hides viewed when hideViewed=true', () => {
        engine.updateSettings({ hideViewed: true }, true);
        const card = mockJobCard({ innerText: 'Viewed 1 day ago\nData Engineer' });
        expect(engine.shouldShowJob(card)).toBe(false);
    });

    it('U-4: titleKeywords positive match (OR logic)', () => {
        engine.updateSettings({ titleKeywords: ['Data Engineer', 'ETL'] }, true);
        const pass = mockJobCard({
            querySelector: () => ({ innerText: 'Senior Data Engineer' }),
            innerText: 'Senior Data Engineer'
        });
        const fail = mockJobCard({
            querySelector: () => ({ innerText: 'Marketing Manager' }),
            innerText: 'Marketing Manager'
        });
        expect(engine.shouldShowJob(pass)).toBe(true);
        expect(engine.shouldShowJob(fail)).toBe(false);
    });

    it('U-5: negativeKeywords exclude matching titles', () => {
        engine.updateSettings({ negativeKeywords: ['Senior', 'Lead'] }, true);
        const card = mockJobCard({
            querySelector: () => ({ innerText: 'Senior Backend Engineer' }),
            innerText: 'Senior Backend Engineer'
        });
        expect(engine.shouldShowJob(card)).toBe(false);
    });

    it('U-6: checkDetail passes/fails activelyReviewingOnly', () => {
        engine.updateSettings({ activelyReviewingOnly: true }, true);
        expect(engine.checkDetail({ hasActivelyRecruiting: true })).toEqual({ pass: true });
        expect(engine.checkDetail({ hasActivelyRecruiting: false })).toEqual({ pass: false, reason: 'Not Recruiting' });
    });

    it('U-14: sticky viewed exemption keeps session-viewed job visible by id', () => {
        engine.updateSettings({ hideViewed: true }, true);
        engine.setStickyViewedApplied(true);
        engine.setSessionViewed('123');

        const card = mockJobCard({
            innerText: 'Viewed 1 day ago\nData Engineer',
            getAttribute: (name) => (name === 'data-occludable-job-id' ? '123' : null)
        });

        expect(engine.shouldShowJob(card)).toBe(true);
    });

    it('U-15: sticky viewed exemption resets after clearSessionViewed', () => {
        engine.updateSettings({ hideViewed: true }, true);
        engine.setStickyViewedApplied(true);
        engine.setSessionViewed('123');
        engine.clearSessionViewed();

        const card = mockJobCard({
            innerText: 'Viewed 1 day ago\nData Engineer',
            getAttribute: (name) => (name === 'data-occludable-job-id' ? '123' : null)
        });

        expect(engine.shouldShowJob(card)).toBe(false);
    });

    it('U-16: sticky viewed exemption works when id is on a descendant node', () => {
        engine.updateSettings({ hideViewed: true }, true);
        engine.setStickyViewedApplied(true);
        engine.setSessionViewed('456');

        const card = mockJobCard({
            innerText: 'Viewed 1 day ago\nBackend Engineer',
            getAttribute: () => null,
            querySelector: (sel) => {
                if (sel === '[data-occludable-job-id], [data-job-id]') {
                    return { getAttribute: (name) => (name === 'data-occludable-job-id' ? '456' : null) };
                }
                return null;
            }
        });

        expect(engine.shouldShowJob(card)).toBe(true);
    });

    it('U-17: getJobId falls back to job link when attributes are missing', () => {
        const card = mockJobCard({
            getAttribute: () => null,
            querySelector: (sel) => {
                if (sel === '[data-occludable-job-id], [data-job-id]') return null;
                if (sel === 'a[href*=\"/jobs/view/\"]') {
                    return { getAttribute: (name) => (name === 'href' ? 'https://www.linkedin.com/jobs/view/789/' : null) };
                }
                return null;
            }
        });

        expect(engine.getJobId(card)).toBe('789');
    });

    it('U-18: shouldShowJob keeps viewed card visible in dim-mode', () => {
        engine.updateSettings({ hideViewed: true }, true);
        const card = mockJobCard({ innerText: 'Viewed 1 day ago\nData Engineer' });
        expect(engine.shouldShowJob(card, { treatViewedAppliedAsDim: true })).toBe(true);
    });
});
