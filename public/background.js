let popupWindowId = null;
let popupWindow2Id = null;

/**
 * Unified message listener for all content script messages.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "verifyPopup") {
    chrome.windows.create({
      url: chrome.runtime.getURL("verify-my-profile.html"),
      type: "popup",
      width: 800,
      height: 600,
    }, (popup) => {
      popupWindowId = popup.id;
    });
    return false;
  }

  if (message.action === "majorMinorPopup") {
    chrome.windows.create({
      url: chrome.runtime.getURL("major-minor.html"),
      type: "popup",
      width: 800,
      height: 720
    }, (popup) => {
      popupWindow2Id = popup.id;
    });
    return false;
  }
});
