import React, { useState } from "react";
import { getVerificationArchives, getMajorMinorArchives } from "../api/client";

import { S } from "./theme";

export function ModalArchives({ visible, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [archives, setArchives] = useState([]);
  const [searched, setSearched] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all', 'verification', 'major-minor'

  const handleSearch = async () => {
    if (!email || !email.endsWith("@ashoka.edu.in")) {
      setError("Please enter a valid @ashoka.edu.in email.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const [vRes, mmRes] = await Promise.all([
        getVerificationArchives(email),
        getMajorMinorArchives(email)
      ]);

      const vData = (vRes.success && vRes.data) ? vRes.data.map(d => ({ ...d, type: "Profile Verification" })) : [];
      const mmData = (mmRes.success && mmRes.data) ? mmRes.data.map(d => ({ ...d, type: "Major/Minor Change" })) : [];

      // Combine and sort descending by raised_at
      const combined = [...vData, ...mmData].sort((a, b) => new Date(b.raised_at) - new Date(a.raised_at));

      setArchives(combined);
      setSearched(true);
    } catch (err) {
      setError("Failed to fetch archives. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setEmail("");
    setError(null);
    setArchives([]);
    setSearched(false);
    setLoading(false);
    setFilter("all");
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
    });
  };

  const filteredArchives = archives.filter(item => {
    if (filter === "all") return true;
    if (filter === "verification" && item.type === "Profile Verification") return true;
    if (filter === "major-minor" && item.type === "Major/Minor Change") return true;
    return false;
  });

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div style={S.card}>
        <button style={S.closeBtn} onClick={handleClose}>✕</button>

        <div style={S.header}>
          <div>
            <h2 style={S.title}>Request History</h2>
            <p style={S.desc}>View your past approved and rejected requests.</p>
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
                {loading ? "Searching…" : "View History"}
              </button>
            </div>
          ) : (
            <div>
              {archives.length > 0 ? (
                <>
                  <div style={S.filterWrap}>
                    <button style={S.filterBtn(filter === "all")} onClick={() => setFilter("all")}>All Records</button>
                    <button style={S.filterBtn(filter === "verification")} onClick={() => setFilter("verification")}>Verifications</button>
                    <button style={S.filterBtn(filter === "major-minor")} onClick={() => setFilter("major-minor")}>Major/Minor</button>
                  </div>

                  <div style={S.list}>
                    {filteredArchives.length > 0 ? filteredArchives.map((item, idx) => (
                      <div key={idx} style={S.archiveItem}>
                        <div style={S.statusPillWrapper}>
                          <div style={S.statusType}>{item.type}</div>
                          <div style={S.statusBadge(item.status)}>
                            {item.status}
                          </div>
                        </div>
                        <div style={S.row}>
                          <span style={S.rowLabel}>Requested on</span>
                          <span style={S.rowValue}>{formatDate(item.raised_at)}</span>
                        </div>
                        <div style={{ ...S.row, marginBottom: 0 }}>
                          <span style={S.rowLabel}>Completed on</span>
                          <span style={S.rowValue}>{formatDate(item.modified_at) || "N/A"}</span>
                        </div>
                      </div>
                    )) : (
                      <div style={S.emptyState}>
                        <p style={S.emptyText}>No <strong>{filter}</strong> requests found.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={S.emptyState}>
                  <p style={S.emptyText}>No past requests found for <strong>{email}</strong>.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
