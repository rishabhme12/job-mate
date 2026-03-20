import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('action popup UI', () => {
    it('uses a popup instead of reopening the welcome tab on toolbar click', () => {
        const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
        const backgroundSrc = readFileSync(join(root, 'background.js'), 'utf8');

        expect(manifest.action.default_popup).toBe('popup.html');
        expect(manifest.permissions).toEqual(['storage']);
        expect(backgroundSrc).not.toContain('chrome.action.onClicked');
    });

    it('keeps the welcome page for fresh installs only', () => {
        const backgroundSrc = readFileSync(join(root, 'background.js'), 'utf8');

        expect(backgroundSrc).toContain("details.reason === 'install'");
        expect(backgroundSrc).toContain("chrome.runtime.getURL('welcome.html')");
    });
});
