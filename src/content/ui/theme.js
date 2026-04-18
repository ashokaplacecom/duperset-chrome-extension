/* ─── Shared Theme/Styles for Modals ─── */
export const S = {
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

  /* Step dots */
  dots: { display: "flex", gap: 5, paddingTop: 4 },
  dot: (active) => ({
    height: 6, borderRadius: active ? 3 : "50%",
    width: active ? 22 : 6, background: active ? "#1e1b72" : "#d1d5db",
    transition: "all 0.25s",
  }),

  /* Inputs */
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 6 },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  optional: { fontWeight: 400, color: "#9ca3af", fontSize: 12 },
  input: (error) => ({
    width: "100%", height: 46, borderRadius: 12, border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`,
    padding: "0 14px", fontSize: 14, outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s", fontFamily: "inherit"
  }),
  inputDisabled: {
    width: "100%", height: 46, borderRadius: 12, border: "1.5px solid #e5e7eb",
    padding: "0 14px", fontSize: 14, outline: "none", boxSizing: "border-box",
    background: "#f9fafb", color: "#6b7280", cursor: "not-allowed",
  },
  textarea: (error) => ({
    width: "100%", borderRadius: 12, border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`,
    padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box",
    resize: "vertical", minHeight: 80, fontFamily: "inherit", transition: "border-color 0.15s",
  }),

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

  /* Layout Utilities */
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  sp6:  { height: 6 },
  sp10: { height: 10 },
  sp14: { height: 14 },

  /* List & Items (Archives/Latest Statuses) */
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

  /* Success Message */
  successCircle: {
    width: 72, height: 72, borderRadius: "50%", background: "#d1fae5",
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
  },
  successIcon: { fontSize: 36, color: "#059669" },
  successTitle: { fontSize: 18, fontWeight: 700, color: "#111", textAlign: "center", margin: "0 0 6px" },
  successMsg: { fontSize: 14, color: "#6b7280", textAlign: "center", maxWidth: 340, margin: "0 auto" },
};
