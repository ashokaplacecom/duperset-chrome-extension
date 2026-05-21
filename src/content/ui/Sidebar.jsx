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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://connect-placecom.vercel.app/api";
const ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, "");

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
  brandWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    objectFit: "contain",
  },
  titleWrapper: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: "-1.5px",
    background: "linear-gradient(135deg, #1e1b72 30%, #4f46e5 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
    lineHeight: 1,
  },
  subtitle: {
    fontSize: 11,
    color: "#6b7280",
    margin: "2px 0 0",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    opacity: 0.8,
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
    margin: "24px 0 6px 4px",
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
    padding: "20px 24px",
    borderTop: "1px solid #f3f4f6",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 500,
    lineHeight: "1.45",
    margin: 0,
    textWrap: "balance",
  },
  footerLink: {
    fontSize: 12,
    color: "#4f46e5",
    textDecoration: "none",
    fontWeight: 600,
    transition: "all 0.2s ease",
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

export function Sidebar({ onVerify, onMajorMinor, onViewLatest, onViewHistory, isOpen: controlledIsOpen, setIsOpen: controlledSetIsOpen }) {
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [isFooterHovered, setIsFooterHovered] = useState(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : localIsOpen;
  const setIsOpen = controlledSetIsOpen !== undefined ? controlledSetIsOpen : setLocalIsOpen;

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
          <div style={S.brandWrapper}>
            <img
              src={chrome.runtime.getURL("images/placecom_logo.png")}
              alt="PlaceCom Logo"
              style={S.logo}
            />
            <div style={S.titleWrapper}>
              <h1 style={S.title}>Duperset</h1>
              <p style={S.subtitle}>by PlaceCom</p>
            </div>
          </div>
          <button style={S.closeBtn} onClick={toggle}>
            ✕
          </button>
        </div>

        <div style={S.content}>
          <p style={S.sectionTitle}>Raise a Request</p>
          <button style={S.btn} onClick={() => { onVerify(); toggle(); }}>
            <div style={S.btnIcon}><ShieldCheck size={18} /></div>
            <span style={S.btnText}>Verify My Profile</span>
            <ChevronRight size={16} style={S.btnArrow} />
          </button>

          <button style={S.btn} onClick={() => { onMajorMinor(); toggle(); }}>
            <div style={S.btnIcon}><GraduationCap size={18} /></div>
            <span style={S.btnText}>Major/Minor Change</span>
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
          <button
            style={S.btn}
            onClick={() => {
              window.history.pushState({}, '', '/students/external-opportunities');
              window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
              toggle();
            }}
          >
            <div style={S.btnIcon}><Globe size={18} /></div>
            <span style={S.btnText}>External Opportunities</span>
            <ChevronRight size={16} style={S.btnArrow} />
          </button>

          <button style={S.btn} onClick={() => window.open(`${ROOT_URL}`, "_blank")}>
            <div style={S.btnIcon}><ExternalLink size={18} /></div>
            <span style={S.btnText}>Visit our Website</span>
            <ExternalLink size={14} style={S.btnArrow} />
          </button>

          <button style={S.btn} onClick={() => window.open(`${ROOT_URL}/duperset/resources`, "_blank")}>
            <div style={S.btnIcon}><BookOpen size={18} /></div>
            <span style={S.btnText}>Access Resources</span>
            <ExternalLink size={14} style={S.btnArrow} />
          </button>
        </div>

        <div style={S.footer}>
          <p style={S.footerText}>
            Built by Soham Tulsyan, Ananya Karel, Ibrahim Khalil & Saransh Goel
          </p>
          <a
            href="https://placecom.ashoka.edu.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...S.footerLink,
              color: isFooterHovered ? "#1e1b72" : "#4f46e5",
              textDecoration: isFooterHovered ? "underline" : "none",
            }}
            onMouseEnter={() => setIsFooterHovered(true)}
            onMouseLeave={() => setIsFooterHovered(false)}
          >
            Maintained by Team Placecom
          </a>
        </div>
      </div >

      {/* Background Overlay */}
      {
        isOpen && (
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
        )
      }
    </>
  );
}
