// src/app.jsx — Main app with team-based access control
const { useState, useEffect } = React;

// ─────────────────────────────────────────────────────────────────────
// ACCESS CONTROL
// แก้ password ได้ที่นี่ แล้ว push ขึ้น GitHub ใหม่
// null = ดูได้ทุกทีม  |  "bp"/"mai" = ดูแค่ทีมนั้น
// ─────────────────────────────────────────────────────────────────────
const ACCESS_KEYS = {
  "managementLMI": null,
  "bp2026":        "bp",
  "mai2026":       "mai",
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
          <div style={{ fontFamily:"Arial,sans-serif", fontWeight:800, fontSize:20, color:"#0a1628", letterSpacing:2 }}>
            SALES OPS
          </div>
        </div>
        <div style={{ fontFamily:"Arial,sans-serif", fontSize:12, color:"#86807a", letterSpacing:1 }}>
          ACTIVITY CONSOLE
        </div>
      </div>

      <div style={{
        background:"#fff", borderRadius:16, border:"1px solid #e5e1d8",
        padding:"32px 36px", width:300,
        boxShadow:"0 4px 32px rgba(10,22,40,0.08)",
      }}>
        <div style={{ fontFamily:"Arial,sans-serif", fontWeight:600, fontSize:15, color:"#0a1628", marginBottom:6 }}>
          Sign in
        </div>
        <div style={{ fontFamily:"Arial,sans-serif", fontSize:12, color:"#86807a", marginBottom:20 }}>
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
                fontFamily:"Arial,sans-serif", fontSize:14,
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
                          fontFamily:"Arial,sans-serif" }}>
              Access code ไม่ถูกต้อง
            </div>
          )}
          <button type="submit" style={{
            width:"100%", padding:"11px",
            background:"#0a1628", color:"#fff", border:"none",
            borderRadius:8, cursor:"pointer",
            fontFamily:"Arial,sans-serif", fontWeight:600, fontSize:14,
            transition:"opacity 0.15s",
          }}>
            Sign In
          </button>
        </form>
      </div>

      <div style={{ fontFamily:"Arial,sans-serif", fontSize:11, color:"#c4bfb9" }}>
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
      <div style={{ fontFamily:"Arial,sans-serif", fontWeight:600, color:"#0a1628", fontSize:16 }}>
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
      <div style={{ fontFamily:"Arial,sans-serif", fontWeight:700, fontSize:20, color:"#dc2626" }}>
        Data not loaded
      </div>
      <div style={{
        background:"#fff", border:"1px solid #e5e1d8", borderRadius:12,
        padding:"18px 28px", maxWidth:520, textAlign:"center", lineHeight:1.7,
        fontFamily:"Arial,sans-serif", color:"#2d2f36", fontSize:14,
      }}>
        <p style={{margin:"0 0 12px"}}>{message}</p>
      </div>
      <button onClick={() => window.location.reload()} style={{
        marginTop:8, padding:"10px 24px", background:"#0a1628", color:"#fff",
        border:"none", borderRadius:8, cursor:"pointer",
        fontFamily:"Arial,sans-serif", fontWeight:600, fontSize:13,
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
  const { ok: _ok, team: _team } = getAccess();
  const canViewMarket = _ok && _team === null;   // management (managementLMI) only
  const defaultTeam = D.TEAMS[0]?.id || "all";
  const [teamId, setTeamId] = useState(defaultTeam);
  const [view, setView] = useState("dashboard");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openSec, setOpenSec] = useState(null); // null | "teams" | "activity" | "market"
  const teamCount = (id) => id === "all" ? D.SALESPEOPLE.length : D.SALESPEOPLE.filter(s => s.team === id).length;

  return (
    <div className="app app-exec" data-team={teamId}>
      <aside className="rail exec">
        <div className="rail-logo">
          <i style={{ background:"#d97706" }} /><i style={{ background:"#0891b2" }} />
          <i style={{ background:"#7c3aed" }} /><i style={{ background:"#fff" }} />
        </div>
        <button className={`rbtn ${openSec === "teams" ? "active" : ""}`}
                onClick={() => setOpenSec(openSec === "teams" ? null : "teams")}>☰<span className="rb-label">Teams</span></button>
        <button className={`rbtn ${openSec === "activity" ? "active" : ""}`}
                onClick={() => setOpenSec(openSec === "activity" ? null : "activity")}>▦<span className="rb-label">Sales Activity</span></button>
        {canViewMarket && (
          <button className={`rbtn ${openSec === "market" ? "active" : ""}`}
                  onClick={() => setOpenSec(openSec === "market" ? null : "market")}>◆<span className="rb-label">Market Intelligence</span></button>
        )}
        <div className="rail-sp" />
      </aside>

      {openSec && (
        <>
          <div className="scrim" onClick={() => setOpenSec(null)} />
          <div className="flyout exec">
            {openSec === "teams" && (
              <>
                <div className="fly-title">Teams</div>
                <div className="fly-sub">เลือกทีมที่ต้องการดู</div>
                <div className="fly-list">
                  {D.TEAMS.map(t => (
                    <button key={t.id} className={`fteam ${teamId === t.id ? "active" : ""}`}
                            onClick={() => { setTeamId(t.id); setOpenSec(null); }}>
                      <span className="dot" style={{ background: t.color }} />
                      <span className="ft-meta"><div className="ft-en">{t.name}</div><div className="ft-th">{t.thai}</div></span>
                      <span className="ft-cnt">{teamCount(t.id)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {openSec === "activity" && (
              <>
                <div className="fly-title">Sales Activity</div>
                <div className="fly-sub">มุมมองกิจกรรมการขาย</div>
                <div className="fly-list">
                  {[["dashboard","▦","Dashboard","แดชบอร์ด"],["customers","◳","Customers","ลูกค้า"]].map(([id,ic,en,th]) => (
                    <button key={id} className={`fteam ${view === id ? "active" : ""}`}
                            onClick={() => { setView(id); setOpenSec(null); }}>
                      <span className="ft-ic">{ic}</span>
                      <span className="ft-meta"><div className="ft-en">{en}</div><div className="ft-th">{th}</div></span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {openSec === "market" && canViewMarket && (
              <>
                <div className="fly-title">Market Intelligence</div>
                <div className="fly-sub">ข้อมูลตลาดส่งออก</div>
                <div className="fly-list">
                  {[["mkt-customers","⊞","Customer List","รายชื่อลูกค้า"],["mkt-dashboard","◆","Market Dashboard","ภาพรวมตลาด"]].map(([id,ic,en,th]) => (
                    <button key={id} className={`fteam ${view === id ? "active" : ""}`}
                            onClick={() => { setView(id); setOpenSec(null); }}>
                      <span className="ft-ic">{ic}</span>
                      <span className="ft-meta"><div className="ft-en">{en}</div><div className="ft-th">{th}</div></span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      <main className="main" key={`${teamId}-${view}`}>
        {view === "dashboard" && (
          <DashboardView teamId={teamId}
                         onSelectCustomer={setSelectedCustomer}
                         onNavigate={setView} />
        )}
        {view === "customers" && (
          <CustomersView teamId={teamId} onSelectCustomer={setSelectedCustomer} />
        )}
        {canViewMarket && view === "mkt-customers" && <MarketCustomersView />}
        {canViewMarket && view === "mkt-dashboard" && <MarketDashboardView />}
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
