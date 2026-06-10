// Reusable UI building blocks — KPI cards, charts, badges, sparklines.
// Drawn with inline SVG. No chart libraries.

const { useState, useEffect, useRef, useMemo } = React;

// ---------- AnimatedNumber: counts up from 0 to value ----------
function AnimatedNumber({ value, duration = 900, format = (n) => n.toLocaleString() }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
      else prevValue.current = end;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{format(display)}</span>;
}

// ---------- Sparkline ----------
function Sparkline({ data, color = "#0a1628", height = 36, width = 120, fill = true }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2]);
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fillPath = `${path} L${width},${height} L0,${height} Z`;
  const gradId = `sparkfill-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={fillPath} fill={`url(#${gradId})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2.5" fill={color} />
    </svg>
  );
}

// ---------- KPI Card ----------
function KpiCard({ label, thai, value, icon, accent, series, split, periodWeeks, onClick }) {
  const total = split ? (split.existing + split.new) : value;
  const exPct = split && total > 0 ? (split.existing / total) * 100 : 0;
  const clickable = typeof onClick === "function" && value > 0;
  return (
    <div className={`kpi-card ${clickable ? "kpi-clickable" : ""}`}
         onClick={clickable ? onClick : undefined}
         role={clickable ? "button" : undefined}
         tabIndex={clickable ? 0 : undefined}>
      <div className="kpi-head">
        <div className="kpi-icon" style={{ background: accent + "14", color: accent }}>{icon}</div>
        <div className="kpi-label">
          <div className="kpi-en">{label}</div>
          <div className="kpi-th">{thai}</div>
        </div>
        {clickable && <span className="kpi-open">›</span>}
      </div>
      <div className="kpi-value">
        <AnimatedNumber value={value} />
      </div>
      {split && (
        <div className="kpi-split">
          <div className="kpi-split-bar">
            <div className="kpi-split-existing" style={{ width: `${exPct}%`, background: accent }} />
            <div className="kpi-split-new" style={{ width: `${100 - exPct}%`, background: accent, opacity: 0.35 }} />
          </div>
          <div className="kpi-split-legend">
            <span><i style={{ background: accent }} />Existing <b className="mono">{split.existing}</b></span>
            <span><i style={{ background: accent, opacity: 0.35 }} />New <b className="mono">{split.new}</b></span>
          </div>
        </div>
      )}
      <div className="kpi-foot">
        <span className="kpi-foot-meta">{periodWeeks > 1 ? `${periodWeeks}-week total` : "this period"}</span>
      </div>
      <div className="kpi-accent-bar" style={{ background: accent }} />
    </div>
  );
}

// ---------- Team Compare Chart (small multiples — one chart per activity) ----------
function TeamCompareChart({ teams, fields, valueOf }) {
  return (
    <div className="tcc-grid">
      {fields.map(f => (
        <TeamCompareMiniChart key={f.key} field={f} teams={teams} valueOf={valueOf} />
      ))}
    </div>
  );
}

function TeamCompareMiniChart({ field, teams, valueOf }) {
  const data = teams.map(t => ({ team: t, value: valueOf(t.id, field.key) }));
  const max = Math.max(...data.map(d => d.value), 1) * 1.25;
  // Make chart wider when more items (e.g. 7 salespeople vs 3 teams) and a bit taller
  // so tall bars + value labels never get clipped.
  const n = teams.length;
  const w = Math.max(280, 60 + n * 36);
  const h = 210;
  const padL = 10, padR = 10, padT = 36, padB = 38;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const groupW = innerW / n;
  const barW = Math.min(28, groupW * 0.6);

  return (
    <div className="tcc-card">
      <div className="tcc-head">
        <div className="tcc-icon" style={{ background: field.color + "18", color: field.color }}>{field.icon}</div>
        <div>
          <div className="tcc-title">{field.label}</div>
          <div className="tcc-thai">{field.thai}</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="tcc-svg" width="100%" preserveAspectRatio="xMidYMid meet">
        {/* Baseline */}
        <line x1={padL} x2={w - padR} y1={padT + innerH} y2={padT + innerH} stroke="#e7e5df" />
        {data.map((d, gi) => {
          const groupCx = padL + groupW * gi + groupW / 2;
          const barX = groupCx - barW / 2;
          const rawH = (d.value / max) * innerH;
          const barH = d.value > 0 ? Math.max(3, rawH) : 0;
          const barY = padT + innerH - barH;
          // Clamp value label so it never escapes the chart area
          const labelY = Math.max(padT - 2, barY - 6);
          return (
            <g key={d.team.id}>
              {/* Bar — static, no SMIL animation */}
              <rect x={barX} y={barY} width={barW} height={barH} fill={field.color} rx="3" />
              {/* Value above bar */}
              <text x={groupCx} y={labelY} textAnchor="middle" fontSize="13" fontWeight="700"
                    fill="#0a1628" fontFamily="Arial">{d.value}</text>
              {/* Name below baseline — no colored dot anymore */}
              <text x={groupCx} y={padT + innerH + 20} textAnchor="middle" fontSize="11" fontWeight="600"
                    fill="#0a1628" fontFamily="Arial">{d.team.name.replace("TEAM ", "")}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------- Bar Chart (weekly TEU) ----------
function BarChart({ weeks, values, valuesB, color = "#d97706", colorB = "#0a1628", labelA = "Potential", labelB = "Won" }) {
  const max = Math.max(...values, ...(valuesB || []), 1);
  const padded = max * 1.15;
  const w = 720, h = 240, padL = 36, padR = 12, padT = 16, padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const groupW = innerW / weeks.length;
  const barW = valuesB ? groupW * 0.32 : groupW * 0.55;

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((padded / yTicks) * i));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="bar-chart" width="100%">
      {/* Y grid */}
      {ticks.map((t, i) => {
        const y = padT + innerH - (t / padded) * innerH;
        return (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="#e7e5df" strokeDasharray={i === 0 ? "0" : "2 4"} />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#86807a" fontFamily="Arial">{t}</text>
          </g>
        );
      })}
      {/* Bars */}
      {weeks.map((wk, i) => {
        const cx = padL + groupW * i + groupW / 2;
        const va = values[i];
        const vb = valuesB ? valuesB[i] : null;
        const ha = (va / padded) * innerH;
        const hb = vb != null ? (vb / padded) * innerH : 0;
        const xa = valuesB ? cx - barW - 2 : cx - barW / 2;
        const xb = cx + 2;
        return (
          <g key={wk} className="bar-group">
            <rect x={xa} y={padT + innerH - ha} width={barW} height={ha} fill={color} rx="2">
              <animate attributeName="height" from="0" to={ha} dur="0.6s" fill="freeze" begin={`${i * 0.04}s`} />
              <animate attributeName="y" from={padT + innerH} to={padT + innerH - ha} dur="0.6s" fill="freeze" begin={`${i * 0.04}s`} />
            </rect>
            {valuesB && (
              <rect x={xb} y={padT + innerH - hb} width={barW} height={hb} fill={colorB} rx="2">
                <animate attributeName="height" from="0" to={hb} dur="0.6s" fill="freeze" begin={`${i * 0.04 + 0.1}s`} />
                <animate attributeName="y" from={padT + innerH} to={padT + innerH - hb} dur="0.6s" fill="freeze" begin={`${i * 0.04 + 0.1}s`} />
              </rect>
            )}
            <text x={cx} y={h - 10} textAnchor="middle" fontSize="10" fill="#86807a" fontFamily="Arial">{wk}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------- Line Chart (multi-series) ----------
function LineChart({ weeks, series }) {
  // series: [{name, values, color}]
  const allVals = series.flatMap(s => s.values);
  const max = Math.max(...allVals, 1) * 1.1;
  const w = 720, h = 220, padL = 36, padR = 12, padT = 16, padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const stepX = innerW / (weeks.length - 1);

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((max / yTicks) * i));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="line-chart" width="100%">
      {ticks.map((t, i) => {
        const y = padT + innerH - (t / max) * innerH;
        return (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="#e7e5df" strokeDasharray={i === 0 ? "0" : "2 4"} />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#86807a" fontFamily="Arial">{t}</text>
          </g>
        );
      })}
      {weeks.map((wk, i) => (
        <text key={wk} x={padL + stepX * i} y={h - 10} textAnchor="middle" fontSize="10" fill="#86807a" fontFamily="Arial">{wk}</text>
      ))}
      {series.map((s, si) => {
        const pts = s.values.map((v, i) => [padL + stepX * i, padT + innerH - (v / max) * innerH]);
        const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
        const len = 800;
        return (
          <g key={s.name}>
            <path d={path} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ strokeDasharray: len, strokeDashoffset: len, animation: `draw 1s ${si * 0.15}s ease forwards` }} />
            {pts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke={s.color} strokeWidth="1.5">
                <animate attributeName="r" from="0" to="3" dur="0.3s" fill="freeze" begin={`${0.9 + si * 0.15}s`} />
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ---------- Stage Badge ----------
function StageBadge({ stage }) {
  const { STAGES } = window.SalesData;
  const s = STAGES.find(x => x.id === stage);
  if (!s) return null;
  return (
    <span className="stage-badge" style={{ "--c": s.color }}>
      <span className="stage-dot" />
      {s.label}
    </span>
  );
}

// ---------- Avatar ----------
function Avatar({ initials, color = "#0a1628", size = 32 }) {
  return (
    <div className="avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

// ---------- Progress Bar ----------
function ProgressBar({ value, max = 100, color = "#d97706", height = 6 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="progress-track" style={{ height }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: color, height }} />
    </div>
  );
}

// ---------- Radial Gauge (conversion %) ----------
function RadialGauge({ value, max = 100, color = "#d97706", size = 110, label = "" }) {
  const pct = Math.min(100, (value / max) * 100);
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#eeeae3" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
                strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
                transform={`rotate(-90 ${size/2} ${size/2})`}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)" }} />
      </svg>
      <div className="gauge-center">
        <div className="gauge-value"><AnimatedNumber value={value} />%</div>
        <div className="gauge-label">{label}</div>
      </div>
    </div>
  );
}

// ---------- Activity Detail Drawer (drill-down from KPI cards) ----------
function ActivityDetailDrawer({ open, onClose, title, subtitle, items, columns, emptyMessage }) {
  if (!open) return null;
  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="ad-head">
          <div>
            <div className="ad-title">{title}</div>
            {subtitle && <div className="ad-sub">{subtitle}</div>}
          </div>
          <button className="ad-close" onClick={onClose}>✕</button>
        </div>
        <div className="ad-body">
          {(!items || items.length === 0) ? (
            <div className="ad-empty">{emptyMessage || "No items to show."}</div>
          ) : (
            <table className="ad-table">
              <thead>
                <tr>
                  <th style={{width: 40}}>#</th>
                  {columns.map(c => <th key={c.key} style={c.style}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td className="ad-i">{i + 1}</td>
                    {columns.map(c => (
                      <td key={c.key} className={c.cellClass}>
                        {c.render ? c.render(it) : it[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="ad-foot">
          <span>{items?.length || 0} item{items?.length === 1 ? "" : "s"}</span>
          <button className="ad-foot-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  AnimatedNumber, Sparkline, KpiCard, BarChart, LineChart, TeamCompareChart, TeamCompareMiniChart,
  StageBadge, Avatar, ProgressBar, RadialGauge, ActivityDetailDrawer,
});
