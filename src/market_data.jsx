// src/market_data.jsx — Mock market intelligence data for Thai export shippers.
// REPLACE WITH REAL EXCEL DATA LATER:
//   1. Drop the Excel file into sync/ (e.g. sync/market_intelligence.xlsx)
//   2. Add a parser in sync/sync_excel.py that emits MARKET section into data.json
//   3. Switch the IIFE below to read from window.SalesData.MARKET instead of MOCK

(function () {
  "use strict";

  // -----------------------------------------------------------------
  // Reference dimensions (matches the colored pill bar in screenshot)
  // -----------------------------------------------------------------
  const CATEGORIES = [
    { id: "total",   label: "Total Shippers", icon: "◧", color: "#1d7a73" },
    { id: "chicken", label: "Chicken",        icon: "♘", color: "#1a2940" },
    { id: "seafood", label: "Seafood",        icon: "≈",  color: "#1d6fb7" },
    { id: "rice",    label: "Rice",           icon: "❀", color: "#2f6e3a" },
    { id: "sugar",   label: "Sugar",          icon: "❆", color: "#8b5526" },
    { id: "multi",   label: "Multi",          icon: "▦", color: "#595959" },
  ];

  // -----------------------------------------------------------------
  // Mock shippers (≈50 realistic Thai exporters)
  // -----------------------------------------------------------------
  // Helper to build country volume objects without typing braces a hundred times
  const mk = (countries) => {
    const o = {};
    countries.forEach(([c, v]) => { o[c] = v; });
    return o;
  };

  const SHIPPERS = [
    // ─── Chicken (12) ─────────────────────────────────────────────
    { id: "c01", name: "GFPT Public Co., Ltd.",                nameTh: "จีเอฟพีที",        cat: "chicken", products: ["Frozen chicken", "Cooked chicken"], cv: mk([["Japan",420],["UK",180],["Korea",140],["Germany",90]]) },
    { id: "c02", name: "Saha Farms Group",                      nameTh: "ฟาร์มสห",         cat: "chicken", products: ["Frozen chicken"],                  cv: mk([["Japan",260],["EU",210],["Singapore",70]]) },
    { id: "c03", name: "Bangkok Ranch PCL",                     nameTh: "บางกอกแร้นช์",    cat: "chicken", products: ["Duck", "Chicken"],                cv: mk([["Japan",190],["UK",110],["Netherlands",80]]) },
    { id: "c04", name: "Betagro Public Co., Ltd.",              nameTh: "เบทาโกร",         cat: "chicken", products: ["Frozen chicken", "Processed"],     cv: mk([["Japan",380],["UK",200],["Korea",130],["Vietnam",110]]) },
    { id: "c05", name: "Cargill Meats Thailand",                nameTh: "คาร์กิลล์",       cat: "chicken", products: ["Cooked chicken"],                  cv: mk([["Japan",470],["UK",240],["EU",160]]) },
    { id: "c06", name: "Centaco Group",                         nameTh: "เซ็นทาโก",        cat: "chicken", products: ["Frozen chicken"],                  cv: mk([["Korea",140],["Hong Kong",60]]) },
    { id: "c07", name: "Thaifoods Group PCL",                   nameTh: "ไทยฟู้ดส์",       cat: "chicken", products: ["Frozen chicken"],                  cv: mk([["Japan",170],["Singapore",70],["Malaysia",50]]) },
    { id: "c08", name: "Laemthong Corporation",                 nameTh: "แหลมทอง",        cat: "chicken", products: ["Frozen chicken"],                  cv: mk([["Japan",120],["Korea",80]]) },
    { id: "c09", name: "Korat Poultry Co., Ltd.",               nameTh: "โคราชโปลทรี",    cat: "chicken", products: ["Frozen chicken"],                  cv: mk([["Hong Kong",90],["Singapore",60]]) },
    { id: "c10", name: "Saha Mitr Farm",                        nameTh: "สหมิตรฟาร์ม",    cat: "chicken", products: ["Cooked chicken"],                  cv: mk([["Japan",110],["EU",70]]) },
    { id: "c11", name: "BR Foods Thailand",                     nameTh: "บีอาร์ ฟู้ดส์",  cat: "chicken", products: ["Frozen chicken"],                  cv: mk([["Saudi Arabia",140],["UAE",90]]) },
    { id: "c12", name: "Sun Valley (Thailand) Ltd.",            nameTh: "ซันวัลเลย์",      cat: "chicken", products: ["Cooked chicken"],                  cv: mk([["UK",230],["Germany",110]]) },

    // ─── Seafood (15) ─────────────────────────────────────────────
    { id: "s01", name: "Thai Union Group PCL",                  nameTh: "ไทยยูเนี่ยน",     cat: "seafood", products: ["Tuna", "Shrimp", "Pet food"],     cv: mk([["USA",890],["Japan",520],["EU",430],["UK",260],["Canada",110]]) },
    { id: "s02", name: "Charoen Pokphand Foods (Seafood)",      nameTh: "ซีพีเอฟ",        cat: "seafood", products: ["Shrimp", "Prepared seafood"],     cv: mk([["USA",710],["Japan",430],["UK",240]]) },
    { id: "s03", name: "Asian Seafoods Coldstorage PCL",        nameTh: "เอเชี่ยน ซีฟู้ดส์",cat: "seafood",products: ["Shrimp", "Fish"],                 cv: mk([["USA",340],["EU",210],["Australia",80]]) },
    { id: "s04", name: "Marine Gold Products Ltd.",             nameTh: "มารีน โกลด์",    cat: "seafood", products: ["Shrimp"],                          cv: mk([["USA",260],["Japan",110]]) },
    { id: "s05", name: "Songkla Canning PCL",                   nameTh: "สงขลาแคนนิ่ง",   cat: "seafood", products: ["Canned tuna", "Canned sardine"],   cv: mk([["EU",240],["Africa",180],["Middle East",120]]) },
    { id: "s06", name: "Pataya Food Industries Ltd.",           nameTh: "พัทยาฟู้ด",       cat: "seafood", products: ["Canned tuna"],                     cv: mk([["EU",310],["USA",150]]) },
    { id: "s07", name: "Phatthana Seafood Co., Ltd.",           nameTh: "พัฒนาซีฟู้ด",    cat: "seafood", products: ["Shrimp"],                          cv: mk([["USA",290],["Canada",90]]) },
    { id: "s08", name: "Sea Value PCL",                         nameTh: "ซีแวลู",         cat: "seafood", products: ["Canned tuna", "Pet food"],         cv: mk([["EU",260],["USA",130],["Australia",90]]) },
    { id: "s09", name: "Thai Union Manufacturing",              nameTh: "ทียูเอ็ม",       cat: "seafood", products: ["Tuna", "Sardine"],                 cv: mk([["USA",440],["EU",240]]) },
    { id: "s10", name: "Andaman Seafood Co., Ltd.",             nameTh: "อันดามัน",       cat: "seafood", products: ["Shrimp", "Fish"],                  cv: mk([["Japan",170],["Korea",90]]) },
    { id: "s11", name: "Surapon Foods PCL",                     nameTh: "สุรพลฟู้ดส์",    cat: "seafood", products: ["Shrimp", "Crab"],                  cv: mk([["Japan",240],["USA",110],["EU",80]]) },
    { id: "s12", name: "Kingfisher Holdings Ltd.",              nameTh: "คิงฟิชเชอร์",    cat: "seafood", products: ["Tuna"],                            cv: mk([["EU",190],["USA",90]]) },
    { id: "s13", name: "Thai Royal Frozen Food",                nameTh: "ไทยรอยัล",       cat: "seafood", products: ["Shrimp"],                          cv: mk([["Japan",160],["Korea",70]]) },
    { id: "s14", name: "Chumporn Marine Foods",                 nameTh: "ชุมพรมารีน",     cat: "seafood", products: ["Squid", "Octopus"],                cv: mk([["Korea",140],["Japan",80]]) },
    { id: "s15", name: "Asian Alliance Intl.",                  nameTh: "เอเชี่ยน อัลไลแอนซ์", cat: "seafood", products: ["Tuna", "Pet food"],            cv: mk([["USA",380],["EU",170]]) },

    // ─── Rice (10) ────────────────────────────────────────────────
    { id: "r01", name: "Asia Golden Rice Co., Ltd.",            nameTh: "เอเชียโกลเด้นไรซ์", cat: "rice", products: ["Hom Mali", "White rice"],          cv: mk([["China",420],["Africa",380],["USA",210],["Middle East",170]]) },
    { id: "r02", name: "Thai Hua (2517) Co., Ltd.",             nameTh: "ไทยฮั้ว",        cat: "rice",    products: ["Hom Mali"],                        cv: mk([["China",340],["Hong Kong",110],["Singapore",90]]) },
    { id: "r03", name: "Capital Rice Co., Ltd.",                nameTh: "แคปปิทอลไรซ์",   cat: "rice",    products: ["Hom Mali", "Parboiled"],           cv: mk([["Africa",420],["USA",180]]) },
    { id: "r04", name: "Pong Phaisan Rice Mill",                nameTh: "ปองไพศาล",       cat: "rice",    products: ["White rice"],                      cv: mk([["China",240],["Philippines",170]]) },
    { id: "r05", name: "Siam Rice International",               nameTh: "สยามไรซ์",       cat: "rice",    products: ["Hom Mali"],                        cv: mk([["Hong Kong",180],["Singapore",130]]) },
    { id: "r06", name: "Chia Meng Group",                       nameTh: "เจียเม้ง",       cat: "rice",    products: ["Hom Mali", "White rice"],          cv: mk([["China",310],["EU",110]]) },
    { id: "r07", name: "Nakornchaisri Rice Mill",               nameTh: "นครชัยศรี",      cat: "rice",    products: ["White rice"],                      cv: mk([["Philippines",240],["Malaysia",110]]) },
    { id: "r08", name: "Olam (Thailand) Rice",                  nameTh: "โอลัม",          cat: "rice",    products: ["Parboiled", "White rice"],         cv: mk([["Africa",520],["Middle East",230]]) },
    { id: "r09", name: "Patum Rice Mill & Granary",             nameTh: "ปทุมไรซ์",       cat: "rice",    products: ["Hom Mali"],                        cv: mk([["China",260],["USA",90]]) },
    { id: "r10", name: "Buri Rice Co., Ltd.",                   nameTh: "บุรีไรซ์",       cat: "rice",    products: ["White rice"],                      cv: mk([["Africa",180],["Indonesia",110]]) },

    // ─── Sugar (8) ────────────────────────────────────────────────
    { id: "u01", name: "Mitr Phol Sugar Corp.",                 nameTh: "มิตรผล",         cat: "sugar",   products: ["Raw sugar", "White sugar"],        cv: mk([["Indonesia",620],["China",480],["Korea",320],["Japan",260]]) },
    { id: "u02", name: "Thai Roong Ruang Sugar",                nameTh: "ไทยรุ่งเรือง",   cat: "sugar",   products: ["Raw sugar"],                       cv: mk([["Indonesia",410],["Korea",240]]) },
    { id: "u03", name: "Khon Kaen Sugar Industry",              nameTh: "ขอนแก่นซูการ์",  cat: "sugar",   products: ["Raw sugar", "Refined"],            cv: mk([["Indonesia",380],["Vietnam",170]]) },
    { id: "u04", name: "Thai Sugar Trading Corp.",              nameTh: "ไทยชูการ์",      cat: "sugar",   products: ["Raw sugar"],                       cv: mk([["Korea",290],["China",180]]) },
    { id: "u05", name: "Wang Kanai Group",                      nameTh: "วังขนาย",        cat: "sugar",   products: ["White sugar"],                     cv: mk([["China",240],["Philippines",110]]) },
    { id: "u06", name: "KSL Group",                             nameTh: "เคเอสแอล",       cat: "sugar",   products: ["Refined sugar"],                   cv: mk([["Indonesia",210],["Vietnam",90]]) },
    { id: "u07", name: "Buriram Sugar PCL",                     nameTh: "บุรีรัมย์",      cat: "sugar",   products: ["Raw sugar"],                       cv: mk([["Korea",170],["Japan",80]]) },
    { id: "u08", name: "Eastern Sugar & Cane",                  nameTh: "อีสเทิร์น",      cat: "sugar",   products: ["Raw sugar"],                       cv: mk([["Indonesia",260],["Taiwan",110]]) },

    // ─── Multi-category exporters (5) ─────────────────────────────
    { id: "m01", name: "Charoen Pokphand Foods PCL",            nameTh: "ซีพีเอฟ (ภาพรวม)",cat: "multi",  products: ["Chicken", "Shrimp", "Pork", "Pet food"], cv: mk([["Japan",980],["USA",810],["China",640],["UK",420],["EU",380]]) },
    { id: "m02", name: "Betagro Group (Mixed)",                 nameTh: "เบทาโกร",        cat: "multi",   products: ["Chicken", "Pork", "Feed"],         cv: mk([["Japan",520],["Vietnam",240],["Cambodia",190]]) },
    { id: "m03", name: "Thai Union (Pet+Seafood)",              nameTh: "ทียู (รวม)",     cat: "multi",   products: ["Tuna", "Pet food", "Lobster"],     cv: mk([["USA",1240],["EU",680],["Japan",340]]) },
    { id: "m04", name: "Saha Pathana Inter-Holding",            nameTh: "สหพัฒน์",        cat: "multi",   products: ["Noodle", "Snack", "Frozen meal"],  cv: mk([["Cambodia",160],["Myanmar",110],["Laos",70]]) },
    { id: "m05", name: "Thaifoods Group (Mixed)",               nameTh: "ไทยฟู้ดส์ รวม",  cat: "multi",   products: ["Chicken", "Pork", "Feed"],         cv: mk([["Japan",240],["Vietnam",170],["Singapore",90]]) },
  ];

  // -----------------------------------------------------------------
  // Use real data from Excel sync if available, otherwise mock
  // -----------------------------------------------------------------
  const real = window.SalesData && window.SalesData.MARKET;
  if (real && !real.isMock && real.SHIPPERS && real.SHIPPERS.length > 0) {
    window.MarketData = { CATEGORIES, ...real };
    return;
  }

  // -----------------------------------------------------------------
  // Fallback: derive aggregates from mock SHIPPERS
  // -----------------------------------------------------------------
  const withTotals = SHIPPERS.map((s) => ({
    ...s,
    totalTeu: Object.values(s.cv).reduce((a, b) => a + b, 0),
    countries: Object.keys(s.cv),
  }));

  const byCategory = { chicken: 0, seafood: 0, rice: 0, sugar: 0, multi: 0 };
  withTotals.forEach((s) => { byCategory[s.cat] = (byCategory[s.cat] || 0) + 1; });

  const countryAgg = {};
  withTotals.forEach((s) => {
    Object.entries(s.cv).forEach(([country, vol]) => {
      const a = countryAgg[country] || (countryAgg[country] = { country, volume: 0, shippers: 0, productSet: new Set() });
      a.volume += vol;
      a.shippers += 1;
      s.products.forEach((p) => a.productSet.add(p));
    });
  });
  const countries = Object.values(countryAgg)
    .map((c) => ({ ...c, products: [...c.productSet] }))
    .sort((a, b) => b.volume - a.volume);

  const productSet = new Set();
  withTotals.forEach((s) => s.products.forEach((p) => productSet.add(p)));

  window.MarketData = {
    CATEGORIES,
    SHIPPERS:        withTotals,
    BY_CATEGORY:     byCategory,
    TOTAL_SHIPPERS:  withTotals.length,
    COUNTRIES:       countries,
    PRODUCTS:        [...productSet].sort(),
    isMock:          true,
  };
})();
