import React, { useState } from "react";
import { getVerificationArchives, getMajorMinorArchives } from "../api/client";
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Mail,
  User,
  Calendar,
  Filter
} from "lucide-react";

/* ─── Constants ─── */
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
    maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column",
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
  body: { padding: "0 28px 28px", overflowY: "auto", flex: 1 },

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

  /* List & Items */
  list: { display: "flex", flexDirection: "column", gap: 12, paddingBottom: 10 },
  archiveItem: {
    background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 12, padding: 16,
  },
  statusPillWrapper: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #e5e7eb"
  },
  statusType: { fontSize: 14, fontWeight: 700, color: "#111" },
  
  statusBadge: (status) => {
    let bg = "#fffbeb", color = "#92400e", border = "#fde68a";
    if (status === "approved") { bg = "#ecfdf5"; color = "#065f46"; border = "#a7f3d0"; }
    if (status === "rejected") { bg = "#fef2f2"; color = "#991b1b"; border = "#fecaca"; }
    return {
      fontSize: 11, fontWeight: 700, textTransform: "capitalize",
      padding: "2px 8px", borderRadius: 6, background: bg, color: color, border: `1px solid ${border}`
    };
  },

  row: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  rowLabel: { fontSize: 12, color: "#6b7280" },
  rowValue: { fontSize: 12, fontWeight: 600, color: "#111", textAlign: "right" },

  emptyState: { textAlign: "center", padding: "20px 0" },
  emptyText: { fontSize: 14, color: "#6b7280", margin: "0" },
  
  filterWrap: {
    display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4
  },
  filterBtn: (active) => ({
    padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
    border: `1px solid ${active ? "#1e1b72" : "#e5e7eb"}`,
    background: active ? "#eef0fb" : "#fff",
    color: active ? "#1e1b72" : "#6b7280",
    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s"
  }),
};

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
