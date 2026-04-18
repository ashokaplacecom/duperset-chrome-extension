import React, { useState, useRef, useEffect, useCallback } from "react";
import { sendOTP, verifyOTP } from "../api/client";

import { S } from "./theme";
import { OtpBoxes } from "./components/OtpBoxes";

/* ─── Constants ─── */
const RESEND_COOLDOWN = 20;

const stepMeta = [
  { title: "Verify Your Email", desc: "Enter your Ashoka University email to get started." },
  { title: "Enter Verification Code", desc: "We've sent a 4-digit OTP to your email." },
  { title: "Emergency Request", desc: "Provide details for your emergency verification." },
  { title: "Request Submitted", desc: "Your verification request has been processed." },
];


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
