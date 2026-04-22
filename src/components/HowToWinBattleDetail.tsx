import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, ChevronRight, ChevronDown, BookOpen, ExternalLink, Play, Zap, AlertTriangle } from "lucide-react";
import { howToWinBattleKpis, type BattleInsight } from "@/data/battleKpiData";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterKpi = { label: string; value: string; vs: string; status?: "positive" | "warning" | "negative" };
type FilterInsight = { insight: string; action: string; kpiIndices?: number[] };
type StepDetail = { step: string; explanation: string; dataLink: string; dataLabel: string };

// ─── Shared filter options ─────────────────────────────────────────────────────

const BRANDS = ["All Brands", "Heineken", "Amstel", "Schin"];
const CHANNELS = ["All Channels", "Off Trade", "On Trade", "E-Commerce"];

// ─── Per-filter KPI data ───────────────────────────────────────────────────────

const B3_BRAND_KPIS: Record<string, FilterKpi[]> = {
  "All Brands": [
    { label: "BGS: Taste Perception", value: "78%", vs: "+3pp vs. comp." },
    { label: "BGS: Ease of Drinking", value: "82%", vs: "+5pp vs. comp." },
    { label: "BGS: Quality", value: "85%", vs: "Category leader" },
  ],
  "Heineken": [
    { label: "BGS: Taste Perception", value: "83%", vs: "+6pp vs. avg." },
    { label: "BGS: Ease of Drinking", value: "87%", vs: "Premium benchmark" },
    { label: "BGS: Quality", value: "91%", vs: "Top quartile" },
  ],
  "Amstel": [
    { label: "BGS: Taste Perception", value: "74%", vs: "-1pp vs. PY" },
    { label: "BGS: Ease of Drinking", value: "79%", vs: "In line with avg." },
    { label: "BGS: Quality", value: "81%", vs: "+2pp vs. Schin" },
  ],
  "Schin": [
    { label: "BGS: Taste Perception", value: "69%", vs: "-2pp vs. PY" },
    { label: "BGS: Ease of Drinking", value: "74%", vs: "Below avg." },
    { label: "BGS: Quality", value: "72%", vs: "Value segment" },
  ],
};

const B3_BRAND_INSIGHTS: Record<string, FilterInsight[]> = {
  "All Brands": [
    { insight: "Quality scores stable at 85% but taste preference shifting toward lighter profiles — Silver over-indexing with younger consumers.", action: "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool" },
    { insight: "Occasion Fit at 74% — opportunity to improve premium occasion messaging in boteco and at-home segments.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
  ],
  "Heineken": [
    { insight: "Heineken Original's BGS Quality at 91% — leverage in premium on-trade storytelling and sommelier-style activations.", action: "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool" },
    { insight: "Taste preference among 25–34 cohort shifting toward lighter lager — position Silver as entry into main brand franchise.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
  ],
  "Amstel": [
    { insight: "Amstel taste scores declining (-1pp) vs. PY. Risk of losing mainstream drinkers to Brahma in C-stores.", action: "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool" },
    { insight: "Occasion fit strongest in family occasion — reinforce 'refreshing everyday' messaging at POS in supermarkets.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
  ],
  "Desperados": [
    { insight: "Desperados unique flavour profile drives trial but repeat purchase lower than Heineken — improve post-trial messaging.", action: "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool" },
    { insight: "Summer 2024 activation drove +8pp taste trial. Replicate mechanic in boteco on-trade for Carnaval period.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
  ],
  "Heineken 0.0": [
    { insight: "Heineken 0.0 taste perception up +8pp — address residual 'compromise' perception with taste-forward sampling activations.", action: "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool" },
    { insight: "Ease of drinking cue is the #1 driver of 0.0 purchase — amplify in digital and gym/wellness channel partnership.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
  ],
};

const B4_CHANNEL_KPIS: Record<string, FilterKpi[]> = {
  "All Channels": [
    { label: "ATL%", value: "62%", vs: "On plan" },
    { label: "BTL%", value: "38%", vs: "On plan" },
    { label: "Adherence to ABTL Golden Rules", value: "76%", vs: "+3pp vs. PY" },
  ],
  "Off Trade": [
    { label: "ATL%", value: "57%", vs: "Digital-heavy" },
    { label: "BTL%", value: "43%", vs: "Promo-led" },
    { label: "Adherence to ABTL Golden Rules", value: "70%", vs: "Needs improvement" },
  ],
  "On Trade": [
    { label: "ATL%", value: "68%", vs: "UCL-driven" },
    { label: "BTL%", value: "32%", vs: "Activation-light" },
    { label: "Adherence to ABTL Golden Rules", value: "81%", vs: "Best in class" },
  ],
  "E-Commerce": [
    { label: "ATL%", value: "80%", vs: "Digital native" },
    { label: "BTL%", value: "20%", vs: "Minimal BTL" },
    { label: "Adherence to ABTL Golden Rules", value: "91%", vs: "Highest compliance" },
  ],
};

const B4_CHANNEL_INSIGHTS: Record<string, FilterInsight[]> = {
  "All Channels": [
    { insight: "Digital activation spend is €420K behind plan this week — immediately reallocate budget from underperforming display formats to high-CTR video placements to recover in-flight.", action: "Adjust media spend to counter competitor momentum – go to Media dashboard" },
    { insight: "Share of Voice dropped -3pp vs. Brahma in the last 7 days — activate pre-approved contingency creatives across social channels before the weekend to close the gap.", action: "Pause underperforming Desperados digital activation – go to Media tool" },
  ],
  "Mod. Off-Trade": [
    { insight: "3 of the top 10 supermarket accounts have ABTL Golden Rules compliance below 70% this cycle — dispatch field reps this week to realign in-store materials with the current ATL campaign.", action: "Adjust media spend to counter competitor momentum – go to Media dashboard" },
    { insight: "BTL promo in Mod. Off-Trade is overspending by 8% this period — pause the secondary display activation in Carrefour immediately and redirect spend to compliant retailers.", action: "Pause underperforming Desperados digital activation – go to Media tool" },
  ],
  "Mod. On-Trade": [
    { insight: "UCL activation compliance at 84% — the 16% gap is concentrated in 5 venues; coordinate with the account team to resolve point-of-sale execution failures by end of week.", action: "Adjust media spend to counter competitor momentum – go to Media dashboard" },
    { insight: "BTL experiential budget (29%) is unspent in 12 Mod. On-Trade venues — approve activation kits for immediate deployment ahead of this weekend's match fixtures.", action: "Pause underperforming Desperados digital activation – go to Media tool" },
  ],
  "Trad. Off-Trade": [
    { insight: "ABTL compliance at 68% in Trad. Off-Trade — immediately contact the 3 key distributors with the updated campaign brief and compliance checklist to course-correct this cycle.", action: "Adjust media spend to counter competitor momentum – go to Media dashboard" },
    { insight: "Distributor-led BTL promotions are running at unauthorized price points in 7 Trad. Off-Trade accounts — escalate to trade marketing for correction before end of this week.", action: "Pause underperforming Desperados digital activation – go to Media tool" },
  ],
  "Trad. On-Trade": [
    { insight: "Activation materials for botecos have not been delivered to 18 outlets — expedite logistics with the 3PL provider today to ensure on-time installation before the campaign peak.", action: "Adjust media spend to counter competitor momentum – go to Media dashboard" },
    { insight: "SOV is -6pp vs. Brahma in Trad. On-Trade this week — approve additional POS display units for the top 20 boteco corridors to boost visibility immediately.", action: "Pause underperforming Desperados digital activation – go to Media tool" },
  ],
  "E-retail": [
    { insight: "E-retail search ranking for 'cerveja' dropped to position 4 this week — activate a keyword bid increase of 20% today to recover top-3 placement before the weekend traffic spike.", action: "Adjust media spend to counter competitor momentum – go to Media dashboard" },
    { insight: "Bundled e-commerce promotion has not been activated on iFood — confirm listing with the account manager and push live by end of day to capture Thursday–Sunday demand.", action: "Pause underperforming Desperados digital activation – go to Media tool" },
  ],
};

const B5_KPIS: Record<string, Record<string, FilterKpi[]>> = {
  "All Brands": {
    "All Channels": [
      { label: "Innovation Rate", value: "12.4%", vs: "+1.2pp vs. PY" },
      { label: "Innovation Rate of Sales", value: "-3.2%", vs: "Below target", status: "warning" },
      { label: "BGS: Innovative", value: "61%", vs: "+4pp vs. comp.", status: "warning" },
    ],
    "Off Trade": [
      { label: "Innovation Rate", value: "13.2%", vs: "Shelf-driven" },
      { label: "Innovation Rate of Sales", value: "-4.8%", vs: "Drag on portfolio", status: "warning" },
      { label: "BGS: Innovative", value: "60%", vs: "Moderate perception", status: "warning" },
    ],
    "On Trade": [
      { label: "Innovation Rate", value: "10.2%", vs: "Premium trial" },
      { label: "Innovation Rate of Sales", value: "+1.1%", vs: "Positive momentum" },
      { label: "BGS: Innovative", value: "68%", vs: "Best-in-channel" },
    ],
    "E-Commerce": [
      { label: "Innovation Rate", value: "18.6%", vs: "Fastest growing" },
      { label: "Innovation Rate of Sales", value: "+3.4%", vs: "Above target" },
      { label: "BGS: Innovative", value: "74%", vs: "Digital-first impact" },
    ],
  },
  "Heineken": {
    "All Channels": [
      { label: "Innovation Rate", value: "9.4%", vs: "Core driver" },
      { label: "Innovation Rate of Sales", value: "-2.8%", vs: "Cannibalising Original" },
      { label: "BGS: Innovative", value: "64%", vs: "Strong perception" },
    ],
    "Off Trade": [
      { label: "Innovation Rate", value: "11.2%", vs: "Supermarket led" },
      { label: "Innovation Rate of Sales", value: "-5.1%", vs: "High cannibalisation" },
      { label: "BGS: Innovative", value: "62%", vs: "Shelf cut-through" },
    ],
    "On Trade": [
      { label: "Innovation Rate", value: "7.8%", vs: "Limited listing" },
      { label: "Innovation Rate of Sales", value: "+1.6%", vs: "Trial converting" },
      { label: "BGS: Innovative", value: "72%", vs: "Premium perception" },
    ],
    "E-Commerce": [
      { label: "Innovation Rate", value: "16.4%", vs: "Digital over-index" },
      { label: "Innovation Rate of Sales", value: "+4.2%", vs: "D2C momentum" },
      { label: "BGS: Innovative", value: "78%", vs: "Content-rich listings" },
    ],
  },
  "Amstel": {
    "All Channels": [
      { label: "Innovation Rate", value: "6.1%", vs: "-0.8pp vs. PY" },
      { label: "Innovation Rate of Sales", value: "-4.9%", vs: "Below target" },
      { label: "BGS: Innovative", value: "52%", vs: "Low perception" },
    ],
    "Off Trade": [
      { label: "Innovation Rate", value: "7.4%", vs: "Promo-reliant" },
      { label: "Innovation Rate of Sales", value: "-6.2%", vs: "Weak velocity" },
      { label: "BGS: Innovative", value: "49%", vs: "Awareness gap" },
    ],
    "On Trade": [
      { label: "Innovation Rate", value: "4.8%", vs: "Low listing" },
      { label: "Innovation Rate of Sales", value: "-1.4%", vs: "Slightly declining" },
      { label: "BGS: Innovative", value: "58%", vs: "Moderate" },
    ],
    "E-Commerce": [
      { label: "Innovation Rate", value: "9.6%", vs: "Digital growth" },
      { label: "Innovation Rate of Sales", value: "+1.8%", vs: "Improving" },
      { label: "BGS: Innovative", value: "64%", vs: "Best channel for brand" },
    ],
  },
  "Schin": {
    "All Channels": [
      { label: "Innovation Rate", value: "3.2%", vs: "Minimal innovation" },
      { label: "Innovation Rate of Sales", value: "-7.1%", vs: "Very low velocity" },
      { label: "BGS: Innovative", value: "38%", vs: "Value brand" },
    ],
    "Off Trade": [
      { label: "Innovation Rate", value: "4.1%", vs: "C-store led" },
      { label: "Innovation Rate of Sales", value: "-8.4%", vs: "Price-sensitive drag" },
      { label: "BGS: Innovative", value: "36%", vs: "Low awareness" },
    ],
    "On Trade": [
      { label: "Innovation Rate", value: "2.2%", vs: "Near absent" },
      { label: "Innovation Rate of Sales", value: "-5.2%", vs: "Limited range" },
      { label: "BGS: Innovative", value: "42%", vs: "Boteco perception" },
    ],
    "E-Commerce": [
      { label: "Innovation Rate", value: "5.8%", vs: "Growing from low base" },
      { label: "Innovation Rate of Sales", value: "-2.1%", vs: "Slowly improving" },
      { label: "BGS: Innovative", value: "48%", vs: "Digital presence" },
    ],
  },
};

const B5_BRANDS = ["All Brands", "Heineken", "Amstel", "Schin"];

const B5_INSIGHTS: Record<string, FilterInsight[]> = {
  "All Brands": [
    { insight: "Portfolio innovation pipeline is structurally skewed toward incremental line extensions — long-term growth requires a dedicated disruptive innovation platform (e.g., RTD, alcohol-free) to capture emerging consumer segments over the next 3–5 years.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool", kpiIndices: [0, 1] },
    { insight: "BGS: Innovative at 61% signals a widening gap between pipeline investment and consumer perception — the brand must build a culture of visible, category-leading innovation to sustain long-term equity and defend against challenger brands.", action: "Bundle offers to balance sales – go to Promotions dashboard", kpiIndices: [2] },
  ],
  "Heineken": [
    { insight: "Heineken Silver risks permanently eroding Original's core equity if portfolio architecture is not clearly defined — a long-term tiered innovation strategy is needed to future-proof the masterbrand while enabling scalable sub-brand growth.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool", kpiIndices: [1] },
    { insight: "Heineken 0.0's rising trial base represents a structural opportunity to lead the alcohol-free category in Brazil over the next decade — sustained innovation investment in this segment will define long-term category share.", action: "Bundle offers to balance sales – go to Promotions dashboard", kpiIndices: [2] },
  ],
  "Amstel": [
    { insight: "Amstel's declining Innovation Rate reflects an absence of a long-term brand innovation roadmap — the brand needs a 3-year pipeline anchored to a distinct occasion strategy to prevent continued equity erosion in the mid-premium tier.", action: "Bundle offers to balance sales – go to Promotions dashboard", kpiIndices: [0] },
    { insight: "BGS: Innovative at 52% reflects consumer perception that Amstel is standing still — a bold, multi-year innovation narrative (new variant + format + occasion) is required to reposition the brand as dynamically relevant.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool", kpiIndices: [1, 2] },
  ],
  "Schin": [
    { insight: "Schin's low Innovation Rate (3.2%) is strategically acceptable for a value brand, but long-term relevance requires a scalable format innovation (e.g., returnable pack, occasion bundle) that grows the base without diluting value equity.", action: "Bundle offers to balance sales – go to Promotions dashboard", kpiIndices: [0, 1] },
    { insight: "BGS: Innovative at 38% is a long-term risk if value-tier competitors innovate in pack or flavour — Schin needs a 5-year format roadmap to defend its segment anchor position as consumer preferences evolve.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool", kpiIndices: [2] },
  ],
};


const B6_BRAND_KPIS: Record<string, FilterKpi[]> = {
  "All Brands": [
    { label: "Price / L (+ vs. competitors)", value: "€2.85", vs: "+8pp premium" },
    { label: "Share per Price Tier", value: "34%", vs: "+1pp vs. PY" },
    { label: "Base price (vs. key comp.)", value: "+8pp", vs: "Maintained" },
  ],
  "Heineken": [
    { label: "Price / L", value: "€3.20", vs: "Super-premium tier" },
    { label: "Share per Price Tier", value: "41%", vs: "Premium segment leader" },
    { label: "Price Index vs. Brahma", value: "+22pp", vs: "UCL premium justified" },
  ],
  "Amstel": [
    { label: "Price / L", value: "€2.40", vs: "Mid-premium" },
    { label: "Share per Price Tier", value: "28%", vs: "-2pp vs. PY" },
    { label: "Price Index vs. Schin", value: "+11pp", vs: "Under pressure" },
  ],
  "Schin": [
    { label: "Price / L", value: "€1.65", vs: "Value segment" },
    { label: "Share per Price Tier", value: "19%", vs: "+1pp vs. PY" },
    { label: "Price Index vs. Heineken", value: "-48pp", vs: "Deep value" },
  ],
};

const B6_BRAND_INSIGHTS: Record<string, FilterInsight[]> = {
  "All Brands": [
    { insight: "Price index at 108 maintains premium positioning but competitor promotions eroding price gap in convenience channel.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool" },
    { insight: "Price Compliance Rate at 78% — independent trade partners not adhering to recommended price points in interior markets.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
  ],
  "Heineken": [
    { insight: "Heineken maintains +22pp price premium vs. Brahma — UCL sponsorship continues to justify super-premium positioning in modern trade.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool" },
    { insight: "Price compliance strongest at Key Accounts (91%) but weakest in independents (63%) — targeted pricing enforcement programme needed in Nordeste.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
  ],
  "Amstel": [
    { insight: "Amstel price share declining (-2pp) in mid-premium — Brahma increasing promotional depth is narrowing price gap in convenience channel.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool" },
    { insight: "Amstel 600ml pricing above Brahma equivalent in C-stores — risk of switching. Review PPA recommendation for this format and channel.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
  ],
  "Desperados": [
    { insight: "Desperados price premium vs. RTD competitors is narrow (+4pp) — strong flavour differentiation justifies higher price point. Increase RRP by €0.20.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool" },
    { insight: "Desperados promo frequency too high — deep discounts training consumers to wait for promotion price, diluting brand value.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
  ],
  "Heineken 0.0": [
    { insight: "0.0 priced at parity with Heineken Original — opportunity to introduce a premium low/no tier at +10pp to capture growing wellness consumer segment.", action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool" },
    { insight: "Single-serve 330ml 0.0 below €3.00 in most retailers — introduce premium 4x330ml gift pack at €11.99 for health-gifting occasion.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
  ],
};

const B7_KPIS: Record<string, Record<string, FilterKpi[]>> = {
  "All Brands": {
    "All Channels": [
      { label: "Promo Pressure", value: "24%", vs: "+4pp vs. target" },
      { label: "Promo Depth", value: "-18%", vs: "Exceeds -15% ceiling" },
      { label: "Promo Intensity", value: "High", vs: "Above benchmark" },
      { label: "Share of Promo / SOM", value: "1.03x", vs: "On target" },
    ],
    "Off Trade": [
      { label: "Promo Pressure", value: "29%", vs: "Highest channel" },
      { label: "Promo Depth", value: "-21%", vs: "Deep discounting" },
      { label: "Promo Intensity", value: "Very High", vs: "Risk level" },
      { label: "Share of Promo / SOM", value: "1.10x", vs: "Over-indexed" },
    ],
    "On Trade": [
      { label: "Promo Pressure", value: "16%", vs: "Low & controlled" },
      { label: "Promo Depth", value: "-10%", vs: "Within ceiling" },
      { label: "Promo Intensity", value: "Low", vs: "Premium protected" },
      { label: "Share of Promo / SOM", value: "0.88x", vs: "Under-activated" },
    ],
    "E-Commerce": [
      { label: "Promo Pressure", value: "38%", vs: "Digital promo culture" },
      { label: "Promo Depth", value: "-28%", vs: "Highest depth" },
      { label: "Promo Intensity", value: "Very High", vs: "Price war risk" },
      { label: "Share of Promo / SOM", value: "1.24x", vs: "Over-activated" },
    ],
  },
  "Heineken": {
    "All Channels": [
      { label: "Promo Pressure", value: "18%", vs: "Controlled" },
      { label: "Promo Depth", value: "-12%", vs: "Within guidelines" },
      { label: "Promo Intensity", value: "Medium", vs: "Brand-appropriate" },
      { label: "Share of Promo / SOM", value: "0.88x", vs: "Under-promoted" },
    ],
    "Off Trade": [
      { label: "Promo Pressure", value: "21%", vs: "Moderate" },
      { label: "Promo Depth", value: "-15%", vs: "At ceiling" },
      { label: "Promo Intensity", value: "Medium", vs: "Monitor closely" },
      { label: "Share of Promo / SOM", value: "0.94x", vs: "Near target" },
    ],
    "On Trade": [
      { label: "Promo Pressure", value: "10%", vs: "Minimal — protected" },
      { label: "Promo Depth", value: "-6%", vs: "Negligible" },
      { label: "Promo Intensity", value: "Low", vs: "Premium maintained" },
      { label: "Share of Promo / SOM", value: "0.75x", vs: "Under-activated" },
    ],
    "E-Commerce": [
      { label: "Promo Pressure", value: "32%", vs: "High digital" },
      { label: "Promo Depth", value: "-21%", vs: "Eroding premium" },
      { label: "Promo Intensity", value: "High", vs: "Intervention needed" },
      { label: "Share of Promo / SOM", value: "1.14x", vs: "Over-indexed" },
    ],
  },
  "Amstel": {
    "All Channels": [
      { label: "Promo Pressure", value: "28%", vs: "Above target" },
      { label: "Promo Depth", value: "-19%", vs: "Above ceiling" },
      { label: "Promo Intensity", value: "High", vs: "Eroding mid-premium" },
      { label: "Share of Promo / SOM", value: "1.18x", vs: "Over-indexed" },
    ],
    "Off Trade": [
      { label: "Promo Pressure", value: "34%", vs: "Very high" },
      { label: "Promo Depth", value: "-24%", vs: "Deep price erosion" },
      { label: "Promo Intensity", value: "Very High", vs: "Brand risk" },
      { label: "Share of Promo / SOM", value: "1.31x", vs: "Unsustainable" },
    ],
    "On Trade": [
      { label: "Promo Pressure", value: "18%", vs: "Moderate" },
      { label: "Promo Depth", value: "-11%", vs: "Acceptable" },
      { label: "Promo Intensity", value: "Medium", vs: "Controlled" },
      { label: "Share of Promo / SOM", value: "0.96x", vs: "Near parity" },
    ],
    "E-Commerce": [
      { label: "Promo Pressure", value: "42%", vs: "Highest for Amstel" },
      { label: "Promo Depth", value: "-31%", vs: "Training to buy on deal" },
      { label: "Promo Intensity", value: "Critical", vs: "Structural issue" },
      { label: "Share of Promo / SOM", value: "1.58x", vs: "Out of control" },
    ],
  },
  "Schin": {
    "All Channels": [
      { label: "Promo Pressure", value: "36%", vs: "Value-driven" },
      { label: "Promo Depth", value: "-26%", vs: "Category norm" },
      { label: "Promo Intensity", value: "Very High", vs: "Value brand" },
      { label: "Share of Promo / SOM", value: "1.42x", vs: "Over-indexed" },
    ],
    "Off Trade": [
      { label: "Promo Pressure", value: "41%", vs: "C-store led" },
      { label: "Promo Depth", value: "-30%", vs: "Price war" },
      { label: "Promo Intensity", value: "Critical", vs: "Race to bottom" },
      { label: "Share of Promo / SOM", value: "1.62x", vs: "Unsustainable" },
    ],
    "On Trade": [
      { label: "Promo Pressure", value: "22%", vs: "Moderate" },
      { label: "Promo Depth", value: "-14%", vs: "Acceptable" },
      { label: "Promo Intensity", value: "Medium", vs: "Boteco norm" },
      { label: "Share of Promo / SOM", value: "1.08x", vs: "Slight over-index" },
    ],
    "E-Commerce": [
      { label: "Promo Pressure", value: "48%", vs: "Permanent deal" },
      { label: "Promo Depth", value: "-36%", vs: "Deep discount" },
      { label: "Promo Intensity", value: "Critical", vs: "Review needed" },
      { label: "Share of Promo / SOM", value: "1.84x", vs: "Out of control" },
    ],
  },
};

const B7_BRANDS = ["All Brands", "Heineken", "Amstel", "Schin"];

const B8_KPIS: Record<string, Record<string, FilterKpi[]>> = {
  "All Brands": {
    "All Channels": [
      { label: "Sales Power", value: "62.3", vs: "+1.6pts vs. PY" },
      { label: "TDP (vs. Comp)", value: "72%", vs: "+3pp vs. PY" },
      { label: "Rate of Sales", value: "+3.2%", vs: "Positive trend" },
      { label: "Customer NPS", value: "68", vs: "+4 vs. PY" },
      { label: "WD right SKU per channel", value: "84%", vs: "+5pp vs. plan" },
    ],
    "Off Trade": [
      { label: "Sales Power", value: "63.4", vs: "Shelf-led" },
      { label: "TDP (vs. Comp)", value: "74%", vs: "Strong vs. ABI" },
      { label: "Rate of Sales", value: "+3.8%", vs: "Above avg." },
      { label: "Customer NPS", value: "67", vs: "Solid" },
      { label: "WD right SKU per channel", value: "83%", vs: "Near compliance" },
    ],
    "On Trade": [
      { label: "Sales Power", value: "60.1", vs: "Premium venues" },
      { label: "TDP (vs. Comp)", value: "69%", vs: "Below target" },
      { label: "Rate of Sales", value: "+2.5%", vs: "Improving" },
      { label: "Customer NPS", value: "69", vs: "Draught quality key" },
      { label: "WD right SKU per channel", value: "80%", vs: "SKU gaps remain" },
    ],
    "E-Commerce": [
      { label: "Sales Power", value: "71.8", vs: "Digital leader" },
      { label: "TDP (vs. Comp)", value: "88%", vs: "Best coverage" },
      { label: "Rate of Sales", value: "+9.4%", vs: "Fastest growing" },
      { label: "Customer NPS", value: "76", vs: "DTC satisfaction" },
      { label: "WD right SKU per channel", value: "96%", vs: "Full range available" },
    ],
  },
  "Heineken": {
    "All Channels": [
      { label: "Sales Power", value: "71.4", vs: "Portfolio leader" },
      { label: "TDP (vs. Comp)", value: "86%", vs: "+8pp vs. Brahma" },
      { label: "Rate of Sales", value: "+4.8%", vs: "Strong momentum" },
      { label: "Customer NPS", value: "76", vs: "Highest in portfolio" },
      { label: "WD right SKU per channel", value: "93%", vs: "Excellent SKU fit" },
    ],
    "Off Trade": [
      { label: "Sales Power", value: "74.2", vs: "Above avg." },
      { label: "TDP (vs. Comp)", value: "88%", vs: "Near full coverage" },
      { label: "Rate of Sales", value: "+5.1%", vs: "UCL-driven" },
      { label: "Customer NPS", value: "78", vs: "Key Account leader" },
      { label: "WD right SKU per channel", value: "95%", vs: "Full range" },
    ],
    "On Trade": [
      { label: "Sales Power", value: "68.4", vs: "Premium anchored" },
      { label: "TDP (vs. Comp)", value: "75%", vs: "Strong" },
      { label: "Rate of Sales", value: "+3.6%", vs: "Growing" },
      { label: "Customer NPS", value: "76", vs: "Venue satisfaction" },
      { label: "WD right SKU per channel", value: "87%", vs: "Draught + can" },
    ],
    "E-Commerce": [
      { label: "Sales Power", value: "81.3", vs: "Digital flagship" },
      { label: "TDP (vs. Comp)", value: "96%", vs: "Full listing" },
      { label: "Rate of Sales", value: "+11.2%", vs: "Best RoS" },
      { label: "Customer NPS", value: "84", vs: "Premium DTC" },
      { label: "WD right SKU per channel", value: "99%", vs: "Full range online" },
    ],
  },
  "Amstel": {
    "All Channels": [
      { label: "Sales Power", value: "48.2", vs: "-2.1pts vs. PY" },
      { label: "TDP (vs. Comp)", value: "61%", vs: "-3pp vs. Brahma" },
      { label: "Rate of Sales", value: "-1.4%", vs: "Declining" },
      { label: "Customer NPS", value: "54", vs: "Below portfolio avg." },
      { label: "WD right SKU per channel", value: "72%", vs: "SKU rationalisation needed" },
    ],
    "Off Trade": [
      { label: "Sales Power", value: "50.1", vs: "Moderate" },
      { label: "TDP (vs. Comp)", value: "65%", vs: "Within range" },
      { label: "Rate of Sales", value: "-1.2%", vs: "Declining" },
      { label: "Customer NPS", value: "55", vs: "Below avg." },
      { label: "WD right SKU per channel", value: "73%", vs: "Coverage gap" },
    ],
    "On Trade": [
      { label: "Sales Power", value: "49.3", vs: "Limited presence" },
      { label: "TDP (vs. Comp)", value: "58%", vs: "-8pp vs. Brahma" },
      { label: "Rate of Sales", value: "-0.4%", vs: "Marginal decline" },
      { label: "Customer NPS", value: "54", vs: "Weak on-trade perception" },
      { label: "WD right SKU per channel", value: "76%", vs: "Missing key SKUs" },
    ],
    "E-Commerce": [
      { label: "Sales Power", value: "61.4", vs: "Best channel" },
      { label: "TDP (vs. Comp)", value: "80%", vs: "Good coverage" },
      { label: "Rate of Sales", value: "+3.8%", vs: "Digital growth" },
      { label: "Customer NPS", value: "66", vs: "Improving" },
      { label: "WD right SKU per channel", value: "88%", vs: "Near full range" },
    ],
  },
  "Schin": {
    "All Channels": [
      { label: "Sales Power", value: "38.4", vs: "Value segment" },
      { label: "TDP (vs. Comp)", value: "52%", vs: "Below ABI" },
      { label: "Rate of Sales", value: "-2.8%", vs: "Declining" },
      { label: "Customer NPS", value: "44", vs: "Low satisfaction" },
      { label: "WD right SKU per channel", value: "61%", vs: "Major coverage gaps" },
    ],
    "Off Trade": [
      { label: "Sales Power", value: "41.2", vs: "C-store driven" },
      { label: "TDP (vs. Comp)", value: "58%", vs: "Moderate" },
      { label: "Rate of Sales", value: "-2.1%", vs: "Declining" },
      { label: "Customer NPS", value: "46", vs: "Low" },
      { label: "WD right SKU per channel", value: "66%", vs: "SKU gaps" },
    ],
    "On Trade": [
      { label: "Sales Power", value: "34.8", vs: "Boteco only" },
      { label: "TDP (vs. Comp)", value: "42%", vs: "Very limited" },
      { label: "Rate of Sales", value: "-3.8%", vs: "Sharp decline" },
      { label: "Customer NPS", value: "40", vs: "Very low" },
      { label: "WD right SKU per channel", value: "52%", vs: "Poor SKU range" },
    ],
    "E-Commerce": [
      { label: "Sales Power", value: "44.1", vs: "Improving" },
      { label: "TDP (vs. Comp)", value: "68%", vs: "Digital push" },
      { label: "Rate of Sales", value: "+1.2%", vs: "Slight positive" },
      { label: "Customer NPS", value: "52", vs: "Better than avg." },
      { label: "WD right SKU per channel", value: "74%", vs: "Near full value range" },
    ],
  },
};

const B8_INSIGHTS: Record<string, Record<string, FilterInsight[]>> = {
  "All Brands": {
    "All Channels": [
      { insight: "Distribution at 94% is near ceiling — focus shifts to rate-of-sale improvement and SKU gap-fill in Nordeste independents.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Sales Power growing at +1.6pts vs PY but Amstel underperforming in Key Account segment.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "Mod. Off-Trade": [
      { insight: "Mod. Off-Trade Sales Power at 68.4 — strongest channel. Protect through ongoing Key Account joint business plan delivery and Q3 display investment.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "WD compliance at 91% in Mod. Off-Trade — close remaining 9% gap by targeting remaining Assaí/Atacadão cash-and-carry accounts in Norte.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "Mod. On-Trade": [
      { insight: "TDP below target in Mod. On-Trade (68%) — premium restaurant SKU listing programme needed for 0.0 and Silver in SP & RJ.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "WD SKU gaps (79%) in Mod. On-Trade — Desperados and Heineken 0.0 missing from most wine-list-style menus. Develop on-trade listing kit for sommelier accounts.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "Trad. Off-Trade": [
      { insight: "Trad. Off-Trade remains the biggest availability gap — Sales Power 54.1 vs. 68.4 in Mod. Off-Trade. Deploy additional sales reps in Nordeste and Centro-Oeste.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "OOS rate at 8.2% in Trad. Off-Trade C-stores — implement automated replenishment trigger via POS data integration with distributor WMS.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "Trad. On-Trade": [
      { insight: "Boteco Sales Power improving (+2.1% RoS) — draught activation driving incremental volume. Increase branded cooler deployment in Sul & Sudeste.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "NPS 66 in Trad. On-Trade — draught quality consistency the key driver. Implement quarterly line-clean audit programme across top 1,000 boteco accounts.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "E-retail": [
      { insight: "E-retail Sales Power at 71.8 — fastest-growing channel (+9.4% RoS). Prioritise full portfolio availability and premium placement on iFood, Rappi, and Mercado Livre.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "E-retail WD at 96% but basket attachment (rate per order) has room to grow — implement bundle recommendation engine with platform partners.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
  },
  "Heineken": {
    "All Channels": [
      { insight: "Heineken Sales Power leading at 71.4 — leverage strong NPS (76) for upselling to premium packs and limited editions in high-velocity accounts.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "350ml OOS still 8.2% in Nordeste independents despite overall high WD — last-mile replenishment is the critical issue. Deploy Sales Ops rapid response team.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "Trad. Off-Trade": [
      { insight: "Heineken 350ml SKU gap in Nordeste Trad. Off-Trade (WD 84%) — missing 16% of outlets represents ~€2.1M annual volume opportunity.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Distributor route coverage in interior markets leaves Mon/Tue delivery gaps causing OOS events — negotiate additional weekly call frequency for top 500 accounts.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "Mod. Off-Trade": [
      { insight: "Heineken Mod. Off-Trade near full coverage (94% TDP) — shift focus to in-store execution quality: premium fixture placement, chiller compliance, and secondary display.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "NPS 82 in Mod. Off-Trade — use Key Account satisfaction advantage to negotiate incremental shelf space and feature in seasonal promotional programmes.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "Mod. On-Trade": [
      { insight: "Heineken on-trade TDP at 78% — target missing premium restaurants in SP Jardins, RJ Ipanema/Leblon corridors for listing expansion this quarter.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "RoS +3.9% in Mod. On-Trade — draught Heineken driving incremental vs. packaged. Expand draught installation programme to additional 150 premium bars.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "Trad. On-Trade": [
      { insight: "Heineken draught growing in boteco (+3.2% RoS) — equipment maintenance and freshness are key to holding NPS. Review line-clean compliance programme.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "WD 86% in Trad. On-Trade — gap is in smaller botecos under R$50k annual revenue. Assess whether micro-distribution via motorbike delivery can close the gap.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "E-retail": [
      { insight: "Heineken E-retail Sales Power 81.3 — #1 in portfolio. Use dominant position to negotiate homepage feature placement on iFood marketplace during UCL fixtures.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "RoS +11.2% in E-retail is twice the portfolio average — create Heineken-exclusive digital bundles (Heineken + snacks + UCL merchandise) to drive basket size.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
  },
  "Amstel": {
    "All Channels": [
      { insight: "Amstel Sales Power declining (-2.1pts) — category positioning as affordable premium is being squeezed by Brahma from below and Heineken from above.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Amstel NPS at 54 — lowest in portfolio. Root cause is distribution inconsistency and freshness issues in Trad. Off-Trade. Prioritise field quality audit programme.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "Trad. Off-Trade": [
      { insight: "Amstel Trad. Off-Trade Sales Power critical (42.1) — major SKU gaps (WD 63%) and declining RoS (-3.2%). Consider portfolio rationalisation and focus WD effort on 350ml only.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "NPS 48 in Trad. Off-Trade driven by freshness complaints — accelerate product rotation audit and reduce distributor stockholding time for Amstel by 2 weeks.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "Mod. Off-Trade": [
      { insight: "Amstel Mod. Off-Trade flat (+0.4% RoS) — 350ml coverage gap identified. List 350ml in all 3 major supermarket chains to recover lost volume vs. Brahma.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "NPS improving to 60 in Mod. Off-Trade — leverage supermarket relationships to secure secondary chilled placement ahead of Carnaval season.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "E-retail": [
      { insight: "Amstel E-retail is the only channel showing meaningful growth (+3.8% RoS) — invest in digital content upgrade and sponsored search to accelerate.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Amstel E-retail NPS 66 — far better than physical channels. Use digital channel to test new occasion messaging before deploying to traditional trade.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "Mod. On-Trade": [
      { insight: "Amstel missing from majority of premium restaurant wine lists (TDP 58%) — develop on-trade ambassador programme targeting mid-tier restaurants vs. premium.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Low premium on-trade presence means Amstel is not benefiting from the premiumisation trend — consider dedicating Amstel exclusively to the 'accessible premium' occasion in Mod. On-Trade.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
    "Trad. On-Trade": [
      { insight: "Amstel Trad. On-Trade NPS 52 — draught Amstel freshness and dispense quality issues in botecos creating negative brand perception vs. Brahma on draft.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Declining RoS (-1.1%) in Trad. On-Trade — assess whether Amstel draught should be replaced with a focus on can-only presence in lower-tier boteco accounts.", action: "Adjust media spend to counter Kaiser momentum – go to Media dashboard" },
    ],
  },
};

const B8_BRANDS = ["All Brands", "Heineken", "Amstel", "Schin"];

const B9_KPIS: Record<string, Record<string, FilterKpi[]>> = {
  "All Brands": {
    "All Channels": [
      { label: "Picture of Success", value: "72%", vs: "+3pp vs. PY" },
      { label: "POSM Coverage by channel", value: "64%", vs: "+2pp vs. plan" },
    ],
    "Off Trade": [
      { label: "Picture of Success", value: "72%", vs: "Moderate" },
      { label: "POSM Coverage", value: "63%", vs: "Shelf edge + secondary" },
    ],
    "On Trade": [
      { label: "Picture of Success", value: "72%", vs: "Improving" },
      { label: "POSM Coverage", value: "65%", vs: "Boteco + restaurant" },
    ],
    "E-Commerce": [
      { label: "Picture of Success", value: "88%", vs: "Digital shelf leader" },
      { label: "POSM Coverage", value: "92%", vs: "Hero images compliant" },
    ],
  },
  "Heineken": {
    "All Channels": [
      { label: "Picture of Success", value: "79%", vs: "+4pp vs. PY" },
      { label: "POSM Coverage", value: "72%", vs: "+5pp vs. plan" },
    ],
    "Off Trade": [
      { label: "Picture of Success", value: "78%", vs: "Strong execution" },
      { label: "POSM Coverage", value: "71%", vs: "Shelf + secondary" },
    ],
    "On Trade": [
      { label: "Picture of Success", value: "77%", vs: "UCL materials deployed" },
      { label: "POSM Coverage", value: "72%", vs: "Premium fixture" },
    ],
    "E-Commerce": [
      { label: "Picture of Success", value: "94%", vs: "Digital flagship" },
      { label: "POSM Coverage", value: "96%", vs: "All hero images" },
    ],
  },
  "Amstel": {
    "All Channels": [
      { label: "Picture of Success", value: "61%", vs: "-2pp vs. PY" },
      { label: "POSM Coverage", value: "52%", vs: "Below target" },
    ],
    "Off Trade": [
      { label: "Picture of Success", value: "61%", vs: "Moderate" },
      { label: "POSM Coverage", value: "52%", vs: "Shelf edge only" },
    ],
    "On Trade": [
      { label: "Picture of Success", value: "60%", vs: "Low branded presence" },
      { label: "POSM Coverage", value: "51%", vs: "Missing table cards" },
    ],
    "E-Commerce": [
      { label: "Picture of Success", value: "78%", vs: "Best channel for Amstel" },
      { label: "POSM Coverage", value: "81%", vs: "Product images compliant" },
    ],
  },
  "Schin": {
    "All Channels": [
      { label: "Picture of Success", value: "44%", vs: "Below avg." },
      { label: "POSM Coverage", value: "36%", vs: "Very low" },
    ],
    "Off Trade": [
      { label: "Picture of Success", value: "46%", vs: "C-store minimal" },
      { label: "POSM Coverage", value: "38%", vs: "Price card only" },
    ],
    "On Trade": [
      { label: "Picture of Success", value: "40%", vs: "Boteco basic" },
      { label: "POSM Coverage", value: "32%", vs: "No branded glass" },
    ],
    "E-Commerce": [
      { label: "Picture of Success", value: "62%", vs: "Better than physical" },
      { label: "POSM Coverage", value: "58%", vs: "Basic images only" },
    ],
  },
  "Kaiser": {
    "All Channels": [
      { label: "Picture of Success", value: "48%", vs: "Low" },
      { label: "POSM Coverage", value: "41%", vs: "Minimal" },
    ],
    "Off Trade": [
      { label: "Picture of Success", value: "50%", vs: "Moderate C-store" },
      { label: "POSM Coverage", value: "43%", vs: "Shelf strips only" },
    ],
    "On Trade": [
      { label: "Picture of Success", value: "44%", vs: "Low boteco presence" },
      { label: "POSM Coverage", value: "37%", vs: "Missing glass + collar" },
    ],
    "E-Commerce": [
      { label: "Picture of Success", value: "68%", vs: "Digital uplift" },
      { label: "POSM Coverage", value: "62%", vs: "Basic compliant" },
    ],
  },
};


const B9_INSIGHTS: Record<string, Record<string, FilterInsight[]>> = {
  "All Brands": {
    "All Channels": [
      { insight: "Picture of Success compliance at 72% — top quartile accounts overperforming but long tail dragging average down.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "SOS% in off-trade at 18% below target nationally — on-trade branded presence weak in Sul & Centro-Oeste vs. Carlsberg and AB InBev.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "Mod. Off-Trade": [
      { insight: "Mod. Off-Trade PoS compliance at 81% — Carrefour and Pão de Açúcar leading. Push remaining 19% through joint business plan targets.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "POSM coverage at 76% in Mod. Off-Trade — missing secondary display in Assaí/Atacadão bulk format. Develop specific gondola end solutions for wholesale format.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "Mod. On-Trade": [
      { insight: "Mod. On-Trade PoS improving but 26% of accounts still below standard — focus on SP premium restaurant corridor for maximum brand impression value.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Tabletop POSM and glassware compliance at 68% — implement quarterly field audit with photo verification for top 500 on-trade accounts.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "Trad. Off-Trade": [
      { insight: "Trad. Off-Trade PoS compliance worst at 59% — independent stores not implementing POSM. Introduce sell-in mechanic where POSM placement is condition of promotional terms.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "POSM coverage at 48% in Trad. Off-Trade — increase POSM production for small-format materials (shelf strips, wobblers) suitable for independent store fixtures.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "Trad. On-Trade": [
      { insight: "Boteco branded presence at 68% PoS — branded umbrellas, table numbers, and draught collars are the highest-impact materials. Scale deployment to 2,000 additional accounts.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "SOS% in Trad. On-Trade below target in Sul vs. Itaipava — increase branded cooler placement and neon signage refresh to improve brand salience at point of pour.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "E-retail": [
      { insight: "E-retail PoS at 88% compliance — hero images, nutrition info, and occasion shots all available. Increase 360° product view and video content to drive conversion.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Digital shelf POSM at 92% — maintain standard across iFood, Rappi, and Mercado Livre. Add UCL-branded hero images to Heineken listings for seasonal uplift.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
  },
  "Heineken": {
    "All Channels": [
      { insight: "Heineken PoS compliance at 79% — strongest in portfolio. Focus on closing the 21% gap in Trad. Off-Trade (independent stores) in Nordeste and Norte.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Heineken UCL POSM driving highest compliance scores in Mod. On-Trade — replicate seasonal material toolkit for Carnaval and Copa do Brasil periods.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "Trad. Off-Trade": [
      { insight: "Heineken Trad. Off-Trade PoS at 66% — 34% of independent stores have no Heineken POSM. Sales rep visit frequency is the constraint — increase call frequency for top 2,000 independents.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "POSM coverage 54% in Trad. Off-Trade — develop low-cost, self-install POSM kit (shelf talkers, price cards) that independent owners can apply without field rep visit.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "Mod. Off-Trade": [
      { insight: "Heineken Mod. Off-Trade near 88% PoS compliance — close remaining gap through Q2 category review with Carrefour buyer focusing on chiller blocking and secondary display.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Seasonal UCL POSM materials arriving late vs. campaign launch in 3 out of 5 key accounts — fix supply chain lead time for seasonal POSM kits.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "Mod. On-Trade": [
      { insight: "UCL activation in Mod. On-Trade driving strong 82% PoS compliance — expand beyond current 800 accounts to next 500 premium bars and restaurants.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Heineken branded glassware compliance at 76% — non-compliance is highest in independently-operated premium bars. Introduce glass-replacement programme as quarterly incentive.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "Trad. On-Trade": [
      { insight: "Heineken draught collar and branded glass compliance at 74% in Trad. On-Trade — implement digital photo audit app for sales reps to accelerate compliance feedback loop.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Neon signage and illuminated brand boards have highest ROI in boteco channel — prioritise refresh of 500 highest-volume boteco accounts in SP and MG.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "E-retail": [
      { insight: "Heineken E-retail PoS at 94% — best in class. Add UCL match-day hero images and 'pair with' content to drive basket attachment with food delivery orders.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Video content available for Heineken on only 2 of 5 major e-retail platforms — produce 15-second occasion videos for each platform format to improve conversion.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
  },
  "Amstel": {
    "All Channels": [
      { insight: "Amstel PoS compliance declining (-2pp) — POSM materials not refreshed since last year and now inconsistent with current brand identity standards.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Amstel POSM coverage at 52% — lowest in portfolio. Prioritise refresh of brand identity materials and deploy to top 1,000 accounts before winter occasion season.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "Trad. Off-Trade": [
      { insight: "Amstel Trad. Off-Trade PoS critical at 48% — near zero POSM coverage in Nordeste independent stores. Include POSM as mandatory condition in distributor trading terms.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Amstel brand materials in Trad. Off-Trade outdated (pre-2023 visual identity) — immediate POSM refresh programme required in 3,000 priority independent stores.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "Mod. Off-Trade": [
      { insight: "Amstel Mod. Off-Trade PoS at 70% — shelf strips and price cards present but no secondary display. Negotiate chiller end-cap presence at Pão de Açúcar for winter season.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Amstel secondary display absence in Mod. Off-Trade contributing to declining RoS — link promotional terms to secondary display compliance.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "Mod. On-Trade": [
      { insight: "Amstel Mod. On-Trade branded presence very low (64%) — missing table talkers and menu mention in 36% of premium accounts. Update to drive occasion relevance.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Amstel glassware compliance in Mod. On-Trade low — introduce branded glass replacement programme (trade in old glassware) tied to volume commitment.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "Trad. On-Trade": [
      { insight: "Amstel boteco PoS compliance at 58% — branded glass and draught collar materials present but umbrella and table number compliance very low. Focus field activity on these 2 elements.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Amstel draught freshness issues in boteco channel linked to branded dispense equipment age — initiate equipment refresh programme for top 800 Amstel draught accounts.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
    "E-retail": [
      { insight: "Amstel E-retail PoS best performance (78%) — all product images compliant and occasion shots available. Opportunity to add recipe and food pairing content to drive basket size.", action: "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard" },
      { insight: "Amstel digital shelf is the strongest relative channel — use E-retail as brand identity test-and-learn lab before rolling out to physical channel POSM refresh.", action: "Bundle offers to balance sales – go to Promotions dashboard" },
    ],
  },
};

const B9_BRANDS = ["All Brands", "Heineken", "Amstel", "Schin"];

// ─── Execution steps (shared) ──────────────────────────────────────────────────

const EXECUTION_STEPS: Record<string, StepDetail[]> = {
  "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard": [
    { step: "Open Trade dashboard and filter by Amstel brand", explanation: "Start by isolating Amstel's data to remove noise from other brands.", dataLink: "/trade", dataLabel: "Trade Dashboard" },
    { step: "Compare Salience scores across Key Account segments (L12w vs. PY)", explanation: "Benchmarking current 12-week Salience against prior year reveals whether the decline is seasonal or structural.", dataLink: "/trade", dataLabel: "Salience Report" },
    { step: "Identify top 3 underperforming accounts with largest Salience decline", explanation: "Prioritizing the worst-performing accounts ensures resource allocation targets the biggest opportunities.", dataLink: "/trade", dataLabel: "Account Rankings" },
    { step: "Cross-reference with distribution and shelf-space data", explanation: "Salience drops often correlate with reduced visibility — checking distribution gaps can reveal root causes.", dataLink: "/trade", dataLabel: "Distribution Data" },
    { step: "Schedule review meeting with Key Account managers", explanation: "Align with field teams on findings to co-create corrective action plans.", dataLink: "/trade", dataLabel: "Account Contacts" },
  ],
  "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool": [
    { step: "Open Consumer Insights tool filtered to selected brand", explanation: "Isolate the brand to analyse its unique positioning drivers.", dataLink: "/consumer-insights", dataLabel: "Consumer Insights" },
    { step: "Analyse 'Meaningful' metric decomposition by age cohort", explanation: "Different age groups respond to distinct emotional and functional benefits.", dataLink: "/consumer-insights", dataLabel: "Cohort Analysis" },
    { step: "Compare messaging resonance across campaign touchpoints", explanation: "Evaluate which channels are driving or diluting Meaningful scores.", dataLink: "/consumer-insights", dataLabel: "Campaign Touchpoints" },
    { step: "Identify top 2 underperforming driver attributes", explanation: "Pinpointing weak attributes focuses creative briefs on the highest-impact improvements.", dataLink: "/consumer-insights", dataLabel: "Driver Attributes" },
    { step: "Draft brief for creative agency with revised messaging priorities", explanation: "Translate data insights into a clear, actionable creative brief.", dataLink: "/consumer-insights", dataLabel: "Brief Templates" },
  ],
  "Bundle offers to balance sales – go to Promotions dashboard": [
    { step: "Open Promotions dashboard and review current portfolio SKU overlap", explanation: "Understanding existing promotional overlap prevents conflicting offers.", dataLink: "/promotions", dataLabel: "Promotions Dashboard" },
    { step: "Design 3 bundle configurations (mixed-pack, volume tier, occasion-based)", explanation: "Multiple configurations allow testing different consumer motivations.", dataLink: "/promotions", dataLabel: "Bundle Designer" },
    { step: "Simulate uplift and margin impact for each bundle option", explanation: "Simulation quantifies the trade-off between incremental volume uplift and margin dilution.", dataLink: "/promotions", dataLabel: "Uplift Simulator" },
    { step: "Select top bundle and define promotional calendar slots", explanation: "Aligning the winning bundle with optimal calendar windows maximises reach.", dataLink: "/promotions", dataLabel: "Calendar Planner" },
    { step: "Brief trade marketing team on execution timeline", explanation: "Clear timelines ensure in-store execution aligns with above-the-line campaign timing.", dataLink: "/promotions", dataLabel: "Execution Brief" },
  ],
  "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool": [
    { step: "Open Pricing tool and model a 250ml pack variant", explanation: "A smaller pack creates a lower entry price point, attracting trial without directly competing with core packs.", dataLink: "/pricing", dataLabel: "Pricing Tool" },
    { step: "Run price elasticity simulation at €1.29, €1.49, €1.69 price points", explanation: "Simulating multiple price tiers quantifies demand sensitivity.", dataLink: "/pricing", dataLabel: "Elasticity Model" },
    { step: "Assess cannibalization impact on core SKU at each price tier", explanation: "Each price point has different cross-SKU substitution risk.", dataLink: "/pricing", dataLabel: "Cannibalization Report" },
    { step: "Select optimal price point minimizing cross-SKU substitution", explanation: "The ideal price balances growth potential while protecting core volume.", dataLink: "/pricing", dataLabel: "Price Optimization" },
    { step: "Submit pack-price proposal to commercial planning team", explanation: "Formal submission ensures alignment with commercial strategy.", dataLink: "/pricing", dataLabel: "Proposal Builder" },
  ],
  "Adjust media spend to counter Kaiser momentum – go to Media dashboard": [
    { step: "Open Media dashboard and pull competitive spend analysis", explanation: "Understanding competitor investment levels and timing helps identify share-of-voice gaps.", dataLink: "/media", dataLabel: "Media Dashboard" },
    { step: "Map competitor media weight by channel (TV, Digital, OOH)", explanation: "Channel-level mapping reveals strategy and counter-tactics needed.", dataLink: "/media", dataLabel: "Channel Analysis" },
    { step: "Identify counter-programming windows with low competitor presence", explanation: "Exploiting gaps in competitor scheduling maximizes impact per euro spent.", dataLink: "/media", dataLabel: "Schedule Gaps" },
    { step: "Reallocate 15% of reserve budget to high-impact digital slots", explanation: "Digital channels offer fastest response time and precise targeting.", dataLink: "/media", dataLabel: "Budget Planner" },
    { step: "Set up weekly monitoring alert for competitor SOV changes", explanation: "Continuous monitoring ensures early detection of further competitive shifts.", dataLink: "/media", dataLabel: "SOV Tracker" },
  ],
  "Pause underperforming Desperados digital activation – go to Media tool": [
    { step: "Open Media tool and pull Desperados digital campaign report", explanation: "The campaign report provides granular performance data to confirm underperformance.", dataLink: "/media", dataLabel: "Media Tool" },
    { step: "Confirm ROI remains below €1.00 threshold for 4+ consecutive weeks", explanation: "A 4-week threshold filters out short-term fluctuations.", dataLink: "/media", dataLabel: "ROI Trend Report" },
    { step: "Identify salvageable creative assets for future reuse", explanation: "High-quality creative assets can be repurposed in future campaigns.", dataLink: "/media", dataLabel: "Asset Library" },
    { step: "Submit pause request through campaign management system", explanation: "A formal pause request ensures proper documentation.", dataLink: "/media", dataLabel: "Campaign Manager" },
    { step: "Reallocate freed budget to top-performing channels", explanation: "Redirecting budget to proven high-ROI channels immediately improves overall portfolio ROI.", dataLink: "/media", dataLabel: "Channel Performance" },
  ],
  "AllocationAI recommends shifting budget from Promotions to UCL Sponsorship to maximize overall ROI. – go to AllocationAI tool": [
    { step: "Open AllocationAI tool and review current budget allocation", explanation: "A baseline view of current spend distribution is essential before modelling any reallocation.", dataLink: "/allocation-ai", dataLabel: "AllocationAI Tool" },
    { step: "Model scenario: shift €500K from BTL Promotions to UCL Sponsorship", explanation: "This scenario tests the hypothesis that sponsorship delivers higher ROI than below-the-line promotions.", dataLink: "/allocation-ai", dataLabel: "Scenario Modeller" },
    { step: "Validate projected ROI uplift (€0.85 → €2.45 range improvement)", explanation: "Confirming the projected improvement range builds the business case.", dataLink: "/allocation-ai", dataLabel: "ROI Projections" },
    { step: "Check for minimum spend commitments on existing promo contracts", explanation: "Existing contractual obligations may constrain the reallocation timeline.", dataLink: "/allocation-ai", dataLabel: "Contract Review" },
    { step: "Submit reallocation request to Finance for approval", explanation: "Finance sign-off formalizes the budget shift.", dataLink: "/allocation-ai", dataLabel: "Approval Workflow" },
  ],
  "Shift budget from ATL media to BTL execution for Amstel in AllocationAI": [
    { step: "Open AllocationAI and select Amstel brand filter", explanation: "Isolate Amstel's ATL and BTL budget lines to see the current split and ROI by channel.", dataLink: "/allocation-ai", dataLabel: "AllocationAI Tool" },
    { step: "Model scenario: reallocate 30% of Amstel ATL budget to On-Trade BTL activations", explanation: "ATL ROI at €0.92 is below the €1.20 threshold — shifting to BTL execution (POSM, branded coolers, draught equipment) targets the On-Trade channel where Amstel volume is concentrated.", dataLink: "/allocation-ai", dataLabel: "Scenario Modeller" },
    { step: "Validate projected Sales Power uplift in On-Trade", explanation: "Model the expected improvement in Sales Power (+1.2–2.4 pts) from increased BTL presence in the top 1,000 On-Trade accounts.", dataLink: "/allocation-ai", dataLabel: "Sales Power Forecast" },
    { step: "Review POSM deployment plan for top on-trade accounts", explanation: "Ensure the BTL budget shift translates into physical POSM materials (branded umbrellas, draught collars, table talkers) deployed to priority accounts.", dataLink: "/promotions", dataLabel: "POSM Tracker" },
    { step: "Submit budget reallocation for Amstel to Finance", explanation: "Formalise the ATL-to-BTL shift with clear KPIs: target POSM coverage from 52% → 70% and Sales Power recovery of +1.8 pts within 6 months.", dataLink: "/allocation-ai", dataLabel: "Approval Workflow" },
  ],
};

const getSteps = (action: string): StepDetail[] =>
  EXECUTION_STEPS[action] ?? [
    { step: "Review the relevant dashboard data", explanation: "Start with the data to ensure decisions are grounded in current performance.", dataLink: "/", dataLabel: "Dashboard" },
    { step: "Identify key areas requiring attention", explanation: "Prioritize the metrics with the largest gaps.", dataLink: "/", dataLabel: "Analytics" },
    { step: "Prepare action plan with stakeholders", explanation: "Collaborative planning ensures buy-in.", dataLink: "/", dataLabel: "Planning" },
    { step: "Execute recommended changes", explanation: "Implement the agreed actions with clear ownership.", dataLink: "/", dataLabel: "Execution" },
    { step: "Monitor results and iterate", explanation: "Track outcomes weekly and adjust tactics.", dataLink: "/", dataLabel: "Monitoring" },
  ];

// ─── Sub-components ────────────────────────────────────────────────────────────

function FilterDropdown({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">{label}:</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-card border border-border text-foreground text-[11px] font-semibold rounded-lg px-3 py-1.5 pr-7 cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary transition-colors shadow-sm"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

function KpiPills({ kpis, scale, highlightedKpis }: { kpis: FilterKpi[]; scale: number; highlightedKpis?: number[] }) {
  function scaleVal(v: string) {
    if (scale === 1.0) return v;
    const m = v.match(/^([+-]?)([€£$]?)(\d[\d,.]*)(\s?(?:pp|pts|%|x|M|B|khl)?.*)$/);
    if (!m) return v;
    const [, sign, cur, num, suf] = m;
    const raw = parseFloat(num.replace(/,/g, ""));
    if (isNaN(raw)) return v;
    const isDecimal = num.includes(".") || suf.includes("pp") || suf.includes("pts");
    return `${sign}${cur}${(raw * scale).toFixed(isDecimal ? 1 : 0)}${suf}`;
  }
  const cols = kpis.length <= 3 ? kpis.length : 3;
  const isHighlighting = highlightedKpis && highlightedKpis.length > 0;
  return (
    <div className={`grid gap-2 mb-4`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {kpis.map((kpi, i) => {
        const isHighlighted = isHighlighting && highlightedKpis!.includes(i);
        const isDimmed = isHighlighting && !highlightedKpis!.includes(i);
        return (
          <div
            key={i}
            className={`rounded-2xl border-2 px-3 py-3 text-center shadow-sm transition-all duration-200 ${
              isHighlighted
                ? "border-[hsl(var(--status-orange))] bg-status-orange-bg shadow-[0_0_12px_hsl(var(--status-orange)/0.25)] scale-[1.03]"
                : isDimmed
                  ? "border-border bg-card opacity-40"
                  : "border-border bg-card"
            }`}
          >
            <div className="text-[10px] font-medium text-muted-foreground tracking-wide leading-tight">{kpi.label}</div>
            <div className={`text-sm font-extrabold mt-1 ${kpi.status === "warning" ? "text-[hsl(var(--status-orange))]" : kpi.status === "negative" ? "text-[hsl(var(--status-red,0_84%_60%))]" : "text-[hsl(var(--status-green))]"}`}>{scaleVal(kpi.value)}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{kpi.vs}</div>
          </div>
        );
      })}
    </div>
  );
}

function InsightCard({ insights, expandedAction, setExpandedAction, expandedReadMore, setExpandedReadMore, variant = "default", onInsightHover }: {
  insights: FilterInsight[];
  expandedAction: string | null;
  setExpandedAction: (a: string | null) => void;
  expandedReadMore: string | null;
  setExpandedReadMore: (k: string | null) => void;
  variant?: "default" | "alert";
  onInsightHover?: (kpiIndices: number[] | null) => void;
}) {
  if (!insights.length) return null;
  const renderActionText = (text: string) => <span>{text.replace(/\s*–\s*go to\s+.+$/i, "")}</span>;
  const isAlert = variant === "alert";
  const containerCls = isAlert
    ? "border-2 border-[hsl(var(--status-orange))] bg-status-orange-bg shadow-[0_0_12px_hsl(var(--status-orange)/0.15)]"
    : "border-2 border-[hsl(var(--status-orange))] bg-status-orange-bg shadow-[0_0_12px_hsl(var(--status-orange)/0.15)]";
  return (
    <>
      <h3 className="font-bold text-xs text-foreground mb-3 uppercase tracking-wide">Insights & Recommended Actions</h3>
      <div className={`rounded-xl mb-4 overflow-hidden ${containerCls}`}>
        <div className="divide-y divide-[hsl(var(--status-orange))]/20">
          {insights.map((item, idx) => {
            const isExpanded = expandedAction === `${item.action}-${idx}`;
            const steps = getSteps(item.action);
            return (
              <div
                key={idx}
                onMouseEnter={() => onInsightHover?.(item.kpiIndices ?? null)}
                onMouseLeave={() => onInsightHover?.(null)}
              >
                <button
                  onClick={() => setExpandedAction(isExpanded ? null : `${item.action}-${idx}`)}
                  className="w-full text-left p-3 transition-all space-y-2 hover:bg-[hsl(var(--status-orange))]/10"
                >
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle size={13} className="text-[hsl(var(--status-orange))] mt-0.5 shrink-0" />
                    <p className="text-foreground leading-snug text-[11px]">{item.insight}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <CheckSquare size={12} className={`shrink-0 ${isExpanded ? "text-[hsl(var(--status-orange))]" : "text-muted-foreground"}`} />
                    <span className="flex-1 leading-snug font-semibold">{renderActionText(item.action)}</span>
                    <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full transition-colors ${isExpanded ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
                      <ChevronRight size={10} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      View Execution
                    </span>
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="bg-muted/40 border border-t-0 border-border rounded-b-xl p-4 space-y-2">
                        <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wide mb-2">Execution Steps</h4>
                        {steps.map((s, j) => {
                          const rmKey = `${item.action}-${idx}-${j}`;
                          const open = expandedReadMore === rmKey;
                          return (
                            <div key={j} className="space-y-1">
                              <div className="flex items-start gap-2 text-[12px] text-foreground/90 leading-snug">
                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">{j + 1}</div>
                                <span>{s.step}</span>
                              </div>
                              <div className="ml-7">
                                <button onClick={(e) => { e.stopPropagation(); setExpandedReadMore(open ? null : rmKey); }} className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors">
                                  <BookOpen size={10} />
                                  {open ? "Show less" : "Read more"}
                                </button>
                                <AnimatePresence>
                                  {open && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 mb-1.5">{s.explanation}</p>
                                      <a href={s.dataLink} className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:text-accent/80 transition-colors">
                                        <ExternalLink size={9} />
                                        Explore in {s.dataLabel}
                                      </a>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-end pt-2">
                          <button className="flex items-center gap-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 shadow transition-all hover:shadow-md hover:scale-[1.02]">
                            <Play size={12} />
                            Start Execution
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

interface Props {
  battleId: number;
  period?: string;
  onOpenAllocationAI?: () => void;
}

export default function HowToWinBattleDetail({ battleId, period = "L12w", onOpenAllocationAI }: Props) {
  const [brand, setBrand] = useState("All Brands");
  const [channel, setChannel] = useState("All Channels");
  const [expandedAction5, setExpandedAction5] = useState<string | null>(null);
  const [expandedReadMore5, setExpandedReadMore5] = useState<string | null>(null);
  const [hoveredKpis5, setHoveredKpis5] = useState<number[] | null>(null);

  const kpiScale: Record<string, number> = { L12w: 1.00, L4w: 0.88, YTD: 1.06, MAT: 1.03 };
  const scale = kpiScale[period] ?? 1.0;

  useEffect(() => {
    setBrand("All Brands");
    setChannel("All Channels");
    setExpandedAction5(null);
    setExpandedReadMore5(null);
    setHoveredKpis5(null);
  }, [battleId]);

  if (battleId === 3) {
    const kpis = B3_BRAND_KPIS[brand] ?? B3_BRAND_KPIS["All Brands"];
    return (
      <div className="space-y-3">
        <FilterDropdown label="Brand" options={BRANDS} value={brand} onChange={setBrand} />
        <KpiPills kpis={kpis} scale={scale} />
      </div>
    );
  }

  if (battleId === 4) {
    const kpis = B4_CHANNEL_KPIS[channel] ?? B4_CHANNEL_KPIS["All Channels"];
    return (
      <div className="space-y-3">
        <FilterDropdown label="Channel" options={CHANNELS} value={channel} onChange={setChannel} />
        <KpiPills kpis={kpis} scale={scale} />
      </div>
    );
  }

  if (battleId === 5) {
    const brandData = B5_KPIS[brand] ?? B5_KPIS["All Brands"];
    const kpis = brandData["All Channels"];
    const insights5 = B5_INSIGHTS["All Brands"];

    // Parse numeric KPI values for the bar chart
    const parseVal = (v: string) => {
      const clean = v.replace(/[^0-9.\-+]/g, "");
      return parseFloat(clean) || 0;
    };

    const irVal = parseVal(kpis[0]?.value ?? "0");
    const rosVal = parseVal(kpis[1]?.value ?? "0");
    const bgsVal = parseVal(kpis[2]?.value ?? "0");

    const chartData = [
      { name: "Innovation Rate", actual: irVal, target: 10, fill: irVal >= 10 ? "hsl(var(--status-green))" : "hsl(var(--status-orange))" },
      { name: "Rate of Sales", actual: rosVal, target: 0, fill: rosVal >= 0 ? "hsl(var(--status-green))" : "hsl(var(--status-orange))" },
      { name: "BGS: Innovative", actual: bgsVal, target: 65, fill: bgsVal >= 65 ? "hsl(var(--status-green))" : "hsl(var(--status-orange))" },
    ];

    const brandLabel = brand === "All Brands" ? "Portfolio" : brand;

    return (
      <div className="space-y-3">
        <FilterDropdown label="Brand" options={B5_BRANDS} value={brand} onChange={setBrand} />
        <KpiPills kpis={kpis} scale={scale} highlightedKpis={hoveredKpis5 ?? undefined} />
        <InsightCard
          insights={insights5}
          expandedAction={expandedAction5}
          setExpandedAction={setExpandedAction5}
          expandedReadMore={expandedReadMore5}
          setExpandedReadMore={setExpandedReadMore5}
          variant="alert"
          onInsightHover={setHoveredKpis5}
        />
        <div className="border-t border-border pt-3">
          <h3 className="font-bold text-xs text-foreground mb-1 uppercase tracking-wide">KPI Performance vs. Target</h3>
          <p className="text-[10px] text-muted-foreground mb-3">{brandLabel}</p>
          <div className="mb-2">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 5, right: 8, left: -15, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} unit="%" domain={["auto", "auto"]} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={80} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  formatter={(val: number, name: string) => [`${val.toFixed(1)}%`, name === "actual" ? "Actual" : "Target"]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v) => v === "actual" ? "Actual" : "Target"} />
                <Bar dataKey="actual" name="actual" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
                <Bar dataKey="target" name="target" fill="hsl(var(--muted-foreground))" opacity={0.35} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-2 mb-3 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-[hsl(var(--status-green))]" />Above target</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-[hsl(var(--status-orange))]" />Below target</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-muted-foreground opacity-35" />Target</span>
          </div>
        </div>
        <div className="pt-2 border-t border-border">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Data Sources</h4>
          <div className="flex flex-wrap gap-1.5">
            {["Nielsen Retail Audit (L12w)", "GfK Consumer Panel", "SAP Revenue Cockpit", "Innovation Pipeline Tracker"].map((s, i) => (
              <span key={i} className="inline-flex items-center text-[9px] font-medium text-muted-foreground bg-muted/50 border border-border rounded-md px-2 py-1">{s}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (battleId === 6) {
    const kpis = B6_BRAND_KPIS[brand] ?? B6_BRAND_KPIS["All Brands"];
    return (
      <div className="space-y-3">
        <FilterDropdown label="Brand" options={BRANDS} value={brand} onChange={setBrand} />
        <KpiPills kpis={kpis} scale={scale} />
      </div>
    );
  }

  if (battleId === 7) {
    const brandChannelData = B7_KPIS[brand] ?? B7_KPIS["All Brands"];
    const kpis = brandChannelData[channel] ?? brandChannelData["All Channels"];
    const promoData = [
      { name: "Promo Pressure", value: parseFloat(kpis[0].value) || 24, target: 20 },
      { name: "Promo Depth", value: Math.abs(parseFloat(kpis[1].value) || 18), target: 15 },
    ];
    const config = howToWinBattleKpis[7];
    return (
      <div className="space-y-3">
        <FilterDropdown label="Brand" options={B7_BRANDS} value={brand} onChange={setBrand} />
        <FilterDropdown label="Channel" options={CHANNELS} value={channel} onChange={setChannel} />
        <KpiPills kpis={kpis} scale={scale} />
        <div className="border-t border-border pt-3">
          <h3 className="font-bold text-xs text-foreground mb-2 uppercase tracking-wide">Promotions vs. Target</h3>
          <div className="mb-4">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={promoData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="value" name="Actual" fill="hsl(var(--status-orange))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button className="w-full flex items-center justify-center gap-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl py-3 px-4 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] mb-4">
            <Zap size={16} />
            Deep-dive into {config.deepDiveLabel}
            <ExternalLink size={14} />
          </button>
          <div className="pt-3 border-t border-border">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Data Sources</h4>
            <div className="flex flex-wrap gap-1.5">
              {["SAP Revenue Cockpit", "Promotions Tracker", "Nielsen Trade Panel", "AllocationAI Engine v2.1"].map((s, i) => (
                <span key={i} className="inline-flex items-center text-[9px] font-medium text-muted-foreground bg-muted/50 border border-border rounded-md px-2 py-1">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (battleId === 8) {
    const brandChannelData = B8_KPIS[brand] ?? B8_KPIS["All Brands"];
    const kpis = brandChannelData[channel] ?? brandChannelData["All Channels"];
    return (
      <div className="space-y-3">
        <FilterDropdown label="Brand" options={B8_BRANDS} value={brand} onChange={setBrand} />
        <FilterDropdown label="Channel" options={CHANNELS} value={channel} onChange={setChannel} />
        <KpiPills kpis={kpis} scale={scale} />
      </div>
    );
  }

  if (battleId === 9) {
    const brandChannelData = B9_KPIS[brand] ?? B9_KPIS["All Brands"];
    const kpis = brandChannelData[channel] ?? brandChannelData["All Channels"];
    const insightKey = brand === "Amstel" ? "Amstel" : brand === "Heineken" ? "Heineken" : "All Brands";
    const channelKey = channel !== "All Channels" ? channel : "All Channels";
    const insightsData = B9_INSIGHTS[insightKey] ?? B9_INSIGHTS["All Brands"];
    const insights9 = insightsData[channelKey] ?? insightsData["All Channels"] ?? [];

    // Amstel-specific OOH insight override
    const isAmstel = brand === "Amstel";
    const displayInsights: FilterInsight[] = isAmstel
      ? [
          { insight: "Opportunity to boost on-trade sales for Amstel through BTL execution — Amstel POSM coverage at 52% (lowest in portfolio) and On-Trade Sales Power declining -1.8 pts vs PY. ATL ROI at €0.92 is below threshold, suggesting budget is better deployed in targeted BTL activations at point of sale.", action: "Shift budget from ATL media to BTL execution for Amstel in AllocationAI" },
        ]
      : [
          { insight: "Opportunity to boost on-trade sales for Amstel through BTL execution — Amstel's On-Trade visibility is the weakest in portfolio at 52% POSM coverage. Shifting ATL budget to BTL would improve ROI and Sales Power.", action: "Shift budget from ATL media to BTL execution for Amstel in AllocationAI" },
        ];

    // Amstel-specific chart data
    const visibilityData = isAmstel
      ? [
          { metric: "POSM Coverage", value: 52, target: 75, fill: "hsl(var(--status-orange))" },
          { metric: "PoS Compliance", value: 58, target: 72, fill: "hsl(var(--status-orange))" },
          { metric: "Brand Visibility", value: 48, target: 64, fill: "hsl(var(--status-orange))" },
          { metric: "ATL ROI (€)", value: 92, target: 120, fill: "hsl(var(--status-orange))" },
        ]
      : [
          { metric: "POSM Coverage", value: 72, target: 75, fill: "hsl(var(--status-green))" },
          { metric: "PoS Compliance", value: 72, target: 75, fill: "hsl(var(--status-green))" },
          { metric: "Brand Visibility", value: 64, target: 70, fill: "hsl(var(--status-orange))" },
          { metric: "ATL ROI (€)", value: 108, target: 120, fill: "hsl(var(--status-orange))" },
        ];

    return (
      <div className="space-y-3">
        <FilterDropdown label="Brand" options={B9_BRANDS} value={brand} onChange={setBrand} />
        <FilterDropdown label="Channel" options={CHANNELS} value={channel} onChange={setChannel} />
        <KpiPills kpis={kpis} scale={scale} />
        <InsightCard
          insights={displayInsights}
          expandedAction={expandedAction5}
          setExpandedAction={setExpandedAction5}
          expandedReadMore={expandedReadMore5}
          setExpandedReadMore={setExpandedReadMore5}
          variant="alert"
          onInsightHover={setHoveredKpis5}
        />
        {/* Visibility chart */}
        <div className="border-t border-border pt-3">
          <h3 className="font-bold text-xs text-foreground mb-1 uppercase tracking-wide">{isAmstel ? "Amstel Visibility vs. Target" : "Visibility Execution Overview"}</h3>
          <p className="text-[10px] text-muted-foreground mb-3">{isAmstel ? "BTL execution metrics — On-Trade focus" : "Portfolio POSM & compliance metrics"}</p>
          <div className="mb-2">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={visibilityData} margin={{ top: 5, right: 8, left: -15, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} domain={[0, 130]} />
                <YAxis dataKey="metric" type="category" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={90} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="value" name="Actual" radius={[0, 4, 4, 0]}>
                  {visibilityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
                <Bar dataKey="target" name="Target" fill="hsl(var(--muted-foreground))" opacity={0.35} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-2 mb-3 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-[hsl(var(--status-green))]" />On target</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-[hsl(var(--status-orange))]" />Below target</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-muted-foreground opacity-35" />Target</span>
          </div>
        </div>
        {/* Deep-dive buttons */}
        <div className="pt-3 border-t border-border space-y-2">
          <button onClick={onOpenAllocationAI} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl py-3 px-4 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
            <Zap size={16} />
            Deep-dive into AllocationAI
            <ExternalLink size={14} />
          </button>
          <button className="w-full flex items-center justify-center gap-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl py-3 px-4 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
            <Zap size={16} />
            Deep-dive into Promotional Dashboard
            <ExternalLink size={14} />
          </button>
        </div>
        {/* Data Sources */}
        <div className="pt-3 border-t border-border">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Data Sources</h4>
          <div className="flex flex-wrap gap-1.5">
            {["Nielsen Retail Audit (L12w)", "POSM Compliance Tracker", "AllocationAI Engine v2.1", "Trade Marketing Dashboard"].map((s, i) => (
              <span key={i} className="inline-flex items-center text-[9px] font-medium text-muted-foreground bg-muted/50 border border-border rounded-md px-2 py-1">{s}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
