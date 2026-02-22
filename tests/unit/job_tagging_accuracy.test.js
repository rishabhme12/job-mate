/**
 * Job tagging golden-set accuracy test.
 * Uses tests/fixtures/job_tagging_golden_set.json: each entry has title, description, expectedTag.
 * Runs KeywordEngine.classify(title, description) and compares to expectedTag; reports accuracy.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, '../fixtures/job_tagging_golden_set.json');
const MIN_ACCURACY = 0.70; // 70% correct required (configurable)

beforeAll(() => { if (typeof globalThis.window === 'undefined') globalThis.window = {}; });
afterAll(() => { delete globalThis.window; });

describe('Job tagging golden set (U-13)', () => {
    let KeywordEngine;
    let goldenSet;

    beforeAll(async () => {
        const mod = await import('../../keyword_engine.js');
        KeywordEngine = mod.KeywordEngine;
        const raw = readFileSync(FIXTURE_PATH, 'utf-8');
        goldenSet = JSON.parse(raw);
        if (!Array.isArray(goldenSet) || goldenSet.length === 0) {
            throw new Error(`Golden set must be a non-empty array in ${FIXTURE_PATH}`);
        }
    });

    it('U-13: tagging accuracy on golden set meets threshold', () => {
        const results = goldenSet.map(({ title, description, expectedTag }) => {
            const predicted = KeywordEngine.classify(title || '', description || '');
            return { title: (title || '').slice(0, 50), expectedTag, predicted, ok: predicted === expectedTag };
        });

        const correct = results.filter(r => r.ok).length;
        const total = results.length;
        const accuracy = total > 0 ? correct / total : 0;

        // Log mismatches for debugging
        const mismatches = results.filter(r => !r.ok);
        if (mismatches.length > 0) {
            console.log('\nTagging mismatches (expected → predicted):');
            mismatches.forEach(m => console.log(`  "${m.title}..." => ${m.expectedTag} → ${m.predicted}`));
        }
        console.log(`\nGolden set accuracy: ${correct}/${total} (${(accuracy * 100).toFixed(1)}%)`);

        expect(accuracy).toBeGreaterThanOrEqual(MIN_ACCURACY);
    });
});
