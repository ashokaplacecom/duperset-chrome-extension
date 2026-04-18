import React, { useState } from "react";
import { getVerificationStatus, getMajorMinorStatus } from "../api/client";

import { S } from "./theme";

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
