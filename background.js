const UNINSTALL_FEEDBACK_URL = 'https://tally.so/r/lbR85o';
chrome.runtime.setUninstallURL(UNINSTALL_FEEDBACK_URL);

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Open the welcome page on fresh install
        chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
    }
});

// Listen for clicks on the extension action icon in the toolbar
chrome.action.onClicked.addListener((tab) => {
    // Check if a welcome page tab is already open
    const urlToMatch = chrome.runtime.getURL('welcome.html');
    chrome.tabs.query({ url: urlToMatch }, (tabs) => {
        if (tabs.length > 0) {
            // If it's already open, focus it
            chrome.tabs.update(tabs[0].id, { active: true });
            chrome.windows.update(tabs[0].windowId, { focused: true });
        } else {
            // If not open, create a new one
            chrome.tabs.create({ url: urlToMatch });
        }
    });
});
