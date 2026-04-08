import React, { useState, useRef, useEffect, useCallback } from "react";
import { sendOTP, verifyOTPOnly, createMajorMinorChange } from "../api/client";

/* ─── Constants ─── */
const RESEND_COOLDOWN = 20;

const stepMeta = [
  { title: "Verify Your Email",           desc: "Enter your Ashoka University email to get started." },
  { title: "Enter Verification Code",     desc: "We've sent a 4-digit OTP to your email." },
  { title: "Major / Minor Change Request",desc: "Fill in your current and prospective programme details." },
  { title: "Request Submitted",           desc: "Your change request has been processed successfully." },
];

/* ─── Inline styles (mirrors ModalVerify.jsx) ─── */
const S = {
  overlay: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 10000, fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  card: {
    background: "#fff", borderRadius: 16, width: 460, maxWidth: "calc(100vw - 32px)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.18)", overflow: "hidden", position: "relative",
    maxHeight: "calc(100vh - 40px)", overflowY: "auto",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "24px 28px 8px",
  },
  title: { fontSize: 20, fontWeight: 700, color: "#111", margin: 0 },
  desc:  { fontSize: 13, color: "#6b7280", margin: "4px 0 0" },
  body:  { padding: "0 28px 28px" },
  closeBtn: {
    position: "absolute", top: 14, right: 14, background: "none", border: "none",
    fontSize: 18, cursor: "pointer", color: "#9ca3af", lineHeight: 1,
  },

  /* Step dots */
  dots: { display: "flex", gap: 5, paddingTop: 4 },
  dot: (active) => ({
    height: 6, borderRadius: active ? 3 : "50%",
    width: active ? 22 : 6, background: active ? "#1e1b72" : "#d1d5db",
    transition: "all 0.25s",
  }),

  /* Inputs */
  label:    { display: "block", fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 6 },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  optional: { fontWeight: 400, color: "#9ca3af", fontSize: 12 },
  input: (error) => ({
    width: "100%", height: 46, borderRadius: 12, border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`,
    padding: "0 14px", fontSize: 14, outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s", fontFamily: "inherit",
  }),
  inputDisabled: {
    width: "100%", height: 46, borderRadius: 12, border: "1.5px solid #e5e7eb",
    padding: "0 14px", fontSize: 14, outline: "none", boxSizing: "border-box",
    background: "#f9fafb", color: "#6b7280", cursor: "not-allowed",
  },

  /* OTP boxes */
  otpWrap: { display: "flex", gap: 10, justifyContent: "center", margin: "12px 0 18px" },
  otpBox: (filled, error) => ({
    width: 56, height: 56, borderRadius: 12, textAlign: "center", fontSize: 20,
    fontWeight: 600, border: `1.5px solid ${error ? "#ef4444" : filled ? "#1e1b72" : "#e5e7eb"}`,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  }),

  /* Pill / alerts */
  pill: {
    display: "flex", alignItems: "center", gap: 10, background: "#eef0fb",
    borderRadius: 10, padding: "11px 14px", marginBottom: 14,
  },
  pillIcon: { color: "#1e1b72", fontSize: 16, flexShrink: 0 },
  pillText: { fontSize: 13, fontWeight: 600, color: "#1e1b72", wordBreak: "break-all" },

  alertInfo: {
    display: "flex", gap: 10, padding: "12px 14px", borderRadius: 10,
    background: "#eef0fb", border: "1px solid #c7d2fe", color: "#3730a3",
    fontSize: 13, lineHeight: 1.55, marginBottom: 14,
  },
  alertWarning: {
    display: "flex", gap: 10, padding: "12px 14px", borderRadius: 10,
    background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e",
    fontSize: 13, lineHeight: 1.55, marginBottom: 14,
  },
  errorBox: {
    display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10,
    background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
    fontSize: 13, marginBottom: 14,
  },

  /* Buttons */
  btnPrimary: (disabled) => ({
    display: "block", width: "100%", padding: "13px 0", border: "none", borderRadius: 50,
    background: disabled ? "#8a88c0" : "#1e1b72", color: "#fff", fontSize: 15,
    fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    marginBottom: 10, transition: "background 0.15s",
  }),
  btnGhost: {
    display: "block", width: "100%", background: "none", border: "none",
    color: "#6b7280", fontSize: 14, cursor: "pointer", padding: 8, textAlign: "center",
  },
  resendWrap: { textAlign: "center", fontSize: 13, color: "#6b7280", marginTop: 8 },
  resendLink: (enabled) => ({
    fontWeight: 700, background: "none", border: "none",
    color: enabled ? "#1e1b72" : "#b0b0b0", cursor: enabled ? "pointer" : "not-allowed",
    textDecoration: enabled ? "underline" : "none", fontSize: 13,
  }),

  /* Grid for optional pairs */
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  /* Success */
  successCircle: {
    width: 72, height: 72, borderRadius: "50%", background: "#d1fae5",
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
  },
  successIcon:  { fontSize: 36, color: "#059669" },
  successTitle: { fontSize: 18, fontWeight: 700, color: "#111", textAlign: "center", margin: "0 0 6px" },
  successMsg:   { fontSize: 14, color: "#6b7280", textAlign: "center", maxWidth: 340, margin: "0 auto" },

  /* Spacers */
  sp6:  { height: 6 },
  sp10: { height: 10 },
  sp14: { height: 14 },
};

/* ─── OTP Input subcomponent (same as ModalVerify) ─── */
function OtpBoxes({ value, onChange, hasError = false }) {
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
        />
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
export function MajorMinorChangeForm({ visible, onClose }) {
  const [step, setStep]               = useState(0);
  const [email, setEmail]             = useState("");
  const [emailInput, setEmailInput]   = useState("");
  const [otp, setOtp]                 = useState("");
  const [studentId, setStudentId]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [successMsg, setSuccessMsg]   = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  /* Change request fields */
  const [currentMajor,      setCurrentMajor]      = useState("");
  const [prospectiveMajor,  setProspectiveMajor]  = useState("");
  const [currentMinor,      setCurrentMinor]       = useState("");
  const [prospectiveMinor,  setProspectiveMinor]  = useState("");

  /* ── Resend timer ── */
  const startTimer = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  /* ── Validation ── */
  const validateEmail = (v) => {
    if (!v) return "Email is required";
    if (!v.includes("@")) return "Please enter a valid email address";
    if (!v.endsWith("@ashoka.edu.in")) return "Only @ashoka.edu.in emails are accepted";
    return null;
  };

  /* ── Reset ── */
  const resetAll = () => {
    setStep(0); setEmail(""); setEmailInput(""); setOtp(""); setStudentId(null);
    setCurrentMajor(""); setProspectiveMajor(""); setCurrentMinor(""); setProspectiveMinor("");
    setError(null); setSuccessMsg(""); setLoading(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(0);
  };

  /* ── Step 0: Send OTP ── */
  const handleSendOtp = async () => {
    const err = validateEmail(emailInput);
    if (err) { setError(err); return; }
    setError(null); setLoading(true);
    const res = await sendOTP(emailInput);
    setLoading(false);
    if (res.success) {
      setEmail(emailInput);
      startTimer();
      setStep(1);
    } else {
      setError(res.message || "Failed to send OTP.");
    }
  };

  /* ── Step 1: Verify OTP only (get studentId) ── */
  const handleVerifyOtp = async () => {
    if (otp.replace(/\s/g, "").length !== 4) { setError("Please enter the complete 4-digit OTP."); return; }
    setError(null); setLoading(true);
    const res = await verifyOTPOnly({ email, otp });
    setLoading(false);
    if (res.success) {
      setStudentId(res.studentId);
      setStep(2);
    } else {
      setError(res.message || "OTP verification failed.");
    }
  };

  /* ── Step 2: Submit change request ── */
  const handleChangeSubmit = async () => {
    const fields = [currentMajor, prospectiveMajor, currentMinor, prospectiveMinor];
    if (fields.every(f => !f.trim())) {
      setError("Please fill in at least one major or minor field.");
      return;
    }
    setError(null); setLoading(true);
    const res = await createMajorMinorChange({
      studentId,
      email,
      currentMajor:     currentMajor.trim()     || undefined,
      prospectiveMajor: prospectiveMajor.trim() || undefined,
      currentMinor:     currentMinor.trim()     || undefined,
      prospectiveMinor: prospectiveMinor.trim() || undefined,
    });
    setLoading(false);
    if (res.success) {
      setSuccessMsg("Your major/minor change request has been submitted successfully. You'll receive a confirmation email shortly.");
      setStep(3);
    } else {
      setError(res.message || "Failed to submit request.");
    }
  };

  /* ── Resend ── */
  const handleResend = async () => {
    if (resendTimer > 0) return;
    const res = await sendOTP(email);
    if (res.success) startTimer();
    else setError(res.message || "Failed to resend OTP.");
  };

  /* ── Close ── */
  const handleClose = () => { resetAll(); onClose?.(); };

  if (!visible) return null;

  const meta = stepMeta[step];
  const progressStep = Math.min(step, 2);

  return (
    <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={S.card}>
        {/* Close */}
        <button style={S.closeBtn} onClick={handleClose}>✕</button>

        {/* Header */}
        <div style={S.header}>
          <div>
            <h2 style={S.title}>{meta.title}</h2>
            <p style={S.desc}>{meta.desc}</p>
          </div>
          {step < 3 && (
            <div style={S.dots}>
              {[0, 1, 2].map(i => <div key={i} style={S.dot(progressStep === i)} />)}
            </div>
          )}
        </div>

        <div style={S.body}>
          {/* ── Error ── */}
          {error && (
            <div style={S.errorBox}>
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ═══════ STEP 0: Email ═══════ */}
          {step === 0 && (
            <div>
              <label style={S.label}>Student Email</label>
              <input
                style={S.input(false)}
                type="email"
                placeholder="yourname@ashoka.edu.in"
                value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setError(null); }}
                disabled={loading}
                onKeyDown={e => { if (e.key === "Enter") handleSendOtp(); }}
              />
              <div style={S.sp14} />
              <button style={S.btnPrimary(loading)} disabled={loading} onClick={handleSendOtp}>
                {loading ? "Sending OTP…" : "Continue →"}
              </button>
            </div>
          )}

          {/* ═══════ STEP 1: OTP ═══════ */}
          {step === 1 && (
            <div>
              {/* Email pill */}
              <div style={S.pill}>
                <span style={S.pillIcon}>✓</span>
                <span style={S.pillText}>OTP sent to {email}</span>
              </div>

              {/* Info */}
              <div style={S.alertInfo}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>ⓘ</span>
                <span>
                  Major/minor change requests are subject to quota limits.
                  Ensure your selections are accurate before submitting.
                </span>
              </div>

              {/* OTP */}
              <label style={S.label}>Enter OTP</label>
              <OtpBoxes value={otp} onChange={v => { setOtp(v); setError(null); }} />

              <div style={S.sp6} />
              <button style={S.btnPrimary(loading)} disabled={loading} onClick={handleVerifyOtp}>
                {loading ? "Verifying…" : "Verify OTP →"}
              </button>

              {/* Resend */}
              <div style={S.resendWrap}>
                Didn't get OTP?{" "}
                <button style={S.resendLink(resendTimer === 0)} onClick={handleResend} disabled={resendTimer > 0}>
                  Resend{resendTimer > 0 ? ` (${resendTimer}s)` : ""}
                </button>
              </div>
            </div>
          )}

          {/* ═══════ STEP 2: Change Request Form ═══════ */}
          {step === 2 && (
            <div>
              {/* Info */}
              <div style={S.alertInfo}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>ⓘ</span>
                <span>
                  Changes to your major or minor are subject to approval by the relevant
                  academic departments. Please ensure your selections are accurate.
                </span>
              </div>

              {/* Email (read-only) */}
              <label style={S.label}>Email</label>
              <input style={S.inputDisabled} type="email" value={email} readOnly disabled />
              <div style={S.sp10} />

              {/* Optional fields note */}
              <div style={S.alertWarning}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>ⓘ</span>
                <span>
                  Fill all relevant fields. Leave blank if not applicable.
                  If declaring a minor for the first time, write <strong>NA</strong> in Current Minor.
                </span>
              </div>

              {/* Major row */}
              <div style={S.grid2}>
                <div>
                  <div style={S.labelRow}>
                    <label style={{ ...S.label, marginBottom: 0 }}>Current Major</label>
                    <span style={S.optional}>optional</span>
                  </div>
                  <div style={S.sp6} />
                  <input
                    style={S.input(false)}
                    type="text"
                    placeholder="e.g. Economics"
                    value={currentMajor}
                    onChange={e => { setCurrentMajor(e.target.value); setError(null); }}
                  />
                </div>
                <div>
                  <div style={S.labelRow}>
                    <label style={{ ...S.label, marginBottom: 0 }}>Prospective Major</label>
                    <span style={S.optional}>optional</span>
                  </div>
                  <div style={S.sp6} />
                  <input
                    style={S.input(false)}
                    type="text"
                    placeholder="e.g. CS"
                    value={prospectiveMajor}
                    onChange={e => { setProspectiveMajor(e.target.value); setError(null); }}
                  />
                </div>
              </div>
              <div style={S.sp10} />

              {/* Minor row */}
              <div style={S.grid2}>
                <div>
                  <div style={S.labelRow}>
                    <label style={{ ...S.label, marginBottom: 0 }}>Current Minor</label>
                    <span style={S.optional}>optional</span>
                  </div>
                  <div style={S.sp6} />
                  <input
                    style={S.input(false)}
                    type="text"
                    placeholder="e.g. Math (or NA)"
                    value={currentMinor}
                    onChange={e => { setCurrentMinor(e.target.value); setError(null); }}
                  />
                </div>
                <div>
                  <div style={S.labelRow}>
                    <label style={{ ...S.label, marginBottom: 0 }}>Prospective Minor</label>
                    <span style={S.optional}>optional</span>
                  </div>
                  <div style={S.sp6} />
                  <input
                    style={S.input(false)}
                    type="text"
                    placeholder="e.g. Philosophy"
                    value={prospectiveMinor}
                    onChange={e => { setProspectiveMinor(e.target.value); setError(null); }}
                  />
                </div>
              </div>
              <div style={S.sp14} />

              <button style={S.btnPrimary(loading)} disabled={loading} onClick={handleChangeSubmit}>
                {loading ? "Submitting…" : "Submit Request"}
              </button>
              <button style={S.btnGhost} onClick={() => { setError(null); setStep(1); }}>
                ‹ Back to OTP
              </button>
            </div>
          )}

          {/* ═══════ STEP 3: Success ═══════ */}
          {step === 3 && (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <div style={S.successCircle}>
                <span style={S.successIcon}>✓</span>
              </div>
              <h3 style={S.successTitle}>Request Submitted!</h3>
              <p style={S.successMsg}>{successMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
