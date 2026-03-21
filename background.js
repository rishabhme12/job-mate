const UNINSTALL_FEEDBACK_URL = 'https://tally.so/r/lbR85o';
chrome.runtime.setUninstallURL(UNINSTALL_FEEDBACK_URL);

// Open onboarding once on fresh install.
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
    }
});
