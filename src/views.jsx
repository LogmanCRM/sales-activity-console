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

// ---------- Time Selector — two rows: Month (top), Week (bottom) ----------
function TimeSelector({ weeks, mode, setMode, weekIdx, setWeekIdx, monthIdx, setMonthIdx, monthGroups }) {
  const isAllW = mode === "week" && weekIdx === -1;
  const isAllM = mode === "month" && monthIdx === -1;
  // Which month's weeks should be highlighted in the bottom row?
  // - In month mode with a specific month: that month's weeks
  // - In week mode with a specific week: the month containing that week
  const highlightMonthKey = mode === "month"
    ? (monthIdx === -1 ? null : monthGroups[monthIdx].key)
    : (weekIdx === -1  ? null : weekToMonthKey(weeks[weekIdx]));

  const title = mode === "month"
    ? (isAllM ? "All Months · Year Total"
              : `${monthGroups[monthIdx].key} · ${monthGroups[monthIdx].weeks.length} weeks`)
    : (isAllW ? `All Weeks · ${weeks.length}W Total`
              : `Week ${weeks[weekIdx].replace("W", "")}, 2026${weekIdx === weeks.length - 1 ? " · Current" : ""}`);

  return (
    <div className="week-selector ws-two-row">
      <div className="ws-label">
        <span className="ws-eyebrow">Reporting period</span>
        <span className="ws-title">{title}</span>
      </div>

      {/* Top row: months */}
      <div className="ws-row">
        <span className="ws-row-label">Month</span>
        <button className={`ws-pill ws-pill-all ${isAllM ? "active" : ""}`}
                onClick={() => { setMode("month"); setMonthIdx(-1); }}>ALL</button>
        <div className="ws-pills">
          {monthGroups.map((g, i) => {
            const active = mode === "month" && i === monthIdx;
            const highlighted = mode === "week" && g.key === highlightMonthKey;
            return (
              <button key={g.key}
                      className={`ws-pill ws-pill-month ${active ? "active" : ""} ${highlighted ? "in-month" : ""}`}
                      onClick={() => { setMode("month"); setMonthIdx(i); }}>
                <span className="ws-pill-main">{g.key.split(" ")[0]}</span>
                <span className="ws-pill-sub">W{g.weeks.map(w => w.replace("W","")).join(",")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom row: weeks */}
      <div className="ws-row">
        <span className="ws-row-label">Week</span>
        <button className={`ws-pill ws-pill-all ${isAllW ? "active" : ""}`}
                onClick={() => { setMode("week"); setWeekIdx(-1); }}>ALL</button>
        <div className="ws-pills">
          {weeks.map((w, i) => {
            const active = mode === "week" && i === weekIdx;
            const inHighlightedMonth = weekToMonthKey(w) === highlightMonthKey;
            const isCurrent = i === weeks.length - 1;
            return (
              <button key={w}
                      className={`ws-pill ${active ? "active" : ""} ${isCurrent ? "is-current" : ""} ${inHighlightedMonth && !active ? "in-month" : ""}`}
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

// ---------- Activity field defs (with expectations per week) ----------
const ACTIVITY_FIELDS = [
  { key: "contacts",   label: "Call",             thai: "การโทร / ติดต่อลูกค้า", icon: "✉", color: "#0a1628", expect: 10 },
  { key: "visits",     label: "Customer Visits",  thai: "การไปหาลูกค้า",   icon: "◉", color: "#0891b2", expect: 2  },
  { key: "quotations", label: "Quotations Sent",  thai: "ส่ง Quotation",   icon: "◧", color: "#d97706", expect: null },
  { key: "problems",   label: "Problem Calls",    thai: "โทรแก้ปัญหา",     icon: "⚠", color: "#dc2626", expect: null },
  { key: "newClients", label: "New Pipeline",     thai: "ลูกค้าใหม่เข้า pipeline", icon: "★", color: "#7c3aed", expect: null },
  { key: "wonDeals",   label: "Confirm Shipment", thai: "ปิดดีล / Won Deal", icon: "✓", color: "#10b981", expect: null },
];

// "wonDeals" is a synthetic field — count of confirmed shipments per week.
// Currently it's the same data as newClients (which counts status="confirm" rows).
// "newClients" is being repurposed here as "New Pipeline" (count of week's pipeline entries).
// We use CUSTOMERS.sinceWeek to derive a true New Pipeline count.
function valueForField(D, teamId, fieldKey, weekIdxs, ctype) {
  // weekIdxs = array of week indices (1 for single week, multiple for month, all for ALL)
  if (fieldKey === "newClients") {
    // New Pipeline = count of customers whose firstContactDate (sinceWeek) falls in these weeks
    const weekLabels = weekIdxs.map(i => D.WEEKS[i]);
    return D.CUSTOMERS.filter(c =>
      (teamId === "all" || c.team === teamId) &&
      weekLabels.includes(c.sinceWeek)
    ).length;
  }
  if (fieldKey === "wonDeals") {
    // Won Deals = original newClients sum (status="confirm" rows per week)
    return weekIdxs.reduce((sum, i) => sum + D.totalForTeam(teamId, i, "newClients", ctype), 0);
  }
  return weekIdxs.reduce((sum, i) => sum + D.totalForTeam(teamId, i, fieldKey, ctype), 0);
}

// ---------- Dashboard View ----------
function DashboardView({ teamId, onSelectCustomer, onNavigate }) {
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

  // Helper: value for the current period
  const valueFor = (field, ct = ctype) => valueForField(D, teamId, field, activeWeekIdxs, ct);
  const valueForTeam = (tid, field, ct = ctype) => valueForField(D, tid, field, activeWeekIdxs, ct);
  // Sparkline series (always full WEEKS regardless of mode)
  const sparkSeries = (field) => D.WEEKS.map((_, i) => valueForField(D, teamId, field, [i], ctype));

  // Counts for the customer type filter chips
  const counts = {
    all:      valueFor("contacts", "all"),
    existing: valueFor("contacts", "existing"),
    new:      valueFor("contacts", "new"),
  };

  // Weeks count in the current period (for expectation thresholds)
  const periodWeeks = activeWeekIdxs.length;

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
    const weekLabels = activeWeekIdxs.map(i => D.WEEKS[i]);
    const inTeam = (t) => teamId === "all" || t === teamId;
    const ctypeMatch = (ev) => ctype === "all"
      || (ctype === "existing" &&  ev.existing)
      || (ctype === "new"      && !ev.existing);

    // New Pipeline → derived from CUSTOMERS.sinceWeek
    if (drillField.key === "newClients") {
      return D.CUSTOMERS
        .filter(c => inTeam(c.team) && weekLabels.includes(c.sinceWeek))
        .sort((a, b) => (b.firstContactDate || "").localeCompare(a.firstContactDate || ""))
        .map(c => ({
          customer: c.name,
          team:     teamNameMap[c.team] || c.team,
          sp:       spMap[c.owner]?.name || "—",
          date:     c.firstContactDate,
          week:     c.sinceWeek,
          stage:    c.stage,
          notes:    c.notes,
        }));
    }
    // Won Deal → events with type "newClients" (rows where stage="won")
    const evType = drillField.key === "wonDeals" ? "newClients" : drillField.key;
    return (D.EVENTS || [])
      .filter(ev => ev.type === evType
                 && inTeam(ev.team)
                 && weekLabels.includes(ev.week)
                 && ctypeMatch(ev))
      .map(ev => ({
        customer: ev.customer,
        team:     teamNameMap[ev.team] || ev.team,
        sp:       spMap[ev.spId]?.name || "—",
        date:     ev.date,
        week:     ev.week,
        stage:    ev.stage,
        notes:    ev.notes,
        existing: ev.existing,
      }));
  }, [drillField, teamId, ctype, activeWeekIdxs]);

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

      {/* Time selector (Week or Month) + Customer type filter */}
      <TimeSelector weeks={D.WEEKS} mode={mode} setMode={setMode}
                    weekIdx={weekIdx} setWeekIdx={setWeekIdx}
                    monthIdx={monthIdx} setMonthIdx={setMonthIdx}
                    monthGroups={monthGroups} />
      <CustomerTypeFilter value={ctype} onChange={setCtype} counts={counts} />

      {/* KPI Row — 6 cards, no target comparison */}
      <div className="kpi-grid kpi-grid-6" key={`kpi-${ctype}-${mode}-${weekIdx}-${monthIdx}`}>
        {ACTIVITY_FIELDS.map((f) => {
          const cur = valueFor(f.key);
          const series = sparkSeries(f.key);
          const split = (ctype === "all" && f.key !== "newClients" && f.key !== "wonDeals") ? {
            existing: valueFor(f.key, "existing"),
            new:      valueFor(f.key, "new"),
          } : null;
          return (
            <KpiCard key={f.key}
                     label={f.label} thai={f.thai} value={cur}
                     icon={f.icon} accent={f.color} series={series}
                     split={split}
                     periodWeeks={periodWeeks}
                     onClick={() => setDrillField(f)} />
          );
        })}
      </div>

      {/* Team activity comparison — only when viewing ALL teams.
          When a single team is selected, show per-salesperson comparison instead. */}
      <div className="card chart-card">
        <div className="card-head">
          <div>
            <div className="card-title">
              {teamId === "all"
                ? `Team Activity Comparison · ${periodLabel}`
                : `${team.name} — Salesperson Activity · ${periodLabel}`}
            </div>
            <div className="card-sub">
              {teamId === "all"
                ? "กราฟแยกตาม activity — เปรียบเทียบทีมในที่เดียว"
                : "เปรียบเทียบเซลล์แต่ละคนในทีม"}
            </div>
          </div>
        </div>
        {teamId === "all" ? (
          <TeamCompareChart
            teams={teamsForChart}
            fields={ACTIVITY_FIELDS}
            valueOf={(tid, fk) => valueForTeam(tid, fk)}
          />
        ) : (
          <TeamCompareChart
            teams={people.map(sp => ({
              id: sp.id,
              name: sp.name,
              thai: sp.thai,
              color: team.color,
            }))}
            fields={ACTIVITY_FIELDS}
            valueOf={(spId, fk) => {
              if (fk === "newClients") {
                return D.CUSTOMERS.filter(c => c.owner === spId &&
                  activeWeekIdxs.map(i => D.WEEKS[i]).includes(c.sinceWeek)).length;
              }
              const realKey = fk === "wonDeals" ? "newClients" : fk;
              return activeWeekIdxs.reduce((s, i) =>
                s + D.pickVal(D.ACTIVITY[spId][i][realKey], ctype), 0);
            }}
          />
        )}
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
        <div className="leaderboard leaderboard-v2">
          <div className="lb-head">
            <div>Sales Rep</div>
            <div>Team</div>
            <div className="num" title="≥ 10 calls / week">Call<br/><span className="lb-expect">≥10/wk</span></div>
            <div className="num" title="≥ 2 visits / week">Visits<br/><span className="lb-expect">≥2/wk</span></div>
            <div className="num">Quotes</div>
            <div className="num">Problems</div>
            <div className="num">New Pipeline</div>
            <div className="num">Won Deal</div>
            <div className="num">Potential TEU</div>
          </div>

          {/* Group people by team when teamId === "all", else just one block */}
          {(() => {
            const teamsToShow = teamId === "all"
              ? D.TEAMS.filter(t => t.id !== "all").filter(t => D.SALESPEOPLE.some(s => s.team === t.id))
              : [team];
            return teamsToShow.map(t => {
              const tPeople = D.SALESPEOPLE.filter(s => s.team === t.id);
              if (tPeople.length === 0) return null;

              const vp = (sp, field) => {
                if (field === "newClients") {
                  return D.CUSTOMERS.filter(c => c.owner === sp.id &&
                    activeWeekIdxs.map(i => D.WEEKS[i]).includes(c.sinceWeek)).length;
                }
                if (field === "wonDeals") {
                  return activeWeekIdxs.reduce((s, i) =>
                    s + D.pickVal(D.ACTIVITY[sp.id][i].newClients, ctype), 0);
                }
                return activeWeekIdxs.reduce((s, i) =>
                  s + D.pickVal(D.ACTIVITY[sp.id][i][field], ctype), 0);
              };
              // Team totals row
              const sumField = (field) => tPeople.reduce((s, sp) => s + vp(sp, field), 0);

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
                        <span title="Total contacts">{sumField("contacts")} contacts</span>
                        <span title="Total visits">· {sumField("visits")} visits</span>
                        <span title="Total won deals" style={{ color: "#10b981" }}>· {sumField("wonDeals")} won</span>
                      </div>
                    </div>
                  )}
                  {tPeople.map(sp => {
                    const contacts = vp(sp, "contacts");
                    const visits   = vp(sp, "visits");
                    const contactsBelow = contacts < 10 * periodWeeks;
                    const visitsBelow   = visits   < 2  * periodWeeks;
                    return (
                      <div key={sp.id} className="lb-row">
                        <div className="lb-name">
                          <Avatar initials={sp.avatar} color={t.color} size={32} />
                          <div>
                            <div className="name-en">{sp.name}</div>
                            <div className="name-th">{sp.thai}</div>
                          </div>
                        </div>
                        <div><span className="team-chip" style={{ "--c": t.color }}>{t.name.replace("TEAM ", "")}</span></div>
                        <div className={`num mono ${contactsBelow ? "lb-below" : ""}`}>{contacts}</div>
                        <div className={`num mono ${visitsBelow ? "lb-below" : ""}`}>{visits}</div>
                        <div className="num mono">{vp(sp, "quotations")}</div>
                        <div className="num mono">{vp(sp, "problems")}</div>
                        <div className="num mono">{vp(sp, "newClients")}</div>
                        <div className="num mono lb-big" style={{ color: "#10b981" }}>{vp(sp, "wonDeals")}</div>
                        <div className="num mono">{vp(sp, "potentialTeu")}</div>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            });
          })()}
        </div>
      </div>

      {/* Recent pipeline */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Recent Pipeline Customers</div>
            <div className="card-sub">ลูกค้าใหม่ที่เข้ามาใน pipeline ล่าสุด</div>
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
          { key: "customer", label: "Customer", style: {minWidth: 200},
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
          { key: "date", label: "Date",
            render: (it) => <span className="mono ad-date">{it.date}<span className="ad-wk">{it.week}</span></span> },
          { key: "stage", label: "Stage",
            render: (it) => <span className="ad-stage">{it.stage || "—"}</span> },
        ]}
      />
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