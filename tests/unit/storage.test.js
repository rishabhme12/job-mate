import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

// Mock chrome.storage before loading storage.js so getSettings/saveSettings use it
const mockGet = vi.fn();
const mockSet = vi.fn();
const chromeMock = {
    storage: {
        local: {
            get: (keys, cb) => {
                mockGet(keys);
                cb({});
                if (globalThis.chrome?.runtime) globalThis.chrome.runtime.lastError = null;
            },
            set: (obj, cb) => {
                mockSet(obj);
                if (cb) cb();
            }
        }
    },
    runtime: { lastError: null }
};
beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    globalThis.chrome = { ...chromeMock, runtime: { lastError: null } };
});

describe('JobMateStorage', () => {
    let JobMateStorage;
    beforeAll(async () => {
        const mod = await import('../../storage.js');
        JobMateStorage = mod.JobMateStorage;
    });

    it('U-11: getSettings returns defaults when empty', async () => {
        const settings = await JobMateStorage.getSettings();
        expect(settings.filters).toBeDefined();
        expect(settings.filters.hideViewed).toBe(false);
        expect(settings.filters.titleKeywords).toEqual([]);
        expect(settings.searchTweaks).toBeDefined();
        expect(settings.ui.expanded).toBe(true);
    });

    it('U-12: saveSettings merges with existing', async () => {
        await JobMateStorage.saveSettings({ filters: { hideViewed: true } });
        expect(mockSet).toHaveBeenCalled();
        const payload = mockSet.mock.calls[0][0];
        expect(payload.jobMateSettings.filters.hideViewed).toBe(true);
        expect(payload.jobMateSettings.filters.hideApplied).toBe(false);
    });
});
