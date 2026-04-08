import React, { useState } from "react";
import { getVerificationStatus, getMajorMinorStatus } from "../api/client";

/* ─── Constants ─── */
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
  closeBtn: {
    position: "absolute", top: 14, right: 14, background: "none", border: "none",
    fontSize: 18, cursor: "pointer", color: "#9ca3af", lineHeight: 1,
  },
  body: { padding: "0 28px 28px" },

  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 6 },
  input: (error) => ({
    width: "100%", height: 46, borderRadius: 12, border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`,
    padding: "0 14px", fontSize: 14, outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s",
  }),

  btnPrimary: (disabled) => ({
    display: "block", width: "100%", padding: "13px 0", border: "none", borderRadius: 50,
    background: disabled ? "#8a88c0" : "#1e1b72", color: "#fff", fontSize: 15,
    fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    marginBottom: 10, transition: "background 0.15s",
  }),

  errorBox: {
    display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10,
    background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
    fontSize: 13, marginBottom: 14,
  },

  /* Status specific styles */
  statusPillWrapper: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f3f4f6"
  },
  statusType: { fontSize: 15, fontWeight: 700, color: "#111" },
  
  statusBadge: (status) => {
    let bg = "#fffbeb", color = "#92400e", border = "#fde68a";
    if (status === "approved") { bg = "#ecfdf5"; color = "#065f46"; border = "#a7f3d0"; }
    if (status === "rejected") { bg = "#fef2f2"; color = "#991b1b"; border = "#fecaca"; }
    return {
      fontSize: 12, fontWeight: 700, textTransform: "capitalize",
      padding: "4px 10px", borderRadius: 6, background: bg, color: color, border: `1px solid ${border}`
    };
  },

  row: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  rowLabel: { fontSize: 13, color: "#6b7280" },
  rowValue: { fontSize: 13, fontWeight: 600, color: "#111", textAlign: "right" },

  emptyState: { textAlign: "center", padding: "20px 0" },
  emptyText: { fontSize: 14, color: "#6b7280", margin: "0" },
};

export function LatestRequestModal({ visible, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [latestRequest, setLatestRequest] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!email || !email.endsWith("@ashoka.edu.in")) {
      setError("Please enter a valid @ashoka.edu.in email.");
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const [vRes, mmRes] = await Promise.all([
        getVerificationStatus(email),
        getMajorMinorStatus(email)
      ]);
      
      let winner = null;
      const vData = vRes.success ? vRes.data : null;
      const mmData = mmRes.success ? mmRes.data : null;
      
      if (vData && mmData) {
        winner = new Date(vData.raised_at) > new Date(mmData.raised_at) 
          ? { ...vData, type: "Profile Verification" }
          : { ...mmData, type: "Major/Minor Change" };
      } else if (vData) {
        winner = { ...vData, type: "Profile Verification" };
      } else if (mmData) {
        winner = { ...mmData, type: "Major/Minor Change" };
      }
      
      setLatestRequest(winner);
      setSearched(true);
    } catch (err) {
      setError("Failed to fetch status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setEmail("");
    setError(null);
    setLatestRequest(null);
    setSearched(false);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!visible) return null;

  const formatDate = (iso) => {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleDateString("en-GB", { 
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Calculate generic deadline (48 hours for normal verifications, can be adjusted if needed)
  const calculateDeadline = (iso, type) => {
    if (!iso) return "N/A";
    const date = new Date(iso);
    // Rough estimate: usually 48 hr SLA for general requests
    date.setHours(date.getHours() + 48); 
    return date.toLocaleDateString("en-GB", { 
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div style={S.card}>
        <button style={S.closeBtn} onClick={handleClose}>✕</button>
        
        <div style={S.header}>
          <div>
            <h2 style={S.title}>Request Status</h2>
            <p style={S.desc}>Track your ongoing applications and submissions.</p>
          </div>
        </div>

        <div style={{ height: 24 }} />

        <div style={S.body}>
          {error && (
            <div style={S.errorBox}>
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {!searched ? (
            <div>
              <label style={S.label}>Student Email</label>
              <input
                style={S.input(false)}
                type="email"
                placeholder="yourname@ashoka.edu.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
              <div style={{ height: 14 }} />
              <button 
                style={S.btnPrimary(loading)} 
                onClick={handleSearch} 
                disabled={loading}
              >
                {loading ? "Searching…" : "Track Request"}
              </button>
            </div>
          ) : (
            <div>
              {latestRequest ? (
                <div style={{ background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
                  <div style={S.statusPillWrapper}>
                    <div style={S.statusType}>{latestRequest.type}</div>
                    <div style={S.statusBadge(latestRequest.status)}>
                      {latestRequest.status}
                    </div>
                  </div>

                  <div style={S.row}>
                    <span style={S.rowLabel}>Raised on</span>
                    <span style={S.rowValue}>{formatDate(latestRequest.raised_at)}</span>
                  </div>
                  
                  {latestRequest.status === "pending" && (
                    <div style={S.row}>
                      <span style={S.rowLabel}>Expected SLA Deadline</span>
                      <span style={S.rowValue}>{calculateDeadline(latestRequest.raised_at, latestRequest.type)}</span>
                    </div>
                  )}

                  {latestRequest.modified_at && (
                    <div style={{ ...S.row, marginBottom: 0 }}>
                      <span style={S.rowLabel}>Last Updated</span>
                      <span style={S.rowValue}>{formatDate(latestRequest.modified_at)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={S.emptyState}>
                  <p style={S.emptyText}>No recent requests found for <strong>{email}</strong> in the last 7 days.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
