document.addEventListener("DOMContentLoaded", () => {
  const openSidebarButton = document.getElementById("open-sidebar");
  const statusMessage = document.getElementById("status-message");
  let activeTabId = null;
  let heartbeatInterval = null;

  // Initialize communication with the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;

    const tab = tabs[0];
    const isSuperset = tab.url && tab.url.includes("app.joinsuperset.com/students");

    if (isSuperset) {
      activeTabId = tab.id;

      // Immediately notify that popup is opened
      chrome.tabs.sendMessage(activeTabId, { action: "popupOpened" }, (response) => {
        if (chrome.runtime.lastError) {
          console.log("Content script not ready or not loaded yet.");
        }
      });

      // Start the heartbeat to keep the overlay alive
      heartbeatInterval = setInterval(() => {
        chrome.tabs.sendMessage(activeTabId, { action: "popupHeartbeat" }, (response) => {
          if (chrome.runtime.lastError) {
            clearInterval(heartbeatInterval);
          }
        });
      }, 250);

      // Handle sidebar open click
      openSidebarButton.addEventListener("click", () => {
        chrome.tabs.sendMessage(activeTabId, { action: "openSidebar" }, (response) => {
          if (chrome.runtime.lastError) {
            alert("Could not open sidebar. Please refresh the page and try again.");
          } else {
            // Close the popup after opening the sidebar
            window.close();
          }
        });
      });
    } else {
      // Not on Superset Student Portal
      if (statusMessage) {
        statusMessage.style.display = "block";
        statusMessage.innerHTML = `
          <span>⚠️ <strong>Not on Student Portal:</strong></span>
          <p>Please navigate to your <a href="https://app.joinsuperset.com/students/" target="_blank" style="color: #6366f1; text-decoration: underline; font-weight: 500;">Superset Student Portal</a> to use Duperset features.</p>
        `;
      }
      if (openSidebarButton) {
        openSidebarButton.disabled = true;
        openSidebarButton.style.opacity = "0.5";
        openSidebarButton.style.cursor = "not-allowed";
      }
    }
  });

  // Cleanup interval on page unload (although popup lifecycle is short, it's good practice)
  window.addEventListener("unload", () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
  });
});
