export type KpiPill = {
  label: string;
  value: string;
  status: "positive" | "warning" | "negative";
};

export type BattleInsight = {
  insight: string;
  action: string;
};

export type BattleKpiConfig = {
  kpis: KpiPill[];
  insights: BattleInsight[];
  deepDiveLabel: string;
  deepDiveLink: string;
};

export const howToWinBattleKpis: Record<number, BattleKpiConfig> = {
  1: {
    kpis: [
      { label: "Brand Power (+ vs. competitors)", value: "11.3", status: "positive" },
      { label: "Meaningful (+ vs. comp.)", value: "+2.4pp", status: "positive" },
      { label: "Different (+ vs. comp.)", value: "-1.2pp", status: "positive" },
    ],
    insights: [
      { insight: "Heineken Brand Power leads at 11.3 but Meaningful growth is slowing — positioning narrative needs refresh to stay ahead of Kaiser.", action: "Review brand positioning strategy in Consumer Insights tool – go to Consumer Insights tool" },
      { insight: "Share of Voice declining in digital channels while competitors increase spend on social platforms.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    deepDiveLabel: "Brand Power Dashboard",
    deepDiveLink: "/brand-power",
  },
  2: {
    kpis: [
      { label: "BGS: Attractive Packaging", value: "74%", status: "positive" },
      { label: "BGS: Unique", value: "68%", status: "positive" },
    ],
    insights: [
      { insight: "Green bottle & star icon recognition strong in SP & Rio, but brand asset usage inconsistent across on-trade partners in interior markets.", action: "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool" },
      { insight: "Visual consistency score at 68% — on-trade activation materials not meeting brand standards in Nordeste.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
    ],
    deepDiveLabel: "Brand Identity Dashboard",
    deepDiveLink: "/brand-identity",
  },
  3: {
    kpis: [
      { label: "BGS: Taste Perception", value: "78%", status: "positive" },
      { label: "BGS: Ease of Drinking", value: "82%", status: "positive" },
      { label: "BGS: Quality", value: "85%", status: "positive" },
    ],
    insights: [
      { insight: "Quality scores stable at 85% but taste preference shifting toward lighter profiles — Silver over-indexing with younger consumers.", action: "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool" },
      { insight: "Occasion Fit at 74% — opportunity to improve premium occasion messaging in boteco and at-home segments.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    deepDiveLabel: "Taste & Quality Dashboard",
    deepDiveLink: "/taste-quality",
  },
  4: {
    kpis: [
      { label: "ATL%", value: "62%", status: "positive" },
      { label: "BTL%", value: "38%", status: "positive" },
      { label: "Adherence to ABTL Golden Rules", value: "76%", status: "positive" },
    ],
    insights: [
      { insight: "ATL/BTL split at 62/38 — digital activation underperforming vs. plan, requiring budget optimization across channels.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
      { insight: "Share of Voice at 28% below Market Share — competitor outspending Heineken during key seasonal peaks (Carnaval, Copa do Brasil).", action: "Pause underperforming Desperados digital activation – go to Media tool" },
    ],
    deepDiveLabel: "Communication Dashboard",
    deepDiveLink: "/communication",
  },
  5: {
    kpis: [
      { label: "Innovation Rate", value: "12.4%", status: "positive" },
      { label: "Innovation Rate of Sales", value: "-3.2%", status: "warning" },
      { label: "BGS: Innovative", value: "61%", status: "warning" },
    ],
    insights: [
      { insight: "Innovation Rate of Sales in off-trade below portfolio target. Innovation Weighted Distribution lagging vs. ABI in key modern trade channels across Sudeste.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool" },
      { insight: "Innovation Volume growing (+18.5%) but Weighted Distribution at only 61% — overexposure risk in low-velocity outlets.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    deepDiveLabel: "Innovation Dashboard",
    deepDiveLink: "/innovation",
  },
  6: {
    kpis: [
      { label: "Price / L (+ vs. competitors)", value: "€2.85", status: "positive" },
      { label: "Share per Price Tier", value: "34%", status: "positive" },
      { label: "Base price (vs. key comp.)", value: "+8pp", status: "positive" },
    ],
    insights: [
      { insight: "Price index at 108 maintains premium positioning but competitor promotions eroding price gap in convenience channel.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool" },
      { insight: "Price Compliance Rate at 78% — independent trade partners not adhering to recommended price points in interior markets.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    deepDiveLabel: "Pricing Dashboard",
    deepDiveLink: "/pricing",
  },
  7: {
    kpis: [
      { label: "Promo Pressure", value: "24%", status: "positive" },
      { label: "Promo Depth", value: "-18%", status: "positive" },
      { label: "Promo Intensity", value: "High", status: "positive" },
      { label: "Share of Promo / Share of market", value: "1.03x", status: "positive" },
    ],
    insights: [
      { insight: "Promo pressure at 24% exceeds target ceiling — deep discounting eroding brand equity in modern trade.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
      { insight: "Promo ROI at €0.85 below threshold — AllocationAI recommends shifting budget from promotions to UCL Sponsorship.", action: "AllocationAI recommends shifting budget from Promotions to UCL Sponsorship to maximize overall ROI. – go to AllocationAI tool" },
    ],
    deepDiveLabel: "Promotions Dashboard",
    deepDiveLink: "/promotions",
  },
  8: {
    kpis: [
      { label: "Sales Power", value: "62.3", status: "positive" },
      { label: "TDP (vs. Comp)", value: "72%", status: "positive" },
      { label: "Rate of Sales", value: "+3.2%", status: "positive" },
      { label: "Customer NPS", value: "68", status: "positive" },
      { label: "WD right SKU per channel", value: "84%", status: "positive" },
    ],
    insights: [
      { insight: "Distribution at 94% is near ceiling — focus shifts to rate-of-sale improvement and SKU gap-fill in Nordeste independents.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Sales Power growing at +1.6pts vs PY but Amstel underperforming in Key Account segment.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    deepDiveLabel: "Availability Dashboard",
    deepDiveLink: "/availability",
  },
  9: {
    kpis: [
      { label: "Picture of Success", value: "72%", status: "positive" },
      { label: "POSM Coverage by channel", value: "64%", status: "positive" },
    ],
    insights: [
      { insight: "Picture of Success compliance at 72% — top quartile accounts overperforming but long tail dragging average down.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "SOS% in off-trade at 18% below target nationally — on-trade branded presence weak in Sul & Centro-Oeste vs. Carlsberg and AB InBev.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    deepDiveLabel: "Visibility Dashboard",
    deepDiveLink: "/visibility",
  },
};

// Executional Excellence battles (state 3) — battles 4-9 have specific execution focus
export const execExcellenceBattleKpis: Record<number, BattleKpiConfig> = {
  1: {
    kpis: [
      { label: "Brand Power (+ vs. comp.)", value: "11.3", status: "positive" },
      { label: "Meaningful (+ vs. comp.)", value: "+2.4pp", status: "positive" },
      { label: "Different (+ vs. comp.)", value: "-1.2pp", status: "negative" },
      { label: "Salient (+ vs. comp.)", value: "+3.1pp", status: "positive" },
      { label: "Spontaneous Awareness", value: "64%", status: "positive" },
      { label: "Brand Preference", value: "38%", status: "positive" },
    ],
    insights: [
      { insight: "Brand positioning execution strong — Salience gains (+3.1pp) driven by UCL sponsorship activation.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
      { insight: "Differentiation score declining (-1.2pp) despite strong awareness — creative refresh needed.", action: "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool" },
    ],
    deepDiveLabel: "Brand Power Dashboard",
    deepDiveLink: "/brand-power",
  },
  2: {
    kpis: [
      { label: "Brand Power (+ vs. comp.)", value: "11.3", status: "positive" },
      { label: "Meaningful (+ vs. comp.)", value: "+2.4pp", status: "positive" },
      { label: "Different (+ vs. comp.)", value: "-1.2pp", status: "negative" },
      { label: "Salient (+ vs. comp.)", value: "+3.1pp", status: "positive" },
      { label: "Brand Asset Usage", value: "71%", status: "warning" },
      { label: "Visual Consistency Score", value: "68%", status: "warning" },
    ],
    insights: [
      { insight: "Identity execution metrics on track — Quality perception holding at 85% across key segments.", action: "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool" },
      { insight: "Brand asset usage at 71% in interior markets — on-trade activation consistency requires improvement.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    deepDiveLabel: "Brand Identity Dashboard",
    deepDiveLink: "/brand-identity",
  },
  3: {
    kpis: [
      { label: "BGS: Taste Perception", value: "78%", status: "positive" },
      { label: "BGS: Ease of Drinking", value: "82%", status: "positive" },
      { label: "BGS: Quality", value: "85%", status: "positive" },
      { label: "Taste Preference vs. comp.", value: "+4.2pp", status: "positive" },
      { label: "Occasion Fit Score", value: "74%", status: "positive" },
      { label: "Liquid Satisfaction", value: "79%", status: "positive" },
    ],
    insights: [
      { insight: "Taste execution scores stable but consumer preference shifting to lighter profiles — portfolio mix may need adjustment.", action: "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool" },
      { insight: "Quality consistency metrics strong — maintain current brewing standards across production sites.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
    ],
    deepDiveLabel: "Taste & Quality Dashboard",
    deepDiveLink: "/taste-quality",
  },
  4: {
    kpis: [
      { label: "ATL%", value: "62%", status: "warning" },
      { label: "BTL%", value: "38%", status: "warning" },
      { label: "Adherence to ABTL Golden Rules", value: "76%", status: "warning" },
    ],
    insights: [
      { insight: "ATL/BTL split tracking at 62/38 vs. 65/35 target — BTL overspend driven by unplanned in-store activations in Sudeste region. Immediate rebalancing required this cycle.", action: "Reallocate excess BTL spend back to planned ATL channels – go to Media dashboard" },
      { insight: "ABTL Golden Rules adherence at 76% — 3 of 12 campaign flights launched without mandatory creative pre-testing. Enforce gate review before next wave.", action: "Enforce creative pre-testing gate for remaining campaign flights – go to Media tool" },
    ],
    deepDiveLabel: "AllocationAI Tool",
    deepDiveLink: "/allocation-ai",
  },
  5: {
    kpis: [
      { label: "Innovation Rate", value: "12.4%", status: "positive" },
      { label: "Innovation Volume", value: "+18.5%", status: "positive" },
      { label: "Innovation Value", value: "€4.2M", status: "positive" },
      { label: "Innovation GP", value: "€1.8M", status: "positive" },
      { label: "Innovation Wtd. Distribution", value: "61%", status: "warning" },
      { label: "Innovation Rate of Sales", value: "-3.2%", status: "warning" },
    ],
    insights: [
      { insight: "Innovation execution delivering volume growth but GP contribution needs monitoring as weighted distribution lags targets.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool" },
      { insight: "Innovation Rate of Sales declining (-3.2%) — overextension in low-velocity outlets pulling down overall innovation performance.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    deepDiveLabel: "Innovation Dashboard",
    deepDiveLink: "/innovation",
  },
  6: {
    kpis: [
      { label: "Price / L (+ vs. comp.)", value: "€2.85", status: "positive" },
      { label: "Price Index", value: "108", status: "positive" },
      { label: "PPA On-Premise", value: "€4.20", status: "positive" },
      { label: "Pack Mix Index", value: "92", status: "warning" },
      { label: "Price Compliance Rate", value: "78%", status: "warning" },
      { label: "RMG Cockpit", value: "On Track", status: "positive" },
    ],
    insights: [
      { insight: "Pack-price execution on track — maintaining premium index at 108 while competitors intensify promotional activity.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool" },
      { insight: "RMG cockpit signals margin pressure from input cost inflation — proactive price adjustment may be needed Q3.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    deepDiveLabel: "Pricing Dashboard",
    deepDiveLink: "/pricing",
  },
  7: {
    kpis: [
      { label: "Promo Pressure", value: "24%", status: "warning" },
      { label: "Promo Depth", value: "-18%", status: "warning" },
      { label: "Promo Intensity", value: "High", status: "warning" },
      { label: "Promo Share", value: "31%", status: "positive" },
      { label: "Share of Promo / SOM", value: "1.03x", status: "positive" },
      { label: "Promo ROI", value: "€0.85", status: "warning" },
    ],
    insights: [
      { insight: "Promo execution over-indexed on depth (-18%) — shift toward value-added promotions to protect brand equity.", action: "AllocationAI recommends shifting budget from Promotions to UCL Sponsorship to maximize overall ROI. – go to AllocationAI tool" },
      { insight: "Promo ROI at €0.85 — per promo euro return declining, optimization and reallocation required.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    deepDiveLabel: "Promotions Dashboard",
    deepDiveLink: "/promotions",
  },
  8: {
    kpis: [
      { label: "Sales Power", value: "62.3", status: "positive" },
      { label: "Rate of Sales", value: "+3.2%", status: "positive" },
      { label: "Distribution", value: "94%", status: "positive" },
      { label: "Levers", value: "TBD", status: "warning" },
      { label: "Customer NPS", value: "68", status: "positive" },
      { label: "Sales Rep Productivity", value: "+5.1%", status: "positive" },
    ],
    insights: [
      { insight: "Availability execution near ceiling at 94% — incremental gains require targeted gap-fill in convenience and on-trade.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Rate of sales improving (+3.2%) but unevenly distributed — bottom quintile outlets need targeted intervention.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    deepDiveLabel: "Availability Dashboard",
    deepDiveLink: "/availability",
  },
  9: {
    kpis: [
      { label: "Picture of Success", value: "72%", status: "positive" },
      { label: "SOS% Off-Trade", value: "18%", status: "warning" },
      { label: "Brand Visibility Score", value: "64%", status: "warning" },
      { label: "Shelf Compliance", value: "76%", status: "positive" },
      { label: "POS Execution Rate", value: "69%", status: "warning" },
      { label: "Customer Engagement", value: "TBD", status: "warning" },
    ],
    insights: [
      { insight: "Visibility execution at 72% PoS compliance — top accounts strong but consistency lacking in independent trade.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "SOS% in off-trade at 18% below target — on-trade branded presence requires reinforcement in Sul & Centro-Oeste.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    deepDiveLabel: "Visibility Dashboard",
    deepDiveLink: "/visibility",
  },
};
