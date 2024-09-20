chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed and ready to use.");
});

