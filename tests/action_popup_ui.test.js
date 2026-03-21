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

    it('keeps the tutorial link at the end of the popup support links', () => {
        const popupHtml = readFileSync(join(root, 'popup.html'), 'utf8');
        const linkGridMarkup = popupHtml.match(/<section class="link-grid"[\s\S]*?<\/section>/)?.[0];
        const tutorialIndex = linkGridMarkup?.indexOf('id="tutorial-link"') ?? -1;
        const rateUsIndex = linkGridMarkup?.indexOf('Rate Us') ?? -1;
        const feedbackIndex = linkGridMarkup?.indexOf('Feedback') ?? -1;

        expect(linkGridMarkup).toBeTruthy();
        expect(tutorialIndex).toBeGreaterThan(feedbackIndex);
        expect(feedbackIndex).toBeGreaterThan(rateUsIndex);
    });
});
