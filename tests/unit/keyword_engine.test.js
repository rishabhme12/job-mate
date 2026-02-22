import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// KeywordEngine assigns to window; in Node we need a global window for the script to load
beforeAll(() => { if (typeof globalThis.window === 'undefined') globalThis.window = {}; });
afterAll(() => { delete globalThis.window; });

describe('KeywordEngine', () => {
    let KeywordEngine;
    beforeAll(async () => {
        const mod = await import('../../keyword_engine.js');
        KeywordEngine = mod.KeywordEngine;
    });

    it('U-7: normalize lowercases and strips non-word chars', () => {
        expect(KeywordEngine.normalize('Back-End Engineer')).toBe('back-end engineer');
        expect(KeywordEngine.normalize('C++ Developer')).toContain('c');
    });

    it('U-8: classify returns Backend for "Backend Engineer"', () => {
        const out = KeywordEngine.classify('Backend Engineer', 'We use Java and Spring.');
        expect(out).toBe('Backend');
    });

    it('U-9: classify returns Data Engineering for ETL title', () => {
        const out = KeywordEngine.classify('Data Engineer - ETL Pipelines', 'Spark, Airflow, Python.');
        expect(out).toBe('Data Engineering');
    });

    it('U-10: classify returns Not Sure for low/no match', () => {
        const out = KeywordEngine.classify('Chief of Staff', 'Coordinating meetings and travel.');
        expect(out).toBe('Not Sure');
    });
});
