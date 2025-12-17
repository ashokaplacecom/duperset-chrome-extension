let popupWindowId = null;
let popupWindow2Id = null;

// --- CONFIGURATION (API details stored here) ---
const API_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbyCTOnOEHUVqRNvd3EeNNCpA00YgZNOFvuzoyzydp6aAIBwm-mkdA71HbDmfOGtKkE6/exec';
const API_KEY          = 'ibrahimdoesnotknowcoding';
const API_PARAMS       = `apiKey=${API_KEY}&days=7&redirect=false`;

/**
 * Unified message listener for all content script messages.
 * @param {Object} message The message sent from the content script.
 * @param {Object} sender Information about the sender of the message.
 * @param {Function} sendResponse Function to call with the response.
 * @returns {boolean} True to indicate that sendResponse will be called asynchronously.
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
    
    if (message.action === "fetchOpportunities") {
        console.log('[Background] Fetching opportunities from Apps Script API');
        fetchDataFromAppsScript(sendResponse);
        // Returning true is necessary for asynchronous response
        return true; 
    }
});

/**
 * Performs the actual cross-origin fetch request for opportunity data.
 * @param {Function} sendResponse The function to send the response back to the content script.
 */
async function fetchDataFromAppsScript(sendResponse) {
    const fullUrl = `${API_ENDPOINT_URL}?${API_PARAMS}`;
    console.log('[Background] Fetching from:', fullUrl);
    
    try {
        const res = await fetch(fullUrl, {credentials: 'omit'});
        
        if (!res.ok) {
            throw new Error(`API request failed with status ${res.status}`);
        }
        
        const data = await res.json(); 
        console.log('[Background] Successfully fetched opportunities:', data.length, 'items');

        // The API returns an array directly
        sendResponse(data);

    } catch (err) {
        console.error('[Background] API fetch failed:', err);
        // Send back a structured error message
        sendResponse({
            error: true,
            message: `Failed to connect to Apps Script API: ${err.message}`
        });
    }
}