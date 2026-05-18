// src/market_views.jsx — Market Intelligence views (Customer List + Market Dashboard)

const { useState: useStateMI, useMemo: useMemoMI } = React;

// Returns real MARKET data from SalesData if available, else falls back to mock.
// Called at render time — after onSalesDataReady fires — so SalesData is populated.
function getM() {
  const real = window.SalesData && window.SalesData.MARKET;
  if (real && !real.isMock && real.SHIPPERS && real.SHIPPERS.length > 0) {
    return { CATEGORIES: window.MarketData.CATEGORIES, ...real };
  }
  return window.MarketData;
}

// ─────────────────────────────────────────────────────────────────────
// Shared: Category summary pill bar (matches "Total Shippers / Chicken / ..." strip)
// ─────────────────────────────────────────────────────────────────────
function MarketCategoryBar({ activeCat, onChange, filteredCounts }) {
  const M = getM();
  const totalFiltered = Object.values(filteredCounts).reduce((a, b) => a + b, 0);
  return (
    <div className="mkt-cats">
      {M.CATEGORIES.map((c) => {
        const value = c.id === "total" ? totalFiltered : (filteredCounts[c.id] || 0);
        const active = activeCat === c.id;
        return (
          <button key={c.id}
                  className={`mkt-cat ${active ? "active" : ""}`}
                  style={{ "--cat-c": c.color }}
                  onClick={() => onChange(c.id)}>
            <div className="mkt-cat-head">
              <span className="mkt-cat-ic">{c.icon}</span>
              <span className="mkt-cat-label">{c.label}</span>
            </div>
            <div className="mkt-cat-value mono">{value}</div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Shared: Filter toolbar (search + product + country)
// ─────────────────────────────────────────────────────────────────────
function MarketFilters({ search, setSearch, product, setProduct, country, setCountry, onClear, allCountries, allProducts }) {
  const hasAny = search || product !== "all" || country !== "all";
  return (
    <div className="mkt-toolbar">
      <div className="search-input">
        <span className="search-icon">⌕</span>
        <input placeholder="Search by customer name…" value={search}
               onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="owner-filter">
        <span className="of-label">Product:</span>
        <select className="of-select" value={product} onChange={(e) => setProduct(e.target.value)}>
          <option value="all">All products</option>
          {allProducts.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="owner-filter">
        <span className="of-label">Country:</span>
        <select className="of-select" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="all">All countries</option>
          {allCountries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {hasAny && <button className="btn-link" onClick={onClear}>Clear filters</button>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hook: shared filter logic for both market views
// ─────────────────────────────────────────────────────────────────────
function useMarketFiltered() {
  const M = getM();
  const [activeCat, setActiveCat] = useStateMI("total");
  const [search,    setSearch]    = useStateMI("");
  const [product,   setProduct]   = useStateMI("all");
  const [country,   setCountry]   = useStateMI("all");

  const filtered = useMemoMI(() => {
    let list = M.SHIPPERS;
    if (activeCat !== "total") list = list.filter((s) => s.cat === activeCat);
    if (product !== "all")     list = list.filter((s) => s.products.includes(product));
    if (country !== "all")     list = list.filter((s) => s.countries.includes(country));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nameTh || "").toLowerCase().includes(q));
    }
    return list;
  }, [activeCat, search, product, country]);

  // counts per category, AFTER applying search/product/country (but BEFORE activeCat)
  const baseList = useMemoMI(() => {
    let list = M.SHIPPERS;
    if (product !== "all") list = list.filter((s) => s.products.includes(product));
    if (country !== "all") list = list.filter((s) => s.countries.includes(country));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nameTh || "").toLowerCase().includes(q));
    }
    return list;
  }, [search, product, country]);

  const filteredCounts = useMemoMI(() => {
    const out = { chicken: 0, seafood: 0, rice: 0, sugar: 0, multi: 0 };
    baseList.forEach((s) => { out[s.cat] = (out[s.cat] || 0) + 1; });
    return out;
  }, [baseList]);

  const clearAll = () => { setActiveCat("total"); setSearch(""); setProduct("all"); setCountry("all"); };

  return {
    activeCat, setActiveCat, search, setSearch, product, setProduct, country, setCountry,
    filtered, baseList, filteredCounts, clearAll,
  };
}

// ─────────────────────────────────────────────────────────────────────
// VIEW 1 — Customer List
// ─────────────────────────────────────────────────────────────────────
function MarketCustomersView() {
  const M = getM();
  const F = useMarketFiltered();
  const allCountries = useMemoMI(() => M.COUNTRIES.map((c) => c.country), []);

  return (
    <div className="view market-view">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">MARKET INTELLIGENCE · THAILAND EXPORTERS</div>
          <h1 className="page-title">Customer List <span className="page-title-en">/ รายชื่อลูกค้าส่งออก</span></h1>
          <div className="page-sub">
            {F.filtered.length} of {M.SHIPPERS.length} shippers
            {M.isMock && <> · <span style={{color:"var(--amber)"}}>mock data — replace with Excel sync</span></>}
          </div>
        </div>
      </div>

      <MarketCategoryBar activeCat={F.activeCat} onChange={F.setActiveCat} filteredCounts={F.filteredCounts} />

      <MarketFilters
        search={F.search} setSearch={F.setSearch}
        product={F.product} setProduct={F.setProduct}
        country={F.country} setCountry={F.setCountry}
        onClear={F.clearAll}
        allCountries={allCountries}
        allProducts={M.PRODUCTS}
      />

      <div className="card mkt-table-card">
        <table className="mkt-table">
          <thead>
            <tr>
              <th style={{width:"4%"}}>#</th>
              <th style={{width:"26%"}}>Customer</th>
              <th style={{width:"12%"}}>Category</th>
              <th style={{width:"22%"}}>Products</th>
              <th style={{width:"22%"}}>Export Countries</th>
              <th style={{width:"14%", textAlign:"right"}}>Volume (TEU)</th>
            </tr>
          </thead>
          <tbody>
            {F.filtered.length === 0 && (
              <tr><td colSpan="6" style={{textAlign:"center", padding:"40px", color:"var(--ink-4)"}}>
                No shippers match the current filters.
              </td></tr>
            )}
            {F.filtered.map((s, i) => {
              const catMeta = M.CATEGORIES.find((c) => c.id === s.cat);
              return (
                <tr key={s.id}>
                  <td className="mono" style={{color:"var(--ink-4)"}}>{i + 1}</td>
                  <td>
                    <div className="mkt-cust-name">{s.name}</div>
                    {s.nameTh && <div className="mkt-cust-th">{s.nameTh}</div>}
                  </td>
                  <td>
                    <span className="mkt-cat-tag" style={{ background: catMeta.color + "18", color: catMeta.color }}>
                      {catMeta.label}
                    </span>
                  </td>
                  <td>
                    <div className="mkt-tags">
                      {s.products.map((p) => <span key={p} className="mkt-tag">{p}</span>)}
                    </div>
                  </td>
                  <td>
                    <div className="mkt-tags">
                      {s.countries.slice(0, 4).map((c) => <span key={c} className="mkt-tag mkt-tag-ctry">{c}</span>)}
                      {s.countries.length > 4 && <span className="mkt-tag mkt-tag-more">+{s.countries.length - 4}</span>}
                    </div>
                  </td>
                  <td className="mono" style={{textAlign:"right", fontWeight:600}}>
                    {s.totalTeu.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// VIEW 2 — Market Dashboard
// ─────────────────────────────────────────────────────────────────────
function MarketDashboardView() {
  const M = getM();
  const F = useMarketFiltered();
  const allCountries = useMemoMI(() => M.COUNTRIES.map((c) => c.country), []);

  // Aggregates over the filtered list
  const agg = useMemoMI(() => {
    const list = F.filtered;
    const totalTeu = list.reduce((a, b) => a + b.totalTeu, 0);

    const countryMap = {};
    const productMap = {};
    list.forEach((s) => {
      Object.entries(s.cv).forEach(([c, v]) => { countryMap[c] = (countryMap[c] || 0) + v; });
      s.products.forEach((p) => { productMap[p] = (productMap[p] || 0) + s.totalTeu / s.products.length; });
    });

    const topCountries = Object.entries(countryMap)
      .map(([country, vol]) => ({ country, vol }))
      .sort((a, b) => b.vol - a.vol);

    const topShippers = [...list].sort((a, b) => b.totalTeu - a.totalTeu).slice(0, 10);

    const productMix = Object.entries(productMap)
      .map(([p, v]) => ({ p, v }))
      .sort((a, b) => b.v - a.v);

    const topCountry = topCountries[0]?.country || "—";
    const topShipper = topShippers[0]?.name || "—";
    const topProduct = productMix[0]?.p || "—";

    return { totalTeu, topCountries, topShippers, productMix, topCountry, topShipper, topProduct };
  }, [F.filtered]);

  const KPIS = [
    { label: "Total TEU",      thai: "ปริมาณส่งออกรวม", value: agg.totalTeu.toLocaleString(), icon: "▣", c: "#0a1628" },
    { label: "Top Destination", thai: "ปลายทางสูงสุด",  value: agg.topCountry,                  icon: "✈", c: "#0891b2" },
    { label: "Top Shipper",     thai: "ผู้ส่งออกอันดับ 1", value: agg.topShipper,                icon: "★", c: "#d97706" },
    { label: "Top Product",     thai: "สินค้าหลัก",      value: agg.topProduct,                  icon: "◆", c: "#10b981" },
  ];

  const maxCountryVol = agg.topCountries[0]?.vol || 1;
  const maxShipperVol = agg.topShippers[0]?.totalTeu || 1;
  const totalProductVol = agg.productMix.reduce((a, b) => a + b.v, 0) || 1;

  return (
    <div className="view market-view">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">MARKET INTELLIGENCE · THAILAND EXPORT OVERVIEW</div>
          <h1 className="page-title">Market Dashboard <span className="page-title-en">/ ภาพรวมตลาด</span></h1>
          <div className="page-sub">
            {F.filtered.length} shippers · {agg.totalTeu.toLocaleString()} total TEU · {agg.topCountries.length} destination countries
            {M.isMock && <> · <span style={{color:"var(--amber)"}}>mock data</span></>}
          </div>
        </div>
      </div>

      <MarketCategoryBar activeCat={F.activeCat} onChange={F.setActiveCat} filteredCounts={F.filteredCounts} />

      <MarketFilters
        search={F.search} setSearch={F.setSearch}
        product={F.product} setProduct={F.setProduct}
        country={F.country} setCountry={F.setCountry}
        onClear={F.clearAll}
        allCountries={allCountries}
        allProducts={M.PRODUCTS}
      />

      {/* KPI strip */}
      <div className="mkt-kpis">
        {KPIS.map((k) => (
          <div key={k.label} className="mkt-kpi">
            <div className="mkt-kpi-head">
              <div className="mkt-kpi-ic" style={{ background: k.c + "14", color: k.c }}>{k.icon}</div>
              <div>
                <div className="mkt-kpi-en">{k.label}</div>
                <div className="mkt-kpi-th">{k.thai}</div>
              </div>
            </div>
            <div className="mkt-kpi-val">{k.value}</div>
            <div className="mkt-kpi-bar" style={{ background: k.c }} />
          </div>
        ))}
      </div>

      {/* Two-up: Top destinations | Product mix */}
      <div className="row-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Top Destination Countries</div>
              <div className="card-sub">Sorted by total TEU exported</div>
            </div>
          </div>
          <div className="mkt-hbar-list">
            {agg.topCountries.slice(0, 10).map((c) => {
              const pct = (c.vol / maxCountryVol) * 100;
              return (
                <div key={c.country} className="mkt-hbar-row">
                  <div className="mkt-hbar-label">{c.country}</div>
                  <div className="mkt-hbar-track">
                    <div className="mkt-hbar-fill" style={{ width: pct + "%", background: "#0891b2" }} />
                  </div>
                  <div className="mkt-hbar-val mono">{c.vol.toLocaleString()}</div>
                </div>
              );
            })}
            {agg.topCountries.length === 0 && (
              <div style={{textAlign:"center", color:"var(--ink-4)", padding:"24px"}}>No data</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Product Mix</div>
              <div className="card-sub">Estimated volume share</div>
            </div>
          </div>
          <div className="mkt-hbar-list">
            {agg.productMix.slice(0, 10).map((row, idx) => {
              const pct = (row.v / totalProductVol) * 100;
              const palette = ["#0a1628","#0891b2","#d97706","#10b981","#7c3aed","#dc2626","#1d7a73","#8b5526","#1d6fb7","#595959"];
              const color = palette[idx % palette.length];
              return (
                <div key={row.p} className="mkt-hbar-row">
                  <div className="mkt-hbar-label">{row.p}</div>
                  <div className="mkt-hbar-track">
                    <div className="mkt-hbar-fill" style={{ width: pct + "%", background: color }} />
                  </div>
                  <div className="mkt-hbar-val mono">{pct.toFixed(1)}%</div>
                </div>
              );
            })}
            {agg.productMix.length === 0 && (
              <div style={{textAlign:"center", color:"var(--ink-4)", padding:"24px"}}>No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Top shippers leaderboard */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Top 10 Shippers by Volume</div>
            <div className="card-sub">Highest export TEU within current filter</div>
          </div>
        </div>
        <div className="mkt-hbar-list">
          {agg.topShippers.map((s, idx) => {
            const pct = (s.totalTeu / maxShipperVol) * 100;
            const catMeta = M.CATEGORIES.find((c) => c.id === s.cat);
            return (
              <div key={s.id} className="mkt-hbar-row mkt-hbar-row-rich">
                <div className="mkt-hbar-rank mono">{String(idx + 1).padStart(2, "0")}</div>
                <div className="mkt-hbar-label mkt-hbar-label-2">
                  <div className="mkt-cust-name">{s.name}</div>
                  <span className="mkt-cat-tag" style={{ background: catMeta.color + "18", color: catMeta.color }}>
                    {catMeta.label}
                  </span>
                </div>
                <div className="mkt-hbar-track">
                  <div className="mkt-hbar-fill" style={{ width: pct + "%", background: catMeta.color }} />
                </div>
                <div className="mkt-hbar-val mono">{s.totalTeu.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
