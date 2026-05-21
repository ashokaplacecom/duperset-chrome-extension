import React, { useState, useEffect, useRef } from "react";
import { VerificationForm } from "./ui/ModalVerify.jsx";
import { MajorMinorChangeForm } from "./ui/ModalMajorMinor.jsx";
import { LatestRequestModal } from "./ui/ModalLatestRequest.jsx";
import { ModalArchives } from "./ui/ModalArchives.jsx";
import { Sidebar } from "./ui/Sidebar.jsx";

export default function App({ onMounted }) {
  const [showVerify, setShowVerify] = useState(false);
  const [showMajorMinor, setShowMajorMinor] = useState(false);
  const [showLatest, setShowLatest] = useState(false);
  const [showArchives, setShowArchives] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [popupActive, setPopupActive] = useState(false);
  const lastHeartbeatRef = useRef(0);

  // Expose an imperative API via onMounted if provided,
  // matching the pattern index.jsx might expect.
  useEffect(() => {
    if (onMounted) {
      onMounted({
        openVerify: () => setShowVerify(true),
        closeVerify: () => setShowVerify(false),
        openMajorMinor: () => setShowMajorMinor(true),
        closeMajorMinor: () => setShowMajorMinor(false),
        openLatest: () => setShowLatest(true),
        closeLatest: () => setShowLatest(false),
        openArchives: () => setShowArchives(true),
        closeArchives: () => setShowArchives(false),
      });
    }
  }, [onMounted]);

  // Handle messages from extension popup
  useEffect(() => {
    const handleMessage = (message, sender, sendResponse) => {
      if (message.action === "popupOpened") {
        setPopupActive(true);
        lastHeartbeatRef.current = Date.now();
        if (sendResponse) sendResponse({ status: "ok" });
      } else if (message.action === "popupHeartbeat") {
        setPopupActive(true);
        lastHeartbeatRef.current = Date.now();
        if (sendResponse) sendResponse({ status: "ok" });
      } else if (message.action === "openSidebar") {
        setSidebarOpen(true);
        if (sendResponse) sendResponse({ status: "ok" });
      }
      return true; // Keep message channel open for async responses
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Monitor heartbeat to detect when the popup is closed
  useEffect(() => {
    if (!popupActive) return;
    const interval = setInterval(() => {
      if (Date.now() - lastHeartbeatRef.current > 750) {
        setPopupActive(false);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [popupActive]);

  return (
    <>
      <Sidebar
        onVerify={() => setShowVerify(true)}
        onMajorMinor={() => setShowMajorMinor(true)}
        onViewLatest={() => setShowLatest(true)}
        onViewHistory={() => setShowArchives(true)}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <VerificationForm
        visible={showVerify}
        onClose={() => setShowVerify(false)}
      />

      <MajorMinorChangeForm
        visible={showMajorMinor}
        onClose={() => setShowMajorMinor(false)}
      />

      <LatestRequestModal
        visible={showLatest}
        onClose={() => setShowLatest(false)}
      />
      
      <ModalArchives
        visible={showArchives}
        onClose={() => setShowArchives(false)}
      />

      {/* Background Overlay when Popup is active */}
      {popupActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(1.5px)",
            zIndex: 9998,
            pointerEvents: "auto",
          }}
        />
      )}

      {/* Tooltip & Arrow pointing to sidebar button when Popup is active */}
      {popupActive && !sidebarOpen && (
        <>
          <style>{`
            @keyframes duperset-bounce {
              0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
              }
              40% {
                transform: translateY(-12px);
              }
              60% {
                transform: translateY(-6px);
              }
            }
          `}</style>
          <div
            style={{
              position: "fixed",
              bottom: 92,
              right: 12,
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontFamily: "system-ui, -apple-system, sans-serif",
              animation: "duperset-bounce 2s infinite",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                background: "#1e1b72",
                color: "white",
                padding: "10px 16px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: "600",
                boxShadow: "0 10px 25px rgba(30, 27, 114, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                textAlign: "center",
                maxWidth: "200px",
              }}
            >
              Click here to open the Sidebar!
            </div>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "8px solid #1e1b72",
                marginTop: "-1px",
              }}
            />
          </div>
        </>
      )}
    </>
  );
}


