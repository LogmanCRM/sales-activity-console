// src/app.jsx — Main app with team-based access control
const { useState, useEffect } = React;

// ─────────────────────────────────────────────────────────────────────
// ACCESS CONTROL
// แก้ password ได้ที่นี่ แล้ว push ขึ้น GitHub ใหม่
// null = ดูได้ทุกทีม  |  "bp"/"mai"/"oversea" = ดูแค่ทีมนั้น
// ─────────────────────────────────────────────────────────────────────
const ACCESS_KEYS = {
  "manager2026": null,
  "bp2026":      "bp",
  "mai2026":     "mai",
  "oversea2026": "oversea",
};

function getAccess() {
  const key = new URLSearchParams(window.location.search).get("key") || "";
  if (key in ACCESS_KEYS) return { ok: true, team: ACCESS_KEYS[key] };
  return { ok: false, team: null };
}

function filterData(D, teamId) {
  if (!teamId) return D;
  const sps   = D.SALESPEOPLE.filter(s => s.team === teamId);
  const spIds = new Set(sps.map(s => s.id));
  const act   = {};
  spIds.forEach(id => { act[id] = D.ACTIVITY[id] || []; });
  return {
    ...D,
    TEAMS:       D.TEAMS.filter(t => t.id === teamId),
    SALESPEOPLE: sps,
    CUSTOMERS:   D.CUSTOMERS.filter(c => c.team === teamId),
    ACTIVITY:    act,
  };
}

// ─────────────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────────────
function LoginScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (code in ACCESS_KEYS) {
      window.location.href = window.location.pathname + "?key=" + code;
    } else {
      setError(true);
    }
  }

  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"100vh", background:"#f6f4ef", gap:20,
    }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"center", marginBottom:4 }}>
          <div style={{ display:"flex", gap:3 }}>
            <div style={{ width:10, height:10, background:"#0a1628", borderRadius:2 }}/>
            <div style={{ width:10, height:10, background:"#d97706", borderRadius:2, marginTop:4 }}/>
            <div style={{ width:10, height:10, background:"#0891b2", borderRadius:2 }}/>
          </div>
          <div style={{ fontFamily:"Space Grotesk,sans-serif", fontWeight:800, fontSize:20, color:"#0a1628", letterSpacing:2 }}>
            SALES OPS
          </div>
        </div>
        <div style={{ fontFamily:"Space Grotesk,sans-serif", fontSize:12, color:"#86807a", letterSpacing:1 }}>
          ACTIVITY CONSOLE
        </div>
      </div>

      <div style={{
        background:"#fff", borderRadius:16, border:"1px solid #e5e1d8",
        padding:"32px 36px", width:300,
        boxShadow:"0 4px 32px rgba(10,22,40,0.08)",
      }}>
        <div style={{ fontFamily:"Space Grotesk,sans-serif", fontWeight:600, fontSize:15, color:"#0a1628", marginBottom:6 }}>
          Sign in
        </div>
        <div style={{ fontFamily:"Space Grotesk,sans-serif", fontSize:12, color:"#86807a", marginBottom:20 }}>
          กรอก access code ของทีมคุณ
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ position:"relative", marginBottom: error ? 8 : 16 }}>
            <input
              type={show ? "text" : "password"}
              value={code}
              onChange={e => { setCode(e.target.value); setError(false); }}
              placeholder="Access code"
              autoFocus
              style={{
                width:"100%", padding:"10px 40px 10px 14px",
                borderRadius:8, boxSizing:"border-box",
                border: error ? "1.5px solid #ef4444" : "1.5px solid #e5e1d8",
                fontFamily:"Space Grotesk,sans-serif", fontSize:14,
                outline:"none", color:"#0a1628", background:"#fafaf9",
              }}
            />
            <button type="button" onClick={() => setShow(!show)} style={{
              position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", cursor:"pointer",
              color:"#86807a", fontSize:13, padding:2,
            }}>
              {show ? "hide" : "show"}
            </button>
          </div>
          {error && (
            <div style={{ color:"#ef4444", fontSize:12, marginBottom:12,
                          fontFamily:"Space Grotesk,sans-serif" }}>
              Access code ไม่ถูกต้อง
            </div>
          )}
          <button type="submit" style={{
            width:"100%", padding:"11px",
            background:"#0a1628", color:"#fff", border:"none",
            borderRadius:8, cursor:"pointer",
            fontFamily:"Space Grotesk,sans-serif", fontWeight:600, fontSize:14,
            transition:"opacity 0.15s",
          }}>
            Sign In
          </button>
        </form>
      </div>

      <div style={{ fontFamily:"Space Grotesk,sans-serif", fontSize:11, color:"#c4bfb9" }}>
        ติดต่อ admin หาก access code ไม่ทำงาน
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// LOADING / ERROR
// ─────────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      minHeight:"100vh", background:"#f6f4ef", gap:20,
    }}>
      <div style={{
        width:48, height:48, border:"4px solid #e5e1d8",
        borderTopColor:"#0a1628", borderRadius:"50%",
        animation:"spin 0.9s linear infinite",
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontFamily:"Space Grotesk,sans-serif", fontWeight:600, color:"#0a1628", fontSize:16 }}>
        Loading sales data…
      </div>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      minHeight:"100vh", background:"#f6f4ef", gap:16, padding:40,
    }}>
      <div style={{ fontSize:32 }}>⚠️</div>
      <div style={{ fontFamily:"Space Grotesk,sans-serif", fontWeight:700, fontSize:20, color:"#dc2626" }}>
        Data not loaded
      </div>
      <div style={{
        background:"#fff", border:"1px solid #e5e1d8", borderRadius:12,
        padding:"18px 28px", maxWidth:520, textAlign:"center", lineHeight:1.7,
        fontFamily:"Space Grotesk,sans-serif", color:"#2d2f36", fontSize:14,
      }}>
        <p style={{margin:"0 0 12px"}}>{message}</p>
      </div>
      <button onClick={() => window.location.reload()} style={{
        marginTop:8, padding:"10px 24px", background:"#0a1628", color:"#fff",
        border:"none", borderRadius:8, cursor:"pointer",
        fontFamily:"Space Grotesk,sans-serif", fontWeight:600, fontSize:13,
      }}>
        Retry
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────
function App({ D }) {
  const defaultTeam = D.TEAMS[0]?.id || "all";
  const [teamId, setTeamId] = useState(defaultTeam);
  const [view, setView] = useState("dashboard");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const syncLabel = D.generated_at
    ? new Date(D.generated_at).toLocaleString("en-GB", {
        day:"2-digit", month:"short", year:"numeric",
        hour:"2-digit", minute:"2-digit",
      })
    : "—";

  return (
    <div className="app" data-team={teamId}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <div className="bm-block" />
            <div className="bm-block bm-block-2" />
            <div className="bm-block bm-block-3" />
          </div>
          <div className="brand-text">
            <div className="brand-name">SALES OPS</div>
            <div className="brand-sub">Activity Console</div>
          </div>
        </div>

        <div className="side-section">
          <div className="side-section-title">Teams</div>
          <div className="team-list">
            {D.TEAMS.map(t => (
              <button key={t.id}
                      className={`team-btn ${teamId === t.id ? "active" : ""}`}
                      onClick={() => setTeamId(t.id)}>
                <span className="team-btn-dot" style={{ background: t.color }} />
                <div className="team-btn-text">
                  <div className="team-btn-name">{t.name}</div>
                  <div className="team-btn-thai">{t.thai}</div>
                </div>
                <span className="team-btn-count">
                  {t.id === "all"
                    ? D.SALESPEOPLE.length
                    : D.SALESPEOPLE.filter(s => s.team === t.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="side-section">
          <div className="side-section-title">Navigation</div>
          <div className="nav-list">
            <button className={`nav-btn ${view === "dashboard" ? "active" : ""}`}
                    onClick={() => setView("dashboard")}>
              <span className="nav-ic">▦</span>
              Dashboard
              <span className="nav-th">แดชบอร์ด</span>
            </button>
            <button className={`nav-btn ${view === "customers" ? "active" : ""}`}
                    onClick={() => setView("customers")}>
              <span className="nav-ic">◳</span>
              Customers
              <span className="nav-th">ลูกค้า</span>
            </button>
          </div>
        </div>

        <div className="side-footer">
          <div className="sync-card">
            <div className="sync-head">
              <div className="sync-dot" />
              <span>Excel Synced</span>
            </div>
            <div className="sync-time mono">
              {clock.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
            </div>
            <div className="sync-meta">Last data: {syncLabel}</div>
            <div className="sync-meta" style={{ marginTop:4 }}>Auto-refresh: every Tuesday 15:00</div>
          </div>
        </div>
      </aside>

      <main className="main" key={`${teamId}-${view}`}>
        {view === "dashboard" && (
          <DashboardView teamId={teamId}
                         onSelectCustomer={setSelectedCustomer}
                         onNavigate={setView} />
        )}
        {view === "customers" && (
          <CustomersView teamId={teamId} onSelectCustomer={setSelectedCustomer} />
        )}
      </main>

      <CustomerDrawer customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────
// ROOT — checks access, loads data, filters by team
// ─────────────────────────────────────────────────────────────────────
function Root() {
  const access = getAccess();

  const [D, setD]     = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!access.ok) return;
    window.onSalesDataReady(function (data) {
      if (data) {
        const filtered = filterData(data, access.team);
        window.SalesData = filtered;
        setD(filtered);
      } else {
        setErr(window._sdError || "Unknown error loading data.json");
      }
    });
  }, []);

  if (!access.ok)  return <LoginScreen />;
  if (err)         return <ErrorScreen message={err} />;
  if (!D)          return <LoadingScreen />;
  return <App D={D} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
