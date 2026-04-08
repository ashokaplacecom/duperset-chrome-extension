import React, { useState, useEffect } from "react";
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

  return (
    <>
      <Sidebar
        onVerify={() => setShowVerify(true)}
        onMajorMinor={() => setShowMajorMinor(true)}
        onViewLatest={() => setShowLatest(true)}
        onViewHistory={() => setShowArchives(true)}
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
    </>
  );
}


