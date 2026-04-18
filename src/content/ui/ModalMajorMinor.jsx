import React, { useState, useRef, useEffect, useCallback } from "react";
import { sendOTP, verifyOTPOnly, createMajorMinorChange } from "../api/client";

import { S } from "./theme";
import { OtpBoxes } from "./components/OtpBoxes";

/* ─── Constants ─── */
const RESEND_COOLDOWN = 20;

const stepMeta = [
  { title: "Verify Your Email", desc: "Enter your Ashoka University email to get started." },
  { title: "Enter Verification Code", desc: "We've sent a 4-digit OTP to your email." },
  { title: "Major / Minor Change Request", desc: "Fill in your current and prospective programme details." },
  { title: "Request Submitted", desc: "Your change request has been processed successfully." },
];

/* ─── Main Component ─── */
export function MajorMinorChangeForm({ visible, onClose }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [otp, setOtp] = useState("");
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  /* Change request fields */
  const [currentMajor, setCurrentMajor] = useState("");
  const [prospectiveMajor, setProspectiveMajor] = useState("");
  const [currentMinor, setCurrentMinor] = useState("");
  const [prospectiveMinor, setProspectiveMinor] = useState("");

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
      currentMajor: currentMajor.trim() || undefined,
      prospectiveMajor: prospectiveMajor.trim() || undefined,
      currentMinor: currentMinor.trim() || undefined,
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
