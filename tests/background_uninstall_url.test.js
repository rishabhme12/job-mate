import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('background.js uninstall URL', () => {
    it('registers Tally uninstall feedback form', () => {
        const src = readFileSync(join(root, 'background.js'), 'utf8');
        expect(src).toContain('https://tally.so/r/lbR85o');
        expect(src).toContain('setUninstallURL');
    });
});
