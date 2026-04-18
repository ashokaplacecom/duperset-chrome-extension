import React, { useRef } from "react";
import { S } from "../theme";

export function OtpBoxes({ value, onChange, hasError = false, readOnly = false }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const digits = (value || "").split("");

  const handleInput = (i, e) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = [...digits];
    arr[i] = v;
    while (arr.length < 4) arr.push("");
    onChange(arr.join(""));
    if (v && i < 3) refs[i + 1].current?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs[i - 1].current?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 4);
    onChange(text.padEnd(4, "").slice(0, 4));
    refs[Math.min(text.length, 3)].current?.focus();
  };

  return (
    <div style={S.otpWrap}>
      {[0, 1, 2, 3].map(i => (
        <input
          key={i}
          ref={refs[i]}
          style={S.otpBox(!!digits[i], hasError)}
          maxLength={1}
          inputMode="numeric"
          value={digits[i] || ""}
          onChange={e => handleInput(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
