/// <reference types="chrome" />

// Background service worker
// Handles Side Panel behavior

// Force side panel to open on action click
// @ts-ignore
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: any) => console.error(error));

// Optional: Context menu to open side panel
// Requires the "contextMenus" permission (public/manifest.json). removeAll first so an update
// doesn't fail with a duplicate-id error.
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'openSidePanel',
            title: 'Open Side Panel',
            contexts: ['all']
        });
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openSidePanel') {
        // This requires a tabId to open the specific window's side panel
        if (tab?.id) {
            // @ts-ignore
            chrome.sidePanel.open({ tabId: tab.id });
        }
    }
});
