import { describe, it, expect, beforeEach } from 'vitest';
import { FilterEngine } from '../../filter_engine.js';

function mockJobCard(overrides = {}) {
    const base = {
        innerText: '',
        dataset: {},
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
});
