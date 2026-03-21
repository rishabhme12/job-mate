document.addEventListener('DOMContentLoaded', () => {
    const manifest = chrome.runtime.getManifest();
    const title = document.getElementById('popup-title');
    const version = document.getElementById('popup-version');
    const icon = document.getElementById('popup-icon');
    const tutorialLink = document.getElementById('tutorial-link');

    if (title) {
        title.textContent = manifest.name || 'Jobs Hero';
    }

    if (version) {
        version.textContent = `v${manifest.version}`;
    }

    if (icon && manifest.icons) {
        icon.src = manifest.icons['48'] || manifest.icons['128'] || icon.src;
    }

    if (tutorialLink) {
        tutorialLink.href = chrome.runtime.getURL('welcome.html');
    }
});
