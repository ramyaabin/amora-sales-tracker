import { useEffect, useRef, useState } from "react";
import amoraLogo from "./assets/Amora-logo.png";
import api from "./api";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ===================== MOBILE HOOK ===================== */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return isMobile;
};

/* ===================== HELPERS ===================== */
const money = (n) =>
  "AED " +
  Number(n || 0).toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// The business runs on UAE time, so "today" and "now" always use Asia/Dubai,
// whatever the device clock is set to (the server does the same)
const uaeParts = () =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dubai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
const getToday = () => {
  const p = uaeParts();
  return `${p.year}-${p.month}-${p.day}`;
};
const nowHHMM = () => {
  const p = uaeParts();
  return `${p.hour}:${p.minute}`;
};

/* ===================== LEAVE HELPERS ===================== */
// "Full day" or "08:00 – 14:00"
const leaveTimeLabel = (l) =>
  l?.leaveType === "partial" && l.fromTime && l.toTime
    ? `${l.fromTime} – ${l.toTime}`
    : "Full day";

// Is the salesman blocked from adding sales on `date` right now?
// Returns null if allowed, otherwise { message } (approved leave only).
const getLeaveBlock = (leaves, date) => {
  const leave = leaves.find((l) => l.date === date && l.status === "Approved");
  if (!leave) return null;
  if (leave.leaveType !== "partial") {
    return {
      leave,
      message: `You are on approved leave on ${formatDate(date)}. Sales can't be added for this day.`,
    };
  }
  const now = nowHHMM();
  if (date === getToday() && now >= leave.fromTime && now < leave.toTime) {
    return {
      leave,
      message: `You are on leave today from ${leave.fromTime} to ${leave.toTime}. You can add sales again from ${leave.toTime}.`,
    };
  }
  return null;
};

const getMonthYear = () => getToday().slice(0, 7);

/* ===================== PROFESSIONAL AMAZON-STYLE THEME ===================== */
const theme = {
  colors: {
    primary: "#e53935", // Red
    primaryDark: "#c62828",
    primaryLight: "#ef5350",
    grey50: "#fafafa",
    grey100: "#f5f5f5",
    grey200: "#eeeeee",
    grey300: "#e0e0e0",
    grey400: "#bdbdbd",
    grey500: "#9e9e9e",
    grey600: "#757575",
    grey700: "#616161",
    grey800: "#424242",
    grey900: "#212121",
    white: "#ffffff",
    black: "#000000",
    success: "#4caf50",
    warning: "#ff9800",
    text: "#212121",
    textSecondary: "#616161",
  },
};

/* Shared red header bar, used by every screen */
const HEADER_BAR = {
  background: `linear-gradient(120deg, ${theme.colors.primaryLight} 0%, ${theme.colors.primary} 45%, ${theme.colors.primaryDark} 100%)`,
  boxShadow: "0 6px 20px rgba(198,40,40,0.25)",
  position: "sticky",
  top: 0,
  zIndex: 100,
};
const HEADER_CONTENT = {
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "14px 32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
};
const HEADER_TITLE = {
  fontSize: "22px",
  fontWeight: "700",
  color: theme.colors.white,
  margin: 0,
  letterSpacing: "0.2px",
};
const HEADER_BUTTON = {
  padding: "10px 20px",
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.4)",
  borderRadius: "12px",
  color: theme.colors.white,
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
};
const LOGOUT_BUTTON = {
  padding: "10px 20px",
  background: theme.colors.white,
  border: "none",
  borderRadius: "12px",
  color: theme.colors.primaryDark,
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
};

const modernStyles = {
  dashboardContainer: {
    minHeight: "100vh",
    background: theme.colors.grey100,
    fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
    color: theme.colors.text,
    overflowX: "hidden",
  },
  header: HEADER_BAR,
  headerContent: HEADER_CONTENT,
  logoContainer: { display: "flex", alignItems: "center", gap: "16px" },
  // Logo sits on a white tile so it stays visible on the red header
  logo: {
    height: "46px",
    width: "auto",
    objectFit: "contain",
    background: theme.colors.white,
    padding: "7px 12px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  headerTitle: HEADER_TITLE,
  headerSubtitle: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.85)",
    margin: "2px 0 0 0",
    fontWeight: "400",
  },
  headerButton: HEADER_BUTTON,
  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 16px 6px 6px",
    background: theme.colors.white,
    borderRadius: "999px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  },
  userAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${theme.colors.primaryLight}, ${theme.colors.primaryDark})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    fontWeight: "700",
    color: theme.colors.white,
    border: "2px solid #fff",
    flexShrink: 0,
  },
  userName: { fontSize: "15px", fontWeight: "600", color: theme.colors.text },
  logoutButton: LOGOUT_BUTTON,
  mainContent: { maxWidth: "1400px", margin: "0 auto", padding: "28px 32px" },
  controlBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    padding: "14px 18px",
    background: theme.colors.white,
    borderRadius: "16px",
    border: `1px solid ${theme.colors.grey200}`,
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
  },
  viewToggle: {
    display: "flex",
    gap: "4px",
    background: theme.colors.grey100,
    borderRadius: "12px",
    padding: "4px",
  },
  toggleButton: {
    padding: "11px 26px",
    background: "transparent",
    border: "none",
    borderRadius: "10px",
    color: theme.colors.textSecondary,
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  toggleButtonActive: {
    background: `linear-gradient(135deg, ${theme.colors.primaryLight}, ${theme.colors.primaryDark})`,
    color: theme.colors.white,
    boxShadow: "0 4px 12px rgba(229,57,53,0.3)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  statsCard: {
    padding: "24px",
    borderRadius: "18px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background: theme.colors.white,
    border: `1px solid ${theme.colors.grey200}`,
    transition: "all 0.2s",
  },
  // Emoji icon inside a soft red rounded tile
  statsIcon: {
    fontSize: "28px",
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "#ffebee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statsLabel: {
    fontSize: "13px",
    color: theme.colors.textSecondary,
    margin: "0 0 6px 0",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },
  statsValue: {
    fontSize: "30px",
    fontWeight: "700",
    color: theme.colors.text,
    margin: 0,
    lineHeight: 1.15,
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  chartCard: {
    background: theme.colors.white,
    borderRadius: "18px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
    border: `1px solid ${theme.colors.grey200}`,
    padding: "26px",
  },
  chartTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: theme.colors.text,
    margin: "0 0 16px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartSubtitle: {
    fontSize: "12px",
    color: theme.colors.textSecondary,
    fontWeight: "400",
  },
};

const styles = {
  loginContainer: {
    minHeight: "100vh",
    background: `linear-gradient(135deg, #fff5f5 0%, ${theme.colors.grey100} 60%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
  },
  loginCard: {
    background: theme.colors.white,
    borderRadius: "24px",
    boxShadow: "0 24px 60px rgba(198,40,40,0.15), 0 4px 12px rgba(0,0,0,0.06)",
    maxWidth: "1000px",
    width: "100%",
    minHeight: "600px",
    overflow: "hidden",
    display: "flex",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "28px",
  },
  logo: {
    height: "64px",
    width: "auto",
    objectFit: "contain",
  },
  loginTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: theme.colors.text,
    margin: "0 0 8px",
    textAlign: "center",
  },
  loginSubtitle: {
    fontSize: "16px",
    color: theme.colors.textSecondary,
    margin: "0 0 32px",
    textAlign: "center",
  },
  formGroup: {
    marginBottom: "22px",
  },
  label: {
    display: "block",
    fontSize: "15px",
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "16px",
    border: `1.5px solid ${theme.colors.grey300}`,
    borderRadius: "12px",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: theme.colors.grey50,
  },
  button: {
    width: "100%",
    minHeight: "50px",
    padding: "14px 24px",
    background: `linear-gradient(135deg, ${theme.colors.primaryLight}, ${theme.colors.primaryDark})`,
    color: theme.colors.white,
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    boxShadow: "0 8px 20px rgba(229,57,53,0.3)",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  dashboardContainer: {
    minHeight: "100vh",
    background: theme.colors.grey100,
    fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
    overflowX: "hidden",
  },
  header: HEADER_BAR,
  headerContent: HEADER_CONTENT,
  headerTitle: HEADER_TITLE,
  headerButton: HEADER_BUTTON,
  logoutButton: LOGOUT_BUTTON,
  mainContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "28px 32px",
  },
  card: {
    background: theme.colors.white,
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    border: `1px solid ${theme.colors.grey200}`,
    padding: "26px",
    marginBottom: "20px",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: `2px solid ${theme.colors.grey300}`,
    fontSize: "13px",
    fontWeight: "600",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    background: theme.colors.grey50,
  },
  td: {
    padding: "14px 12px",
    borderBottom: `1px solid ${theme.colors.grey200}`,
    fontSize: "15px",
    color: theme.colors.text,
  },
  actionButton: {
    padding: "8px 16px",
    background: theme.colors.primary,
    color: theme.colors.white,
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "16px",
    border: `1px solid ${theme.colors.grey300}`,
    borderRadius: "10px",
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
  },
  dateInput: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "16px",
    border: `1px solid ${theme.colors.grey300}`,
    borderRadius: "10px",
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "16px",
    border: `1px solid ${theme.colors.grey300}`,
    borderRadius: "10px",
    outline: "none",
    cursor: "pointer",
    background: theme.colors.white,
    boxSizing: "border-box",
  },
};

/* ===================== GLOBAL STYLES ===================== */
const GlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; }
      button, input, select, textarea { font-family:inherit; }
      body { margin:0; padding:0; font-family:'Poppins','Segoe UI',Arial,sans-serif; color:#212121; -webkit-font-smoothing:antialiased; overflow-x:auto; -webkit-overflow-scrolling: touch; }
      button:hover { opacity:0.9; transform:translateY(-1px); box-shadow:0 2px 4px rgba(0,0,0,0.1); }
      button:active { transform:translateY(0); }
      button:disabled { opacity:0.6; cursor:not-allowed; transform:none !important; }
      input:focus,textarea:focus,select:focus { border-color:${theme.colors.primary}; box-shadow:0 0 0 3px rgba(229,57,53,0.1); }
      table tr:hover { background:${theme.colors.grey50}; }
      .card:hover { box-shadow:0 2px 8px rgba(0,0,0,0.15); }
      /* Mobile/Desktop toggle */
      .mob { display:none !important; }
      .desk { display:block; }
      /* Hamburger nav */
      .nav-desktop { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
      .nav-hamburger { display:none !important; }
      .mob-nav-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:9999; flex-direction:column; align-items:flex-end; }
      .mob-nav-overlay.open { display:flex; }
      .mob-nav-panel { background:#fff; width:260px; height:100%; padding:24px 20px; display:flex; flex-direction:column; gap:12px; box-shadow:-4px 0 16px rgba(0,0,0,0.15); overflow-y:auto; }
      .mob-nav-panel button { width:100%; text-align:left; padding:14px 16px; border-radius:6px; font-size:15px; cursor:pointer; }
      .mob-nav-divider { height:1px; background:#e0e0e0; margin:4px 0; }
      input:focus,textarea:focus,select:focus { background:#fff !important; }
      /* ---------- Red header bar ---------- */
      button.nav-hamburger, .nav-hamburger > button { color:#fff !important; background:rgba(255,255,255,0.14) !important;
        border:1px solid rgba(255,255,255,0.45) !important; border-radius:10px !important; }
      /* ---------- Summary cards ---------- */
      .stats-card { position:relative; overflow:hidden; }
      .stats-card::after { content:""; position:absolute; left:0; right:0; top:0; height:4px;
        background:linear-gradient(90deg, ${theme.colors.primaryLight}, ${theme.colors.primaryDark}); }
      .stats-card:hover { transform:translateY(-3px); box-shadow:0 12px 28px rgba(229,57,53,0.12) !important; }
      /* Stop Chrome's light-blue autofill background */
      input:-webkit-autofill { -webkit-box-shadow:0 0 0 40px #fafafa inset !important; -webkit-text-fill-color:#212121; }
      /* ---------- Login page ---------- */
      .login-brand { position:relative; flex:1 1 50%; overflow:hidden; color:#fff; display:flex; align-items:center;
        background:linear-gradient(150deg, ${theme.colors.primaryLight} 0%, ${theme.colors.primary} 45%, ${theme.colors.primaryDark} 100%); }
      .login-brand-inner { position:relative; z-index:1; padding:56px 48px; }
      .login-brand-circle { position:absolute; border-radius:50%; background:rgba(255,255,255,0.10); }
      .login-brand-circle.c1 { width:340px; height:340px; top:-110px; right:-120px; }
      .login-brand-circle.c2 { width:240px; height:240px; bottom:-90px; left:-70px; background:rgba(255,255,255,0.07); }
      .login-brand-logo { display:inline-block; background:#fff; border-radius:16px; padding:14px 20px; margin-bottom:36px; box-shadow:0 10px 30px rgba(0,0,0,0.15); }
      .login-brand-logo img { height:44px; display:block; }
      .login-brand-title { font-size:38px; line-height:1.2; font-weight:700; margin:0 0 16px; }
      .login-brand-text { font-size:16px; line-height:1.6; margin:0 0 32px; opacity:0.92; max-width:360px; }
      .login-brand-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:14px; }
      .login-brand-list li { display:flex; align-items:center; gap:14px; font-size:16px; font-weight:500; }
      .login-brand-list span { width:42px; height:42px; border-radius:12px; background:rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; font-size:20px; }
      .login-form-side { flex:1 1 50%; display:flex; align-items:center; justify-content:center; padding:48px 40px; }
      .login-form-wrap { width:100%; max-width:380px; }
      .login-form-logo { display:none; }
      .login-footer { text-align:center; font-size:13px; color:#9e9e9e; margin:32px 0 0; }
      .pw-toggle { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:${theme.colors.primary};
        font-weight:600; font-size:14px; cursor:pointer; padding:8px 10px; font-family:inherit; }
      .pw-toggle:hover { transform:translateY(-50%); box-shadow:none; }
      @media (max-width:768px) {
        .mob { display:block !important; }
        .desk { display:none !important; }
        .nav-desktop { display:none !important; }
        .nav-hamburger { display:flex !important; align-items:center; gap:8px; }
        /* Header */
        .hdr { padding:10px 14px !important; }
        .hdr-title { font-size:17px !important; }
        .hdr-sub { display:none !important; }
        .hdr-logo { height:38px !important; padding:5px 9px !important; border-radius:10px !important; }
        /* Content padding */
        .pg-content { padding:12px 14px !important; }
        /* Control bar stacks */
        .ctrl-bar { flex-direction:column !important; align-items:stretch !important; gap:10px !important; padding:12px !important; }
        .view-toggle { width:100% !important; }
        .view-toggle button { flex:1 !important; }
        .ctrl-date { width:100% !important; }
        /* Stats: 2 cols */
        .stats-grid { grid-template-columns:repeat(2,1fr) !important; gap:10px !important; }
        .stats-card { padding:16px 14px !important; gap:10px !important; flex-direction:column !important; align-items:flex-start !important; border-radius:16px !important; }
        .stats-icon { font-size:22px !important; width:44px !important; height:44px !important; border-radius:12px !important; }
        .stats-val, .stats-card h2 { font-size:20px !important; word-break:break-word; }
        .stats-card p { font-size:12px !important; }
        /* Charts stack */
        .charts-grid { grid-template-columns:1fr !important; }
        /* Login */
        .login-wrap-outer { padding:14px !important; }
        .login-card { flex-direction:column !important; min-height:auto !important; border-radius:20px !important; }
        .login-brand { flex:none; }
        .login-brand-inner { padding:28px 24px 30px; }
        .login-brand-logo { padding:10px 14px; margin-bottom:18px; border-radius:12px; }
        .login-brand-logo img { height:32px; }
        .login-brand-title { font-size:26px; margin-bottom:8px; }
        .login-brand-text { font-size:15px; margin:0; }
        .login-brand-list { display:none; }
        .login-form-side { padding:28px 22px 26px; }
        .login-form-side h2 { font-size:24px !important; }
        /* Form max-width */
        .form-card { max-width:100% !important; margin:0 !important; }
        /* Action btn group */
        .act-btns { 
  display: flex;
  flex-wrap: wrap;     /* ✅ allows wrapping */
  gap: 6px;
}

.act-btns button {
  width: auto;         /* ✅ natural size */
}
        /* Mobile sale/leave row cards */
        .row-card { background:#fff; border:1px solid #e0e0e0; border-radius:8px; padding:12px 14px; margin-bottom:8px; }
        .row-card-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
        .row-card-title { font-size:16px; font-weight:600; color:#212121; }
        .row-card-amount { font-size:16px; font-weight:700; color:#e53935; }
        .row-card-meta { font-size:13px; color:#777; margin-top:2px; }
        /* Salesman cards */
       .sm-row {
  background:#fff;
  border:1px solid #e0e0e0;
  border-radius:8px;
  padding:12px 14px;
  margin-bottom:8px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.sm-row-l .sm-name { 
  font-size:15px; 
  font-weight:600; 
}

.sm-row-l .sm-meta { 
  font-size:12px; 
  color:#888; 
  margin-top:2px; 
}

/* ✅ FIXED RIGHT SECTION */
.sm-row-r { 
  width: 100%;
  margin-top: 8px;
  text-align: left;   /* keep ONLY this */
}

.sm-row-r .sm-total { 
  font-size:16px; 
  font-weight:700; 
  color:#e53935; 
}
        /* Product cards */
        .prod-row { 
  background:#fff; 
  border:1px solid #e0e0e0; 
  border-radius:8px; 
  padding:12px 14px; 
  margin-bottom:7px; 

  display:flex;
  flex-direction: column;
  align-items: flex-start;
}

.prod-row-brand { 
  font-size:14px; 
  font-weight:600;
  width: 100%; 
}

.prod-row-code { 
  font-size:12px; 
  color:#888; 
  margin-top:2px; 
  width: 100%;
}

.prod-row-price {
  margin-top: 6px;
  font-size:15px; 
  font-weight:700; 
  color:#e53935;
}
        /* Manage salesmen cards */
        .mgr-row { background:#fff; border:1px solid #e0e0e0; border-radius:8px; padding:12px 14px; margin-bottom:8px; }
        .mgr-row-name { font-size:16px; font-weight:600; }
        .mgr-row-meta { font-size:13px; color:#888; margin-top:2px; }
        .mgr-row-actions { display:flex; gap:8px; margin-top:10px; }
        .mgr-row-actions button { flex:1; font-size:14px !important; padding:10px !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

/* ===================== LOADING SPINNER ===================== */
// ✅ Leave status badge with colour coding
const LeaveStatusBadge = ({ status }) => {
  const cfg = {
    Approved: { bg: "#e8f5e9", color: "#2e7d32", label: "✓ Approved" },
    Rejected: { bg: "#ffebee", color: "#c62828", label: "✗ Rejected" },
    Pending: { bg: "#fff8e1", color: "#f57f17", label: "⏳ Pending" },
    Cancelled: { bg: "#eceff1", color: "#546e7a", label: "⊘ Cancelled" },
  };
  const s = cfg[status] || cfg.Pending;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {s.label}
    </span>
  );
};

const LoadingSpinner = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: theme.colors.grey100,
    }}
  >
    <div
      style={{
        fontSize: "16px",
        color: theme.colors.textSecondary,
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          border: `3px solid ${theme.colors.grey300}`,
          borderTop: `3px solid ${theme.colors.primary}`,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      Loading...
    </div>
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

/* ===================== SUCCESS TOAST ===================== */
const SuccessToast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: theme.colors.success,
        color: theme.colors.white,
        padding: "16px 24px",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        animation: "slideIn 0.3s ease",
      }}
    >
      <span style={{ fontSize: "20px" }}>✓</span>
      <span style={{ fontSize: "14px", fontWeight: "500" }}>{message}</span>
      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

/* ===================== LOGIN PAGE ===================== */
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fpStep, setFpStep] = useState("login");
  const [fpUsername, setFpUsername] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPw, setFpNewPw] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [fpEmail, setFpEmail] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }
    setLoading(true);
    try {
      const result = await api.login(username, password);
      if (result.success) onLogin(result.user);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setFpError("");
    if (!fpUsername.trim()) {
      setFpError("Please enter your username");
      return;
    }
    setFpLoading(true);
    try {
      const res = await api.forgotPassword(fpUsername.trim());
      setFpEmail(res.maskedEmail);
      setFpStep("verify");
    } catch (err) {
      setFpError(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFpError("");
    if (!fpOtp.trim()) {
      setFpError("Please enter the OTP");
      return;
    }
    setFpLoading(true);
    try {
      await api.verifyOtp(fpUsername.trim(), fpOtp.trim());
      setFpStep("newpw");
    } catch (err) {
      setFpError(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  const handleResetPw = async (e) => {
    e.preventDefault();
    setFpError("");
    if (!fpNewPw) {
      setFpError("Please enter a new password");
      return;
    }
    if (fpNewPw.length < 6) {
      setFpError("Minimum 6 characters");
      return;
    }
    if (fpNewPw !== fpConfirm) {
      setFpError("Passwords do not match");
      return;
    }
    setFpLoading(true);
    try {
      await api.resetPasswordWithOtp(fpUsername.trim(), fpNewPw);
      alert("Password reset! Please sign in.");
      setFpStep("login");
      setFpUsername("");
      setFpOtp("");
      setFpNewPw("");
      setFpConfirm("");
      setFpEmail("");
    } catch (err) {
      setFpError(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  const errBox = fpError ? (
    <div
      style={{
        background: "#fff0f0",
        border: "1px solid #ffcdd2",
        borderRadius: 10,
        color: "#c62828",
        fontSize: 13,
        padding: "10px 12px",
        marginBottom: 16,
      }}
    >
      {fpError}
    </div>
  ) : null;

  const infoBox = fpEmail ? (
    <div
      style={{
        background: "#f0f4ff",
        border: "1px solid #c5cae9",
        borderRadius: 10,
        color: "#1a237e",
        fontSize: 13,
        padding: "10px 12px",
        marginBottom: 16,
        textAlign: "center",
      }}
    >
      OTP sent to <strong>{fpEmail}</strong>
    </div>
  ) : null;

  const linkBtn = (label, onClick) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "center",
        marginTop: 14,
        color: theme.colors.primary,
        fontSize: 14,
        cursor: "pointer",
        background: "none",
        border: "none",
        padding: 0,
        textDecoration: "underline",
      }}
    >
      {label}
    </button>
  );

  const renderFp = () => {
    if (fpStep === "request")
      return (
        <form onSubmit={handleRequestOtp}>
          <h2 style={styles.loginTitle}>Forgot Password</h2>
          <p style={styles.loginSubtitle}>
            Admin accounts only — enter your registered email
          </p>
          {errBox}
          <div style={styles.formGroup}>
            <label style={styles.label}>Registered Email</label>
            <input
              type="email"
              value={fpUsername}
              onChange={(e) => setFpUsername(e.target.value)}
              disabled={fpLoading}
              style={styles.input}
              placeholder="Enter your admin email address"
              autoFocus
            />
          </div>
          <button type="submit" disabled={fpLoading} style={styles.button}>
            {fpLoading ? "Sending OTP…" : "Send OTP"}
          </button>
          {linkBtn("← Back to Sign In", () => {
            setFpStep("login");
            setFpError("");
          })}
        </form>
      );
    if (fpStep === "verify")
      return (
        <form onSubmit={handleVerifyOtp}>
          <h2 style={styles.loginTitle}>Enter OTP</h2>
          {infoBox}
          {errBox}
          <div style={styles.formGroup}>
            <label style={styles.label}>6-Digit OTP</label>
            <input
              type="text"
              value={fpOtp}
              onChange={(e) =>
                setFpOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              disabled={fpLoading}
              style={{
                ...styles.input,
                fontSize: 28,
                letterSpacing: 10,
                textAlign: "center",
              }}
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={fpLoading || fpOtp.length < 6}
            style={styles.button}
          >
            {fpLoading ? "Verifying…" : "Verify OTP"}
          </button>
          {linkBtn("← Resend OTP", () => {
            setFpStep("request");
            setFpOtp("");
            setFpError("");
          })}
        </form>
      );
    if (fpStep === "newpw")
      return (
        <form onSubmit={handleResetPw}>
          <h2 style={styles.loginTitle}>New Password</h2>
          <p style={styles.loginSubtitle}>Choose a strong password</p>
          {errBox}
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={fpNewPw}
              onChange={(e) => setFpNewPw(e.target.value)}
              disabled={fpLoading}
              style={styles.input}
              placeholder="Min. 6 characters"
              autoFocus
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={fpConfirm}
              onChange={(e) => setFpConfirm(e.target.value)}
              disabled={fpLoading}
              style={styles.input}
              placeholder="Repeat password"
            />
          </div>
          <button type="submit" disabled={fpLoading} style={styles.button}>
            {fpLoading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      );
  };

  return (
    <>
      <GlobalStyles />
      <div style={styles.loginContainer} className="login-wrap-outer">
        <div style={styles.loginCard} className="login-card">
          {/* Left: red welcome panel (becomes a top banner on phones) */}
          <div className="login-brand">
            <div className="login-brand-circle c1" />
            <div className="login-brand-circle c2" />
            <div className="login-brand-inner">
              <div className="login-brand-logo">
                <img src={amoraLogo} alt="Amora" />
              </div>
              <h1 className="login-brand-title">
                Track every sale.
                <br />
                Every day.
              </h1>
              <p className="login-brand-text">
                The Amora sales team's daily companion for recording sales,
                tracking targets and managing leave.
              </p>
              <ul className="login-brand-list">
                <li>
                  <span>📊</span> Live sales dashboard
                </li>
                <li>
                  <span>🛒</span> Record a sale in seconds
                </li>
                <li>
                  <span>🗓️</span> Apply for and approve leave
                </li>
              </ul>
            </div>
          </div>

          {/* Right: sign-in form */}
          <div className="login-form-side">
            <div className="login-form-wrap">
              <div style={styles.logoContainer} className="login-form-logo">
                <img src={amoraLogo} alt="Amora" style={styles.logo} />
              </div>
              {fpStep !== "login" ? (
                renderFp()
              ) : (
                <form onSubmit={handleLogin}>
                  <h2 style={styles.loginTitle}>Welcome back 👋</h2>
                  <p style={styles.loginSubtitle}>
                    Sign in to Amora Sales Tracker
                  </p>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      style={styles.input}
                      placeholder="Enter your username"
                      autoComplete="username"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        style={{ ...styles.input, paddingRight: 70 }}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="pw-toggle"
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ ...styles.button, marginTop: 6 }}
                  >
                    {loading ? "Signing in…" : "Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFpStep("request")}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "center",
                      marginTop: 18,
                      color: theme.colors.primary,
                      fontSize: 15,
                      fontWeight: 500,
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                      boxShadow: "none",
                      padding: 0,
                    }}
                  >
                    Forgot password? (Admin only)
                  </button>
                </form>
              )}
              <p className="login-footer">
                © {new Date().getFullYear()} Amora · All rights reserved
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ===================== SALES BY MONTH CHART ===================== */
// One bar per month (up to the last 12, ending this month). Click a bar to open that month.
const MonthlyTrendCard = ({ sales, selectedMonth, onSelect }) => {
  const current = getMonthYear();
  const first = sales.reduce(
    (min, s) => (s.date && s.date.slice(0, 7) < min ? s.date.slice(0, 7) : min),
    current,
  );
  const months = [];
  let [y, m] = current.split("-").map(Number);
  while (months.length < 12) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    if (key < first) break;
    months.unshift(key);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  const totals = {};
  sales.forEach((s) => {
    const k = s.date?.slice(0, 7);
    if (k) totals[k] = (totals[k] || 0) + (s.totalAmount || s.quantity * s.price);
  });
  const data = months.map((k) => ({
    month: k,
    label: new Date(`${k}-01T12:00:00Z`).toLocaleDateString("en-AE", {
      month: "short",
      year: "2-digit",
    }),
    sales: Math.round((totals[k] || 0) * 100) / 100,
  }));

  return (
    <div style={{ ...modernStyles.chartCard, marginBottom: 24 }}>
      <h3 style={modernStyles.chartTitle}>
        Sales by Month
        <span style={modernStyles.chartSubtitle}>Click a bar to open that month</span>
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.colors.grey200} />
          <XAxis dataKey="label" tick={{ fontSize: 13 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={60}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
          />
          <Tooltip formatter={(v) => money(v)} cursor={{ fill: "rgba(229,57,53,0.06)" }} />
          <Bar
            dataKey="sales"
            name="Sales (AED)"
            radius={[8, 8, 0, 0]}
            cursor="pointer"
            onClick={(d) => onSelect(d.month || d.payload?.month)}
          >
            {data.map((d) => (
              <Cell
                key={d.month}
                fill={d.month === selectedMonth ? theme.colors.primaryDark : "#ef9a9a"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ===================== BRAND PIE CHART ===================== */
const BRAND_COLORS = ["#e53935", "#1e88e5", "#43a047", "#fb8c00", "#8e24aa"];

// Top 5 brands by revenue for the given sales
const BrandPieCard = ({ sales, title, subtitle, emptyText, fallback }) => {
  const byBrand = {};
  sales.forEach((s) => {
    const b = s.brand || "Unknown";
    byBrand[b] = (byBrand[b] || 0) + (Number(s.totalAmount) || s.quantity * s.price);
  });
  const data = Object.entries(byBrand)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div style={{ ...modernStyles.chartCard, marginBottom: 24 }}>
      <h3 style={modernStyles.chartTitle}>
        {title}
        <span style={modernStyles.chartSubtitle}>{subtitle}</span>
      </h3>
      {data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "36px 16px" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🥧</div>
          <p style={{ color: theme.colors.textSecondary, margin: "0 0 16px", fontSize: 16 }}>
            {emptyText || "No sales in this period yet"}
          </p>
          {fallback && (
            <button
              onClick={fallback.onClick}
              style={{ ...styles.button, width: "auto", padding: "10px 22px" }}
            >
              {fallback.label}
            </button>
          )}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={95}
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              dataKey="value"
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => money(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

/* ===================== MANAGE SALESMEN ===================== */
const ManageSalesmen = ({ navigate, onLogout }) => {
  const isMobile = useIsMobile();
  const [salesmen, setSalesmen] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    salesmanId: "",
  });
  const [resetData, setResetData] = useState({ salesmanId: "", password: "" });
  const [showResetForm, setShowResetForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSalesmen();
  }, []);

  const loadSalesmen = async () => {
    setLoading(true);
    try {
      const users = await api.getUsers();
      setSalesmen(users.filter((u) => u.role === "salesman"));
    } catch (err) {
      console.error("Error loading salesmen:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSalesman = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) {
      alert("Please fill all required fields");
      return;
    }

    // Next ID = highest existing SM number + 1, so deleted IDs never cause a clash
    const highestId = salesmen.reduce((max, s) => {
      const match = /^SM(\d+)$/i.exec(s.salesmanId || "");
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    try {
      const userData = {
        ...formData,
        role: "salesman",
        salesmanId:
          formData.salesmanId.trim() ||
          `SM${String(highestId + 1).padStart(3, "0")}`,
      };

      await api.addUser(userData);
      alert("Salesman added successfully!");
      setFormData({ name: "", username: "", password: "", salesmanId: "" });
      setShowForm(false);
      loadSalesmen();
    } catch (err) {
      alert("Error adding salesman: " + err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetData.salesmanId || !resetData.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      await api.resetPassword(resetData);
      alert("Password reset successfully!");
      setResetData({ salesmanId: "", password: "" });
      setShowResetForm(false);
    } catch (err) {
      alert("Error resetting password: " + err.message);
    }
  };

  const handleDeleteSalesman = async (salesmanId, salesmanName) => {
    if (
      !confirm(
        `Are you sure you want to delete ${salesmanName}?\n\nThis will also delete all their sales and leave records. This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await api.deleteUser(salesmanId);
      alert(`${salesmanName} has been deleted successfully!`);
      loadSalesmen();
    } catch (err) {
      alert("Error deleting salesman: " + err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <GlobalStyles />
      <div style={styles.dashboardContainer}>
        <div style={styles.header}>
          <div
            style={{
              ...styles.headerContent,
              padding: isMobile ? "16px 20px" : "16px 32px",
            }}
          >
            <div style={modernStyles.logoContainer}>
              <img src={amoraLogo} alt="Amora" style={modernStyles.logo} />
              <h1 style={styles.headerTitle}>Manage Salesmen</h1>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => navigate("admin-dashboard")}
                style={styles.headerButton}
              >
                Back to Dashboard
              </button>
              <button onClick={onLogout} style={styles.logoutButton}>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div style={styles.mainContent} className="pg-content">
          <div style={{ marginBottom: "20px", display: "flex", gap: "12px" }}>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                ...styles.button,
                width: "auto",
              }}
            >
              {showForm ? "Cancel" : "Add New Salesman"}
            </button>
            <button
              onClick={() => setShowResetForm(!showResetForm)}
              style={{
                ...styles.button,
                width: "auto",
                background: theme.colors.grey600,
              }}
            >
              {showResetForm ? "Cancel" : "Reset Password"}
            </button>
          </div>

          {showForm && (
            <div className="card" style={styles.card}>
              <h3 style={styles.cardTitle}>Add New Salesman</h3>
              <form onSubmit={handleAddSalesman}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    style={styles.input}
                    placeholder="Full Name"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    style={styles.input}
                    placeholder="Login username"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    style={styles.input}
                    placeholder="Login password"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Salesman ID (optional, auto-generated if empty)
                  </label>
                  <input
                    type="text"
                    value={formData.salesmanId}
                    onChange={(e) =>
                      setFormData({ ...formData, salesmanId: e.target.value })
                    }
                    style={styles.input}
                    placeholder="e.g., SM001"
                  />
                </div>
                <button type="submit" style={styles.button}>
                  Add Salesman
                </button>
              </form>
            </div>
          )}

          {showResetForm && (
            <div className="card" style={styles.card}>
              <h3 style={styles.cardTitle}>Reset Password</h3>
              <form onSubmit={handleResetPassword}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Salesman ID</label>
                  <select
                    value={resetData.salesmanId}
                    onChange={(e) =>
                      setResetData({ ...resetData, salesmanId: e.target.value })
                    }
                    style={styles.select}
                  >
                    <option value="">Select Salesman</option>
                    {salesmen.map((sm) => (
                      <option key={sm.id || sm._id} value={sm.salesmanId}>
                        {sm.name} ({sm.salesmanId})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>New Password</label>
                  <input
                    type="password"
                    value={resetData.password}
                    onChange={(e) =>
                      setResetData({ ...resetData, password: e.target.value })
                    }
                    style={styles.input}
                    placeholder="Enter new password"
                  />
                </div>
                <button type="submit" style={styles.button}>
                  Reset Password
                </button>
              </form>
            </div>
          )}

          <div className="card" style={styles.card}>
            <h3 style={styles.cardTitle}>Current Salesmen</h3>
            {/* Mobile cards */}
            <div className="mob">
              {salesmen.map((sm) => (
                <div key={sm.id || sm._id} className="mgr-row">
                  <div className="mgr-row-name">{sm.name}</div>
                  <div className="mgr-row-meta">
                    @{sm.username} · ID: {sm.salesmanId}
                  </div>
                  <div className="mgr-row-actions">
                    <button
                      onClick={() =>
                        handleDeleteSalesman(sm.salesmanId, sm.name)
                      }
                      style={{
                        ...styles.actionButton,
                        background: theme.colors.grey700,
                        flex: 1,
                      }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="desk" style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Username</th>
                    <th style={styles.th}>Salesman ID</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesmen.map((sm) => (
                    <tr key={sm.id || sm._id}>
                      <td style={styles.td}>{sm.name}</td>
                      <td style={styles.td}>{sm.username}</td>
                      <td style={styles.td}>{sm.salesmanId}</td>
                      <td style={styles.td}>
                        <button
                          onClick={() =>
                            handleDeleteSalesman(sm.salesmanId, sm.name)
                          }
                          style={{
                            ...styles.actionButton,
                            background: theme.colors.grey700,
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ===================== DOWNLOAD PRODUCTS ===================== */
const DownloadProducts = ({ navigate, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const q = searchTerm.toLowerCase();
      const filtered = products.filter(
        (p) =>
          (p.brand || "").toLowerCase().includes(q) ||
          (p.modelNumber || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.ean || "").toLowerCase().includes(q),
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const downloadCSV = () => {
    let csv = "Brand,Model No.,Barcode,Description,Price\n";
    filteredProducts.forEach((p) => {
      const desc = `"${(p.description || "").replace(/"/g, '""')}"`;
      csv += `${p.brand},${p.modelNumber || ""},${p.ean || ""},${desc},${p.price}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <GlobalStyles />
      <div style={styles.dashboardContainer}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={modernStyles.logoContainer}>
              <img src={amoraLogo} alt="Amora" style={modernStyles.logo} />
              <h1 style={styles.headerTitle}>Product List</h1>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => navigate("admin-dashboard")}
                style={styles.headerButton}
              >
                Back to Dashboard
              </button>
              <button onClick={onLogout} style={styles.logoutButton}>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div style={styles.mainContent} className="pg-content">
          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={downloadCSV}
              style={{
                ...styles.button,
                width: "auto",
              }}
            >
              Download CSV
            </button>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by brand or item code..."
              style={{
                ...styles.input,
                flex: 1,
                maxWidth: "400px",
              }}
            />
          </div>

          <div className="card" style={styles.card}>
            <h3 style={styles.cardTitle}>
              {searchTerm
                ? `Search Results (${filteredProducts.length} of ${products.length} items)`
                : `All Products (${products.length} items)`}
            </h3>
            {/* Mobile cards */}
            <div className="mob">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p, i) => (
                  <div key={i} className="prod-row">
                    <div style={{ flex: 1 }}>
                      <div className="prod-row-brand">{p.brand}</div>
                      <div className="prod-row-code">
                        {p.modelNumber || "—"}
                      </div>
                      <div className="prod-row-code" style={{ fontSize: 11 }}>
                        🔖 {p.ean || "—"}
                      </div>
                      <div className="prod-row-code" style={{ fontSize: 11 }}>
                        {p.description || ""}
                      </div>
                    </div>
                    <div className="prod-row-price">{money(p.price)}</div>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    textAlign: "center",
                    color: theme.colors.textSecondary,
                    padding: 24,
                  }}
                >
                  No products found
                </p>
              )}
            </div>
            {/* Desktop table */}
            <div className="desk" style={{ maxHeight: 600, overflowY: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Brand</th>
                    <th style={styles.th}>Model No.</th>
                    <th style={styles.th}>Barcode</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Price (AED)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p, i) => (
                      <tr key={i}>
                        <td style={styles.td}>{p.brand}</td>
                        <td style={styles.td}>{p.modelNumber || "—"}</td>
                        <td style={styles.td}>{p.ean || "—"}</td>
                        <td
                          style={{
                            ...styles.td,
                            maxWidth: 300,
                            whiteSpace: "normal",
                          }}
                        >
                          {p.description || "—"}
                        </td>
                        <td style={styles.td}>{money(p.price)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          ...styles.td,
                          textAlign: "center",
                          color: theme.colors.textSecondary,
                        }}
                      >
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ===================== SALESMAN DASHBOARD ===================== */
const SalesmanDashboard = ({ user, navigate, onLogout }) => {
  const [sales, setSales] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [view, setView] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refreshLeaves();
  }, [view, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesData, leavesData] = await Promise.all([
        api.getSales({ salesmanId: user.salesmanId }),
        api.getLeaves({ salesmanId: user.salesmanId }),
      ]);
      setSales(salesData);
      setLeaves(leavesData);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshLeaves = async () => {
    try {
      const leavesData = await api.getLeaves({ salesmanId: user.salesmanId });
      setLeaves(leavesData);
    } catch (err) {
      console.error("Error refreshing leaves:", err);
    }
  };

  const getDailySales = (date) => sales.filter((s) => s.date === date);
  const getMonthlySales = (monthYear) =>
    sales.filter((s) => s.date.startsWith(monthYear));
  const calculateTotal = (salesData) =>
    salesData.reduce(
      (sum, s) => sum + (s.totalAmount || s.quantity * s.price),
      0,
    );

  const currentSales =
    view === "daily"
      ? getDailySales(selectedDate)
      : getMonthlySales(selectedDate);
  const dailyLeaves = leaves.filter((l) => l.date === selectedDate);
  const monthlyLeaves = leaves.filter((l) =>
    l.date.startsWith(selectedDate.slice(0, 7)),
  );

  const getDailyTrendData = () => {
    const last7Days = [];
    // Count back from today's UAE date (noon UTC avoids any day-boundary slip)
    const todayUae = new Date(`${getToday()}T12:00:00Z`);
    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayUae.getTime() - i * 86400000);
      const dateStr = date.toISOString().split("T")[0];
      const daySales = sales.filter((s) => s.date === dateStr);
      const total = calculateTotal(daySales);
      last7Days.push({
        date: date.toLocaleDateString("en-AE", {
          month: "short",
          day: "numeric",
        }),
        sales: total,
      });
    }
    return last7Days;
  };

  const dailyTrendData = getDailyTrendData();

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <GlobalStyles />
      <div style={modernStyles.dashboardContainer}>
        <div style={modernStyles.header}>
          <div style={modernStyles.headerContent} className="hdr">
            <div style={modernStyles.logoContainer}>
              <img
                src={amoraLogo}
                alt="Amora"
                style={modernStyles.logo}
                className="hdr-logo"
              />
              <div>
                <h1 style={modernStyles.headerTitle} className="hdr-title">
                  Amora Sales Tracker
                </h1>
                <p style={modernStyles.headerSubtitle} className="hdr-sub">
                  Salesman Dashboard
                </p>
              </div>
            </div>
            {/* Desktop nav */}
            <div className="nav-desktop">
              <div style={modernStyles.userBadge}>
                <div style={modernStyles.userAvatar}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={modernStyles.userName}>{user.name}</div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {user.salesmanId}
                  </div>
                </div>
              </div>
              <button onClick={onLogout} style={modernStyles.logoutButton}>
                Logout
              </button>
            </div>
            {/* Mobile hamburger */}
            <div className="nav-hamburger">
              <div style={modernStyles.userAvatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => setNavOpen(true)}
                style={{
                  background: "none",
                  border: `1px solid ${theme.colors.grey300}`,
                  borderRadius: 6,
                  padding: "7px 10px",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ☰
              </button>
            </div>
          </div>
        </div>
        {/* Mobile nav overlay */}
        <div
          className={`mob-nav-overlay${navOpen ? " open" : ""}`}
          onClick={() => setNavOpen(false)}
        >
          <div className="mob-nav-panel" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {user.salesmanId}
                </div>
              </div>
              <button
                onClick={() => setNavOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div className="mob-nav-divider" />
            <button
              onClick={() => {
                navigate("add-sale");
                setNavOpen(false);
              }}
              style={{
                background: theme.colors.primary,
                color: "#fff",
                border: "none",
              }}
            >
              ➕ Add New Sale
            </button>
            <button
              onClick={() => {
                navigate("apply-leave");
                setNavOpen(false);
              }}
              style={{
                background: theme.colors.warning,
                color: "#fff",
                border: "none",
              }}
            >
              📅 Apply for Leave
            </button>
            <div className="mob-nav-divider" />
            <button
              onClick={() => {
                onLogout();
                setNavOpen(false);
              }}
              style={{
                background: "#fff",
                border: `1px solid ${theme.colors.grey300}`,
                color: theme.colors.text,
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        <div style={modernStyles.mainContent} className="pg-content">
          <div style={modernStyles.controlBar} className="ctrl-bar">
            <div style={modernStyles.viewToggle} className="view-toggle">
              <button
                onClick={() => {
                  setView("daily");
                  setSelectedDate(getToday());
                }}
                style={{
                  ...modernStyles.toggleButton,
                  ...(view === "daily" ? modernStyles.toggleButtonActive : {}),
                }}
              >
                Daily View
              </button>
              <button
                onClick={() => {
                  setView("monthly");
                  setSelectedDate(getMonthYear());
                }}
                style={{
                  ...modernStyles.toggleButton,
                  ...(view === "monthly"
                    ? modernStyles.toggleButtonActive
                    : {}),
                }}
              >
                Monthly View
              </button>
            </div>
            <input
              type={view === "daily" ? "date" : "month"}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                ...modernStyles.dateInput,
                padding: "10px 16px",
                fontSize: "14px",
                border: `1px solid ${theme.colors.grey300}`,
                borderRadius: "10px",
              }}
            />
          </div>

          <div style={modernStyles.statsGrid} className="stats-grid">
            <div style={modernStyles.statsCard} className="stats-card">
              <div style={modernStyles.statsIcon} className="stats-icon">
                📊
              </div>
              <div>
                <p style={modernStyles.statsLabel}>Total Sales</p>
                <h2 style={modernStyles.statsValue}>
                  {money(calculateTotal(currentSales))}
                </h2>
              </div>
            </div>
            <div style={modernStyles.statsCard} className="stats-card">
              <div style={modernStyles.statsIcon} className="stats-icon">
                🛍️
              </div>
              <div>
                <p style={modernStyles.statsLabel}>Transactions</p>
                <h2 style={modernStyles.statsValue}>{currentSales.length}</h2>
              </div>
            </div>
            <div style={modernStyles.statsCard} className="stats-card">
              <div style={modernStyles.statsIcon} className="stats-icon">
                📅
              </div>
              <div>
                <p style={modernStyles.statsLabel}>Leave Days</p>
                <h2 style={modernStyles.statsValue}>
                  {view === "daily" ? dailyLeaves.length : monthlyLeaves.length}
                </h2>
              </div>
            </div>
          </div>

          {view === "monthly" && (
            <MonthlyTrendCard
              sales={sales}
              selectedMonth={selectedDate}
              onSelect={setSelectedDate}
            />
          )}

          {(() => {
            const monthName = (ym) =>
              new Date(`${ym}-01T12:00:00Z`).toLocaleDateString("en-AE", {
                month: "long",
                year: "numeric",
              });
            const periodName =
              view === "daily" ? formatDate(selectedDate) : monthName(selectedDate);
            // Latest earlier day/month that has sales, offered when this one is empty
            const key = (s) => (view === "daily" ? s.date : s.date?.slice(0, 7));
            const earlier = sales
              .map(key)
              .filter((k) => k && k < selectedDate)
              .sort()
              .pop();
            return (
              <BrandPieCard
                sales={currentSales}
                title="My Top Brands"
                subtitle={`By revenue · ${periodName}`}
                emptyText={`No sales in ${periodName} yet, so there's no brand split to show.`}
                fallback={
                  earlier && {
                    label: `Show ${view === "daily" ? formatDate(earlier) : monthName(earlier)}`,
                    onClick: () => setSelectedDate(earlier),
                  }
                }
              />
            );
          })()}

          {view === "daily" && (
            <div style={modernStyles.chartCard}>
              <h3 style={modernStyles.chartTitle}>
                Last 7 Days Sales Trend
                <span style={modernStyles.chartSubtitle}>
                  Daily performance overview
                </span>
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyTrendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.colors.grey300}
                  />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => money(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke={theme.colors.primary}
                    strokeWidth={2}
                    name="Sales (AED)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div
            className="act-btns"
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => navigate("add-sale")}
              style={{ ...styles.button, width: "auto" }}
            >
              ➕ Add New Sale
            </button>
            <button
              onClick={() => navigate("apply-leave")}
              style={{
                ...styles.button,
                width: "auto",
                background: theme.colors.warning,
              }}
            >
              📅 Apply for Leave
            </button>
          </div>

          <div className="card" style={styles.card}>
            <h3 style={styles.cardTitle}>
              Sales (
              {view === "daily" ? formatDate(selectedDate) : selectedDate})
            </h3>
            {currentSales.length === 0 ? (
              <p
                style={{
                  color: theme.colors.textSecondary,
                  textAlign: "center",
                  padding: 40,
                }}
              >
                {view === "daily" &&
                dailyLeaves.some((l) => l.status === "Approved") ? (
                  <span style={{ color: "#e65100", fontWeight: 600 }}>
                    🌴{" "}
                    {(() => {
                      const l = dailyLeaves.find((x) => x.status === "Approved");
                      return l.leaveType === "partial"
                        ? `You're on leave ${leaveTimeLabel(l)} this day. You can add sales outside those hours.`
                        : "You're on approved leave this day, so no sales are expected.";
                    })()}
                  </span>
                ) : (
                  <>No sales for this {view === "daily" ? "day" : "month"}</>
                )}
              </p>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="mob">
                  {currentSales.map((sale, i) => (
                    <div key={i} className="row-card">
                      <div className="row-card-head">
                        <span className="row-card-title">{sale.brand}</span>
                        <span className="row-card-amount">
                          {money(
                            sale.totalAmount || sale.quantity * sale.price,
                          )}
                        </span>
                      </div>
                      <div className="row-card-meta">
                        Qty: {sale.quantity} · {money(sale.price)} each
                      </div>
                      {sale.barcode && (
                        <div className="row-card-meta">🔖 {sale.barcode}</div>
                      )}
                      {sale.location && (
                        <div className="row-card-meta">📍 {sale.location}</div>
                      )}
                      <div className="row-card-meta">
                        {formatDate(sale.date)}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div
                  className="desk"
                  style={{
                    maxHeight: 400,
                    overflowY: "auto",
                    overflowX: "auto",
                  }}
                >
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Location</th>
                        <th style={styles.th}>Brand</th>
                        <th style={styles.th}>Barcode</th>
                        <th style={styles.th}>Qty</th>
                        <th style={styles.th}>Price</th>
                        <th style={styles.th}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSales.map((sale, i) => (
                        <tr key={i}>
                          <td style={styles.td}>{formatDate(sale.date)}</td>
                          <td style={styles.td}>{sale.location || "—"}</td>
                          <td style={styles.td}>{sale.brand}</td>
                          <td style={styles.td}>{sale.barcode || "—"}</td>
                          <td style={styles.td}>{sale.quantity}</td>
                          <td style={styles.td}>{money(sale.price)}</td>
                          <td
                            style={{
                              ...styles.td,
                              fontWeight: 600,
                              color: theme.colors.primary,
                            }}
                          >
                            {money(
                              sale.totalAmount || sale.quantity * sale.price,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {view === "daily" && dailyLeaves.length > 0 && (
            <div className="card" style={styles.card}>
              <h3 style={styles.cardTitle}>Leave Today</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Reason</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Admin Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyLeaves.map((leave, idx) => (
                    <tr key={idx}>
                      <td style={styles.td}>{formatDate(leave.date)}</td>
                      <td style={styles.td}>{leave.reason}<div style={{ fontSize: 12, color: leave.leaveType === "partial" ? "#e65100" : "#9e9e9e", fontWeight: 600, marginTop: 2 }}>🕒 {leaveTimeLabel(leave)}</div></td>
                      <td style={styles.td}>
                        <LeaveStatusBadge status={leave.status} />
                      </td>
                      <td style={styles.td}>{leave.adminRemark || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "monthly" && monthlyLeaves.length > 0 && (
            <div className="card" style={styles.card}>
              <h3 style={styles.cardTitle}>
                Monthly Leave Report ({monthlyLeaves.length} days)
              </h3>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Reason</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Admin Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyLeaves.map((leave, idx) => (
                      <tr key={idx}>
                        <td style={styles.td}>{formatDate(leave.date)}</td>
                        <td style={styles.td}>{leave.reason}<div style={{ fontSize: 12, color: leave.leaveType === "partial" ? "#e65100" : "#9e9e9e", fontWeight: 600, marginTop: 2 }}>🕒 {leaveTimeLabel(leave)}</div></td>
                        <td style={styles.td}>
                          <LeaveStatusBadge status={leave.status} />
                        </td>
                        <td style={styles.td}>{leave.adminRemark || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ===================== DROPDOWN ITEM COMPONENT ===================== */
const DropdownItem = ({ product, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: "12px",
        cursor: "pointer",
        borderBottom: `1px solid ${theme.colors.grey200}`,
        background: isHovered ? theme.colors.grey50 : theme.colors.white,
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          fontWeight: "600",
          fontSize: "14px",
          color: theme.colors.text,
        }}
      >
        {String(
          product.modelNumber || product["Model "] || product.Model || "—",
        )}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: theme.colors.textSecondary,
          marginTop: "4px",
        }}
      >
        {product.brand} · {money(product.price)}
      </div>
    </div>
  );
};

/* ===================== ADD SALE ===================== */
const AddSale = ({ user, navigate, onLogout }) => {
  const [date, setDate] = useState(getToday());
  const [location, setLocation] = useState("");
  const [brand, setBrand] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [modelSearch, setModelSearch] = useState(""); // NEW: search by model
  const [selectedModel, setSelectedModel] = useState(""); // NEW: display after select
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  // Sales this salesman has entered for the selected date (shown below the form)
  const [daySales, setDaySales] = useState([]);
  const modelInputRef = useRef(null);
  // Leave check: block sales during approved leave; re-check every 30s so a
  // part-day leave unlocks on its own when it ends
  const [myLeaves, setMyLeaves] = useState([]);
  const [, setClock] = useState(0);
  useEffect(() => {
    // Re-fetch leaves too, so the page unlocks soon after the admin cancels a leave
    const loadLeaves = () =>
      api.getLeaves({ salesmanId: user.salesmanId }).then(setMyLeaves).catch(() => {});
    loadLeaves();
    const t = setInterval(() => {
      setClock((c) => c + 1);
      loadLeaves();
    }, 30000);
    return () => clearInterval(t);
  }, [user.salesmanId]);
  const leaveBlock = getLeaveBlock(myLeaves, date);

  useEffect(() => {
    let cancelled = false;
    api
      .getSales({ salesmanId: user.salesmanId, date })
      .then((data) => !cancelled && setDaySales(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [date, user.salesmanId]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await api.getProducts();
        // Filter out any invalid products
        const validProducts = (data || []).filter(
          (p) => p && typeof p === "object" && p.brand,
        );
        console.log(
          `Loaded ${validProducts.length} valid products out of ${(data || []).length} total`,
        );
        setProducts(validProducts);
      } catch (err) {
        console.error("Error loading products:", err);
        setProducts([]);
        alert("Could not load products. Please refresh the page.");
      }
    };
    loadProducts();
  }, []);

  // Search products by model number, brand, barcode or description
  useEffect(() => {
    if (modelSearch.trim().length > 0) {
      const q = modelSearch.toLowerCase();
      const results = products.filter((p) => {
        const model = String(p.modelNumber || "").toLowerCase();
        const brand = String(p.brand || "").toLowerCase();
        const ean = String(p.ean || "").toLowerCase();
        const desc = String(p.description || "").toLowerCase();
        return (
          model.includes(q) ||
          brand.includes(q) ||
          ean.includes(q) ||
          desc.includes(q)
        );
      });
      setFilteredProducts(results);
      setShowDropdown(results.length > 0);
    } else {
      setFilteredProducts([]);
      setShowDropdown(false);
    }
  }, [modelSearch, products]);

  const handleModelSelect = (p) => {
    if (!p) return;
    const model = String(p.modelNumber || p["Model "] || p.Model || "");
    setSelectedModel(model);
    setModelSearch(model); // keep search box showing selection
    setItemCode(String(p.itemCode || ""));
    setBrand(p.brand || "");
    setPrice(Number(p.price) || 0);
    // Auto-fill barcode (EAN) and description
    setBarcode(String(p.ean || p.EAN || ""));
    setDescription(
      String(p.description || p.Description || p["Item Description"] || ""),
    );
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    console.log("🟢 ADD SALE - handleSubmit called");
    console.log("🟢 Current values:", {
      date,
      brand,
      itemCode,
      quantity,
      price,
    });

    if (leaveBlock) {
      alert(leaveBlock.message);
      return;
    }

    if (!date || !location || !brand || !quantity || !price) {
      console.log("🔴 Validation failed - missing fields");
      alert("Please fill all fields");
      return;
    }

    console.log("✅ Validation passed");
    setSubmitting(true);

    try {
      const sale = {
        salesmanId: user.salesmanId,
        salesmanName: user.name,
        date: date,
        location: location,
        brand: brand,
        itemCode: itemCode,
        barcode: barcode,
        description: description,
        quantity: Number(quantity),
        price: Number(price),
        totalAmount: Number(quantity) * Number(price),
        timestamp: new Date().toISOString(),
      };

      console.log("🟢 About to call api.addSale with:", sale);
      const result = await api.addSale(sale);
      console.log("✅ api.addSale returned:", result);

      // Stay on this page for the next sale: clear the product fields but
      // keep date and location, which are usually the same all day
      setDaySales((prev) => [result.sale || sale, ...prev]);
      setBrand("");
      setItemCode("");
      setBarcode("");
      setDescription("");
      setModelSearch("");
      setSelectedModel("");
      setQuantity("");
      setPrice("");
      setShowToast(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => modelInputRef.current?.focus(), 300);
    } catch (err) {
      console.error("🔴 Error in handleSubmit:", err);
      alert("Error adding sale: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // uniqueBrands not needed - brand is auto-filled from model selection

  return (
    <>
      <GlobalStyles />
      {showToast && (
        <SuccessToast
          message="Sale added! Enter the next one, or go Back to Dashboard when done."
          onClose={() => setShowToast(false)}
        />
      )}

      <div style={styles.dashboardContainer}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={modernStyles.logoContainer}>
              <img src={amoraLogo} alt="Amora" style={modernStyles.logo} />
              <h1 style={styles.headerTitle}>Add New Sale</h1>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => navigate("salesman-dashboard")}
                style={styles.headerButton}
              >
                Back to Dashboard
              </button>
              <button onClick={onLogout} style={styles.logoutButton}>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div style={styles.mainContent} className="pg-content">
          <div
            className="card"
            style={{ ...styles.card, maxWidth: "700px", margin: "0 auto" }}
          >
            <h3 style={styles.cardTitle}>Sale Details</h3>
            {leaveBlock && (
              <div
                style={{
                  background: "#fff3e0",
                  border: "1px solid #ffcc80",
                  color: "#e65100",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 20,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                🌴 {leaveBlock.message}
              </div>
            )}
            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={submitting}
                style={styles.dateInput}
              />
            </div>

            {/* ── Location / Outlet Name ── */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Location / Outlet Name</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={submitting}
                style={styles.select}
              >
                <option value="">-- Select Outlet --</option>
                <option value="Emax - Dalma Mall">Emax - Dalma Mall</option>
                <option value="Emax - Yas Mall">Emax - Yas Mall</option>
                <option value="Emax - Dubai Mall">Emax - Dubai Mall</option>
                <option value="Emax - Mcc">Emax - Mcc</option>
              </select>
            </div>

            {/* ── Model Number Search (auto-fills Brand, Item Code, Price) ── */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Model Number{" "}
                <span
                  style={{
                    color: theme.colors.textSecondary,
                    fontWeight: 400,
                    fontSize: 12,
                  }}
                >
                  (type to search)
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  ref={modelInputRef}
                  type="text"
                  value={modelSearch}
                  onChange={(e) => {
                    setModelSearch(e.target.value);
                    // Clear auto-filled values when user changes search
                    if (e.target.value !== selectedModel) {
                      setBrand("");
                      setItemCode("");
                      setPrice("");
                      setSelectedModel("");
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  disabled={submitting}
                  style={styles.input}
                  placeholder="Type model number…"
                  autoComplete="off"
                />
                {showDropdown && filteredProducts.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      maxHeight: "220px",
                      overflowY: "auto",
                      background: theme.colors.white,
                      border: `1px solid ${theme.colors.grey300}`,
                      borderRadius: "10px",
                      marginTop: "4px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      zIndex: 1000,
                    }}
                  >
                    {filteredProducts.slice(0, 12).map((p, i) => (
                      <DropdownItem
                        key={`${p.itemCode}-${i}`}
                        product={p}
                        onClick={() => handleModelSelect(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Auto-filled read-only fields */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Brand{" "}
                <span
                  style={{
                    color: theme.colors.primary,
                    fontWeight: 400,
                    fontSize: 12,
                  }}
                >
                  (auto-filled)
                </span>
              </label>
              <input
                type="text"
                value={brand}
                disabled
                style={{
                  ...styles.input,
                  background: brand ? "#f0fff0" : theme.colors.grey100,
                  cursor: "not-allowed",
                  fontWeight: brand ? 600 : 400,
                }}
                placeholder="Auto-filled on selection"
              />
            </div>

            {/* Auto-filled: Barcode (EAN) */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Barcode{" "}
                <span
                  style={{
                    color: theme.colors.primary,
                    fontWeight: 400,
                    fontSize: 12,
                  }}
                >
                  (auto-filled)
                </span>
              </label>
              <input
                type="text"
                value={barcode}
                disabled
                style={{
                  ...styles.input,
                  background: barcode ? "#f0fff0" : theme.colors.grey100,
                  cursor: "not-allowed",
                  fontWeight: barcode ? 600 : 400,
                }}
                placeholder="Auto-filled on selection"
              />
            </div>

            {/* Auto-filled: Description */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Description{" "}
                <span
                  style={{
                    color: theme.colors.primary,
                    fontWeight: 400,
                    fontSize: 12,
                  }}
                >
                  (auto-filled)
                </span>
              </label>
              <input
                type="text"
                value={description}
                disabled
                style={{
                  ...styles.input,
                  background: description ? "#f0fff0" : theme.colors.grey100,
                  cursor: "not-allowed",
                  fontWeight: description ? 500 : 400,
                }}
                placeholder="Auto-filled on selection"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={submitting}
                style={styles.input}
                placeholder="Enter quantity"
                min="1"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Price (AED)</label>
              <input
                type="number"
                value={price}
                disabled
                style={{
                  ...styles.input,
                  background: theme.colors.grey100,
                  cursor: "not-allowed",
                }}
                placeholder="Auto-filled from product"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Total Amount</label>
              <input
                type="text"
                value={
                  quantity && price
                    ? money(Number(quantity) * Number(price))
                    : ""
                }
                disabled
                style={{
                  ...styles.input,
                  background: theme.colors.grey100,
                  cursor: "not-allowed",
                  fontWeight: "600",
                  color: theme.colors.primary,
                }}
                placeholder="Calculated automatically"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !!leaveBlock}
              style={styles.button}
            >
              {submitting
                ? "Submitting..."
                : leaveBlock
                  ? "On leave, sales locked"
                  : "＋ Add Sale"}
            </button>
          </div>

          {/* Running list of this day's sales, so the salesman can enter them all in one go */}
          <div
            className="card"
            style={{
              ...styles.card,
              maxWidth: "700px",
              margin: "20px auto 0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <h3 style={{ ...styles.cardTitle, margin: 0 }}>
                {date === getToday() ? "Sales added today" : `Sales on ${formatDate(date)}`}
              </h3>
              <span style={{ fontWeight: 700, color: theme.colors.primary, fontSize: 18 }}>
                {daySales.length} {daySales.length === 1 ? "sale" : "sales"} ·{" "}
                {money(daySales.reduce((t, s) => t + (s.totalAmount || s.quantity * s.price), 0))}
              </span>
            </div>
            {daySales.length === 0 ? (
              <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
                No sales entered yet for this day.
              </p>
            ) : (
              daySales.map((s, i) => (
                <div
                  key={s._id || i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 0",
                    borderTop: i ? `1px solid ${theme.colors.grey200}` : "none",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {s.brand} · {s.description || s.itemCode || s.barcode}
                    </div>
                    <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 }}>
                      Qty {s.quantity} × {money(s.price)}
                      {s.location ? ` · ${s.location}` : ""}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: theme.colors.primary, whiteSpace: "nowrap" }}>
                    {money(s.totalAmount || s.quantity * s.price)}
                  </div>
                </div>
              ))
            )}
            <button
              onClick={() => navigate("salesman-dashboard")}
              style={{
                ...styles.button,
                marginTop: 16,
                background: theme.colors.white,
                color: theme.colors.primaryDark,
                border: `1.5px solid ${theme.colors.primary}`,
                boxShadow: "none",
              }}
            >
              ✓ Done, Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ===================== APPLY LEAVE ===================== */
const ApplyLeave = ({ user, navigate, onLogout }) => {
  const [date, setDate] = useState(getToday());
  const [reason, setReason] = useState("");
  const [leaveType, setLeaveType] = useState("full"); // "full" | "partial"
  const [fromTime, setFromTime] = useState("08:00");
  const [toTime, setToTime] = useState("14:00");
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async () => {
    console.log("🟢 APPLY LEAVE - handleSubmit called");
    console.log("🟢 Current values:", { date, reason });

    if (!date || !reason) {
      console.log("🔴 Validation failed - missing fields");
      alert("Please fill all fields");
      return;
    }
    if (leaveType === "partial" && (!fromTime || !toTime || fromTime >= toTime)) {
      alert("Please enter a From time and a To time (To must be after From).");
      return;
    }

    console.log("✅ Validation passed");
    setSubmitting(true);

    try {
      const leave = {
        salesmanId: user.salesmanId,
        salesmanName: user.name,
        date: date,
        reason: reason,
        leaveType,
        fromTime: leaveType === "partial" ? fromTime : "",
        toTime: leaveType === "partial" ? toTime : "",
        timestamp: new Date().toISOString(),
      };

      console.log("🟢 About to call api.addLeave with:", leave);
      const result = await api.addLeave(leave);
      console.log("✅ api.addLeave returned:", result);

      setDate(getToday());
      setReason("");
      setShowToast(true);

      setTimeout(() => navigate("salesman-dashboard"), 1500);
    } catch (err) {
      console.error("🔴 Error in handleSubmit:", err);
      alert("Error submitting leave: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <GlobalStyles />
      {showToast && (
        <SuccessToast
          message="Leave application submitted successfully!"
          onClose={() => setShowToast(false)}
        />
      )}

      <div style={styles.dashboardContainer}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={modernStyles.logoContainer}>
              <img src={amoraLogo} alt="Amora" style={modernStyles.logo} />
              <h1 style={styles.headerTitle}>Apply for Leave</h1>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => navigate("salesman-dashboard")}
                style={styles.headerButton}
              >
                Back to Dashboard
              </button>
              <button onClick={onLogout} style={styles.logoutButton}>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div style={styles.mainContent} className="pg-content">
          <div
            className="card form-card"
            style={{ ...styles.card, maxWidth: "700px", margin: "0 auto" }}
          >
            <h3 style={styles.cardTitle}>Leave Application</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={submitting}
                style={styles.dateInput}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Leave Type</label>
              <div style={{ ...modernStyles.viewToggle, width: "100%" }}>
                {[
                  ["full", "Full day"],
                  ["partial", "Part of day"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLeaveType(value)}
                    disabled={submitting}
                    style={{
                      ...modernStyles.toggleButton,
                      flex: 1,
                      ...(leaveType === value ? modernStyles.toggleButtonActive : {}),
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {leaveType === "partial" && (
              <div style={{ ...styles.formGroup, display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>From</label>
                  <input
                    type="time"
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                    disabled={submitting}
                    style={styles.dateInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>To</label>
                  <input
                    type="time"
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                    disabled={submitting}
                    style={styles.dateInput}
                  />
                </div>
              </div>
            )}
            {leaveType === "partial" && (
              <p style={{ margin: "-8px 0 20px", fontSize: 14, color: theme.colors.textSecondary }}>
                You can add sales outside these hours on this day.
              </p>
            )}
            <div style={styles.formGroup}>
              <label style={styles.label}>Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="4"
                placeholder="Enter reason for leave..."
                disabled={submitting}
                style={styles.textarea}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={styles.button}
            >
              {submitting ? "Submitting..." : "Submit Leave Application"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ===================== ADMIN DASHBOARD ===================== */
const AdminDashboard = ({ user, navigate, onLogout }) => {
  const [sales, setSales] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [view, setView] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  // ✅ Approve/Reject modal state
  const [remarkModal, setRemarkModal] = useState(null); // { leave, action }
  const [adminRemark, setAdminRemark] = useState("");

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refreshLeaves();
  }, [view, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesData, leavesData, usersData] = await Promise.all([
        api.getSales(),
        api.getLeaves(),
        api.getUsers(),
      ]);
      setSales(salesData);
      setLeaves(leavesData);
      setSalesmen(usersData.filter((u) => u.role === "salesman"));
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshLeaves = async () => {
    try {
      const leavesData = await api.getLeaves();
      setLeaves(leavesData);
    } catch (err) {
      console.error("Error refreshing leaves:", err);
    }
  };

  const getDailySales = (date) => sales.filter((s) => s.date === date);
  const getMonthlySales = (monthYear) =>
    sales.filter((s) => s.date.startsWith(monthYear));
  const getSalesmanSales = (salesmanId, salesData) =>
    salesData.filter((s) => s.salesmanId === salesmanId);
  const calculateTotal = (salesData) =>
    salesData.reduce(
      (sum, s) => sum + (s.totalAmount || s.quantity * s.price),
      0,
    );

  const currentSales =
    view === "daily"
      ? getDailySales(selectedDate)
      : getMonthlySales(selectedDate);
  const dailyLeaves = leaves.filter((l) => l.date === selectedDate);
  const monthlyLeaves = leaves.filter((l) =>
    l.date.startsWith(selectedDate.slice(0, 7)),
  );
  // Salespeople with approved leave on the selected day (daily view only)
  const approvedLeaveById = new Map(
    view === "daily"
      ? dailyLeaves
          .filter((l) => l.status === "Approved")
          .map((l) => [l.salesmanId, l])
      : [],
  );
  const onLeaveBadge = (id) => {
    const l = approvedLeaveById.get(id);
    if (!l) return null;
    return (
    <span
      style={{
        marginLeft: 8,
        padding: "2px 10px",
        borderRadius: 999,
        background: "#fff3e0",
        color: "#e65100",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      🌴 {l.leaveType === "partial" ? `Leave ${leaveTimeLabel(l)}` : "On leave"}
    </span>
    );
  };

  // Admin: permanently delete a leave record
  const handleDeleteLeave = async (leave) => {
    const who = leave.salesmanName || leave.salesmanId;
    if (
      !window.confirm(
        `Delete ${who}'s leave on ${formatDate(leave.date)}?\n\nReason: ${leave.reason}\n\nThis cannot be undone.`,
      )
    )
      return;
    try {
      await api.deleteLeave(leave._id);
      await refreshLeaves();
    } catch (err) {
      alert("Failed to delete leave: " + err.message);
    }
  };
  // Admin: cancel a leave so the salesman can work and add sales that day.
  // Unlike Delete, the record stays in history with status "Cancelled".
  const handleCancelLeave = async (leave) => {
    const who = leave.salesmanName || leave.salesmanId;
    const note = window.prompt(
      `Cancel ${who}'s leave on ${formatDate(leave.date)}?\n${who} will be able to add sales on this day.\n\nNote (optional):`,
      "Cancelled at salesman's request",
    );
    if (note === null) return; // admin pressed Cancel on the dialog
    try {
      await api.updateLeaveStatus(leave._id, "Cancelled", note.trim());
      await refreshLeaves();
    } catch (err) {
      alert("Failed to cancel leave: " + err.message);
    }
  };
  const cancelLeaveButton = (leave) =>
    leave.status === "Approved" || leave.status === "Pending" ? (
      <button
        onClick={() => handleCancelLeave(leave)}
        title="Cancel this leave so the salesman can work"
        style={{
          ...styles.actionButton,
          background: "#546e7a",
        }}
      >
        ⊘ Cancel leave
      </button>
    ) : null;
  const deleteLeaveButton = (leave) => (
    <button
      onClick={() => handleDeleteLeave(leave)}
      title="Delete this leave"
      style={{
        ...styles.actionButton,
        background: theme.colors.white,
        color: theme.colors.primaryDark,
        border: `1px solid ${theme.colors.grey300}`,
      }}
    >
      🗑 Delete
    </button>
  );

  const downloadReport = (salesmanId) => {
    const salesmanSales = sales.filter((s) => s.salesmanId === salesmanId);
    const salesman = salesmen.find((sm) => sm.salesmanId === salesmanId);
    let csv = "Date,Location,Brand,Barcode,Quantity,Price,Total\n";
    salesmanSales.forEach((s) => {
      csv += `${s.date},${s.location || ""},${s.brand},${s.barcode || ""},${s.quantity},${s.price},${s.totalAmount || s.quantity * s.price}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${salesman?.name}_sales_report.csv`;
    a.click();
  };

  // ✅ Download monthly leave report for a specific salesman
  const downloadLeaveReport = (salesmanId) => {
    const salesman = salesmen.find((sm) => sm.salesmanId === salesmanId);
    const month = selectedDate.slice(0, 7); // e.g. "2026-03"
    const salesmanLeaves = leaves.filter(
      (l) => l.salesmanId === salesmanId && l.date.startsWith(month),
    );
    let csv = "Date,Salesman,Reason,Applied At,Status,Admin Remark,Action At\n";
    salesmanLeaves.forEach((l) => {
      const reason = `"${(l.reason || "").replace(/"/g, '""')}"`;
      const remark = `"${(l.adminRemark || "").replace(/"/g, '""')}"`;
      const appliedAt = l.appliedAt
        ? new Date(l.appliedAt).toLocaleString("en-AE")
        : "";
      const actionAt = l.actionAt
        ? new Date(l.actionAt).toLocaleString("en-AE")
        : "";
      csv += `${l.date},${salesman?.name || l.salesmanName},${reason},${appliedAt},${l.status || "Pending"},${remark},${actionAt}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${salesman?.name}_leave_report_${month}.csv`;
    a.click();
  };

  // ✅ Download ALL employees leave report for selected month
  const downloadAllLeavesReport = () => {
    const month = selectedDate.slice(0, 7);
    const filtered = leaves.filter((l) => l.date.startsWith(month));
    let csv = "Date,Salesman,Reason,Applied At,Status,Admin Remark,Action At\n";
    filtered.forEach((l) => {
      const salesman = salesmen.find((s) => s.salesmanId === l.salesmanId);
      const reason = `"${(l.reason || "").replace(/"/g, '""')}"`;
      const remark = `"${(l.adminRemark || "").replace(/"/g, '""')}"`;
      const appliedAt = l.appliedAt
        ? new Date(l.appliedAt).toLocaleString("en-AE")
        : "";
      const actionAt = l.actionAt
        ? new Date(l.actionAt).toLocaleString("en-AE")
        : "";
      csv += `${l.date},${salesman?.name || l.salesmanName},${reason},${appliedAt},${l.status || "Pending"},${remark},${actionAt}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all_employees_leave_report_${month}.csv`;
    a.click();
  };

  // ✅ Approve or Reject leave with admin remark
  const handleLeaveAction = async (status) => {
    if (!remarkModal) return;
    try {
      await api.updateLeaveStatus(remarkModal.leave._id, status, adminRemark);
      await refreshLeaves();
      setRemarkModal(null);
      setAdminRemark("");
    } catch (err) {
      alert("Failed to update leave: " + err.message);
    }
  };

  const salesBySalesman = salesmen.map((sm) => {
    const smSales = getSalesmanSales(sm.salesmanId, currentSales);
    return {
      name: sm.name,
      id: sm.salesmanId,
      sales: calculateTotal(smSales),
      transactions: smSales.length,
    };
  });

  const getBrandPerformance = () => {
    const brandMap = {};
    currentSales.forEach((s) => {
      const brand = s.brand || "Unknown";
      if (!brandMap[brand]) brandMap[brand] = { quantity: 0, total: 0 };
      brandMap[brand].quantity += Number(s.quantity) || 0;
      brandMap[brand].total +=
        Number(s.totalAmount) || Number(s.quantity) * Number(s.price);
    });
    return Object.entries(brandMap)
      .map(([brand, data]) => ({
        name: brand,
        value: data.total,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const topBrands = getBrandPerformance();

  const getPerformerOfMonth = () => {
    if (view !== "monthly") return null;

    const performanceData = salesmen.map((sm) => {
      const smSales = getSalesmanSales(sm.salesmanId, currentSales);
      return {
        salesman: sm,
        sales: calculateTotal(smSales),
        transactions: smSales.length,
      };
    });

    const topPerformer = performanceData.reduce(
      (max, current) => (current.sales > max.sales ? current : max),
      { sales: 0 },
    );

    return topPerformer.sales > 0 ? topPerformer : null;
  };

  const performerOfMonth = getPerformerOfMonth();

  const COLORS = [
    "#e53935", // Red
    "#1e88e5", // Blue
    "#43a047", // Green
    "#fb8c00", // Orange
    "#8e24aa", // Purple
    "#00acc1", // Cyan
    "#f4511e", // Deep Orange
    "#6d4c41", // Brown
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <GlobalStyles />
      <div style={styles.dashboardContainer}>
        <div style={styles.header}>
          <div style={styles.headerContent} className="hdr">
            <div style={modernStyles.logoContainer}>
              <img
                src={amoraLogo}
                alt="Amora"
                style={modernStyles.logo}
                className="hdr-logo"
              />
              <div>
                <h1 style={styles.headerTitle} className="hdr-title">
                  Amora Sales Tracker
                </h1>
                <p style={modernStyles.headerSubtitle} className="hdr-sub">
                  Admin Dashboard
                </p>
              </div>
            </div>
            {/* Desktop nav */}
            <div className="nav-desktop">
              <button
                onClick={() => navigate("manage-salesmen")}
                style={styles.headerButton}
              >
                Manage Team
              </button>
              <button
                onClick={() => navigate("download-products")}
                style={styles.headerButton}
              >
                Products
              </button>
              <div style={modernStyles.userBadge}>
                <div style={modernStyles.userAvatar}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={modernStyles.userName}>{user.name}</div>
              </div>
              <button onClick={onLogout} style={modernStyles.logoutButton}>
                Logout
              </button>
            </div>
            {/* Mobile hamburger */}
            <button
              className="nav-hamburger"
              onClick={() => setNavOpen(true)}
              style={{
                background: "none",
                border: `1px solid ${theme.colors.grey300}`,
                borderRadius: 6,
                padding: "7px 10px",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ☰
            </button>
          </div>
        </div>
        {/* Mobile nav overlay */}
        <div
          className={`mob-nav-overlay${navOpen ? " open" : ""}`}
          onClick={() => setNavOpen(false)}
        >
          <div className="mob-nav-panel" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 16 }}>Admin Menu</span>
              <button
                onClick={() => setNavOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div className="mob-nav-divider" />
            <button
              onClick={() => {
                navigate("manage-salesmen");
                setNavOpen(false);
              }}
              style={{
                background: theme.colors.grey100,
                border: `1px solid ${theme.colors.grey300}`,
                color: theme.colors.text,
              }}
            >
              👥 Manage Team
            </button>
            <button
              onClick={() => {
                navigate("download-products");
                setNavOpen(false);
              }}
              style={{
                background: theme.colors.grey100,
                border: `1px solid ${theme.colors.grey300}`,
                color: theme.colors.text,
              }}
            >
              📦 Products
            </button>
            <div className="mob-nav-divider" />
            <button
              onClick={() => {
                onLogout();
                setNavOpen(false);
              }}
              style={{
                background: "#fff",
                border: `1px solid ${theme.colors.grey300}`,
                color: theme.colors.text,
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        <div style={modernStyles.mainContent} className="pg-content">
          <div style={modernStyles.controlBar} className="ctrl-bar">
            <div style={modernStyles.viewToggle} className="view-toggle">
              <button
                onClick={() => {
                  setView("daily");
                  setSelectedDate(getToday());
                }}
                style={{
                  ...modernStyles.toggleButton,
                  ...(view === "daily" ? modernStyles.toggleButtonActive : {}),
                }}
              >
                Daily View
              </button>
              <button
                onClick={() => {
                  setView("monthly");
                  setSelectedDate(getMonthYear());
                }}
                style={{
                  ...modernStyles.toggleButton,
                  ...(view === "monthly"
                    ? modernStyles.toggleButtonActive
                    : {}),
                }}
              >
                Monthly View
              </button>
            </div>
            <input
              type={view === "daily" ? "date" : "month"}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                ...modernStyles.dateInput,
                padding: "10px 16px",
                fontSize: "14px",
                border: `1px solid ${theme.colors.grey300}`,
                borderRadius: "10px",
              }}
            />
          </div>

          <div style={modernStyles.statsGrid} className="stats-grid">
            <div style={modernStyles.statsCard} className="stats-card">
              <div style={modernStyles.statsIcon} className="stats-icon">
                💰
              </div>
              <div>
                <p style={modernStyles.statsLabel}>Total Sales</p>
                <h2 style={modernStyles.statsValue}>
                  {money(calculateTotal(currentSales))}
                </h2>
              </div>
            </div>
            <div style={modernStyles.statsCard} className="stats-card">
              <div style={modernStyles.statsIcon} className="stats-icon">
                🛍️
              </div>
              <div>
                <p style={modernStyles.statsLabel}>Transactions</p>
                <h2 style={modernStyles.statsValue}>{currentSales.length}</h2>
              </div>
            </div>
            <div style={modernStyles.statsCard} className="stats-card">
              <div style={modernStyles.statsIcon} className="stats-icon">
                👥
              </div>
              <div>
                <p style={modernStyles.statsLabel}>Active Salesmen</p>
                <h2 style={modernStyles.statsValue}>{salesmen.length}</h2>
              </div>
            </div>
            <div style={modernStyles.statsCard} className="stats-card">
              <div style={modernStyles.statsIcon} className="stats-icon">
                📅
              </div>
              <div>
                <p style={modernStyles.statsLabel}>Leaves</p>
                <h2 style={modernStyles.statsValue}>
                  {view === "daily" ? dailyLeaves.length : monthlyLeaves.length}
                </h2>
              </div>
            </div>
          </div>

          {performerOfMonth && (
            <div
              style={{
                ...modernStyles.statsCard,
                marginBottom: "24px",
                background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryLight} 100%)`,
                color: theme.colors.white,
                padding: "32px",
              }}
            >
              <div style={{ fontSize: "48px" }}>🏆</div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    ...modernStyles.statsLabel,
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  Performer of the Month
                </p>
                <h2
                  style={{
                    ...modernStyles.statsValue,
                    color: theme.colors.white,
                    marginBottom: "8px",
                  }}
                >
                  {performerOfMonth.salesman.name}
                </h2>
                <p style={{ fontSize: "16px", margin: 0, opacity: 0.95 }}>
                  {money(performerOfMonth.sales)} •{" "}
                  {performerOfMonth.transactions} transactions
                </p>
              </div>
            </div>
          )}

          {view === "monthly" && (
            <MonthlyTrendCard
              sales={sales}
              selectedMonth={selectedDate}
              onSelect={setSelectedDate}
            />
          )}

          {view === "monthly" && (
            <div style={modernStyles.chartsGrid} className="charts-grid">
              <div style={modernStyles.chartCard}>
                <h3 style={modernStyles.chartTitle}>
                  Top Brand Performance
                  <span style={modernStyles.chartSubtitle}>
                    Top 5 Brands by Revenue
                  </span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topBrands}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topBrands.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => money(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={modernStyles.chartCard}>
                <h3 style={modernStyles.chartTitle}>
                  Employee Performance
                  <span style={modernStyles.chartSubtitle}>
                    Sales Comparison
                  </span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={salesBySalesman}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.colors.grey300}
                    />
                    <XAxis dataKey="id" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [money(value), "Total Sales"]}
                      labelFormatter={(label) => {
                        const entry = salesBySalesman.find(
                          (e) => e.id === label,
                        );
                        return entry ? entry.name : label;
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="sales"
                      fill={theme.colors.primary}
                      name="Total Sales"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {topBrands.length > 0 && (
            <div className="card" style={styles.card}>
              <h3 style={styles.cardTitle}>Top Performing Brands</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Rank</th>
                      <th style={styles.th}>Brand</th>
                      <th style={styles.th}>Units Sold</th>
                      <th style={styles.th}>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBrands.map((brand, idx) => (
                      <tr key={brand.name}>
                        <td style={styles.td}>
                          <span
                            style={{
                              fontWeight: "600",
                              fontSize: "16px",
                              color:
                                idx === 0
                                  ? theme.colors.primary
                                  : theme.colors.textSecondary,
                            }}
                          >
                            {idx === 0
                              ? "🥇"
                              : idx === 1
                                ? "🥈"
                                : idx === 2
                                  ? "🥉"
                                  : `#${idx + 1}`}
                          </span>
                        </td>
                        <td style={{ ...styles.td, fontWeight: "600" }}>
                          {brand.name}
                        </td>
                        <td style={styles.td}>{brand.quantity}</td>
                        <td
                          style={{
                            ...styles.td,
                            fontWeight: "600",
                            color: theme.colors.primary,
                          }}
                        >
                          {money(brand.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === "daily" && dailyLeaves.length > 0 && (
            <div className="card" style={styles.card}>
              <h3 style={styles.cardTitle}>Salesmen on Leave Today</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Salesman</th>
                    <th style={styles.th}>Reason</th>
                    <th style={styles.th}>Applied At</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyLeaves.map((leave, idx) => {
                    const salesman = salesmen.find(
                      (s) => s.salesmanId === leave.salesmanId,
                    );
                    return (
                      <tr key={idx}>
                        <td style={styles.td}>
                          {salesman?.name || leave.salesmanName}
                        </td>
                        <td style={styles.td}>{leave.reason}<div style={{ fontSize: 12, color: leave.leaveType === "partial" ? "#e65100" : "#9e9e9e", fontWeight: 600, marginTop: 2 }}>🕒 {leaveTimeLabel(leave)}</div></td>
                        <td style={styles.td}>
                          {leave.appliedAt
                            ? new Date(leave.appliedAt).toLocaleString("en-AE")
                            : formatDate(leave.date)}
                        </td>
                        <td style={styles.td}>
                          <LeaveStatusBadge status={leave.status} />
                        </td>
                        <td style={styles.td}>
                          {leave.status === "Pending" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => {
                                  setRemarkModal({ leave });
                                  setAdminRemark("");
                                }}
                                style={{
                                  ...styles.actionButton,
                                  background: "#4caf50",
                                }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRemarkModal({
                                    leave,
                                    requireRemark: true,
                                  });
                                  setAdminRemark("");
                                }}
                                style={{
                                  ...styles.actionButton,
                                  background: "#f44336",
                                }}
                              >
                                ✗ Reject
                              </button>
                            </div>
                          )}
                          {leave.status !== "Pending" && leave.adminRemark && (
                            <span style={{ fontSize: 12, color: "#666" }}>
                              📝 {leave.adminRemark}
                            </span>
                          )}
                          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>{cancelLeaveButton(leave)}{deleteLeaveButton(leave)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {view === "monthly" && monthlyLeaves.length > 0 && (
            <div className="card" style={styles.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h3 style={{ ...styles.cardTitle, margin: 0 }}>
                  Monthly Leave Report ({monthlyLeaves.length} total)
                </h3>
                <button
                  onClick={downloadAllLeavesReport}
                  style={{
                    ...styles.button,
                    width: "auto",
                    padding: "8px 16px",
                    fontSize: 13,
                  }}
                >
                  ⬇ Download All Leaves CSV
                </button>
              </div>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Salesman</th>
                      <th style={styles.th}>Reason</th>
                      <th style={styles.th}>Applied At</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Admin Remark</th>
                      <th style={styles.th}>Action At</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyLeaves.map((leave, idx) => {
                      const salesman = salesmen.find(
                        (s) => s.salesmanId === leave.salesmanId,
                      );
                      return (
                        <tr key={idx}>
                          <td style={styles.td}>{formatDate(leave.date)}</td>
                          <td style={styles.td}>
                            {salesman?.name || leave.salesmanName}
                          </td>
                          <td style={styles.td}>{leave.reason}<div style={{ fontSize: 12, color: leave.leaveType === "partial" ? "#e65100" : "#9e9e9e", fontWeight: 600, marginTop: 2 }}>🕒 {leaveTimeLabel(leave)}</div></td>
                          <td style={styles.td}>
                            {leave.appliedAt
                              ? new Date(leave.appliedAt).toLocaleString(
                                  "en-AE",
                                )
                              : "—"}
                          </td>
                          <td style={styles.td}>
                            <LeaveStatusBadge status={leave.status} />
                          </td>
                          <td style={styles.td}>{leave.adminRemark || "—"}</td>
                          <td style={styles.td}>
                            {leave.actionAt
                              ? new Date(leave.actionAt).toLocaleString("en-AE")
                              : "—"}
                          </td>
                          <td style={styles.td}>
                            {leave.status === "Pending" && (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  onClick={() => {
                                    setRemarkModal({ leave });
                                    setAdminRemark("");
                                  }}
                                  style={{
                                    ...styles.actionButton,
                                    background: "#4caf50",
                                  }}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => {
                                    setRemarkModal({
                                      leave,
                                      requireRemark: true,
                                    });
                                    setAdminRemark("");
                                  }}
                                  style={{
                                    ...styles.actionButton,
                                    background: "#f44336",
                                  }}
                                >
                                  ✗
                                </button>
                              </div>
                            )}
                            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>{cancelLeaveButton(leave)}{deleteLeaveButton(leave)}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card" style={styles.card}>
            <h3 style={styles.cardTitle}>
              Sales by Salesman (
              {view === "daily" ? formatDate(selectedDate) : selectedDate})
            </h3>
            {/* Mobile cards */}
            <div className="mob">
              {salesmen.map((salesman) => {
                const smSales = getSalesmanSales(
                  salesman.salesmanId,
                  currentSales,
                );
                const total = calculateTotal(smSales);
                return (
                  <div key={salesman.id || salesman._id} className="sm-row">
                    <div className="sm-row-l">
                      <div className="sm-name">
                        {salesman.name}
                        {onLeaveBadge(salesman.salesmanId)}
                      </div>
                      <div className="sm-meta">
                        {salesman.salesmanId} · {smSales.length} txns
                      </div>
                    </div>
                    <div className="sm-row-r">
                      <div className="sm-total">{money(total)}</div>
                      <button
                        onClick={() => downloadReport(salesman.salesmanId)}
                        style={{
                          ...styles.actionButton,
                          fontSize: 11,
                          padding: "5px 8px",
                          marginTop: 4,
                        }}
                      >
                        ⬇ Sales CSV
                      </button>
                      <button
                        onClick={() => downloadLeaveReport(salesman.salesmanId)}
                        style={{
                          ...styles.actionButton,
                          fontSize: 11,
                          padding: "5px 8px",
                          marginTop: 4,
                          background: "#ff9800",
                        }}
                      >
                        ⬇ Leave CSV
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop table */}
            <div className="desk" style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Salesman</th>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Transactions</th>
                    <th style={styles.th}>Total Sales</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesmen.map((salesman) => {
                    const smSales = getSalesmanSales(
                      salesman.salesmanId,
                      currentSales,
                    );
                    const total = calculateTotal(smSales);
                    return (
                      <tr key={salesman.id || salesman._id}>
                        <td style={styles.td}>
                          {salesman.name}
                          {onLeaveBadge(salesman.salesmanId)}
                        </td>
                        <td style={styles.td}>{salesman.salesmanId}</td>
                        <td style={styles.td}>{smSales.length}</td>
                        <td
                          style={{
                            ...styles.td,
                            fontWeight: 600,
                            color: theme.colors.primary,
                          }}
                        >
                          {money(total)}
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() =>
                                downloadReport(salesman.salesmanId)
                              }
                              style={styles.actionButton}
                            >
                              ⬇ Sales Report
                            </button>
                            <button
                              onClick={() =>
                                downloadLeaveReport(salesman.salesmanId)
                              }
                              style={{
                                ...styles.actionButton,
                                background: "#ff9800",
                              }}
                            >
                              ⬇ Leave Report
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Approve / Reject modal */}
      {remarkModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 28,
              width: 420,
              maxWidth: "90vw",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                color: remarkModal.requireRemark ? "#c62828" : "#2e7d32",
              }}
            >
              {remarkModal.requireRemark ? "✗ Reject Leave" : "✓ Approve Leave"}
            </h3>
            <p style={{ margin: "0 0 16px", color: "#555", fontSize: 14 }}>
              <strong>{remarkModal.leave.salesmanName}</strong> —{" "}
              {formatDate(remarkModal.leave.date)}
              <br />
              Reason: {remarkModal.leave.reason}
            </p>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>
              {remarkModal.requireRemark
                ? "Rejection Reason *"
                : "Note (optional)"}
            </label>
            <textarea
              value={adminRemark}
              onChange={(e) => setAdminRemark(e.target.value)}
              placeholder={
                remarkModal.requireRemark
                  ? "Enter reason for rejection..."
                  : "Add a note (optional)..."
              }
              rows={3}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ddd",
                fontSize: 14,
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 16,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setRemarkModal(null);
                  setAdminRemark("");
                }}
                style={{ ...styles.headerButton, padding: "8px 18px" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (remarkModal.requireRemark && !adminRemark.trim()) {
                    alert("Please enter a rejection reason.");
                    return;
                  }
                  handleLeaveAction(
                    remarkModal.requireRemark ? "Rejected" : "Approved",
                  );
                }}
                style={{
                  ...styles.button,
                  width: "auto",
                  padding: "8px 20px",
                  background: remarkModal.requireRemark ? "#f44336" : "#4caf50",
                }}
              >
                {remarkModal.requireRemark ? "Reject" : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ===================== ROOT APP ===================== */
export default function App() {
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState("login");

  // ── Back-button guard ─────────────────────────────────────────
  // Push a dummy history entry whenever the route changes so the
  // browser back button triggers popstate instead of leaving the app.
  // On popstate we intercept it and redirect to the correct dashboard.
  useEffect(() => {
    if (route !== "login") {
      window.history.pushState({ route }, "", window.location.pathname);
    }
  }, [route]);

  useEffect(() => {
    const handlePop = () => {
      // Always push a new entry so we never fall off the stack
      window.history.pushState({ route }, "", window.location.pathname);
      if (user) {
        // Redirect to the right dashboard – never exit the app
        const dashboard =
          user.role === "admin" ? "admin-dashboard" : "salesman-dashboard";
        setRoute(dashboard);
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [user, route]);
  // ─────────────────────────────────────────────────────────────

  const doLogin = (u) => {
    setUser(u);
    setRoute(u.role === "admin" ? "admin-dashboard" : "salesman-dashboard");
  };

  const doLogout = () => {
    setUser(null);
    setRoute("login");
  };

  const navigate = (r) => setRoute(r);

  if (!user) return <LoginPage onLogin={doLogin} />;
  if (route === "admin-dashboard")
    return (
      <AdminDashboard user={user} navigate={navigate} onLogout={doLogout} />
    );
  if (route === "manage-salesmen")
    return <ManageSalesmen navigate={navigate} onLogout={doLogout} />;
  if (route === "download-products")
    return <DownloadProducts navigate={navigate} onLogout={doLogout} />;
  if (route === "salesman-dashboard")
    return (
      <SalesmanDashboard user={user} navigate={navigate} onLogout={doLogout} />
    );
  if (route === "add-sale")
    return <AddSale user={user} navigate={navigate} onLogout={doLogout} />;
  if (route === "apply-leave")
    return <ApplyLeave user={user} navigate={navigate} onLogout={doLogout} />;

  return <LoginPage onLogin={doLogin} />;
}
