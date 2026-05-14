// src/app.jsx — Main app: waits for data.json, then renders sidebar + views.
const { useState, useEffect } = React;

// ---------- Loading / Error screens ----------
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
      <div style={{ fontSize:12, color:"#86807a" }}>
        Reading data.json
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
        <p style={{margin:0, color:"#86807a", fontSize:12}}>
          Run the ETL script then refresh this page:
        </p>
        <code style={{
          display:"block", background:"#f6f4ef", padding:"8px 14px",
          borderRadius:6, marginTop:8, fontSize:12, textAlign:"left",
          fontFamily:"JetBrains Mono,monospace", color:"#0a1628",
        }}>
          cd sales-activity-console<br/>
          python sync\sync_excel.py
        </code>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop:8, padding:"10px 24px", background:"#0a1628", color:"#fff",
          border:"none", borderRadius:8, cursor:"pointer", fontFamily:"Space Grotesk,sans-serif",
          fontWeight:600, fontSize:13,
        }}>
        Retry
      </button>
    </div>
  );
}

// ---------- Main App ----------
function App({ D }) {
  const [teamId, setTeamId] = useState("all");
  const [view, setView] = useState("dashboard");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Format the last-sync time from generated_at
  const syncLabel = D.generated_at
    ? new Date(D.generated_at).toLocaleString("en-GB", {
        day:"2-digit", month:"short", year:"numeric",
        hour:"2-digit", minute:"2-digit",
      })
    : "—";

  return (
    <div className="app" data-team={teamId}>
      {/* Sidebar */}
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
            <div className="sync-meta" style={{ marginTop:4 }}>Auto-refresh: every Wednesday 08:00</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
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

// ---------- Root: waits for data, then mounts App ----------
function Root() {
  const [D, setD]       = useState(null);
  const [err, setErr]   = useState(null);

  useEffect(() => {
    window.onSalesDataReady(function (data) {
      if (data) {
        // Make available globally so views.jsx / components.jsx can read it
        window.SalesData = data;
        setD(data);
      } else {
        setErr(window._sdError || "Unknown error loading data.json");
      }
    });
  }, []);

  if (err)  return <ErrorScreen message={err} />;
  if (!D)   return <LoadingScreen />;
  return <App D={D} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
