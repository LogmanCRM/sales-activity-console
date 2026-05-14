// Main views: Dashboard (per team) and Customers list.

const { useState, useMemo } = React;

// ---------- Customer Type Filter ----------
function CustomerTypeFilter({ value, onChange, counts }) {
  const opts = [
  { id: "all", label: "All Customers", thai: "ลูกค้าทั้งหมด", icon: "◎" },
  { id: "existing", label: "Existing", thai: "ลูกค้าเดิม", icon: "▲" },
  { id: "new", label: "New / Prospect", thai: "ลูกค้าใหม่", icon: "✦" }];

  return (
    <div className="ctype-filter">
      <div className="ctype-label">
        <span className="ctype-eyebrow">Filter activities by</span>
        <span className="ctype-title">Customer type</span>
      </div>
      <div className="ctype-tabs">
        {opts.map((o) =>
        <button key={o.id}
        className={`ctype-tab ${value === o.id ? "active" : ""}`}
        onClick={() => onChange(o.id)}>
            <span className="ctype-tab-icon">{o.icon}</span>
            <div className="ctype-tab-text">
              <span className="ctype-tab-label">{o.label}</span>
              <span className="ctype-tab-thai">{o.thai}</span>
            </div>
            <span className="ctype-tab-count mono">{counts[o.id]}</span>
          </button>
        )}
      </div>
    </div>);

}

// ---------- Week Selector ----------
function WeekSelector({ weeks, value, onChange }) {
  const isAll = value === -1;
  const isLast = value === weeks.length - 1;
  const isFirst = value === 0;
  return (
    <div className="week-selector">
      <div className="ws-label">
        <span className="ws-eyebrow">Reporting week</span>
        <span className="ws-title">
          {isAll
            ? <>All Weeks <span className="ws-tag-current ws-tag-all">12W TOTAL</span></>
            : <>Week {weeks[value].replace("W", "")}, 2026 {isLast && <span className="ws-tag-current">CURRENT</span>}</>
          }
        </span>
      </div>
      <div className="ws-controls">
        <button className="ws-arrow" disabled={isAll || isFirst} onClick={() => onChange(Math.max(0, value - 1))}>◀</button>
        <button className={`ws-pill ws-pill-all ${isAll ? "active" : ""}`} onClick={() => onChange(-1)}>ALL</button>
        <div className="ws-pills">
          {weeks.map((w, i) =>
          <button key={w}
          className={`ws-pill ${i === value ? "active" : ""} ${i === weeks.length - 1 ? "is-current" : ""}`}
          onClick={() => onChange(i)}>
              {w.replace("W", "")}
            </button>
          )}
        </div>
        <button className="ws-arrow" disabled={isAll || isLast} onClick={() => onChange(Math.min(weeks.length - 1, value + 1))}>▶</button>
      </div>
    </div>);

}

// ---------- Dashboard View ----------
function DashboardView({ teamId, onSelectCustomer, onNavigate }) {
  const D = window.SalesData;
  const team = D.TEAMS.find((t) => t.id === teamId);
  const accent = team.color;
  const [ctype, setCtype] = useState("all"); // "all" | "existing" | "new"
  const [weekIdx, setWeekIdx] = useState(D.WEEKS.length - 1);

  const fields = [
  { key: "contacts", label: "Contacts", thai: "การติดต่อลูกค้า", icon: "✉", color: "#0a1628" },
  { key: "visits", label: "Customer Visits", thai: "การไปหาลูกค้า", icon: "◉", color: "#0891b2" },
  { key: "quotations", label: "Quotations Sent", thai: "ส่ง Quotation", icon: "◧", color: "#d97706" },
  { key: "problems", label: "Problem Calls", thai: "โทรแก้ปัญหา", icon: "⚠", color: "#dc2626" },
  { key: "newClients", label: "New Customers", thai: "ลูกค้าใหม่", icon: "★", color: "#10b981" }];


  const weekly = fields.map((f) => ({ ...f, series: D.weeklyTotals(teamId, f.key, ctype) }));
  const teuPotential = D.weeklyTotals(teamId, "potentialTeu", ctype);
  const teuWon = D.weeklyTotals(teamId, "wonTeu", ctype);

  const currentIdx = weekIdx;
  const prevIdx = Math.max(0, currentIdx - 1);
  const isLatest = currentIdx === D.WEEKS.length - 1;
  const isAllWeeks = weekIdx === -1;

  // People for this team
  const people = teamId === "all" ? D.SALESPEOPLE : D.SALESPEOPLE.filter((s) => s.team === teamId);

  // Sum a field across all 12 weeks (used in All-Weeks mode)
  const sumAllWeeks = (field, ct) => D.weeklyTotals(teamId, field, ct).reduce((a, b) => a + b, 0);

  // Returns the value for the selected week, or the 12-week sum if "All Weeks" is on
  const valueFor = (field, ct) => isAllWeeks
    ? sumAllWeeks(field, ct)
    : D.totalForTeam(teamId, currentIdx, field, ct);

  // Counts for the filter chips
  const counts = {
    all:      valueFor("contacts", "all"),
    existing: valueFor("contacts", "existing"),
    new:      valueFor("contacts", "new"),
  };

  return (
    <div className="view dashboard-view" data-ctype={ctype}>
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">SALES ACTIVITY · {isAllWeeks ? "12-WEEK SUMMARY · 2026" : <>WEEK {D.WEEKS[currentIdx].replace("W", "")} · 2026 {!isLatest && <span className="eyebrow-hist">· HISTORICAL VIEW</span>}</>}</div>
          <h1 className="page-title">
            {team.name} <span className="page-title-en">/ {team.thai}</span>
          </h1>
          <div className="page-sub">
            {people.length} sales reps · {D.customerCount(teamId)} active customers · last sync 2 min ago
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-ghost">⟳ Sync Excel</button>
          <button className="btn-primary">Export Weekly Report</button>
        </div>
      </div>

      {/* Week + Customer type filter */}
      <WeekSelector weeks={D.WEEKS} value={weekIdx} onChange={setWeekIdx} />
      <CustomerTypeFilter value={ctype} onChange={setCtype} counts={counts} />

      {/* KPI Row */}
      <div className="kpi-grid" key={`kpi-${ctype}-${weekIdx}`}>
        {weekly.map((f) => {
          const cur = isAllWeeks ? f.series.reduce((a, b) => a + b, 0) : f.series[currentIdx];
          const prev = isAllWeeks ? null : f.series[prevIdx];
          const delta = isAllWeeks ? null : (prev ? Math.round((cur - prev) / prev * 100) : 0);
          // Existing/New split shown beneath value when filter is "all"
          const split = ctype === "all" ? {
            existing: valueFor(f.key, "existing"),
            new:      valueFor(f.key, "new"),
          } : null;
          return (
            <KpiCard key={f.key}
            label={f.label} thai={f.thai} value={cur} delta={delta}
            icon={f.icon} accent={f.color} series={f.series}
            split={split} />);

        })}
      </div>

      {/* Main row: Potential TEU + Conversion */}
      <div className="row-2">
        <div className="card chart-card" style={{ color: "rgb(10, 22, 40)", backgroundColor: "rgb(255, 255, 255)", borderColor: "rgb(237, 231, 214)" }}>
          <div className="card-head">
            <div>
              <div className="card-title">Potential Volume (TEU) · Weekly</div>
              <div className="card-sub">Potential vs Won — ตู้สินค้า 20 ฟุต ต่ออาทิตย์</div>
            </div>
            <div className="legend">
              <span className="legend-item"><i style={{ background: accent }} />Potential</span>
              <span className="legend-item"><i style={{ color: "rgb(255, 255, 255)", background: "rgb(10, 22, 40)" }} />Won</span>
            </div>
          </div>
          <BarChart weeks={D.WEEKS} values={teuPotential} valuesB={teuWon} color={accent} colorB="#0a1628" />
          <div className="chart-foot">
            <div className="stat-pair">
              <span className="stat-key">{isAllWeeks ? "Potential (12 weeks)" : "Potential this week"}</span>
              <span className="stat-val" style={{ color: accent }}>{(isAllWeeks ? teuPotential.reduce((a, b) => a + b, 0) : teuPotential[currentIdx]).toLocaleString()} TEU</span>
            </div>
            <div className="stat-pair">
              <span className="stat-key">{isAllWeeks ? "Won (12 weeks)" : "Won this week"}</span>
              <span className="stat-val">{(isAllWeeks ? teuWon.reduce((a, b) => a + b, 0) : teuWon[currentIdx]).toLocaleString()} TEU</span>
            </div>
            <div className="stat-pair">
              <span className="stat-key">Hit rate</span>
              <span className="stat-val">{(() => {
                const p = isAllWeeks ? teuPotential.reduce((a,b)=>a+b,0) : teuPotential[currentIdx];
                const w = isAllWeeks ? teuWon.reduce((a,b)=>a+b,0) : teuWon[currentIdx];
                return p ? Math.round(w / p * 100) : 0;
              })()}%</span>
            </div>
          </div>
        </div>

        <div className="card gauge-card">
          <div className="card-head">
            <div>
              <div className="card-title">Team Conversion Rate</div>
              <div className="card-sub">Quotations → New Customers</div>
            </div>
          </div>
          <div className="gauge-wrap">
            <RadialGauge value={D.teamConversionRate(teamId, ctype)} color={accent} size={180} label="conversion" />
          </div>
          <div className="gauge-stats">
            {teamId === "all" ?
            D.TEAMS.filter((t) => t.id !== "all").map((t) =>
            <div key={t.id} className="mini-team-row">
                  <span className="mini-team-dot" style={{ background: t.color }} />
                  <span className="mini-team-name">{t.name}</span>
                  <span className="mini-team-val">{D.teamConversionRate(t.id, ctype)}%</span>
                </div>
            ) :

            <>
                <div className="mini-stat"><div className="mini-label">Quotations sent (12w)</div><div className="mini-val">{
                  people.reduce((s, p) => s + D.ACTIVITY[p.id].reduce((a, w) => a + D.pickVal(w.quotations, ctype), 0), 0)
                  }</div></div>
                <div className="mini-stat"><div className="mini-label">Customers won (12w)</div><div className="mini-val">{
                  people.reduce((s, p) => s + D.ACTIVITY[p.id].reduce((a, w) => a + D.pickVal(w.newClients, ctype), 0), 0)
                  }</div></div>
              </>
            }
          </div>
        </div>
      </div>

      {/* Sales rep leaderboard */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">
              {teamId === "all" ? "Team Performance" : "Sales Performance"} · {isAllWeeks ? "12-Week Total" : `Week ${D.WEEKS[currentIdx].replace("W", "")}`}
            </div>
            <div className="card-sub">
              {teamId === "all" ? "สรุปผลงานต่อทีม" : "ผลงานของเซลล์รายคน"}
            </div>
          </div>
          <div className="card-toolbar">
            <span className="pill-toggle active">{isAllWeeks ? "All Weeks" : `Week ${D.WEEKS[currentIdx].replace("W", "")}`}</span>
          </div>
        </div>
        <div className="leaderboard">
          <div className="lb-head">
            <div>{teamId === "all" ? "Team" : "Sales Rep"}</div>
            <div>{teamId === "all" ? "Members" : "Team"}</div>
            <div className="num">Contacts</div>
            <div className="num">Visits</div>
            <div className="num">Quotes</div>
            <div className="num">Problems</div>
            <div className="num">New</div>
            <div className="num">Potential TEU</div>
            <div className="num">Conv %</div>
          </div>
          {teamId === "all" ?
          D.TEAMS.filter((t) => t.id !== "all").map((t) => {
            const tPeople = D.SALESPEOPLE.filter((s) => s.team === t.id);
            const conv = D.teamConversionRate(t.id, ctype);
            const v = (field) => isAllWeeks
              ? D.weeklyTotals(t.id, field, ctype).reduce((a, b) => a + b, 0)
              : D.totalForTeam(t.id, currentIdx, field, ctype);
            return (
              <div key={t.id} className="lb-row lb-row-team">
                <div className="lb-name">
                  <div className="team-badge-lg" style={{ background: t.color }}>{t.name.replace("TEAM ", "").charAt(0)}</div>
                  <div>
                    <div className="name-en">{t.name}</div>
                    <div className="name-th">{t.thai}</div>
                  </div>
                </div>
                <div className="lb-members mono">{tPeople.length} reps</div>
                <div className="num mono lb-big">{v("contacts")}</div>
                <div className="num mono lb-big">{v("visits")}</div>
                <div className="num mono lb-big">{v("quotations")}</div>
                <div className="num mono lb-big">{v("problems")}</div>
                <div className="num mono lb-big">{v("newClients")}</div>
                <div className="num mono lb-big">{v("potentialTeu")}</div>
                <div className="num mono">
                  <div className="conv-cell">
                    <span style={{ color: t.color, fontWeight: 600, fontSize: 15 }}>{conv}%</span>
                    <ProgressBar value={conv} max={50} color={t.color} height={4} />
                  </div>
                </div>
              </div>);
          }) :
          people.map((sp) => {
            const teamMeta = D.TEAMS.find((t) => t.id === sp.team);
            const conv = D.personConversionRate(sp.id, ctype);
            const v = (field) => isAllWeeks
              ? D.ACTIVITY[sp.id].reduce((a, w) => a + D.pickVal(w[field], ctype), 0)
              : D.pickVal(D.ACTIVITY[sp.id][currentIdx][field], ctype);
            return (
              <div key={sp.id} className="lb-row">
                    <div className="lb-name">
                      <Avatar initials={sp.avatar} color={teamMeta.color} size={32} />
                      <div>
                        <div className="name-en">{sp.name}</div>
                        <div className="name-th">{sp.thai}</div>
                      </div>
                    </div>
                    <div><span className="team-chip" style={{ "--c": teamMeta.color }}>{teamMeta.name.replace("TEAM ", "")}</span></div>
                    <div className="num mono">{v("contacts")}</div>
                    <div className="num mono">{v("visits")}</div>
                    <div className="num mono">{v("quotations")}</div>
                    <div className="num mono">{v("problems")}</div>
                    <div className="num mono">{v("newClients")}</div>
                    <div className="num mono">{v("potentialTeu")}</div>
                    <div className="num mono">
                      <div className="conv-cell">
                        <span style={{ color: teamMeta.color, fontWeight: 600 }}>{conv}%</span>
                        <ProgressBar value={conv} max={50} color={teamMeta.color} height={4} />
                      </div>
                    </div>
                  </div>);

          })}
        </div>
      </div>

      {/* Activity trend */}
      <div className="card chart-card">
        <div className="card-head">
          <div>
            <div className="card-title">Activity Trend · 12 Weeks</div>
            <div className="card-sub">Contacts, visits, quotations, problem calls, new customers</div>
          </div>
          <div className="legend">
            {weekly.map((f) =>
            <span key={f.key} className="legend-item"><i style={{ background: f.color }} />{f.label}</span>
            )}
          </div>
        </div>
        <LineChart weeks={D.WEEKS} series={weekly.map((f) => ({ name: f.label, values: f.series, color: f.color }))} />
      </div>

      {/* Recent customers / next steps */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">New Customers Picked Up Recently</div>
            <div className="card-sub">ลูกค้าใหม่จากอาทิตย์ก่อนๆ ที่เริ่มติดต่อ</div>
          </div>
          <button className="btn-link" onClick={() => onNavigate("customers")}>View all customers →</button>
        </div>
        <div className="new-customers">
          {D.CUSTOMERS.
          filter((c) => teamId === "all" || c.team === teamId).
          filter((c) => ["lead", "contact", "visit"].includes(c.stage)).
          slice(0, 6).
          map((c) => {
            const sp = D.SALESPEOPLE.find((s) => s.id === c.owner);
            const teamMeta = D.TEAMS.find((t) => t.id === c.team);
            return (
              <div key={c.id} className="nc-card" onClick={() => onSelectCustomer(c)}>
                  <div className="nc-head">
                    <div className="nc-name">{c.name}</div>
                    <StageBadge stage={c.stage} />
                  </div>
                  <div className="nc-meta">
                    <span>{c.industry}</span><span className="dot">·</span>
                    <span>{c.location}</span><span className="dot">·</span>
                    <span className="mono">{c.potentialTeu} TEU</span>
                  </div>
                  <div className="nc-foot">
                    <div className="nc-owner">
                      <Avatar initials={sp.avatar} color={teamMeta.color} size={22} />
                      <span>{sp.name}</span>
                    </div>
                    <div className="nc-since mono">since {c.sinceWeek}</div>
                  </div>
                  <div className="nc-note">"{c.notes}"</div>
                </div>);

          })}
        </div>
      </div>
    </div>);

}

// ---------- Customers View ----------
function CustomersView({ teamId, onSelectCustomer }) {
  const D = window.SalesData;
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [sort, setSort] = useState({ key: "lastActivity", dir: "desc" });
  const [openMenu, setOpenMenu] = useState(null); // which column header has filter dropdown open

  // Owners available for the current team scope
  const availableOwners = useMemo(() =>
    teamId === "all" ? D.SALESPEOPLE : D.SALESPEOPLE.filter((s) => s.team === teamId),
  [teamId]);

  const filtered = useMemo(() => {
    let list = D.CUSTOMERS.filter((c) => teamId === "all" || c.team === teamId);
    if (stageFilter !== "all") list = list.filter((c) => c.stage === stageFilter);
    if (ownerFilter !== "all") list = list.filter((c) => c.owner === ownerFilter);
    if (staleOnly) list = list.filter((c) => D.isStale(c));
    if (search) list = list.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase()));

    const dir = sort.dir === "asc" ? 1 : -1;
    const key = sort.key;
    return [...list].sort((a, b) => {
      let va = a[key], vb = b[key];
      if (key === "owner") {
        va = D.SALESPEOPLE.find((s) => s.id === a.owner)?.name || "";
        vb = D.SALESPEOPLE.find((s) => s.id === b.owner)?.name || "";
      }
      if (key === "stage") {
        va = D.STAGES.findIndex((s) => s.id === a.stage);
        vb = D.STAGES.findIndex((s) => s.id === b.stage);
      }
      if (typeof va === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [teamId, search, stageFilter, ownerFilter, staleOnly, sort]);

  const stageCounts = D.STAGES.map((s) => ({
    ...s,
    count: D.CUSTOMERS.filter((c) => (teamId === "all" || c.team === teamId) && c.stage === s.id).length
  }));

  const totalPotential = filtered.reduce((s, c) => s + c.potentialTeu, 0);
  const team = D.TEAMS.find((t) => t.id === teamId);
  const inScopeAll = D.CUSTOMERS.filter((c) => teamId === "all" || c.team === teamId);
  const staleCount = inScopeAll.filter(D.isStale).length;

  const toggleSort = (key) => {
    setSort((prev) => prev.key === key
      ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
      : { key, dir: key === "name" ? "asc" : "desc" });
  };
  const sortArrow = (key) => sort.key === key ? (sort.dir === "asc" ? "▲" : "▼") : "↕";

  return (
    <div className="view customers-view" onClick={() => setOpenMenu(null)}>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">CUSTOMER PIPELINE · {team.name}</div>
          <h1 className="page-title">Customer Directory <span className="page-title-en">/ ทะเบียนลูกค้า</span></h1>
          <div className="page-sub">
            {filtered.length} of {inScopeAll.length} customers · {totalPotential.toLocaleString()} TEU potential
            {staleCount > 0 && <> · <span className="stale-inline">⚠ {staleCount} need review</span></>}
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-ghost">+ Add Customer</button>
          <button className="btn-primary">Export CSV</button>
        </div>
      </div>

      {/* Stage funnel */}
      <div className="stage-funnel">
        <div className={`stage-pill ${stageFilter === "all" ? "active" : ""}`} onClick={() => setStageFilter("all")}>
          <div className="sp-count">{inScopeAll.length}</div>
          <div className="sp-label">All Stages</div>
        </div>
        {stageCounts.map((s) =>
        <div key={s.id} className={`stage-pill ${stageFilter === s.id ? "active" : ""}`}
        style={{ "--c": s.color }} onClick={() => setStageFilter(s.id)}>
            <div className="sp-count">{s.count}</div>
            <div className="sp-label">{s.label}</div>
            <div className="sp-thai">{s.thai}</div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="cust-toolbar">
        <div className="search-input">
          <span className="search-icon">⌕</span>
          <input placeholder="Search by name, industry, location..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="owner-filter">
          <span className="of-label">Sales rep:</span>
          <select className="of-select" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
            <option value="all">All ({availableOwners.length})</option>
            {availableOwners.map((sp) => {
              const t = D.TEAMS.find((tt) => tt.id === sp.team);
              return <option key={sp.id} value={sp.id}>{sp.name} · {t.name.replace("TEAM ", "")}</option>;
            })}
          </select>
        </div>
        <button className={`stale-toggle ${staleOnly ? "active" : ""}`} onClick={() => setStaleOnly((v) => !v)}>
          <span className="st-icon">⚠</span>
          Stale leads only
          <span className="st-count mono">{staleCount}</span>
        </button>
        {(ownerFilter !== "all" || staleOnly || stageFilter !== "all" || search) && (
          <button className="btn-link" onClick={() => { setOwnerFilter("all"); setStaleOnly(false); setStageFilter("all"); setSearch(""); }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card customer-table-card">
        <div className="cust-table">
          <div className="ct-head">
            <div className="ct-th sortable" onClick={() => toggleSort("name")}>
              Customer <span className="sort-arrow">{sortArrow("name")}</span>
            </div>
            <div className="ct-th sortable" onClick={() => toggleSort("owner")}>
              Owner <span className="sort-arrow">{sortArrow("owner")}</span>
            </div>
            <div className="ct-th sortable" onClick={() => toggleSort("stage")}>
              Stage <span className="sort-arrow">{sortArrow("stage")}</span>
            </div>
            <div className="ct-th sortable num" onClick={() => toggleSort("potentialTeu")}>
              Potential TEU <span className="sort-arrow">{sortArrow("potentialTeu")}</span>
            </div>
            <div className="ct-th sortable num" onClick={() => toggleSort("daysSinceFirstContact")}>
              Age <span className="sort-arrow">{sortArrow("daysSinceFirstContact")}</span>
            </div>
            <div className="ct-th sortable" onClick={() => toggleSort("lastActivity")}>
              Last Activity <span className="sort-arrow">{sortArrow("lastActivity")}</span>
            </div>
            <div className="ct-th">Status / Note</div>
          </div>
          {filtered.map((c, i) => {
            const sp = D.SALESPEOPLE.find((s) => s.id === c.owner);
            const teamMeta = D.TEAMS.find((t) => t.id === c.team);
            const stale = D.isStale(c);
            const ageWarn = c.daysSinceFirstContact > 60 && !["won", "lost"].includes(c.stage);
            return (
              <div key={c.id} className={`ct-row ${stale ? "is-stale" : ""}`} onClick={() => onSelectCustomer(c)}
              style={{ animationDelay: `${i * 0.02}s` }}>
                <div className="ct-customer">
                  <div className="ct-name">
                    {stale && <span className="stale-flag" title="No close in 3+ months">⚠</span>}
                    {c.name}
                  </div>
                  <div className="ct-meta">
                    <span className="team-chip" style={{ "--c": teamMeta.color }}>{teamMeta.name.replace("TEAM ", "")}</span>
                    <span>{c.industry}</span>
                    <span className="dot">·</span>
                    <span>{c.location}</span>
                  </div>
                </div>
                <div className="ct-owner">
                  <Avatar initials={sp.avatar} color={teamMeta.color} size={28} />
                  <div>
                    <div className="ct-owner-name">{sp.name}</div>
                    <div className="ct-owner-th">{sp.thai}</div>
                  </div>
                </div>
                <div><StageBadge stage={c.stage} /></div>
                <div className="num mono ct-teu">
                  {c.potentialTeu}
                  <span className="teu-unit">TEU</span>
                </div>
                <div className={`num mono ct-age ${stale ? "age-stale" : ageWarn ? "age-warn" : ""}`}>
                  {c.daysSinceFirstContact}d
                  <span className="age-sub">since first contact</span>
                </div>
                <div className="mono ct-date">{c.lastActivity}</div>
                <div className="ct-status">
                  {stale ? (
                    <div className="stale-pill">
                      <span className="stale-pill-icon">⚠</span>
                      <div>
                        <div className="stale-pill-title">STALE · NEEDS REVIEW</div>
                        <div className="stale-pill-sub">{c.daysSinceFirstContact}d in pipeline, no close</div>
                      </div>
                    </div>
                  ) : (
                    <div className="ct-note">"{c.notes}"</div>
                  )}
                </div>
              </div>);

          })}
          {filtered.length === 0 &&
          <div className="ct-empty">No customers match the current filter.</div>
          }
        </div>
      </div>
    </div>);

}

// ---------- Customer Detail Drawer ----------
function CustomerDrawer({ customer, onClose }) {
  if (!customer) return null;
  const D = window.SalesData;
  const sp = D.SALESPEOPLE.find((s) => s.id === customer.owner);
  const teamMeta = D.TEAMS.find((t) => t.id === customer.team);
  const stageMeta = D.STAGES.find((s) => s.id === customer.stage);
  const stageIdx = D.STAGES.findIndex((s) => s.id === customer.stage);
  const pipelineStages = D.STAGES.filter((s) => !["lost", "hold"].includes(s.id));
  const currentInPipeline = pipelineStages.findIndex((s) => s.id === customer.stage);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <div className="drawer-eyebrow">{customer.id} · {teamMeta.name}</div>
            <h2 className="drawer-title">{customer.name}</h2>
            <div className="drawer-meta">{customer.industry} · {customer.location}</div>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-section">
          <div className="ds-label">Current Stage</div>
          <StageBadge stage={customer.stage} />
        </div>

        <div className="drawer-section">
          <div className="ds-label">Pipeline Progress</div>
          <div className="pipeline-track">
            {pipelineStages.map((s, i) =>
            <div key={s.id} className={`pipeline-step ${i <= currentInPipeline ? "done" : ""} ${i === currentInPipeline ? "current" : ""}`}
            style={{ "--c": s.color }}>
                <div className="ps-dot" />
                <div className="ps-label">{s.label}</div>
              </div>
            )}
          </div>
        </div>

        <div className="drawer-grid">
          <div className="dg-item">
            <div className="dg-label">Owner</div>
            <div className="dg-owner">
              <Avatar initials={sp.avatar} color={teamMeta.color} size={36} />
              <div>
                <div className="dg-owner-name">{sp.name}</div>
                <div className="dg-owner-th">{sp.thai}</div>
              </div>
            </div>
          </div>
          <div className="dg-item">
            <div className="dg-label">Potential Volume</div>
            <div className="dg-big mono" style={{ color: teamMeta.color }}>{customer.potentialTeu} <span style={{ fontSize: 13 }}>TEU</span></div>
          </div>
          <div className="dg-item">
            <div className="dg-label">Contacts This Month</div>
            <div className="dg-big mono">{customer.contactsThisMonth}</div>
          </div>
          <div className="dg-item">
            <div className="dg-label">Quotations Sent</div>
            <div className="dg-big mono">{customer.quotationsSent}</div>
          </div>
        </div>

        <div className="drawer-section">
          <div className="ds-label">Latest Note</div>
          <div className="drawer-note">"{customer.notes}"</div>
          <div className="drawer-note-meta">Logged {customer.lastActivity} by {sp.name}</div>
        </div>

        <div className="drawer-section">
          <div className="ds-label">Activity Timeline</div>
          <div className="timeline">
            {[
            { d: customer.lastActivity, e: `Stage updated to ${stageMeta.label}`, by: sp.name },
            { d: "2026-05-09", e: `Follow-up call · 25 min`, by: sp.name },
            { d: "2026-05-06", e: `Quotation v2 sent (${customer.potentialTeu} TEU)`, by: sp.name },
            { d: "2026-05-02", e: `Site visit · ${customer.location}`, by: sp.name },
            { d: `Since ${customer.sinceWeek}`, e: `Account created`, by: sp.name }].
            map((t, i) =>
            <div key={i} className="tl-row">
                <div className="tl-dot" style={{ background: i === 0 ? teamMeta.color : "#cbc8c1" }} />
                <div className="tl-content">
                  <div className="tl-event">{t.e}</div>
                  <div className="tl-meta mono">{t.d} · {t.by}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="drawer-actions">
          <button className="btn-primary">Log Activity</button>
          <button className="btn-ghost">Edit in Excel</button>
        </div>
      </div>
    </>);

}

Object.assign(window, { DashboardView, CustomersView, CustomerDrawer });