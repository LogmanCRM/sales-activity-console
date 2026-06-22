// Main views: Dashboard (per team) and Customers list.

const { useState, useMemo } = React;

// ---------- Control Bar (customer-type segmented + month/week pills, one card) ----------
function ControlBar({ weeks, mode, setMode, weekIdx, setWeekIdx, monthIdx, setMonthIdx, monthGroups, ctype, setCtype }) {
  const isAllW = mode === "week" && weekIdx === -1;
  const isAllM = mode === "month" && monthIdx === -1;
  const highlightMonthKey = mode === "month"
    ? (monthIdx === -1 ? null : monthGroups[monthIdx].key)
    : (weekIdx === -1 ? null : weekToMonthKey(weeks[weekIdx]));
  const periodTag = mode === "month"
    ? (isAllM ? "All Months · Year" : `${monthGroups[monthIdx].key} · ${monthGroups[monthIdx].weeks.length}w`)
    : (isAllW ? `All Weeks · ${weeks.length}w` : `Week ${weeks[weekIdx].replace("W", "")} · 2026`);

  const CT = [
    { id: "all", label: "All Customers", thai: "ลูกค้าทั้งหมด" },
    { id: "existing", label: "Existing", thai: "ลูกค้าเดิม" },
    { id: "new", label: "New Pipeline", thai: "ลูกค้าใหม่" },
  ];

  return (
    <div className="controls">
      <div className="ctl-row">
        <span className="ctl-label">View</span>
        <div className="ctl-seg">
          {CT.map((o) => (
            <button key={o.id} className={ctype === o.id ? "active" : ""} onClick={() => setCtype(o.id)}>
              {o.label}<span className="ctl-seg-th">{o.thai}</span>
            </button>
          ))}
        </div>
        <span className="period-tag">{periodTag}</span>
      </div>

      <div className="ctl-row">
        <span className="ctl-label">Month</span>
        <button className={`ws-pill ws-pill-all ${isAllM ? "active" : ""}`}
                onClick={() => { setMode("month"); setMonthIdx(-1); }}>ALL</button>
        <div className="ws-pills">
          {monthGroups.map((g, i) => {
            const active = mode === "month" && i === monthIdx;
            const hi = mode === "week" && g.key === highlightMonthKey;
            return (
              <button key={g.key}
                      className={`ws-pill ws-pill-month ${active ? "active" : ""} ${hi ? "in-month" : ""}`}
                      onClick={() => { setMode("month"); setMonthIdx(i); }}>
                <span className="ws-pill-main">{g.key.split(" ")[0]}</span>
                <span className="ws-pill-sub">{g.weeks.length}w</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="ctl-row">
        <span className="ctl-label">Week</span>
        <button className={`ws-pill ws-pill-all ${isAllW ? "active" : ""}`}
                onClick={() => { setMode("week"); setWeekIdx(-1); }}>ALL</button>
        <div className="ws-pills">
          {weeks.map((w, i) => {
            const active = mode === "week" && i === weekIdx;
            const hi = weekToMonthKey(w) === highlightMonthKey && !active;
            const isCurrent = i === weeks.length - 1;
            return (
              <button key={w}
                      className={`ws-pill ${active ? "active" : ""} ${isCurrent ? "is-current" : ""} ${hi ? "in-month" : ""}`}
                      onClick={() => { setMode("week"); setWeekIdx(i); }}>
                {w.replace("W", "")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Week → ISO date helpers ----------
function isoWeekMonday(weekLabel, year = 2026) {
  const wk = parseInt(weekLabel.replace("W", ""), 10);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dow + 1 + (wk - 1) * 7);
  return monday;
}
function weekToMonthKey(weekLabel) {
  const monday = isoWeekMonday(weekLabel);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const m = thursday.toLocaleString("en-US", { month: "short" });
  const y = thursday.getUTCFullYear();
  return `${m} ${y}`;
}
function buildMonthGroups(weeks) {
  const groups = [];
  const map = {};
  weeks.forEach((w, i) => {
    const k = weekToMonthKey(w);
    if (!(k in map)) { map[k] = groups.length; groups.push({ key: k, weeks: [], weekIdxs: [] }); }
    groups[map[k]].weeks.push(w);
    groups[map[k]].weekIdxs.push(i);
  });
  return groups;
}

// ---------- Activity field defs ----------
// Counting is now event-based (D.EVENTS, one row per logged interaction):
//   newPipeline = distinct NEW customers first-contacted (deduplicated by company)
//   followUp    = ALL contact rows (raw count) — repeat calls counted every time
//   visits / quotations / wonDeals = rows of that type
// Customer type ("new"/"existing") comes from fuzzy-clustered company names,
// so different spellings of the same firm are merged and not double-counted.
const FIELD_DEFS = {
  newPipeline: { key: "newPipeline", label: "New Pipeline",    thai: "ลูกค้าใหม่ (ไม่นับซ้ำ)", icon: "★", color: "#7c3aed", expect: 10 },
  followUp:    { key: "followUp",    label: "Follow Up",       thai: "ติดตาม / โทรซ้ำ",        icon: "⟳", color: "#0a1628", expect: null },
  visits:      { key: "visits",      label: "Customer Visits", thai: "การไปหาลูกค้า",          icon: "◉", color: "#0891b2", expect: 2 },
  quotations:  { key: "quotations",  label: "Quotations Sent", thai: "ส่ง Quotation",          icon: "◧", color: "#d97706", expect: 25 },
  wonDeals:    { key: "wonDeals",    label: "Confirm Shipment",thai: "ปิดดีล / Won Deal",      icon: "✓", color: "#10b981", expect: null },
};
const FIELDS_BY_CTYPE = {
  all:      ["newPipeline", "followUp", "visits", "quotations", "wonDeals"],
  new:      ["newPipeline", "followUp", "visits", "quotations", "wonDeals"],
  existing: ["followUp", "visits", "quotations", "wonDeals"],
};
function fieldsForCtype(ctype) {
  return (FIELDS_BY_CTYPE[ctype] || FIELDS_BY_CTYPE.all).map((k) => FIELD_DEFS[k]);
}

const _EV_TYPE = { followUp: "contacts", visits: "visits", quotations: "quotations", wonDeals: "newClients" };

// Core event-based metric. weekSet = Set of week labels in scope.
function metricValue(D, fieldKey, { teamId, spId, weekSet, ctype }) {
  const EV = D.EVENTS || [];
  const match = (ev, ct) =>
    (teamId === "all" || ev.team === teamId) &&
    (!spId || ev.spId === spId) &&
    weekSet.has(ev.week) &&
    (ct === "all" || ev.customerType === ct);

  if (fieldKey === "newPipeline") {
    // distinct NEW customers first-contacted in scope (firstContact dedupes the company)
    return EV.filter((ev) =>
      ev.type === "contacts" && ev.firstContact &&
      ev.customerType === "new" && match(ev, "all")
    ).length;
  }
  if (fieldKey === "potentialTeu") {
    return EV.filter((ev) => match(ev, ctype)).reduce((s, ev) => s + (ev.teu || 0), 0);
  }
  const TYPE = _EV_TYPE[fieldKey];
  if (!TYPE) return 0;
  return EV.filter((ev) => ev.type === TYPE && match(ev, ctype)).length;
}

// ---------- Dashboard View (LEGACY — superseded by the exec dashboard below) ----------
function DashboardViewLegacy({ teamId, onSelectCustomer, onNavigate }) {
  const D = window.SalesData;
  const team = D.TEAMS.find((t) => t.id === teamId);
  const accent = team.color;
  const [ctype, setCtype] = useState("all");
  const [mode, setMode] = useState("week");  // "week" | "month"
  const [weekIdx, setWeekIdx] = useState(D.WEEKS.length - 1);
  const monthGroups = useMemo(() => buildMonthGroups(D.WEEKS), [D.WEEKS]);
  const [monthIdx, setMonthIdx] = useState(monthGroups.length - 1);
  const [drillField, setDrillField] = useState(null);  // drill-down target field

  const isAllW = weekIdx === -1;
  const isAllM = monthIdx === -1;
  const isAllPeriod = (mode === "week" && isAllW) || (mode === "month" && isAllM);

  // Active week indices for current selection
  const activeWeekIdxs = useMemo(() => {
    if (mode === "month") return isAllM ? D.WEEKS.map((_, i) => i) : monthGroups[monthIdx].weekIdxs;
    return isAllW ? D.WEEKS.map((_, i) => i) : [weekIdx];
  }, [mode, weekIdx, monthIdx, isAllW, isAllM, monthGroups]);

  const periodLabel = mode === "month"
    ? (isAllM ? "Year-to-Date" : monthGroups[monthIdx].key)
    : (isAllW ? `${D.WEEKS.length}-Week Summary` : `Week ${D.WEEKS[weekIdx].replace("W", "")}`);

  // People for this team
  const people = teamId === "all" ? D.SALESPEOPLE : D.SALESPEOPLE.filter((s) => s.team === teamId);

  // Active fields for the current customer-type tab
  const fields = fieldsForCtype(ctype);

  // Week labels in scope (Set for fast lookup)
  const weekSet = useMemo(
    () => new Set(activeWeekIdxs.map((i) => D.WEEKS[i])),
    [activeWeekIdxs]
  );

  // Helper: value for the current period
  const valueFor = (field, ct = ctype) => metricValue(D, field, { teamId, weekSet, ctype: ct });

  // Expectation multiplier for the leaderboard:
  //   week view  → ×1 (or ×weeks when "ALL weeks" is selected)
  //   month view → ×4 per month (or ×4×months for "ALL months")
  const expectMult = mode === "month"
    ? 4 * (isAllM ? monthGroups.length : 1)
    : (isAllW ? D.WEEKS.length : 1);

  // Team comparison data — only meaningful when teamId === "all"
  const teamsForChart = D.TEAMS.filter(t => t.id !== "all");

  // ---------- Drill-down: compute items for the selected KPI ----------
  const spMap = useMemo(() => {
    const m = {};
    D.SALESPEOPLE.forEach(s => { m[s.id] = s; });
    return m;
  }, []);
  const teamNameMap = useMemo(() => {
    const m = {};
    D.TEAMS.forEach(t => { m[t.id] = t.name.replace("TEAM ", ""); });
    return m;
  }, []);

  const drillItems = useMemo(() => {
    if (!drillField) return [];
    const k = drillField.key;
    const inTeam = (t) => teamId === "all" || t === teamId;
    const ctMatch = (ev) => ctype === "all" || ev.customerType === ctype;
    const EV = D.EVENTS || [];

    let evs;
    if (k === "newPipeline") {
      // distinct new customers first-contacted (one row per company)
      evs = EV.filter(ev => ev.type === "contacts" && ev.firstContact
                         && ev.customerType === "new"
                         && inTeam(ev.team) && weekSet.has(ev.week));
    } else {
      const TYPE = _EV_TYPE[k];
      evs = EV.filter(ev => ev.type === TYPE
                         && inTeam(ev.team) && weekSet.has(ev.week) && ctMatch(ev));
    }
    return evs
      .map(ev => ({
        customer:     ev.customer,
        team:         teamNameMap[ev.team] || ev.team,
        sp:           spMap[ev.spId]?.name || "—",
        date:         ev.date,
        week:         ev.week,
        stage:        ev.stage,
        notes:        ev.notes,
        customerType: ev.customerType,
      }))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [drillField, teamId, ctype, weekSet]);

  return (
    <div className="view dashboard-view" data-ctype={ctype}>
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">SALES ACTIVITY · {periodLabel.toUpperCase()} · 2026</div>
          <h1 className="page-title">
            {team.name} <span className="page-title-en">/ {team.thai}</span>
          </h1>
          <div className="page-sub">
            {people.length} sales reps · {D.customerCount(teamId)} active customers
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-ghost">⟳ Sync Excel</button>
          <button className="btn-primary">Export Weekly Report</button>
        </div>
      </div>

      {/* Control bar — customer-type segmented + month/week pills in one card */}
      <ControlBar weeks={D.WEEKS} mode={mode} setMode={setMode}
                  weekIdx={weekIdx} setWeekIdx={setWeekIdx}
                  monthIdx={monthIdx} setMonthIdx={setMonthIdx}
                  monthGroups={monthGroups}
                  ctype={ctype} setCtype={setCtype} />

      {/* KPI Row — each card shows the metric broken down by team (ALL view)
          or by salesperson (single-team view) as horizontal bars. */}
      <div className="kpi-grid" key={`kpi-${ctype}-${mode}-${weekIdx}-${monthIdx}`}
           style={{ gridTemplateColumns: `repeat(${fields.length}, 1fr)` }}>
        {fields.map((f) => {
          const cur = valueFor(f.key);
          const breakdown = teamId === "all"
            ? teamsForChart.map((t) => ({
                label: t.name.replace("TEAM ", ""),
                value: metricValue(D, f.key, { teamId: t.id, weekSet, ctype }),
                color: t.color,
              }))
            : people.map((sp) => ({
                label: sp.name,
                value: metricValue(D, f.key, { teamId, spId: sp.id, weekSet, ctype }),
                color: team.color,
              }));
          return (
            <KpiCard key={f.key}
                     label={f.label} thai={f.thai} value={cur}
                     icon={f.icon} accent={f.color}
                     breakdown={breakdown}
                     target={(teamId !== "all" && f.expect != null) ? f.expect * expectMult : null}
                     onClick={() => setDrillField(f)} />
          );
        })}
      </div>

      {/* Salesperson breakdown */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">
              {teamId === "all" ? "Sales Performance — All Teams" : "Sales Performance"} · {periodLabel}
            </div>
            <div className="card-sub">
              {teamId === "all" ? "เบรคผลงานเซลล์รายคน ทุกทีม" : "ผลงานของเซลล์รายคน"}
            </div>
          </div>
          <div className="card-toolbar">
            <span className="pill-toggle active">{periodLabel}</span>
          </div>
        </div>
        {(() => {
          // Columns = the active customer-type fields (Team & Potential TEU removed —
          // team is already shown in the sidebar + the row's avatar/header color)
          const lbCols = fields;
          const gridCols = `1.8fr ${lbCols.map(() => "1fr").join(" ")}`;
          const vp = (sp, fk) => metricValue(D, fk, { teamId: sp.team, spId: sp.id, weekSet, ctype });

          const teamsToShow = teamId === "all"
            ? D.TEAMS.filter(t => t.id !== "all").filter(t => D.SALESPEOPLE.some(s => s.team === t.id))
            : [team];

          return (
            <div className="leaderboard leaderboard-v2">
              <div className="lb-head" style={{ gridTemplateColumns: gridCols }}>
                <div>Sales Rep</div>
                {lbCols.map(c => (
                  <div key={c.key} className="num">
                    {c.label}
                    {c.expect != null && <><br/><span className="lb-expect">≥{c.expect}/wk</span></>}
                  </div>
                ))}
              </div>

              {teamsToShow.map(t => {
                const tPeople = D.SALESPEOPLE.filter(s => s.team === t.id);
                if (tPeople.length === 0) return null;
                const sumField = (fk) => tPeople.reduce((s, sp) => s + vp(sp, fk), 0);

                return (
                  <React.Fragment key={t.id}>
                    {teamId === "all" && (
                      <div className="lb-team-header" style={{ "--c": t.color }}>
                        <div className="lb-team-badge" style={{ background: t.color }}>{t.name.replace("TEAM ", "").charAt(0)}</div>
                        <div className="lb-team-text">
                          <div className="lb-team-name">{t.name}</div>
                          <div className="lb-team-thai">{t.thai} · {tPeople.length} reps</div>
                        </div>
                        <div className="lb-team-totals num mono">
                          {ctype !== "existing" && <span title="New customers">{sumField("newPipeline")} new</span>}
                          <span title="Total follow-up contacts">· {sumField("followUp")} follow-up</span>
                          <span title="Total won deals" style={{ color: "#10b981" }}>· {sumField("wonDeals")} won</span>
                        </div>
                      </div>
                    )}
                    {tPeople.map(sp => {
                      return (
                        <div key={sp.id} className="lb-row" style={{ gridTemplateColumns: gridCols }}>
                          <div className="lb-name">
                            <Avatar initials={sp.avatar} color={t.color} size={32} />
                            <div>
                              <div className="name-en">{sp.name}</div>
                              <div className="name-th">{sp.thai}</div>
                            </div>
                          </div>
                          {lbCols.map(c => {
                            const val = vp(sp, c.key);
                            // Below target if the metric has a threshold and falls short
                            // (per-week × expectMult: ×1 weekly, ×4 monthly)
                            const below = c.expect != null && val < c.expect * expectMult;
                            const isWon = c.key === "wonDeals";
                            return (
                              <div key={c.key}
                                   className={`num mono ${below ? "lb-below" : ""} ${isWon ? "lb-big" : ""}`}
                                   style={isWon ? { color: "#10b981" } : undefined}>
                                {val}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Drill-down drawer */}
      <ActivityDetailDrawer
        open={!!drillField}
        onClose={() => setDrillField(null)}
        title={drillField ? `${drillField.label} · ${periodLabel}` : ""}
        subtitle={drillField
          ? `${teamId === "all" ? "ALL TEAMS" : (D.TEAMS.find(t => t.id === teamId)?.name || "")}` +
            (ctype !== "all" ? ` · ${ctype === "existing" ? "Existing" : "New"} customers` : "")
          : ""}
        items={drillItems}
        emptyMessage="ไม่มีรายการในช่วงเวลาที่เลือก"
        columns={[
          { key: "customer", label: "Customer", style: {minWidth: 220},
            render: (it) => (
              <div className="ad-cust">
                <div className="ad-cust-name">{it.customer}</div>
                {it.notes && <div className="ad-cust-note">"{it.notes}"</div>}
              </div>
            ) },
          { key: "sp",   label: "Sales Rep",
            render: (it) => <span className="ad-sp">{it.sp}</span> },
          { key: "team", label: "Team",
            render: (it) => <span className="ad-team-tag">{it.team}</span> },
          { key: "customerType", label: "Type",
            render: (it) => (
              <span className="ad-cust-type" style={{
                color: it.customerType === "new" ? "#7c3aed" : "#0891b2",
                background: (it.customerType === "new" ? "#7c3aed" : "#0891b2") + "18",
              }}>
                {it.customerType === "new" ? "New" : "Existing"}
              </span>
            ) },
          { key: "date", label: "Date",
            render: (it) => <span className="mono ad-date">{it.date}<span className="ad-wk">{it.week}</span></span> },
        ]}
      />
    </div>);

}

// ---------- Customers View ----------
// ═══════════════════════════════════════════════════════════════════════
// EXECUTIVE DASHBOARD (preview3) — week-only, KPI matrix, line chart vs min
// ═══════════════════════════════════════════════════════════════════════
const CHART_METRICS = [
  { key: "newPipeline", label: "New Pipeline",    icon: "✦", color: "#7c3aed", min: 50, minPerson: 10 },
  { key: "visits",      label: "Customer Visits", icon: "◎", color: "#0891b2", min: 12, minPerson: 2 },
  { key: "quotations",  label: "Quotations Sent", icon: "❏", color: "#d97706", min: 75, minPerson: 15 },
];
const REP_COLORS = ["#4f46e5","#0891b2","#d97706","#16a34a","#db2777","#7c3aed","#0d9488","#ca8a04","#dc2626","#2563eb","#9333ea","#0ea5e9"];

function ExecKc({ f, value, breakdown }) {
  const max = Math.max(...breakdown.map((b) => b.value), 1);
  return (
    <div className="kc" style={{ "--c": f.color }}>
      <div className="kc-top">
        <div className="kc-ic" style={{ background: f.color + "18", color: f.color }}>{f.icon}</div>
        <div style={{ minWidth: 0 }}><div className="kc-nm">{f.label}</div><div className="kc-th">{f.thai}</div></div>
      </div>
      <div className="kc-val" style={{ color: f.color }}>{value > 0 ? <AnimatedNumber value={value} /> : <span className="mono">0</span>}</div>
      <div className="kc-bd">
        {breakdown.map((b) => (
          <div className="bd" key={b.label}>
            <span className="bd-l" title={b.label}>{b.label}</span>
            <span className="bd-t"><span className="bd-f" style={{ width: (b.value / max * 100) + "%", background: b.color }} /></span>
            <span className="bd-v mono">{b.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExecLineChart({ weeks, series, min, curWeekIdx, hov }) {
  const W = 920, H = 340, padL = 46, padR = 18, padT = 22, padB = 46;
  const iw = W - padL - padR, ih = H - padT - padB;
  const maxV = Math.max(min, ...series.flatMap((s) => s.vals), 1);
  const yMax = Math.ceil(maxV * 1.18 / 10) * 10 || 10;
  const x = (i) => padL + (weeks.length === 1 ? iw / 2 : (i / (weeks.length - 1)) * iw);
  const y = (v) => padT + ih - (v / yMax) * ih;
  const yvals = Array.from({ length: 6 }, (_, i) => Math.round(yMax / 5 * i));
  const minY = y(min);
  return (
    <svg viewBox={`0 0 ${W} ${H}`}>
      {yvals.map((v, i) => (
        <g key={i}><line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#eef1f7" />
          <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#aeb6c6" fontFamily="Inter">{v}</text></g>
      ))}
      {curWeekIdx >= 0 && <line x1={x(curWeekIdx)} x2={x(curWeekIdx)} y1={padT} y2={padT + ih} stroke="#4f46e5" strokeOpacity=".18" strokeWidth="10" />}
      {weeks.map((w, i) => (
        <text key={w} x={x(i)} y={H - 22} textAnchor="middle" fontSize="11" fill="#8a93a6" fontFamily="Inter" fontWeight={i === curWeekIdx ? 700 : 400}>{w.replace("W", "")}</text>
      ))}
      <text x={padL} y={H - 6} fontSize="10" fill="#aeb6c6" fontFamily="Inter">Week →</text>
      <line x1={padL} x2={W - padR} y1={minY} y2={minY} stroke="#ef4444" strokeWidth="2" strokeDasharray="6 5" />
      <rect x={W - padR - 96} y={minY - 20} width="96" height="17" rx="4" fill="#ef4444" />
      <text x={W - padR - 48} y={minY - 8} textAnchor="middle" fontSize="10.5" fill="#fff" fontFamily="Inter" fontWeight="700">Min · {min}/wk</text>
      {series.map((_, i) => i).sort((a, b) => (a === hov ? 1 : 0) - (b === hov ? 1 : 0)).map((si) => {
        const s = series[si]; const dim = hov >= 0 && hov !== si; const hot = hov === si;
        const pts = s.vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
        return (
          <g key={si} opacity={dim ? 0.1 : 1}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth={hot ? 4 : 2.6} strokeLinejoin="round" strokeLinecap="round" />
            {s.vals.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={hot ? (i === curWeekIdx ? 5.5 : 4) : (i === curWeekIdx ? 4.5 : 3)} fill="#fff" stroke={s.color} strokeWidth={hot ? 2.8 : 2.2} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function DashboardView({ teamId, onSelectCustomer, onNavigate }) {
  const D = window.SalesData;
  const team = D.TEAMS.find((t) => t.id === teamId);
  const [weekIdx, setWeekIdx] = useState(D.WEEKS.length - 1);
  const [chartMetric, setChartMetric] = useState("newPipeline");
  const [hov, setHov] = useState(-1);
  const [drill, setDrill] = useState(null);
  React.useEffect(() => { setHov(-1); }, [teamId, chartMetric]);

  const TCOLOR = {}; D.TEAMS.forEach((t) => { TCOLOR[t.id] = t.color; });
  const teams = D.TEAMS.filter((t) => t.id !== "all");
  const people = teamId === "all" ? D.SALESPEOPLE : D.SALESPEOPLE.filter((s) => s.team === teamId);
  const short = (id) => (D.TEAMS.find((t) => t.id === id)?.name || id).replace("TEAM ", "");
  const spMap = useMemo(() => { const m = {}; D.SALESPEOPLE.forEach((s) => { m[s.id] = s; }); return m; }, []);

  const isAllW = weekIdx === -1;
  const activeWeeks = isAllW ? D.WEEKS : [D.WEEKS[weekIdx]];
  const weekSet = useMemo(() => new Set(activeWeeks), [weekIdx, isAllW]);
  const wtag = isAllW ? `All Weeks · ${D.WEEKS.length}w` : `Week ${D.WEEKS[weekIdx].replace("W", "")} · 2026`;

  const mv = (key, opts) => metricValue(D, key, { ...opts, ctype: "all" });
  const breakdownOf = (key) => teamId === "all"
    ? teams.map((t) => ({ label: short(t.id), value: mv(key, { teamId: t.id, weekSet }), color: TCOLOR[t.id] }))
    : people.map((sp) => ({ label: sp.name, value: mv(key, { teamId, spId: sp.id, weekSet }), color: TCOLOR[teamId] }));

  const cm = CHART_METRICS.find((m) => m.key === chartMetric);
  const chartMin = teamId === "all" ? cm.min : cm.minPerson;
  const entities = teamId === "all"
    ? teams.map((t) => ({ name: short(t.id), color: TCOLOR[t.id], val: (w) => mv(cm.key, { teamId: t.id, weekSet: new Set([w]) }), tot: (ws) => mv(cm.key, { teamId: t.id, weekSet: ws }) }))
    : people.map((sp, i) => ({ name: sp.name, color: REP_COLORS[i % REP_COLORS.length], val: (w) => mv(cm.key, { teamId, spId: sp.id, weekSet: new Set([w]) }), tot: (ws) => mv(cm.key, { teamId, spId: sp.id, weekSet: ws }) }));
  const chartSeries = entities.map((e) => ({ name: e.name, color: e.color, vals: D.WEEKS.map((w) => e.val(w)) }));
  const chartSummary = entities.map((e) => { const total = e.tot(weekSet); const perWk = isAllW ? Math.round(total / D.WEEKS.length) : total; return { name: e.name, color: e.color, perWk, ok: perWk >= chartMin }; });

  const KPI_ORDER = ["newPipeline", "followUp", "visits", "quotations", "wonDeals"];

  const drillItems = useMemo(() => {
    if (!drill) return [];
    const EV = D.EVENTS || []; const inT = (t) => teamId === "all" || t === teamId;
    let evs;
    if (drill.key === "newPipeline") evs = EV.filter((ev) => ev.type === "contacts" && ev.firstContact && ev.customerType === "new" && inT(ev.team) && weekSet.has(ev.week));
    else { const T = _EV_TYPE[drill.key]; evs = EV.filter((ev) => ev.type === T && inT(ev.team) && weekSet.has(ev.week)); }
    return evs.map((ev) => ({ customer: ev.customer, team: short(ev.team), sp: spMap[ev.spId]?.name || "—", date: ev.date, week: ev.week, customerType: ev.customerType, notes: ev.notes }))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [drill, teamId, weekIdx, isAllW]);

  const syncLabel = D.generated_at ? new Date(D.generated_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="view exec exec-dash">
      <div className="head">
        <div>
          <div className="eyebrow">Executive Dashboard</div>
          <h1 className="h1">{team.name} <small>/ {team.thai}</small></h1>
          <div className="hsub">{people.length} sales reps · {wtag}</div>
        </div>
        <div className="live"><span className="livedot" /> Synced {syncLabel}</div>
      </div>

      <div className="weekbar">
        <span className="wlabel">Week</span>
        <button className={`wp wp-all ${isAllW ? "active" : ""}`} onClick={() => setWeekIdx(-1)}>ALL</button>
        {D.WEEKS.map((w, i) => (
          <button key={w} className={`wp ${i === weekIdx ? "active" : ""} ${i === D.WEEKS.length - 1 ? "cur" : ""}`} onClick={() => setWeekIdx(i)}>{w.replace("W", "")}</button>
        ))}
        <span className="wtag">{wtag}</span>
      </div>

      <div className="kgrid">
        {KPI_ORDER.map((k) => {
          const f = FIELD_DEFS[k]; const val = mv(k, { teamId, weekSet });
          return (
            <div key={k} style={{ cursor: val > 0 ? "pointer" : "default" }} onClick={() => { if (val > 0) setDrill(f); }}>
              <ExecKc f={f} value={val} breakdown={breakdownOf(k)} />
            </div>
          );
        })}
      </div>

      <div className="chart-card">
        <div className="cc-head">
          <div>
            <div className="cc-title">Weekly Activity vs Minimum Target</div>
            <div className="cc-sub">{teamId === "all" ? "เปรียบเทียบทุกทีมรายสัปดาห์ · ขั้นต่ำรายทีม" : `${team.name} · เบรครายเซลล์ · ขั้นต่ำรายคน`} · เส้นแดง = ขั้นต่ำ {chartMin}/สัปดาห์</div>
          </div>
          <div className="cc-seg">
            {CHART_METRICS.map((m) => (
              <button key={m.key} className={chartMetric === m.key ? "active" : ""}
                      style={chartMetric === m.key ? { background: m.color } : {}}
                      onClick={() => setChartMetric(m.key)}><span className="si">{m.icon}</span>{m.label}</button>
            ))}
          </div>
        </div>
        <div className="cc-chart"><ExecLineChart weeks={D.WEEKS} series={chartSeries} min={chartMin} curWeekIdx={weekIdx} hov={hov} /></div>
        <div className="cc-legend">
          {chartSummary.map((e, i) => (
            <span className={`lgi lgi-hov ${hov === i ? "on" : ""} ${hov >= 0 && hov !== i ? "off" : ""}`} key={i}
                  onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(-1)}>
              <span className="ln" style={{ background: e.color }} />{e.name}
            </span>
          ))}
          <span className="lgi"><span className="ln dash" />Minimum <b>{chartMin}/wk</b> {teamId === "all" ? "(ต่อทีม)" : "(ต่อคน)"}</span>
        </div>
        <div className="cc-cards">
          {chartSummary.map((e, i) => (
            <div className={`tsum tsum-hov ${hov === i ? "on" : ""} ${hov >= 0 && hov !== i ? "off" : ""}`} key={i}
                 onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(-1)} style={{ "--c": e.color }}>
              <div className="tsum-top">
                <span className="tsum-dot" style={{ background: e.color }} />
                <span className="tsum-nm">{e.name}</span>
                <span className="tsum-st" style={{ color: e.ok ? "#16a34a" : "#ef4444", background: (e.ok ? "#16a34a" : "#ef4444") + "18" }}>{e.ok ? "On Track" : "Below"}</span>
              </div>
              <div className="tsum-row"><span>{isAllW ? "Avg / week" : "This week"}</span><b className="mono" style={{ color: e.ok ? "#16a34a" : "#ef4444" }}>{e.perWk}</b></div>
              <div className="tsum-row"><span>Minimum</span><b className="mono" style={{ fontSize: 13, color: "#aeb6c6" }}>{chartMin}</b></div>
            </div>
          ))}
        </div>
      </div>

      <ActivityDetailDrawer
        open={!!drill}
        onClose={() => setDrill(null)}
        title={drill ? `${drill.label} · ${wtag}` : ""}
        subtitle={teamId === "all" ? "ALL TEAMS" : (team ? team.name : "")}
        items={drillItems}
        emptyMessage="ไม่มีรายการในช่วงเวลาที่เลือก"
        columns={[
          { key: "customer", label: "Customer", style: { minWidth: 220 },
            render: (it) => (<div><div style={{ fontWeight: 600 }}>{it.customer}</div>{it.notes && <div style={{ fontSize: 11, color: "#8a93a6", fontStyle: "italic", marginTop: 3 }}>"{it.notes}"</div>}</div>) },
          { key: "sp", label: "Sales Rep", render: (it) => it.sp },
          { key: "team", label: "Team", render: (it) => it.team },
          { key: "customerType", label: "Type",
            render: (it) => (<span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, color: it.customerType === "new" ? "#7c3aed" : "#0891b2", background: (it.customerType === "new" ? "#7c3aed" : "#0891b2") + "18" }}>{it.customerType === "new" ? "New" : "Existing"}</span>) },
          { key: "date", label: "Date", render: (it) => <span className="mono">{it.date}</span> },
        ]}
      />
    </div>
  );
}

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

  // Shipment counts: customer.id -> confirmed shipment count (from newClients events, deduped by canonId)
  const shipmentCounts = useMemo(() => {
    const EV = D.EVENTS || [];
    const byCanon = {};
    const nameToCanon = {};
    EV.forEach(ev => {
      if (ev.canonId) {
        nameToCanon[(ev.customer || "").toLowerCase().trim()] = ev.canonId;
        if (ev.type === "newClients") byCanon[ev.canonId] = (byCanon[ev.canonId] || 0) + 1;
      }
    });
    const result = {};
    D.CUSTOMERS.forEach(c => {
      const cid = nameToCanon[(c.name || "").toLowerCase().trim()];
      result[c.id] = cid ? (byCanon[cid] || 0) : 0;
    });
    return result;
  }, []);

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
      if (key === "shipments") {
        va = shipmentCounts[a.id] || 0;
        vb = shipmentCounts[b.id] || 0;
      }
      if (typeof va === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [teamId, search, stageFilter, ownerFilter, staleOnly, sort]);

  const stageCounts = D.STAGES.map((s) => ({
    ...s,
    count: D.CUSTOMERS.filter((c) => (teamId === "all" || c.team === teamId) && c.stage === s.id).length
  }));

  const totalShipments = filtered.reduce((s, c) => s + (shipmentCounts[c.id] || 0), 0);
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
            {filtered.length} of {inScopeAll.length} customers · {totalShipments.toLocaleString()} confirmed shipments
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
            <div className="ct-th sortable num" onClick={() => toggleSort("shipments")}>
              Shipments <span className="sort-arrow">{sortArrow("shipments")}</span>
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
                  {shipmentCounts[c.id] || 0}
                  <span className="teu-unit">ships</span>
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
  // Count confirmed shipments for this customer
  const drawerShipments = (() => {
    const EV = D.EVENTS || [];
    const byCanon = {};
    const nameToCanon = {};
    EV.forEach(ev => {
      if (ev.canonId) {
        nameToCanon[(ev.customer || "").toLowerCase().trim()] = ev.canonId;
        if (ev.type === "newClients") byCanon[ev.canonId] = (byCanon[ev.canonId] || 0) + 1;
      }
    });
    const cid = nameToCanon[(customer.name || "").toLowerCase().trim()];
    return cid ? (byCanon[cid] || 0) : 0;
  })();
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
            <div className="dg-label">Confirmed Shipments</div>
            <div className="dg-big mono" style={{ color: teamMeta.color }}>{drawerShipments} <span style={{ fontSize: 13 }}>ships</span></div>
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
            { d: "2026-05-06", e: `Quotation v2 sent`, by: sp.name },
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