import React, { useState, useRef, useEffect, useCallback } from "react";
import { sendOTP, verifyOTP } from "../api/client";

/* ─── Constants ─── */
const RESEND_COOLDOWN = 20;

const stepMeta = [
  { title: "Verify Your Email", desc: "Enter your Ashoka University email to get started." },
  { title: "Enter Verification Code", desc: "We've sent a 4-digit OTP to your email." },
  { title: "Emergency Request", desc: "Provide details for your emergency verification." },
  { title: "Request Submitted", desc: "Your verification request has been processed." },
];

/* ─── Inline styles ─── */
const S = {
  overlay: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 10000, fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  card: {
    background: "#fff", borderRadius: 16, width: 420, maxWidth: "calc(100vw - 32px)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.18)", overflow: "hidden", position: "relative",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "24px 28px 8px",
  },
  title: { fontSize: 20, fontWeight: 700, color: "#111", margin: 0 },
  desc: { fontSize: 13, color: "#6b7280", margin: "4px 0 0" },
  body: { padding: "0 28px 28px" },
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
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 6 },
  optional: { fontWeight: 400, color: "#9ca3af" },
  input: (error) => ({
    width: "100%", height: 46, borderRadius: 12, border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`,
    padding: "0 14px", fontSize: 14, outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s",
  }),
  textarea: (error) => ({
    width: "100%", borderRadius: 12, border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`,
    padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box",
    resize: "vertical", minHeight: 80, fontFamily: "inherit", transition: "border-color 0.15s",
  }),

  /* OTP boxes */
  otpWrap: { display: "flex", gap: 10, justifyContent: "center", margin: "12px 0 18px" },
  otpBox: (filled) => ({
    width: 56, height: 56, borderRadius: 12, textAlign: "center", fontSize: 20,
    fontWeight: 600, border: `1.5px solid ${filled ? "#1e1b72" : "#e5e7eb"}`,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  }),

  /* Pill / alerts */
  pill: {
    display: "flex", alignItems: "center", gap: 10, background: "#eef0fb",
    borderRadius: 10, padding: "11px 14px", marginBottom: 14,
  },
  pillIcon: { color: "#1e1b72", fontSize: 16, flexShrink: 0 },
  pillText: { fontSize: 13, fontWeight: 600, color: "#1e1b72", wordBreak: "break-all" },

  alertWarning: {
    display: "flex", gap: 10, padding: "12px 14px", borderRadius: 10,
    background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e",
    fontSize: 13, lineHeight: 1.55, marginBottom: 18,
  },
  alertDanger: {
    display: "flex", gap: 10, padding: "12px 14px", borderRadius: 10,
    background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b",
    fontSize: 13, lineHeight: 1.55, marginBottom: 18,
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
  btnEmergency: (disabled) => ({
    display: "block", width: "100%", padding: "13px 0", border: "none", borderRadius: 50,
    background: disabled ? "#e88" : "#dc2626", color: "#fff", fontSize: 15,
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

  /* Success */
  successCircle: {
    width: 72, height: 72, borderRadius: "50%", background: "#d1fae5",
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
  },
  successIcon: { fontSize: 36, color: "#059669" },
  successTitle: { fontSize: 18, fontWeight: 700, color: "#111", textAlign: "center", margin: "0 0 6px" },
  successMsg: { fontSize: 14, color: "#6b7280", textAlign: "center", maxWidth: 320, margin: "0 auto" },
};

/* ─── OTP Input subcomponent ─── */
function OtpBoxes({ value, onChange, readOnly = false }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const digits = (value || "").split("");

  const handleInput = (i, e) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = [...digits];
    arr[i] = v;
    // pad to 4
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
          style={S.otpBox(!!digits[i])}
          maxLength={1}
          inputMode="numeric"
          value={digits[i] || ""}
          readOnly={readOnly}
          onChange={e => handleInput(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
export function VerificationForm({ visible, onClose }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [otp, setOtp] = useState("");
  const [pocMessage, setPocMessage] = useState("");
  const [company, setCompany] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

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

  /* ── Validation helpers ── */
  const validateEmail = (v) => {
    if (!v) return "Email is required";
    if (!v.includes("@")) return "Please enter a valid email address";
    if (!v.endsWith("@ashoka.edu.in")) return "Only @ashoka.edu.in emails are accepted";
    return null;
  };

  /* ── Reset ── */
  const resetAll = () => {
    setStep(0); setEmail(""); setEmailInput(""); setOtp(""); setPocMessage("");
    setCompany(""); setReason(""); setError(null); setSuccessMsg(""); setLoading(false);
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

  /* ── Step 1: Verify & Submit (normal) ── */
  const handleVerifySubmit = async () => {
    if (otp.replace(/\s/g, "").length !== 4) { setError("Please enter the complete 4-digit OTP."); return; }
    setError(null); setLoading(true);
    const res = await verifyOTP({ email, otp, message: pocMessage, isEmergency: false });
    setLoading(false);
    if (res.success) {
      setSuccessMsg("Your verification request has been submitted successfully. Your PoC has been notified.");
      setStep(3);
    } else {
      setError(res.message || "Verification failed.");
    }
  };

  /* ── Step 2: Emergency submit ── */
  const handleEmergencySubmit = async () => {
    if (otp.replace(/\s/g, "").length !== 4) { setError("Please enter the complete 4-digit OTP."); return; }
    if (!company.trim()) { setError("Company name is required."); return; }
    if (!reason.trim()) { setError("Please provide a valid reason."); return; }
    setError(null); setLoading(true);
    const message = `${company.trim()} | ${reason.trim()}`;
    const res = await verifyOTP({ email, otp, message, isEmergency: true });
    setLoading(false);
    if (res.success) {
      setSuccessMsg("Your emergency request has been submitted. Your PoC has been notified (24h SLA).");
      setStep(3);
    } else {
      setError(res.message || "Emergency request failed.");
    }
  };

  /* ── Resend ── */
  const handleResend = async () => {
    if (resendTimer > 0) return;
    const res = await sendOTP(email);
    if (res.success) startTimer();
    else setError(res.message || "Failed to resend OTP.");
  };

  /* ── Close handler ── */
  const handleClose = () => {
    resetAll();
    onClose?.();
  };

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
          {/* ─── Error ─── */}
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
              <div style={{ height: 14 }} />
              <button style={S.btnPrimary(loading)} disabled={loading} onClick={handleSendOtp}>
                {loading ? "Sending OTP…" : "Continue →"}
              </button>
            </div>
          )}

          {/* ═══════ STEP 1: OTP + Message ═══════ */}
          {step === 1 && (
            <div>
              {/* Email pill */}
              <div style={S.pill}>
                <span style={S.pillIcon}>✓</span>
                <span style={S.pillText}>OTP sent to {email}</span>
              </div>

              {/* Warning */}
              <div style={S.alertWarning}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>ⓘ</span>
                <span>
                  <strong>IMP:</strong> You can raise UPTO 3 emergency requests (per semester)
                  to expedite the verification process. Ensure details are accurate; rejected requests
                  still count towards your limit. Once a request is raised, further insistence may be penalized.
                </span>
              </div>

              {/* OTP */}
              <label style={S.label}>Enter OTP</label>
              <OtpBoxes value={otp} onChange={v => { setOtp(v); setError(null); }} />

              {/* Message */}
              <label style={S.label}>
                Message to PoC <span style={S.optional}>(optional)</span>
              </label>
              <textarea
                style={S.textarea(false)}
                placeholder="Add a message for your PoC (optional)"
                value={pocMessage}
                onChange={e => setPocMessage(e.target.value)}
                rows={3}
              />
              <div style={{ height: 10 }} />

              {/* Buttons */}
              <button
                style={S.btnEmergency(false)}
                onClick={() => { setError(null); setStep(2); }}
              >
                Submit as Emergency
              </button>
              <button
                style={S.btnPrimary(loading)}
                disabled={loading}
                onClick={handleVerifySubmit}
              >
                {loading ? "Verifying…" : "Verify & Submit"}
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

          {/* ═══════ STEP 2: Emergency ═══════ */}
          {step === 2 && (
            <div>
              {/* Danger banner */}
              <div style={S.alertDanger}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                <span>Emergency requests are limited. Only use this if you have a genuine, time-sensitive need.</span>
              </div>

              {/* OTP */}
              <label style={S.label}>OTP Code</label>
              <OtpBoxes value={otp} onChange={v => { setOtp(v); setError(null); }} />

              {/* Company */}
              <label style={S.label}>Company of Application</label>
              <input
                style={S.input(false)}
                type="text"
                placeholder="e.g. Google, McKinsey"
                value={company}
                onChange={e => { setCompany(e.target.value); setError(null); }}
              />
              <div style={{ height: 6 }} />

              {/* Reason */}
              <label style={S.label}>Valid Reason for Emergency</label>
              <textarea
                style={S.textarea(false)}
                placeholder="Explain why this is urgent…"
                value={reason}
                onChange={e => { setReason(e.target.value); setError(null); }}
                rows={3}
              />
              <div style={{ height: 10 }} />

              {/* Buttons */}
              <button style={S.btnEmergency(loading)} disabled={loading} onClick={handleEmergencySubmit}>
                {loading ? "Submitting…" : "Submit Emergency Request"}
              </button>
              <button style={S.btnGhost} onClick={() => { setError(null); setStep(1); }}>
                ‹ Back to regular submission
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
