import React, { useState } from "react";
import { VerificationForm } from "./ui/ModalVerify";
import { MajorMinorChangeForm } from "./ui/ModalMajorMinor";

export default function App({ onMounted }) {
  const [showVerify, setShowVerify]       = useState(false);
  const [showMajorMinor, setShowMajorMinor] = useState(false);

  // Expose open/close to the imperative sidebar code via callback
  React.useEffect(() => {
    onMounted?.({
      openVerify:      () => setShowVerify(true),
      closeVerify:     () => setShowVerify(false),
      openMajorMinor:  () => setShowMajorMinor(true),
      closeMajorMinor: () => setShowMajorMinor(false),
    });
  }, [onMounted]);

  return (
    <>
      <VerificationForm
        visible={showVerify}
        onClose={() => setShowVerify(false)}
      />
      <MajorMinorChangeForm
        visible={showMajorMinor}
        onClose={() => setShowMajorMinor(false)}
      />
    </>
  );
}
