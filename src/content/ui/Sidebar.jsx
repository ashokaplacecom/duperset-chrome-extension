import React, { useState } from "react";
import {
  ShieldCheck,
  GraduationCap,
  FileText,
  History,
  Globe,
  BookOpen,
  Menu,
  X,
  ChevronRight,
  ExternalLink
} from "lucide-react";

/* ─── Inline styles ─── */
const S = {
  sidebar: (isOpen) => ({
    position: "fixed",
    top: 0,
    right: isOpen ? 0 : -340,
    width: 320,
    height: "100%",
    background: "#fff",
    boxShadow: "-10px 0 30px rgba(0,0,0,0.08)",
    transition: "right 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 10001,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  }),
  header: {
    padding: "24px 28px 8px",
    background: "#fff",
    color: "#111",
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    margin: "4px 0 0",
    fontWeight: 400,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "none",
    border: "none",
    color: "#9ca3af",
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer",
  },
  content: {
    flex: 1,
    padding: "24px 20px",
    overflowY: "auto",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "1px",
    margin: "24px 0 12px 4px",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "14px 16px",
    margin: "4px 0",
    background: "#f8f9ff",
    border: "1px solid #eef0fb",
    borderRadius: 14,
    color: "#1e1b72",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "left",
    gap: 12,
  },
  btnDisabled: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "14px 16px",
    margin: "4px 0",
    background: "#f8f9ff",
    border: "1px solid #eef0fb",
    borderRadius: 14,
    color: "#807eb8ff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "not-allowed",
    transition: "all 0.2s ease",
    textAlign: "left",
    gap: 12,
  },
  btnIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    background: "#fff",
    borderRadius: 10,
    color: "#1e1b72",
    boxShadow: "0 4px 10px rgba(30,27,114,0.05)",
  },
  btnText: {
    flex: 1,
  },
  btnArrow: {
    opacity: 0.3,
  },
  footer: {
    padding: "20px",
    borderTop: "1px solid #f3f4f6",
    textAlign: "center",
  },
  footerLink: {
    fontSize: 12,
    color: "#9ca3af",
    textDecoration: "none",
    fontWeight: 500,
  },
  hamburger: (isOpen) => ({
    position: "fixed",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "#1e1b72",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    display: isOpen ? "none" : "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 25px rgba(30,27,114,0.3)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 10000,
  }),
};

export function Sidebar({ onVerify, onMajorMinor, onViewLatest, onViewHistory }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Hamburger Toggle */}
      <button
        style={S.hamburger(isOpen)}
        onClick={toggle}
        aria-label="Toggle Sidebar"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar Panel */}
      <div style={S.sidebar(isOpen)}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Duperset</h1>
            <p style={S.subtitle}>by PlaceCom</p>
          </div>
          <button style={S.closeBtn} onClick={toggle}>
            ✕
          </button>
        </div>

        <div style={S.content}>
          <p style={S.sectionTitle}>Profile & Graduation</p>
          <button style={S.btn} onClick={() => { onVerify(); toggle(); }}>
            <div style={S.btnIcon}><ShieldCheck size={18} /></div>
            <span style={S.btnText}>Verify My Profile</span>
            <ChevronRight size={16} style={S.btnArrow} />
          </button>

          <button style={S.btn} onClick={() => { onMajorMinor(); toggle(); }}>
            <div style={S.btnIcon}><GraduationCap size={18} /></div>
            <span style={S.btnText}>Request Major/Minor</span>
            <ChevronRight size={16} style={S.btnArrow} />
          </button>

          <p style={S.sectionTitle}>Your Requests</p>
          <button style={S.btn} onClick={() => { onViewLatest(); toggle(); }}>
            <div style={S.btnIcon}><FileText size={18} /></div>
            <span style={S.btnText}>View Latest Request</span>
            <ChevronRight size={16} style={S.btnArrow} />
          </button>

          <button style={S.btnDisabled} onClick={() => { onViewHistory(); toggle(); }} disabled>
            <div style={S.btnIcon}><History size={18} /></div>
            <span style={S.btnText}>Request History</span>
            <ChevronRight size={16} style={S.btnArrow} />
          </button>

          <p style={S.sectionTitle}>Resources</p>
          <button style={S.btn} onClick={() => window.open("https://connect-placecom.vercel.app", "_blank")}>
            <div style={S.btnIcon}><Globe size={18} /></div>
            <span style={S.btnText}>Visit our Website</span>
            <ExternalLink size={14} style={S.btnArrow} />
          </button>

          <button style={S.btn} onClick={() => window.open("https://connect-placecom.vercel.app/resources", "_blank")}>
            <div style={S.btnIcon}><BookOpen size={18} /></div>
            <span style={S.btnText}>Access Resources</span>
            <ExternalLink size={14} style={S.btnArrow} />
          </button>
        </div>

        <div style={S.footer}>
          <a href="#" style={S.footerLink}>Ashoka University • PlaceCom 2026</a>
        </div>
      </div>

      {/* Background Overlay */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(2px)",
            zIndex: 10000,
          }}
          onClick={toggle}
        />
      )}
    </>
  );
}
