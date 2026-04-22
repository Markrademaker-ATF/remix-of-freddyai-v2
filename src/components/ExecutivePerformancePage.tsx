import React, { useState, useRef, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Filter, BarChart3, ChevronDown, RefreshCw, CheckSquare, ChevronRight, Play, BookOpen, ExternalLink, AlertTriangle, Map, BarChart2, Trophy, Zap as ZapIcon, Target } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { AppState } from "@/data/mockData";

type ComparisonMode = "PY" | "PP" | "YA" | "AP";
type ActiveTab = "aggregated" | "brand_breakdown" | "channel_breakdown" | "region_breakdown";

const regionMap: Record<string, { name: string; flag: string }> = {
  UK: { name: "United Kingdom", flag: "🇬🇧" },
  NL: { name: "Netherlands", flag: "🇳🇱" },
  BR: { name: "Brazil", flag: "🇧🇷" },
  MX: { name: "Mexico", flag: "🇲🇽" },
};

const periodLabels: Record<string, string> = {
  L12w: "L12w",
  L4w: "L4w",
  YTD: "YTD",
  MAT: "MAT",
};

const compModeOptions: { value: ComparisonMode; label: string; description: string }[] = [
  { value: "PY", label: "vs PY", description: "same period last year" },
  { value: "PP", label: "vs PP", description: "previous period" },
  { value: "YA", label: "vs YA", description: "yearly average" },
  { value: "AP", label: "vs AP", description: "actual plan (on track?)" },
];

// Per-period data variants: { value, change multiplier }
// Timeframe scaling: each step up multiplies by 1.3
const periodDataVariants: Record<string, { valueScale: number; changeScale: number }> = {
  L4w:  { valueScale: 1.0,   changeScale: 1.0 },
  L12w: { valueScale: 1.3,   changeScale: 1.0 },
  YTD:  { valueScale: 1.69,  changeScale: 1.3 },
  MAT:  { valueScale: 2.197, changeScale: 1.1 },
};

function scaleChange(change: string, multiplier: number): string {
  const m = change.match(/^([+-]?)(\d+\.?\d*)(.*)$/);
  if (!m) return change;
  const [, sign, num, suffix] = m;
  const scaled = (parseFloat(num) * multiplier).toFixed(1).replace(/\.0$/, "");
  return `${sign}${scaled}${suffix}`;
}

function scaleNumericValue(value: string, scale: number): string {
  if (scale === 1.0) return value;
  const m = value.match(/^(-?)([€£$]?)(\d[\d,.]+)(\s?.*)$/);
  if (!m) return value;
  const [, neg, prefix, num, suffix] = m;
  const raw = parseFloat(num.replace(/,/g, ""));
  if (isNaN(raw)) return value;
  const scaled = raw * scale;
  const formatted = raw >= 100
    ? Math.round(scaled).toLocaleString('en-US')
    : scaled.toFixed(raw < 10 ? 1 : 0);
  return `${neg}${prefix}${formatted}${suffix}`;
}

// Compute filter-based multiplier: start at 1.0, subtract fractions for deselected items
function computeFilterMultiplier(filters: Record<string, string[]>): number {
  let mult = 1.0;

  // Category: Beer off → -4/5, Cider off → -1/5
  const catSel = filters["Category"] ?? [];
  if (catSel.length > 0) {
    const beerOn = catSel.includes("Beer: Low/No") || catSel.includes("Beer: Alcoholic");
    const ciderOn = catSel.includes("Cider");
    if (!beerOn) mult -= 4 / 5;
    if (!ciderOn) mult -= 1 / 5;
  }

  // Channel: Off-trade off → -1/4, On-trade off → -1/4, E-commerce off → -1/2
  const chanSel = filters["Channel"] ?? [];
  if (chanSel.length > 0 && chanSel.length < 3) {
    if (!chanSel.includes("Off-trade")) mult -= 1 / 4;
    if (!chanSel.includes("On-trade")) mult -= 1 / 4;
    if (!chanSel.includes("E-commerce")) mult -= 1 / 2;
  }

  // Brand: each brand off → -1/3
  const brandSel = filters["Brand"] ?? [];
  if (brandSel.length > 0 && brandSel.length < 3) {
    const allBrands = ["Heineken®", "Amstel®", "Schin®"];
    const offCount = allBrands.filter(b => !brandSel.includes(b)).length;
    mult -= offCount * (1 / 3);
  }

  // Region: each region off → -1/4
  const regSel = filters["Region"] ?? [];
  if (regSel.length > 0 && regSel.length < 4) {
    const allRegs = ["Southeast", "South", "Northeast", "Central-West"];
    const offCount = allRegs.filter(r => !regSel.includes(r)).length;
    mult -= offCount * (1 / 4);
  }

  return Math.max(0, mult);
}

type TrendDir = "up" | "down" | "flat" | "none";

function TrendIcon({ dir, className = "" }: { dir: TrendDir; className?: string }) {
  if (dir === "up") return <TrendingUp size={12} className={`text-[hsl(var(--status-green))] ${className}`} />;
  if (dir === "down") return <TrendingDown size={12} className={`text-[hsl(var(--status-red))] ${className}`} />;
  if (dir === "flat") return <Minus size={12} className={`text-muted-foreground ${className}`} />;
  return null;
}

interface CompetitorData {
  value: string;
  change: string;
  changePP?: string;
  trend: TrendDir;
}

interface MetricBreakdown {
  value: string;
  change: string;
  changePP?: string;
  trend: TrendDir;
}

interface KpiMetric {
  label: string;
  unit: string;
  value: string;
  valueAbs?: string;   // absolute part when unit is "L & %" or "€ & %"
  valuePct?: string;   // percentage part
  change: string;
  changePP?: string;   // vs previous period
  trend: TrendDir;
  hideTrend?: boolean;       // hide trend arrow (e.g., growth metrics)
  pctAsMain?: boolean;       // show percentage as main value, absolute in parentheses
  displayPctPlain?: boolean; // show percentage without +/- sign
  hasCompetitor?: boolean;
  competitors?: Record<string, CompetitorData>;
  brandCompetitors?: Record<string, CompetitorData>;
  byCategory?: Record<string, MetricBreakdown>;
  byChannel?: Record<string, MetricBreakdown>;
  byBrand?: Record<string, MetricBreakdown>;
  byRegion?: Record<string, MetricBreakdown>;
  byCustomer?: Record<string, MetricBreakdown>;
}

interface KpiSection {
  key: string;
  label: string;
  subcategories?: { key: string; label: string; metrics: KpiMetric[] }[];
  metrics?: KpiMetric[];
}

const kpiSections: KpiSection[] = [
  {
    key: "category_growth",
    label: "Category Growth",
    metrics: [
      {
        label: "Volume Growth", unit: "L & %", value: "-11,000 khl", valueAbs: "-11,000 khl", valuePct: "-1.2%", change: "-1.2%", changePP: "-0.6%", trend: "down", hideTrend: true, pctAsMain: true,
        byCategory: { "Beer": { value: "-8,200 khl", change: "-1.0%", changePP: "-0.5%", trend: "down" }, "Cider": { value: "-1,800 khl", change: "-1.8%", changePP: "-0.9%", trend: "down" }, "Spirits": { value: "-1,000 khl", change: "-1.5%", changePP: "-0.8%", trend: "down" } },
        byChannel: { "Off-trade": { value: "7,700 khl", change: "+1.4%", changePP: "+0.7%", trend: "up" }, "On-trade": { value: "-2,300 khl", change: "-0.8%", changePP: "-0.4%", trend: "down" }, "E-commerce": { value: "1,000 khl", change: "+0.3%", changePP: "+0.2%", trend: "up" } },
      },
      {
        label: "Value Growth", unit: "€ & %", value: "-€8,000 mln", valueAbs: "-€8,000 mln", valuePct: "-0.8%", change: "-0.8%", changePP: "-0.4%", trend: "down", hideTrend: true, pctAsMain: true,
        byCategory: { "Beer": { value: "-€6,000 mln", change: "-0.6%", changePP: "-0.3%", trend: "down" }, "Cider": { value: "-€1,200 mln", change: "-1.2%", changePP: "-0.6%", trend: "down" }, "Spirits": { value: "-€800 mln", change: "-0.9%", changePP: "-0.5%", trend: "down" } },
        byChannel: { "Off-trade": { value: "€5,600 mln", change: "+0.9%", changePP: "+0.5%", trend: "up" }, "On-trade": { value: "-€1,600 mln", change: "-0.5%", changePP: "-0.3%", trend: "down" }, "E-commerce": { value: "€800 mln", change: "+0.6%", changePP: "+0.3%", trend: "up" } },
      },
      {
        label: "Penetration", unit: "%", value: "54.4%", change: "-1.2pp", changePP: "-0.5pp", trend: "down",
        byCategory: { "Beer": { value: "68%", change: "-1.0pp", changePP: "-0.4pp", trend: "down" }, "Cider": { value: "22%", change: "-1.8pp", changePP: "-0.7pp", trend: "down" }, "Spirits": { value: "41%", change: "-0.8pp", changePP: "-0.3pp", trend: "down" } },
        byChannel: { "Off-trade": { value: "61%", change: "+1.4pp", changePP: "+0.6pp", trend: "up" }, "On-trade": { value: "38%", change: "-0.8pp", changePP: "-0.3pp", trend: "down" }, "E-commerce": { value: "15%", change: "+0.3pp", changePP: "+0.1pp", trend: "up" } },
      },
    ],
  },
  {
    key: "hnk_opco",
    label: "Are we winning? / delivering?",
    subcategories: [
      {
        key: "winning", label: "Are we winning?",
        metrics: [
          { label: "Volume Market Share", unit: "%", value: "31.2%", change: "-2.5pp", changePP: "-1.0pp", trend: "down", hasCompetitor: true,
            competitors: { "AB InBev": { value: "26.4%", change: "-0.2pp", changePP: "-0.1pp", trend: "down" }, "Carlsberg": { value: "12.8%", change: "+0.3pp", changePP: "+0.1pp", trend: "up" } },
            brandCompetitors: { "Brahma": { value: "14.2%", change: "+0.5pp", changePP: "+0.2pp", trend: "up" }, "Budweiser": { value: "8.6%", change: "-0.3pp", changePP: "-0.1pp", trend: "down" } },
            byCategory: { "Beer": { value: "33.5%", change: "-2.1pp", changePP: "-0.8pp", trend: "down" }, "Cider": { value: "18.4%", change: "-3.2pp", changePP: "-1.3pp", trend: "down" } },
            byChannel: { "Off-trade": { value: "29.5%", change: "+2.8pp", changePP: "+1.1pp", trend: "up" }, "On-trade": { value: "34.1%", change: "-1.9pp", changePP: "-0.8pp", trend: "down" }, "E-commerce": { value: "22.4%", change: "+1.2pp", changePP: "+0.5pp", trend: "up" } },
            byBrand: { "Heineken®": { value: "15.6%", change: "-0.8pp", changePP: "-0.3pp", trend: "down" }, "Amstel®": { value: "8.2%", change: "-0.5pp", changePP: "-0.2pp", trend: "down" }, "Schin®": { value: "3.8%", change: "-0.6pp", changePP: "-0.2pp", trend: "down" } },
          },
          { label: "Value Market Share", unit: "%", value: "29.0%", change: "-3.1pp", changePP: "-1.2pp", trend: "down", hasCompetitor: true,
            competitors: { "AB InBev": { value: "25.3%", change: "+1.4pp", changePP: "+0.5pp", trend: "up" }, "Carlsberg": { value: "11.2%", change: "+0.6pp", changePP: "+0.2pp", trend: "up" } },
            brandCompetitors: { "Brahma": { value: "13.1%", change: "+0.8pp", changePP: "+0.3pp", trend: "up" }, "Budweiser": { value: "7.4%", change: "+0.4pp", changePP: "+0.2pp", trend: "up" } },
            byCategory: { "Beer": { value: "31.8%", change: "-2.7pp", changePP: "-1.1pp", trend: "down" }, "Cider": { value: "19.2%", change: "-4.1pp", changePP: "-1.6pp", trend: "down" } },
            byChannel: { "Off-trade": { value: "27.2%", change: "+3.4pp", changePP: "+1.4pp", trend: "up" }, "On-trade": { value: "32.5%", change: "-2.6pp", changePP: "-1.0pp", trend: "down" }, "E-commerce": { value: "24.8%", change: "+1.4pp", changePP: "+0.6pp", trend: "up" } },
            byBrand: { "Heineken®": { value: "14.8%", change: "-1.2pp", changePP: "-0.5pp", trend: "down" }, "Amstel®": { value: "7.0%", change: "-0.8pp", changePP: "-0.3pp", trend: "down" }, "Schin®": { value: "3.6%", change: "-0.5pp", changePP: "-0.2pp", trend: "down" } },
          },
          { label: "Penetration", unit: "%", value: "37.5%", change: "-1.5pp", changePP: "-0.6pp", trend: "down", hasCompetitor: true,
            competitors: { "AB InBev": { value: "48.5%", change: "+0.4pp", changePP: "+0.2pp", trend: "up" }, "Carlsberg": { value: "22.1%", change: "-0.6pp", changePP: "-0.2pp", trend: "down" } },
            brandCompetitors: { "Brahma": { value: "28.6%", change: "+0.6pp", changePP: "+0.3pp", trend: "up" }, "Budweiser": { value: "15.2%", change: "-0.2pp", changePP: "-0.1pp", trend: "down" } },
            byBrand: { "Heineken®": { value: "37.5%", change: "-1.5pp", changePP: "-0.6pp", trend: "down" }, "Amstel®": { value: "24.2%", change: "-0.8pp", changePP: "-0.3pp", trend: "down" }, "Schin®": { value: "17%", change: "-1.3pp", changePP: "-0.5pp", trend: "down" } },
          },
          { label: "Gross Margin", unit: "%", value: "60.0%", change: "-0.8pp", changePP: "-0.3pp", trend: "down",
            byBrand: { "Heineken®": { value: "64.2%", change: "-0.6pp", changePP: "-0.2pp", trend: "down" }, "Amstel®": { value: "56.8%", change: "-1.0pp", changePP: "-0.4pp", trend: "down" }, "Schin®": { value: "52.4%", change: "-0.9pp", changePP: "-0.4pp", trend: "down" } },
          },
        ],
      },
      {
        key: "delivering", label: "Are we delivering?",
        metrics: [
          { label: "Volume Growth", unit: "L & %", value: "-2,345 khl", valueAbs: "-2,345 khl", valuePct: "-2.1%", change: "-2.1%", changePP: "-1.0%", trend: "down", hideTrend: true, pctAsMain: true, hasCompetitor: true,
            competitors: { "AB InBev": { value: "-2,470 khl", change: "-1.5%", changePP: "-0.7%", trend: "down" }, "Carlsberg": { value: "-1,120 khl", change: "-1.8%", changePP: "-0.9%", trend: "down" } },
            brandCompetitors: { "Brahma": { value: "-1,420 khl", change: "-1.2%", changePP: "-0.6%", trend: "down" }, "Budweiser": { value: "-780 khl", change: "-1.8%", changePP: "-0.9%", trend: "down" } },
            byCategory: { "Beer": { value: "-2,095 khl", change: "-1.8%", changePP: "-0.9%", trend: "down" }, "Cider": { value: "-250 khl", change: "-3.2%", changePP: "-1.6%", trend: "down" } },
            byChannel: { "Off-trade": { value: "1,408 khl", change: "+2.4%", changePP: "+1.2%", trend: "up" }, "On-trade": { value: "-702 khl", change: "-1.5%", changePP: "-0.8%", trend: "down" }, "E-commerce": { value: "235 khl", change: "+3.2%", changePP: "+1.6%", trend: "up" } },
            byBrand: { "Heineken®": { value: "-680 khl", change: "-0.8%", changePP: "-0.4%", trend: "down" }, "Amstel®": { value: "-420 khl", change: "-1.5%", changePP: "-0.8%", trend: "down" }, "Schin®": { value: "-625 khl", change: "-3.8%", changePP: "-1.9%", trend: "down" } },
            byCustomer: { "Grupo Pão de Açúcar": { value: "-825 khl", change: "-1.8%", changePP: "-0.9%", trend: "down" }, "Carrefour Brasil": { value: "-740 khl", change: "-2.4%", changePP: "-1.2%", trend: "down" }, "Atacadão": { value: "-780 khl", change: "-2.2%", changePP: "-1.1%", trend: "down" } },
          },
          { label: "Value Growth", unit: "€ & %", value: "-€1,195 mln", valueAbs: "-€1,195 mln", valuePct: "-1.6%", change: "-1.6%", changePP: "-0.8%", trend: "down", hideTrend: true, pctAsMain: true, hasCompetitor: true,
            competitors: { "AB InBev": { value: "-€1,100 mln", change: "-1.0%", changePP: "-0.5%", trend: "down" }, "Carlsberg": { value: "-€580 mln", change: "-1.3%", changePP: "-0.6%", trend: "down" } },
            brandCompetitors: { "Brahma": { value: "-€640 mln", change: "-0.8%", changePP: "-0.4%", trend: "down" }, "Budweiser": { value: "-€320 mln", change: "-1.4%", changePP: "-0.7%", trend: "down" } },
            byCategory: { "Beer": { value: "-€1,070 mln", change: "-1.4%", changePP: "-0.7%", trend: "down" }, "Cider": { value: "-€125 mln", change: "-2.4%", changePP: "-1.2%", trend: "down" } },
            byChannel: { "Off-trade": { value: "€648 mln", change: "+1.8%", changePP: "+0.9%", trend: "up" }, "On-trade": { value: "-€390 mln", change: "-1.2%", changePP: "-0.6%", trend: "down" }, "E-commerce": { value: "€157 mln", change: "+2.8%", changePP: "+1.4%", trend: "up" } },
            byBrand: { "Heineken®": { value: "-€380 mln", change: "-0.6%", changePP: "-0.3%", trend: "down" }, "Amstel®": { value: "-€260 mln", change: "-1.2%", changePP: "-0.6%", trend: "down" }, "Schin®": { value: "-€280 mln", change: "-2.8%", changePP: "-1.4%", trend: "down" } },
            byCustomer: { "Grupo Pão de Açúcar": { value: "-€420 mln", change: "-1.4%", changePP: "-0.7%", trend: "down" }, "Carrefour Brasil": { value: "-€380 mln", change: "-1.8%", changePP: "-0.9%", trend: "down" }, "Atacadão": { value: "-€395 mln", change: "-1.6%", changePP: "-0.8%", trend: "down" } },
          },
          { label: "Revenue / HL", unit: "€/HL", value: "€48.8", change: "-4.5%", changePP: "-2.2%", trend: "down", hasCompetitor: true,
            competitors: { "AB InBev": { value: "€42.6", change: "-2.9%", changePP: "-1.4%", trend: "down" }, "Carlsberg": { value: "€51.8", change: "-3.1%", changePP: "-1.5%", trend: "down" } },
            brandCompetitors: { "Brahma": { value: "€32.4", change: "-2.2%", changePP: "-1.1%", trend: "down" }, "Budweiser": { value: "€38.6", change: "-3.4%", changePP: "-1.7%", trend: "down" } },
            byBrand: { "Heineken®": { value: "€48.8", change: "-4.5%", changePP: "-2.2%", trend: "down" }, "Amstel®": { value: "€44.2", change: "-3.8%", changePP: "-1.9%", trend: "down" }, "Schin®": { value: "€28.9", change: "-5.2%", changePP: "-2.6%", trend: "down" } },
            byCustomer: { "Grupo Pão de Açúcar": { value: "€52.1", change: "-3.8%", changePP: "-1.9%", trend: "down" }, "Carrefour Brasil": { value: "€46.3", change: "-5.1%", changePP: "-2.5%", trend: "down" }, "Atacadão": { value: "€44.7", change: "-4.2%", changePP: "-2.1%", trend: "down" } },
          },
          { label: "Operating Profit", unit: "€ & %", value: "€560 mln", valueAbs: "€560 mln", valuePct: "32%", change: "+0.9pp", changePP: "+0.4pp", trend: "up", pctAsMain: true, displayPctPlain: true,
            byBrand: { "Heineken®": { value: "€295 mln", change: "+1.2pp", changePP: "+0.5pp", trend: "up" }, "Amstel®": { value: "€115 mln", change: "+0.6pp", changePP: "+0.2pp", trend: "up" }, "Schin®": { value: "€72 mln", change: "-0.4pp", changePP: "-0.2pp", trend: "down" } },
            byCustomer: { "Grupo Pão de Açúcar": { value: "€198 mln", change: "+1.1pp", changePP: "+0.4pp", trend: "up" }, "Carrefour Brasil": { value: "€176 mln", change: "+0.7pp", changePP: "+0.3pp", trend: "up" }, "Atacadão": { value: "€186 mln", change: "+0.9pp", changePP: "+0.4pp", trend: "up" } },
          },
        ],
      },
    ],
  },
  {
    key: "brand_power",
    label: "Brand Power",
    metrics: [
      { label: "Brand Power", unit: "%", value: "6.5%", change: "+0.3pp", changePP: "+0.1pp", trend: "up", hasCompetitor: true,
        competitors: { "AB InBev": { value: "8.7%", change: "-0.1pp", changePP: "-0.0pp", trend: "down" }, "Carlsberg": { value: "5.2%", change: "+0.2pp", changePP: "+0.1pp", trend: "up" } },
        brandCompetitors: { "Brahma": { value: "4.8%", change: "+0.1pp", changePP: "+0.0pp", trend: "up" }, "Budweiser": { value: "3.2%", change: "-0.2pp", changePP: "-0.1pp", trend: "down" } },
        byBrand: { "Heineken®": { value: "6.5%", change: "+0.3pp", changePP: "+0.1pp", trend: "up" }, "Amstel®": { value: "3.8%", change: "+0.2pp", changePP: "+0.1pp", trend: "up" }, "Schin®": { value: "1.4%", change: "+0.1pp", changePP: "+0.0pp", trend: "up" } },
      },
      { label: "Meaningful", unit: "", value: "120", change: "+3", changePP: "+1", trend: "up", hasCompetitor: true,
        competitors: { "AB InBev": { value: "95", change: "+1", changePP: "+0", trend: "up" }, "Carlsberg": { value: "78", change: "+2", changePP: "+1", trend: "up" } },
        brandCompetitors: { "Brahma": { value: "88", change: "+2", changePP: "+1", trend: "up" }, "Budweiser": { value: "72", change: "+1", changePP: "+0", trend: "up" } },
        byBrand: { "Heineken®": { value: "120", change: "+3", changePP: "+1", trend: "up" }, "Amstel®": { value: "96", change: "+2", changePP: "+1", trend: "up" }, "Schin®": { value: "43", change: "+2", changePP: "+1", trend: "up" } },
      },
      { label: "Different", unit: "", value: "135", change: "+5", changePP: "+2", trend: "up", hasCompetitor: true,
        competitors: { "AB InBev": { value: "78", change: "+2", changePP: "+1", trend: "up" }, "Carlsberg": { value: "65", change: "+3", changePP: "+1", trend: "up" } },
        brandCompetitors: { "Brahma": { value: "62", change: "+1", changePP: "+0", trend: "up" }, "Budweiser": { value: "55", change: "+2", changePP: "+1", trend: "up" } },
        byBrand: { "Heineken®": { value: "135", change: "+5", changePP: "+2", trend: "up" }, "Amstel®": { value: "79", change: "+3", changePP: "+1", trend: "up" }, "Schin®": { value: "47", change: "+1", changePP: "+0", trend: "up" } },
      },
      { label: "Salient", unit: "", value: "110", change: "-2", changePP: "-1", trend: "down", hasCompetitor: true,
        competitors: { "AB InBev": { value: "72", change: "+3", changePP: "+1", trend: "up" }, "Carlsberg": { value: "56", change: "+1", changePP: "+0", trend: "up" } },
        brandCompetitors: { "Brahma": { value: "68", change: "+4", changePP: "+2", trend: "up" }, "Budweiser": { value: "48", change: "+1", changePP: "+0", trend: "up" } },
        byBrand: { "Heineken®": { value: "110", change: "-2", changePP: "-1", trend: "down" }, "Amstel®": { value: "59", change: "+4", changePP: "+2", trend: "up" }, "Schin®": { value: "58", change: "-2", changePP: "-1", trend: "down" } },
      },
    ],
  },
  {
    key: "sales_power",
    label: "Sales Power",
    metrics: [
      { label: "Sales Power", unit: "%", value: "48%", change: "-2.5pp", changePP: "-1.0pp", trend: "down", hasCompetitor: true,
        competitors: { "AB InBev": { value: "45%", change: "+1.0pp", changePP: "+0.4pp", trend: "up" }, "Carlsberg": { value: "30%", change: "+0.8pp", changePP: "+0.3pp", trend: "up" } },
        brandCompetitors: { "Brahma": { value: "38%", change: "+1.2pp", changePP: "+0.5pp", trend: "up" }, "Budweiser": { value: "22%", change: "+0.6pp", changePP: "+0.2pp", trend: "up" } },
        byChannel: { "Off-trade": { value: "44%", change: "+2.8pp", changePP: "+1.1pp", trend: "up" }, "On-trade": { value: "53%", change: "-2.1pp", changePP: "-0.8pp", trend: "down" }, "E-commerce": { value: "35%", change: "+1.2pp", changePP: "+0.5pp", trend: "up" } },
        byRegion: { "Southeast": { value: "52%", change: "-2.2pp", changePP: "-0.9pp", trend: "down" }, "South": { value: "47%", change: "-2.8pp", changePP: "-1.1pp", trend: "down" }, "Northeast": { value: "39%", change: "-3.1pp", changePP: "-1.2pp", trend: "down" }, "Central-West": { value: "44%", change: "-2.4pp", changePP: "-1.0pp", trend: "down" } },
        byBrand: { "Heineken®": { value: "66%", change: "-1.2pp", changePP: "-0.5pp", trend: "down" }, "Amstel®": { value: "42%", change: "-3.4pp", changePP: "-1.4pp", trend: "down" }, "Schin®": { value: "29%", change: "-4.8pp", changePP: "-1.9pp", trend: "down" } },
      },
      { label: "Total Distribution Points", unit: "%", value: "52%", change: "-1.2pp", changePP: "-0.5pp", trend: "down", hasCompetitor: true,
        competitors: { "AB InBev": { value: "48%", change: "-0.6pp", changePP: "-0.2pp", trend: "down" }, "Carlsberg": { value: "28%", change: "-0.4pp", changePP: "-0.2pp", trend: "down" } },
        brandCompetitors: { "Brahma": { value: "42%", change: "-0.4pp", changePP: "-0.2pp", trend: "down" }, "Budweiser": { value: "26%", change: "-0.3pp", changePP: "-0.1pp", trend: "down" } },
        byChannel: { "Off-trade": { value: "49%", change: "+1.5pp", changePP: "+0.6pp", trend: "up" }, "On-trade": { value: "55%", change: "-0.9pp", changePP: "-0.4pp", trend: "down" }, "E-commerce": { value: "32%", change: "+2.1pp", changePP: "+0.8pp", trend: "up" } },
        byRegion: { "Southeast": { value: "56%", change: "-1.0pp", changePP: "-0.4pp", trend: "down" }, "South": { value: "50%", change: "-1.4pp", changePP: "-0.6pp", trend: "down" }, "Northeast": { value: "45%", change: "-1.8pp", changePP: "-0.7pp", trend: "down" }, "Central-West": { value: "47%", change: "-1.3pp", changePP: "-0.5pp", trend: "down" } },
        byBrand: { "Heineken®": { value: "64%", change: "-0.6pp", changePP: "-0.2pp", trend: "down" }, "Amstel®": { value: "53%", change: "+0.8pp", changePP: "+0.3pp", trend: "up" }, "Schin®": { value: "38%", change: "-2.0pp", changePP: "-0.8pp", trend: "down" } },
      },
      { label: "Rate of Sales", unit: "%", value: "40%", change: "-3.1pp", changePP: "-1.2pp", trend: "down", hasCompetitor: true,
        competitors: { "AB InBev": { value: "38%", change: "+0.6pp", changePP: "+0.2pp", trend: "up" }, "Carlsberg": { value: "24%", change: "+0.5pp", changePP: "+0.2pp", trend: "up" } },
        brandCompetitors: { "Brahma": { value: "34%", change: "+0.8pp", changePP: "+0.3pp", trend: "up" }, "Budweiser": { value: "18%", change: "+0.3pp", changePP: "+0.1pp", trend: "up" } },
        byChannel: { "Off-trade": { value: "37%", change: "+3.5pp", changePP: "+1.4pp", trend: "up" }, "On-trade": { value: "44%", change: "-2.6pp", changePP: "-1.0pp", trend: "down" }, "E-commerce": { value: "30%", change: "+1.8pp", changePP: "+0.7pp", trend: "up" } },
        byRegion: { "Southeast": { value: "44%", change: "-2.8pp", changePP: "-1.1pp", trend: "down" }, "South": { value: "38%", change: "-3.4pp", changePP: "-1.4pp", trend: "down" }, "Northeast": { value: "33%", change: "-4.0pp", changePP: "-1.6pp", trend: "down" }, "Central-West": { value: "36%", change: "-3.2pp", changePP: "-1.3pp", trend: "down" } },
        byBrand: { "Heineken®": { value: "40%", change: "-3.1pp", changePP: "-1.2pp", trend: "down" }, "Amstel®": { value: "19%", change: "-4.2pp", changePP: "-1.7pp", trend: "down" }, "Schin®": { value: "36%", change: "-3.8pp", changePP: "-1.5pp", trend: "down" } },
      },
    ],
  },
  {
    key: "commercial_investment",
    label: "Commercial Investment",
    metrics: [
      { label: "ATL", unit: "€ & % of Revenue", value: "€250 mln", valueAbs: "€250 mln", valuePct: "12.5%", change: "+4.7%", changePP: "+2.3%", trend: "up", displayPctPlain: true,
        byCategory: { "Beer": { value: "€215 mln", change: "+5.2%", changePP: "+2.6%", trend: "up" }, "Cider": { value: "€22 mln", change: "+2.8%", changePP: "+1.4%", trend: "up" }, "Spirits": { value: "€13 mln", change: "+3.5%", changePP: "+1.8%", trend: "up" } },
        byBrand: { "Heineken®": { value: "€128 mln", change: "+4.7%", changePP: "+2.3%", trend: "up" }, "Amstel®": { value: "€72 mln", change: "+6.8%", changePP: "+3.4%", trend: "up" }, "Schin®": { value: "€30 mln", change: "+1.5%", changePP: "+0.8%", trend: "up" } },
        byChannel: { "Off-trade": { value: "€75 mln", change: "+3.8%", changePP: "+1.9%", trend: "up" }, "On-trade": { value: "€115 mln", change: "+5.4%", changePP: "+2.7%", trend: "up" }, "E-commerce": { value: "€60 mln", change: "+5.8%", changePP: "+2.9%", trend: "up" } },
      },
      { label: "BTL", unit: "€ & % of Revenue", value: "€120 mln", valueAbs: "€120 mln", valuePct: "6%", change: "+2.4%", changePP: "+1.2%", trend: "up", displayPctPlain: true,
        byCategory: { "Beer": { value: "€98 mln", change: "+2.8%", changePP: "+1.4%", trend: "up" }, "Cider": { value: "€14 mln", change: "+1.5%", changePP: "+0.8%", trend: "up" }, "Spirits": { value: "€8 mln", change: "+1.2%", changePP: "+0.6%", trend: "up" } },
        byBrand: { "Heineken®": { value: "€60 mln", change: "+2.4%", changePP: "+1.2%", trend: "up" }, "Amstel®": { value: "€32 mln", change: "+3.1%", changePP: "+1.5%", trend: "up" }, "Schin®": { value: "€16 mln", change: "+1.2%", changePP: "+0.6%", trend: "up" } },
        byChannel: { "Off-trade": { value: "€65 mln", change: "+2.8%", changePP: "+1.4%", trend: "up" }, "On-trade": { value: "€35 mln", change: "+1.8%", changePP: "+0.9%", trend: "up" }, "E-commerce": { value: "€20 mln", change: "+3.2%", changePP: "+1.6%", trend: "up" } },
      },
      { label: "Promo", unit: "€ & % of Revenue", value: "€390 mln", valueAbs: "€390 mln", valuePct: "19.5%", change: "-1.5%", changePP: "-0.8%", trend: "down", displayPctPlain: true, hasCompetitor: true,
        competitors: { "AB InBev": { value: "€285 mln", change: "-0.6%", changePP: "-0.3%", trend: "down" }, "Carlsberg": { value: "€140 mln", change: "-1.0%", changePP: "-0.5%", trend: "down" } },
        brandCompetitors: { "Brahma": { value: "€170 mln", change: "-0.8%", changePP: "-0.4%", trend: "down" }, "Budweiser": { value: "€115 mln", change: "-1.2%", changePP: "-0.6%", trend: "down" } },
        byCategory: { "Beer": { value: "€318 mln", change: "-1.2%", changePP: "-0.6%", trend: "down" }, "Cider": { value: "€45 mln", change: "-2.1%", changePP: "-1.0%", trend: "down" }, "Spirits": { value: "€27 mln", change: "-1.8%", changePP: "-0.9%", trend: "down" } },
        byBrand: { "Heineken®": { value: "€170 mln", change: "-1.0%", changePP: "-0.5%", trend: "down" }, "Amstel®": { value: "€95 mln", change: "-1.4%", changePP: "-0.7%", trend: "down" }, "Schin®": { value: "€65 mln", change: "-2.2%", changePP: "-1.1%", trend: "down" } },
        byChannel: { "Off-trade": { value: "€190 mln", change: "+1.2%", changePP: "+0.6%", trend: "up" }, "On-trade": { value: "€125 mln", change: "-1.8%", changePP: "-0.9%", trend: "down" }, "E-commerce": { value: "€75 mln", change: "+1.5%", changePP: "+0.8%", trend: "up" } },
      },
    ],
  },
];

const filterOptions: Record<string, string[]> = {
  Category: ["Beer", "Cider"],
  Channel: ["Off-trade", "On-trade", "E-commerce"],
  Brand: ["Heineken®", "Amstel®", "Schin®"],
  Region: ["Southeast", "South", "Northeast", "Central-West"],
  Customer: ["Grupo Pão de Açúcar", "Carrefour Brasil", "Atacadão"],
};

// Beer subcategories shown as nested options in the Category filter
const beerSubcategories = ["Low/No", "Alcoholic"];

// Map Category selected values to data keys (Beer subcategories → "Beer")
function categoryToDataKey(cat: string): string {
  if (cat === "Beer: Low/No" || cat === "Beer: Alcoholic") return "Beer";
  return cat;
}

const allFilterDimensions = ["Category", "Channel", "Brand", "Region", "Customer"];

// --- Category Filter Dropdown (hierarchical: Beer > Low/No, Alcoholic | Cider) ---
function CategoryFilterDropdown({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [beerOpen, setBeerOpen] = useState(true);

  const topOptions = ["Beer", "Cider"];
  const allLeaves = ["Beer: Low/No", "Beer: Alcoholic", "Cider"];
  const noneSelected = selected.length === 0;

  const isLeafChecked = (leaf: string) => noneSelected || selected.includes(leaf);

  // Beer parent state: checked if both subs are selected (or none=all), indeterminate if only one
  const beerSubs = ["Beer: Low/No", "Beer: Alcoholic"];
  const beerSubsChecked = beerSubs.filter((s) => isLeafChecked(s));
  const beerChecked = noneSelected || beerSubsChecked.length === beerSubs.length;
  const beerIndeterminate = !beerChecked && beerSubsChecked.length > 0;
  const ciderChecked = isLeafChecked("Cider");

  const toggleLeaf = (leaf: string) => {
    const current = noneSelected ? [...allLeaves] : [...selected];
    if (current.includes(leaf)) {
      const next = current.filter((s) => s !== leaf);
      onChange(next.length === allLeaves.length ? [] : next);
    } else {
      const next = [...current, leaf];
      onChange(next.length === allLeaves.length ? [] : next);
    }
  };

  const toggleBeer = () => {
    const current = noneSelected ? [...allLeaves] : [...selected];
    const allBeerSelected = beerSubs.every((s) => current.includes(s));
    let next: string[];
    if (allBeerSelected) {
      next = current.filter((s) => !beerSubs.includes(s));
    } else {
      next = [...new Set([...current, ...beerSubs])];
    }
    onChange(next.length === allLeaves.length ? [] : next);
  };

  const toggleAll = () => onChange([]);

  const activeCount = noneSelected ? 0 : selected.length;
  const displayLabel = noneSelected || selected.length === allLeaves.length
    ? "All"
    : selected.length === 1
      ? selected[0].replace("Beer: ", "")
      : `${selected.length} selected`;

  const isActive = !noneSelected && selected.length < allLeaves.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          isActive ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
        }`}
      >
        <Filter size={10} />
        Category: {displayLabel}
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[180px] py-1"
          >
            {/* Select All */}
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted/50 transition-colors">
              <input type="checkbox" checked={noneSelected} onChange={toggleAll} className="accent-[#008200] w-3.5 h-3.5 rounded" />
              <span className={`font-semibold ${noneSelected ? "text-primary" : "text-foreground"}`}>Select All</span>
            </label>
            <div className="h-px bg-border mx-2 my-0.5" />

            {/* Beer parent row */}
            <div className="flex items-center gap-0 px-3 py-1.5 hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={beerChecked}
                ref={(el) => { if (el) el.indeterminate = beerIndeterminate; }}
                onChange={toggleBeer}
                className="accent-[#008200] w-3.5 h-3.5 rounded mr-2 cursor-pointer"
              />
              <span className="text-xs font-semibold text-foreground flex-1 cursor-pointer" onClick={toggleBeer}>Beer</span>
              <button onClick={() => setBeerOpen(!beerOpen)} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown size={10} className={`transition-transform ${beerOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Beer subcategories */}
            <AnimatePresence>
              {beerOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  {beerSubs.map((sub) => (
                    <label key={sub} className="flex items-center gap-2 pl-8 pr-3 py-1 text-xs cursor-pointer hover:bg-muted/50 transition-colors">
                      <input type="checkbox" checked={isLeafChecked(sub)} onChange={() => toggleLeaf(sub)} className="accent-[#008200] w-3 h-3 rounded" />
                      <span className="text-muted-foreground">{sub.replace("Beer: ", "")}</span>
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cider */}
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted/50 transition-colors">
              <input type="checkbox" checked={ciderChecked} onChange={() => toggleLeaf("Cider")} className="accent-[#008200] w-3.5 h-3.5 rounded" />
              <span className="text-foreground">Cider</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Filter Dropdown with checkboxes ---
function FilterDropdown({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === options.length;
  const noneSelected = selected.length === 0;
  const displayLabel = (allSelected || noneSelected) ? "All" : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  const toggleOption = (opt: string) => {
    if (noneSelected) {
      onChange(options.filter((o) => o !== opt));
    } else if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const toggleAll = () => {
    if (allSelected) onChange([]);
    else onChange([...options]);
  };

  const isChecked = (opt: string) => noneSelected || selected.includes(opt);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          !noneSelected && !allSelected ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
        }`}
      >
        <Filter size={10} />
        {label}: {displayLabel}
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[160px] py-1"
          >
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted/50 transition-colors">
              <input type="checkbox" checked={allSelected || noneSelected} onChange={toggleAll} className="accent-[#008200] w-3.5 h-3.5 rounded" />
              <span className={`font-semibold ${(allSelected || noneSelected) ? "text-primary" : "text-foreground"}`}>Select All</span>
            </label>
            <div className="h-px bg-border mx-2 my-0.5" />
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted/50 transition-colors">
                <input type="checkbox" checked={isChecked(opt)} onChange={() => toggleOption(opt)} className="accent-[#008200] w-3.5 h-3.5 rounded" />
                <span className="text-foreground">{opt}</span>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Comparison mode dropdown (single-select) ---
function ComparisonDropdown({ value, onChange }: { value: ComparisonMode; onChange: (v: ComparisonMode) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const selected = compModeOptions.find((o) => o.value === value) ?? compModeOptions[0];
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:border-primary/40 transition-all"
      >
        <RefreshCw size={9} className="text-primary" />
        {selected.label}
        <ChevronDown size={9} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-30 min-w-[170px] py-1 overflow-hidden"
          >
            {compModeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50 ${value === opt.value ? "bg-primary/10" : ""}`}
              >
                <div className={`w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${value === opt.value ? "border-primary bg-primary" : "border-border"}`}>
                  {value === opt.value && <div className="w-1 h-1 rounded-full bg-white" />}
                </div>
                <div>
                  <div className={`text-[10px] font-bold ${value === opt.value ? "text-primary" : "text-foreground"}`}>{opt.label}</div>
                  <div className="text-[9px] text-muted-foreground">{opt.description}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Helper: pick change value based on comparison mode ---
function getChange(d: { change: string; changePP?: string }, compMode: ComparisonMode) {
  if (compMode === "PP" && d.changePP) return d.changePP;
  if (compMode === "AP") {
    // AP = Actual Plan: simulate slight delta vs plan (use changePP as proxy)
    return d.changePP ?? d.change;
  }
  return d.change;
}

// --- Helper: render dual-value (abs + %) for L & % or € & % metrics ---
function DualValue({ metric, valueScale = 1 }: { metric: KpiMetric; valueScale?: number }) {
  const isDual = metric.unit === "L & %" || metric.unit === "€ & %" || metric.unit === "€ & % of Revenue";
  if (isDual && metric.valueAbs && metric.valuePct) {
    if (metric.pctAsMain) {
      const pctDisplay = metric.displayPctPlain ? metric.valuePct.replace(/^[+-]/, "") : metric.valuePct;
      return (
        <div className="mt-0.5">
          <span className="text-lg font-extrabold text-foreground leading-tight">{pctDisplay}</span>
          <span className="ml-1.5 text-[11px] font-semibold text-muted-foreground">({scaleNumericValue(metric.valueAbs, valueScale)})</span>
        </div>
      );
    }
    return (
      <div className="mt-0.5">
        <span className="text-lg font-extrabold text-foreground leading-tight">{scaleNumericValue(metric.valueAbs, valueScale)}</span>
        <span className="ml-1.5 text-[11px] font-semibold text-muted-foreground">({metric.displayPctPlain ? metric.valuePct.replace(/^[+-]/, "") : metric.valuePct})</span>
      </div>
    );
  }
  return <div className="text-lg font-extrabold text-foreground leading-tight mt-0.5">{scaleNumericValue(metric.value, valueScale)}</div>;
}

// --- Compact KPI Card ---
function KpiCard({ metric, filters, showCompetitors, compMode, periodLabel, periodMultiplier, valueScale }: {
  metric: KpiMetric;
  filters: Record<string, string[]>;
  showCompetitors: boolean;
  compMode: ComparisonMode;
  periodLabel: string;
  periodMultiplier: number;
  valueScale: number;
}) {
  // Compute filter multiplier and combine with period valueScale
  const filterMult = computeFilterMultiplier(filters);
  const combinedScale = valueScale * filterMult;

  const rawChange = getChange(metric, compMode);
  const displayChange = scaleChange(rawChange, periodMultiplier);
  const displayTrend = metric.trend;

  const compLabel = compMode === "PP" ? `vs PP (${periodLabel})` : compMode === "YA" ? "vs YA" : "vs PY";

  const trendColorClass = displayTrend === "up" ? "text-[hsl(var(--status-green))]" : displayTrend === "down" ? "text-[hsl(var(--status-red))]" : "text-muted-foreground";
  const showComp = showCompetitors && metric.hasCompetitor && metric.competitors;

  return (
    <div className="bg-card border border-border rounded-lg p-2.5 hover:shadow-md transition-shadow">
      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
        {metric.label}
        {metric.hasCompetitor && <span className="text-accent ml-0.5">*</span>}
      </div>
      {metric.unit && <div className="text-[8px] text-muted-foreground/50">({metric.unit})</div>}
      <DualValue metric={metric} valueScale={combinedScale} />
      {!metric.hideTrend && (
        <div className={`flex items-center gap-1 text-[10px] font-semibold ${trendColorClass}`}>
          <TrendIcon dir={displayTrend} />
          {displayChange} <span className="text-muted-foreground font-normal">{compLabel}</span>
        </div>
      )}
      {metric.hideTrend && (
        <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
          {displayChange} <span className="font-normal">{compLabel}</span>
        </div>
      )}

      {/* Competitor data */}
      {showComp && metric.competitors && (
        <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
          <div className="text-[8px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">Competitors</div>
          {Object.entries(metric.competitors).map(([name, data]) => {
            const tc = data.trend === "up" ? "text-[hsl(var(--status-green))]" : data.trend === "down" ? "text-[hsl(var(--status-red))]" : "text-muted-foreground";
            const rawCompChange = getChange(data, compMode);
            const compChange = scaleChange(rawCompChange, periodMultiplier);
            return (
              <div key={name} className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground font-medium">{name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground">{data.value}</span>
                  <span className={`flex items-center gap-0.5 font-medium ${tc}`}>
                    <TrendIcon dir={data.trend} />
                    {compChange}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Execution steps for Freddy.PERFORM recommended actions ──────────────────

type StepDetail = { step: string; explanation: string; dataLink: string; dataLabel: string };

const performExecutionSteps: Record<string, StepDetail[]> = {
  "Rebalance price-pack architecture to capture premium growth – go to Pricing tool": [
    { step: "Open Pricing tool and map current portfolio against premium segment growth", explanation: "Understanding where the portfolio sits relative to premium growth pockets ensures investment is directed toward the highest-value opportunities.", dataLink: "/pricing", dataLabel: "Pricing Tool" },
    { step: "Identify 2–3 SKUs best positioned for premiumisation", explanation: "Select candidates with strong brand equity scores and headroom in price elasticity to avoid volume cannibalisation.", dataLink: "/pricing", dataLabel: "SKU Analysis" },
    { step: "Model revenue impact of +10% price increase on target SKUs", explanation: "Simulating the revenue and volume trade-off quantifies the financial upside and identifies acceptable elasticity thresholds.", dataLink: "/pricing", dataLabel: "Elasticity Model" },
    { step: "Align with commercial team on phased price ladder rollout", explanation: "A phased approach reduces channel conflict and allows time for trade partners to adjust shelf layouts and promotional planning.", dataLink: "/pricing", dataLabel: "Commercial Plan" },
    { step: "Monitor category volume share weekly post-launch", explanation: "Weekly tracking ensures any unintended volume loss is caught early, enabling rapid course correction.", dataLink: "/pricing", dataLabel: "Volume Tracker" },
  ],
  "Accelerate e-retail shelf investment to close the digital market share gap – go to Trade dashboard": [
    { step: "Open Trade dashboard and isolate e-retail performance by SKU", explanation: "SKU-level e-retail analysis identifies which products are underperforming online and where content or availability gaps exist.", dataLink: "/trade", dataLabel: "Trade Dashboard" },
    { step: "Audit digital shelf content quality (images, descriptions, ratings)", explanation: "Poor digital shelf content directly reduces conversion — auditing against top-performing competitors reveals quick wins.", dataLink: "/trade", dataLabel: "Content Audit" },
    { step: "Identify top 5 e-retail accounts with largest share gap vs. Brahma", explanation: "Focusing on accounts where competitive gap is largest maximises the impact of incremental investment.", dataLink: "/trade", dataLabel: "Account Gap Report" },
    { step: "Submit digital shelf improvement plan to e-commerce team", explanation: "A formal plan creates accountability, aligns resources, and sets measurable targets for content and availability improvements.", dataLink: "/trade", dataLabel: "Improvement Plan" },
    { step: "Set monthly e-retail share target and alert threshold", explanation: "Automated alerts ensure the team is notified immediately if share drops below the improvement trajectory.", dataLink: "/trade", dataLabel: "Share Tracker" },
  ],
  "Reverse Amstel® Volume Market Share acceleration through portfolio rebalance – go to AllocationAI tool": [
    { step: "Open AllocationAI and pull Amstel vs. portfolio spend allocation", explanation: "A baseline view of how Amstel's investment compares to the rest of the portfolio surfaces any imbalance driving the acceleration.", dataLink: "/allocation-ai", dataLabel: "AllocationAI Tool" },
    { step: "Identify whether Amstel growth is cannibalising Heineken® volume", explanation: "Cross-brand cannibalisation analysis reveals whether share gains are truly incremental or internally diluting portfolio margin.", dataLink: "/allocation-ai", dataLabel: "Cannibalisation Report" },
    { step: "Model scenario: reallocate 10% of Amstel BTL to Heineken® ATL", explanation: "This tests whether redirecting below-the-line Amstel spend toward Heineken brand building creates a better net portfolio outcome.", dataLink: "/allocation-ai", dataLabel: "Scenario Modeller" },
    { step: "Run ROI comparison across reallocation scenarios", explanation: "Quantifying ROI per euro across scenarios enables a data-driven decision on the optimal spend mix.", dataLink: "/allocation-ai", dataLabel: "ROI Comparison" },
    { step: "Submit revised allocation plan to Finance for next quarter", explanation: "Formalising the reallocation through the planning process locks the decision into the next budget cycle.", dataLink: "/allocation-ai", dataLabel: "Budget Submission" },
  ],
};

const getPerformSteps = (action: string): StepDetail[] =>
  performExecutionSteps[action] ?? [
    { step: "Review the relevant dashboard data", explanation: "Start with the data to ensure decisions are grounded in current performance.", dataLink: "/", dataLabel: "Dashboard" },
    { step: "Identify key areas requiring attention", explanation: "Prioritize the metrics with the largest gaps.", dataLink: "/", dataLabel: "Analytics" },
    { step: "Prepare action plan with stakeholders", explanation: "Collaborative planning ensures buy-in.", dataLink: "/", dataLabel: "Planning" },
    { step: "Execute recommended changes", explanation: "Implement the agreed actions with clear ownership.", dataLink: "/", dataLabel: "Execution" },
    { step: "Monitor results and iterate", explanation: "Track outcomes weekly and adjust tactics.", dataLink: "/", dataLabel: "Monitoring" },
  ];

const PERFORM_RECOMMENDED_ACTIONS: { insight: string; action: string }[] = [
  {
    insight: "Molson Coors is gaining in Mod. Off-Trade with consistent share pressure (-2pp for HEINEKEN). Asahi's e-retail share (+8%) is growing faster than the channel average — both require a response.",
    action: "Develop counter-strategy for Molson Coors in Mod. Off-Trade and Asahi in e-retail",
  },
  {
    insight: "Innovation Rate at 12.4% above target but Rate of Sales is -3.2% — new SKUs gaining distribution but failing to drive velocity. Risk of future de-listing.",
    action: "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume",
  },
  {
    insight: "Innovation Rate dropped -0.6pp to 8.4% while Commercial Spend grew +15.4% — spend is scaling faster than new product contribution, risking ROI dilution on the core portfolio.",
    action: "Review innovation portfolio ROI vs. core brand spend efficiency",
  },
];

function PerformActionCard({ item, expandedAction, setExpandedAction, expandedReadMore, setExpandedReadMore }: {
  item: typeof PERFORM_RECOMMENDED_ACTIONS[0];
  expandedAction: string | null;
  setExpandedAction: (a: string | null) => void;
  expandedReadMore: string | null;
  setExpandedReadMore: (k: string | null) => void;
}) {
  const isExpanded = expandedAction === item.action;
  const steps = getPerformSteps(item.action);
  const cleanAction = item.action.replace(/\s*–\s*go to\s+.+$/i, "");
  return (
    <div className="rounded-xl overflow-hidden border-2 border-[hsl(var(--status-orange))] bg-status-orange-bg shadow-[0_0_12px_hsl(var(--status-orange)/0.15)]">
      <button
        onClick={() => setExpandedAction(isExpanded ? null : item.action)}
        className="w-full text-left p-3 transition-all space-y-2 hover:bg-[hsl(var(--status-orange))]/10"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle size={13} className="text-[hsl(var(--status-orange))] mt-0.5 shrink-0" />
          <p className="text-foreground leading-snug text-[11px]">{item.insight}</p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <CheckSquare size={12} className={`shrink-0 ${isExpanded ? "text-[hsl(var(--status-orange))]" : "text-muted-foreground"}`} />
          <span className="flex-1 leading-snug font-semibold">{cleanAction}</span>
          <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${
            isExpanded ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}>
            <ChevronRight size={9} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            View Execution
          </span>
        </div>
      </button>
      {/* Execution steps */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="bg-muted/40 border-t border-border px-3.5 py-3 space-y-2">
              <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wide mb-2">Execution Steps</h4>
              {steps.map((s, j) => {
                const rmKey = `${item.action}-${j}`;
                const open = expandedReadMore === rmKey;
                return (
                  <div key={j} className="space-y-1">
                    <div className="flex items-start gap-2 text-[11px] text-foreground/90 leading-snug">
                      <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5">{j + 1}</div>
                      <span>{s.step}</span>
                    </div>
                    <div className="ml-6">
                      <button onClick={() => setExpandedReadMore(open ? null : rmKey)} className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors">
                        <BookOpen size={9} />
                        {open ? "Show less" : "Read more"}
                      </button>
                      <AnimatePresence>
                        {open && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 mb-1">{s.explanation}</p>
                            <a href={s.dataLink} className="inline-flex items-center gap-1 text-[9px] font-bold text-accent hover:text-accent/80 transition-colors">
                              <ExternalLink size={8} />
                              Explore in {s.dataLabel}
                            </a>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end pt-1">
                <button className="flex items-center gap-1.5 text-[10px] font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg px-3 py-1.5 shadow transition-all hover:shadow-md">
                  <Play size={10} />
                  Start Execution
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ExecutivePerformancePageProps {
  region: string;
  period: string;
  onStateChange?: (state: AppState) => void;
}

export default function ExecutivePerformancePage({ region, period, onStateChange }: ExecutivePerformancePageProps) {
  const regionInfo = regionMap[region] || regionMap.BR;
  const periodLabel = periodLabels[period] || "L12w";
  const periodVariant = periodDataVariants[period] ?? periodDataVariants.L12w;
  const periodMultiplier = periodVariant.changeScale;

  const [filters, setFilters] = useState<Record<string, string[]>>({
    Category: [],
    Channel: [],
    Brand: [],
    Region: [],
    Customer: [],
  });

  const setFilterSelected = (dim: string, selected: string[]) => {
    setFilters((prev) => ({ ...prev, [dim]: selected }));
  };

  const [compMode, setCompMode] = useState<ComparisonMode>("PY");
  const [activeTab, setActiveTab] = useState<ActiveTab>("aggregated");
  const [showCompetitors, setShowCompetitors] = useState(false);
  const [bbFilters, setBbFilters] = useState<Record<string, string[]>>({ Category: [], Channel: [], Brand: [] });
  const [bbShowCompetitors, setBbShowCompetitors] = useState(false);
  const [bbCompMode, setBbCompMode] = useState<ComparisonMode>("PY");
  const setBbFilterSelected = (dim: string, selected: string[]) => setBbFilters((prev) => ({ ...prev, [dim]: selected }));
  const [cbFilters, setCbFilters] = useState<Record<string, string[]>>({ Category: [], Brand: [], Channel: [] });
  const [cbCompMode, setCbCompMode] = useState<ComparisonMode>("PY");
  const setCbFilterSelected = (dim: string, selected: string[]) => setCbFilters((prev) => ({ ...prev, [dim]: selected }));
  const [rbFilters, setRbFilters] = useState<Record<string, string[]>>({ Brand: [], Channel: [] });
  const [rbCompMode, setRbCompMode] = useState<ComparisonMode>("PY");
  const setRbFilterSelected = (dim: string, selected: string[]) => setRbFilters((prev) => ({ ...prev, [dim]: selected }));

  return (
    <div className="flex-1 overflow-auto bg-background">
        {/* Header with global filters */}
        <div className="px-4 py-3 border-b border-border bg-card/50 sticky top-0 z-10">

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shadow-sm">
              <span className="text-lg">{regionInfo.flag}</span>
              <span className="font-bold text-xs text-foreground">{regionInfo.name}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="font-bold text-xs text-primary">{periodLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <BarChart3 size={14} className="text-primary" />
              <span className="text-xs font-bold text-foreground">Freddy.PERFORM</span>
            </div>
          </div>
        </div>

        {/* Strategic Navigation Cards – expandable insight panels */}
        <StrategicInsightCards onStateChange={onStateChange} />

        {/* Tabs card */}
        <div className="mx-4 mt-3 border border-border rounded-xl shadow-sm bg-card overflow-hidden">
          {/* Tab headers */}
          <div className="flex border-b border-border bg-muted/30">
            <button
              onClick={() => setActiveTab("aggregated")}
              className={`flex-1 px-4 py-2.5 text-xs font-bold transition-colors ${activeTab === "aggregated" ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Total Market
            </button>
            <button
              onClick={() => setActiveTab("brand_breakdown")}
              className={`flex-1 px-4 py-2.5 text-xs font-bold transition-colors ${activeTab === "brand_breakdown" ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Brand Breakdown
            </button>
            <button
              onClick={() => setActiveTab("channel_breakdown")}
              className={`flex-1 px-4 py-2.5 text-xs font-bold transition-colors ${activeTab === "channel_breakdown" ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Channel Breakdown
            </button>
            <button
              onClick={() => setActiveTab("region_breakdown")}
              className={`flex-1 px-4 py-2.5 text-xs font-bold transition-colors ${activeTab === "region_breakdown" ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Region Breakdown
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "aggregated" ? (
            <div className="p-3 space-y-3">
              {/* Filters inside tab */}
              <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border/50">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Filters:</span>
                <ComparisonDropdown value={compMode} onChange={setCompMode} />
                {/* Category uses hierarchical dropdown */}
                <CategoryFilterDropdown
                  selected={filters.Category}
                  onChange={(v) => setFilterSelected("Category", v)}
                />
                {/* Other dims use generic dropdown */}
                {allFilterDimensions.filter((d) => d !== "Category").map((dim) => (
                  <FilterDropdown
                    key={dim}
                    label={dim}
                    options={filterOptions[dim]}
                    selected={filters[dim]}
                    onChange={(v) => setFilterSelected(dim, v)}
                  />
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showCompetitors}
                      onChange={(e) => setShowCompetitors(e.target.checked)}
                      className="accent-[#008200] w-3.5 h-3.5 rounded"
                    />
                    <span className="text-xs font-semibold text-foreground">Include Competitors</span>
                    <span className="text-[9px] text-muted-foreground">(ABI, Carlsberg)</span>
                  </label>
                </div>
              </div>

              {/* KPI Sections */}
              {kpiSections.map((section) => {
                const color = { bg: "bg-[#008200]", text: "text-white" };
                const isFiltered = (dim: string) => {
                  const sel = filters[dim];
                  if (dim === "Category") {
                    // 3 leaves: Beer: Low/No, Beer: Alcoholic, Cider
                    return sel.length > 0 && sel.length < 3;
                  }
                  return sel.length > 0 && sel.length < (filterOptions[dim]?.length ?? 0);
                };
                const brandActive = isFiltered("Brand");
                const regionActive = isFiltered("Region");
                if (section.key === "category_growth" && (brandActive || regionActive)) return null;
                const channelActive = isFiltered("Channel");
                if (section.key === "brand_power" && (regionActive || channelActive)) return null;
                if (section.key === "commercial_investment" && regionActive) return null;
                if (section.key === "hnk_opco" && regionActive) return null;
                const categoryActive = isFiltered("Category");
                if (section.key === "sales_power" && categoryActive) return null;
                const customerActive = isFiltered("Customer");
                if (customerActive && section.key !== "hnk_opco") return null;

                return (
                  <div key={section.key} className="flex rounded-xl overflow-hidden border border-border shadow-sm">
                    <div className={`${color.bg} ${color.text} flex items-center justify-center px-4 w-[140px] shrink-0`}>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-center leading-tight">{section.label}</span>
                    </div>
                    <div className="flex-1 bg-card/60 p-3">
                      {section.subcategories ? (
                        section.subcategories.map((sub) => {
                          if (customerActive && sub.key !== "delivering") return null;
                          const count = sub.metrics.length;
                          const cols = count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : count === 3 ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-4";
                          return (
                            <div key={sub.key} className="mb-3 last:mb-0">
                              <div className="text-xs font-bold text-foreground mb-2">{sub.label}</div>
                              <div className={`grid ${cols} gap-2.5`}>
                                {sub.metrics.map((m) => (
                                   <KpiCard key={m.label} metric={m} filters={filters} showCompetitors={showCompetitors} compMode={compMode} periodLabel={periodLabel} periodMultiplier={periodMultiplier} valueScale={periodVariant.valueScale} />
                                ))}
                              </div>
                            </div>
                          );
                        })
                      ) : (() => {
                        const count = section.metrics?.length || 0;
                        const cols = count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : count === 3 ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-4";
                        return (
                          <div className={`grid ${cols} gap-2`}>
                            {section.metrics?.map((m) => (
                              <KpiCard key={m.label} metric={m} filters={filters} showCompetitors={showCompetitors} compMode={compMode} periodLabel={periodLabel} periodMultiplier={periodMultiplier} valueScale={periodVariant.valueScale} />
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === "brand_breakdown" ? (
            <div className="p-3 space-y-3">
              {/* Brand Breakdown Filters */}
              <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border/50">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Filters:</span>
                <ComparisonDropdown value={bbCompMode} onChange={setBbCompMode} />
                {(["Category", "Channel"] as const).map((dim) => (
                  <FilterDropdown
                    key={dim}
                    label={dim}
                    options={filterOptions[dim]}
                    selected={bbFilters[dim]}
                    onChange={(v) => setBbFilterSelected(dim, v)}
                  />
                ))}
                <FilterDropdown
                  label="Brand"
                  options={filterOptions.Brand}
                  selected={bbFilters.Brand}
                  onChange={(v) => setBbFilterSelected("Brand", v)}
                />
                <div className="ml-auto flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={bbShowCompetitors}
                      onChange={(e) => setBbShowCompetitors(e.target.checked)}
                      className="accent-[#008200] w-3.5 h-3.5 rounded"
                    />
                    <span className="text-xs font-semibold text-foreground">Include Competitors</span>
                    <span className="text-[9px] text-muted-foreground">(Brahma, Budweiser)</span>
                  </label>
                </div>
              </div>

              {/* Brand Breakdown — section-per-row like Total Market */}
              {(() => {
                const brands = ["Heineken®", "Amstel®", "Schin®"];
                const competitors = ["Brahma", "Budweiser"];
                const bbCombinedScale = periodVariant.valueScale * computeFilterMultiplier(bbFilters);
                const brandColors: Record<string, { header: string; headerText: string; col: string }> = {
                  "Heineken®": { header: "bg-[hsl(138,100%,25.5%)]", headerText: "text-white", col: "bg-[hsl(138,40%,96%)]" },
                  "Amstel®":   { header: "bg-[hsl(0,70%,45%)]",      headerText: "text-white", col: "bg-[hsl(0,40%,97%)]" },
                  "Schin®":    { header: "bg-[hsl(210,70%,45%)]",     headerText: "text-white", col: "bg-[hsl(210,40%,97%)]" },
                };
                const competitorColors: Record<string, { header: string; headerText: string; col: string }> = {
                  "Brahma":    { header: "bg-[hsl(220,60%,35%)]", headerText: "text-white", col: "bg-[hsl(220,30%,97%)]" },
                  "Budweiser": { header: "bg-[hsl(0,70%,35%)]",   headerText: "text-white", col: "bg-[hsl(0,25%,97%)]" },
                };

                // Filter brands based on bbFilters.Brand selection (empty = all)
                const bbBrandSelected = bbFilters["Brand"] ?? [];
                const filteredBrands = bbBrandSelected.length > 0 && bbBrandSelected.length < brands.length
                  ? brands.filter((b) => bbBrandSelected.includes(b))
                  : brands;
                const displayBrands = bbShowCompetitors ? [...filteredBrands, ...competitors] : filteredBrands;
                const getColor = (name: string) => brandColors[name] ?? competitorColors[name];
                const compLabel = bbCompMode === "PP" ? `Δ PP (${periodLabel})` : bbCompMode === "YA" ? "Δ YA" : "Δ PY";

                // Build filtered metric list per section
                const bbIsFiltered = (dim: string) => {
                  const sel = bbFilters[dim];
                  return sel.length > 0 && sel.length < (filterOptions[dim]?.length ?? 0);
                };

                return kpiSections.map((section) => {
                  const allMetrics = section.subcategories
                    ? section.subcategories.flatMap((sub) => sub.metrics)
                    : section.metrics || [];

                  // Filter metrics that have byBrand data
                  let metricsToShow = allMetrics.filter((m) => m.byBrand && Object.keys(m.byBrand).length > 0);

                  // Apply channel/category filters — hide metrics with no matching breakdown data
                  if (bbIsFiltered("Channel")) {
                    metricsToShow = metricsToShow.filter((m) => m.byChannel);
                  }
                  if (bbIsFiltered("Category")) {
                    metricsToShow = metricsToShow.filter((m) => m.byCategory);
                  }

                  if (metricsToShow.length === 0) return null;

                  // Get competitor values per metric
                  const getCompValue = (m: KpiMetric, comp: string) => {
                    const d = m.brandCompetitors?.[comp];
                    return d ?? null;
                  };

                  return (
                    <div key={section.key} className="flex rounded-xl overflow-hidden border border-border shadow-sm">
                      {/* Section label sidebar */}
                      <div className="bg-[#008200] text-white flex items-center justify-center px-3 w-[120px] shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">{section.label}</span>
                      </div>

                      {/* Table area — sticky metric column */}
                      <div className="flex-1 overflow-x-auto bg-card/60">
                        <table className="text-[11px] border-collapse w-full" style={{ tableLayout: "fixed" }}>
                          <colgroup>
                            <col style={{ width: "130px" }} />
                            {displayBrands.map((name) => (
                              <React.Fragment key={name}>
                                <col />
                                <col />
                                <col />
                              </React.Fragment>
                            ))}
                          </colgroup>
                          <thead>
                            <tr className="border-b border-border">
                              <th className="sticky left-0 z-10 text-left py-1.5 px-3 text-[10px] text-muted-foreground font-semibold bg-muted/30 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]"></th>
                              {displayBrands.map((name) => {
                                const bc = getColor(name);
                                return (
                                  <React.Fragment key={name}>
                                    <th colSpan={3} className={`text-center py-1.5 px-1 text-[10px] font-bold ${bc.header} ${bc.headerText} border-l border-white/20`}>
                                      {name}
                                    </th>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                            <tr className="border-b border-border/50">
                              <th className="sticky left-0 z-10 bg-muted/30 py-1 px-3 text-[9px] text-muted-foreground font-semibold text-left shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">Metric</th>
                              {displayBrands.map((name) => {
                                const bc = getColor(name);
                                return (
                                  <React.Fragment key={name}>
                                    <th className={`text-right py-1 px-2 text-[9px] font-semibold border-l border-border/40 ${bc.col} text-muted-foreground`}>{periodLabel}</th>
                                    <th className={`text-right py-1 px-2 text-[9px] font-semibold ${bc.col} text-muted-foreground`}>%</th>
                                    <th className={`text-right py-1 px-2 text-[9px] font-semibold ${bc.col} text-muted-foreground`}>{compLabel}</th>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {metricsToShow.map((m, mIdx) => {
                              const isDual = m.unit === "L & %" || m.unit === "€ & %" || m.unit === "€ & % of Revenue";
                              return (
                                <tr key={m.label} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                  <td className="sticky left-0 z-10 bg-card py-1.5 px-3 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                                    <div className="text-muted-foreground font-medium">{m.label}</div>
                                    {m.unit && <div className="text-[8px] text-muted-foreground/50">({m.unit})</div>}
                                  </td>
                                  {displayBrands.map((name) => {
                                    const bc = getColor(name);
                                    const isBrand = brands.includes(name);
                                    const d = isBrand ? m.byBrand?.[name] : getCompValue(m, name);
                                    const rowTint = mIdx % 2 === 0 ? bc.col : "";
                                    const changeVal = d ? getChange(d, bbCompMode) : null;
                                    if (!d) return (
                                      <React.Fragment key={name}>
                                        <td className={`text-right py-1.5 px-2 text-muted-foreground/30 border-l border-border/30 ${rowTint}`}>–</td>
                                        <td className={`text-right py-1.5 px-2 text-muted-foreground/30 ${rowTint}`}>–</td>
                                        <td className={`text-right py-1.5 px-2 text-muted-foreground/30 ${rowTint}`}>–</td>
                                      </React.Fragment>
                                    );
                                     const tc = d.trend === "up" ? "text-[hsl(var(--status-green))]" : d.trend === "down" ? "text-[hsl(var(--status-red))]" : "text-muted-foreground";
                                     const absVal = isDual ? d.value : d.value;
                                     const pctVal = isDual ? d.change : null;
                                     return (
                                       <React.Fragment key={name}>
                                         <td className={`text-right py-1.5 px-2 font-bold text-foreground border-l border-border/30 ${rowTint}`}>{scaleNumericValue(absVal, bbCombinedScale)}</td>
                                          <td className={`text-right py-1.5 px-2 font-medium text-muted-foreground ${rowTint}`}>{pctVal ?? "—"}</td>
                                          <td className={`text-right py-1.5 px-2 font-medium ${tc} ${rowTint}`}>
                                            <span className="inline-flex items-center gap-0.5">
                                              <TrendIcon dir={d.trend} />
                                              <span className="italic">{changeVal}</span>
                                            </span>
                                          </td>
                                        </React.Fragment>
                                     );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : activeTab === "channel_breakdown" ? (
            <div className="p-3 space-y-3">
              {/* Channel Breakdown Filters */}
              <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border/50">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Filters:</span>
                <ComparisonDropdown value={cbCompMode} onChange={setCbCompMode} />
                <CategoryFilterDropdown
                  selected={cbFilters.Category}
                  onChange={(v) => setCbFilterSelected("Category", v)}
                />
                <FilterDropdown
                  label="Brand"
                  options={filterOptions.Brand}
                  selected={cbFilters.Brand}
                  onChange={(v) => setCbFilterSelected("Brand", v)}
                />
              </div>

              {/* Channel Breakdown table */}
              {(() => {
                const allChannels = ["Off-trade", "On-trade", "E-commerce"];
                const displayCols = allChannels;
                const cbCombinedScale = periodVariant.valueScale * computeFilterMultiplier(cbFilters);

                // Brand filter awareness
                const cbBrandSelected = cbFilters.Brand ?? [];
                const cbActiveBrand = cbBrandSelected.length === 1 ? cbBrandSelected[0] : null;

                // Amstel-specific channel overrides: On-trade (Out of Home) drives volume but with low Sales Power / RoS
                const amstelChannelOverrides: Record<string, Record<string, MetricBreakdown>> = {
                  "Sales Power": {
                    "Off-trade": { value: "42%", change: "-8.1pp", changePP: "-4.0pp", trend: "down" },
                    "On-trade":  { value: "52%", change: "-5.6pp", changePP: "-2.8pp", trend: "down" },
                    "E-commerce": { value: "31%", change: "-3.2pp", changePP: "-1.6pp", trend: "down" },
                  },
                  "Total Distribution Points": {
                    "Off-trade": { value: "54%", change: "-5.4pp", changePP: "-2.7pp", trend: "down" },
                    "On-trade":  { value: "62%", change: "-3.8pp", changePP: "-1.9pp", trend: "down" },
                    "E-commerce": { value: "28%", change: "+1.8pp", changePP: "+0.9pp", trend: "up" },
                  },
                  "Rate of Sales": {
                    "Off-trade": { value: "34", change: "-22.7%", changePP: "-11.1%", trend: "down" },
                    "On-trade":  { value: "44", change: "-14.2%", changePP: "-7.0%", trend: "down" },
                    "E-commerce": { value: "48", change: "-12.3%", changePP: "-6.0%", trend: "down" },
                  },
                  "Volume Growth": {
                    "Off-trade": { value: "189 khl", change: "+28.1%", changePP: "+13.8%", trend: "up" },
                    "On-trade":  { value: "508 khl", change: "+68.2%", changePP: "+33.5%", trend: "up" },
                    "E-commerce": { value: "111 khl", change: "+42.6%", changePP: "+20.9%", trend: "up" },
                  },
                  "Value Growth": {
                    "Off-trade": { value: "€28 mln", change: "+22.4%", changePP: "+11.0%", trend: "up" },
                    "On-trade":  { value: "€68 mln", change: "+71.8%", changePP: "+35.2%", trend: "up" },
                    "E-commerce": { value: "€22 mln", change: "+38.6%", changePP: "+18.9%", trend: "up" },
                  },
                  "ATL": {
                    "Off-trade": { value: "€1.6 mln", change: "+48.2%", changePP: "+23.7%", trend: "up" },
                    "On-trade":  { value: "€2.1 mln", change: "+52.6%", changePP: "+25.8%", trend: "up" },
                    "E-commerce": { value: "€0.4 mln", change: "+36.4%", changePP: "+17.9%", trend: "up" },
                  },
                };

                function getChannelDataForBrand(m: KpiMetric, channelName: string): MetricBreakdown | undefined {
                  if (cbActiveBrand === "Amstel®" && amstelChannelOverrides[m.label]?.[channelName]) {
                    return amstelChannelOverrides[m.label][channelName];
                  }
                  if (cbActiveBrand && m.byBrand?.[cbActiveBrand]) {
                    // Scale channel data by brand share
                    const baseChannel = m.byChannel?.[channelName];
                    if (!baseChannel) return undefined;
                    const brandData = m.byBrand[cbActiveBrand];
                    const totalNum = parseFloat(m.value.replace(/[^\d.-]/g, ""));
                    const brandNum = parseFloat(brandData.value.replace(/[^\d.-]/g, ""));
                    const channelNum = parseFloat(baseChannel.value.replace(/[^\d.-]/g, ""));
                    const scale = totalNum > 0 ? brandNum / totalNum : 1;
                    const scaledNum = channelNum * scale;
                    const prefix = baseChannel.value.match(/^[€£$]/) ? baseChannel.value.match(/^[€£$]/)?.[0] ?? "" : "";
                    const suffix = baseChannel.value.match(/(%|khl|mln|pp)$/) ? baseChannel.value.match(/(%|khl|mln|pp)$/)?.[0] ?? "" : "";
                    const scaledVal = scaledNum < 10
                      ? `${prefix}${scaledNum.toFixed(1)}${suffix}`
                      : `${prefix}${Math.round(scaledNum)}${suffix}`;
                    return {
                      value: scaledVal,
                      change: brandData.change,
                      changePP: brandData.changePP,
                      trend: brandData.trend,
                    };
                  }
                  return m.byChannel?.[channelName];
                }
                const channelColors: Record<string, { header: string; headerText: string; col: string }> = {
                  "Off-trade":   { header: "bg-[hsl(210,60%,35%)]", headerText: "text-white", col: "bg-[hsl(210,30%,97%)]" },
                  "On-trade":    { header: "bg-[hsl(260,50%,40%)]", headerText: "text-white", col: "bg-[hsl(260,25%,97%)]" },
                  "E-commerce":  { header: "bg-[hsl(28,80%,38%)]",  headerText: "text-white", col: "bg-[hsl(28,40%,97%)]" },
                };
                const getColColor = (name: string) => channelColors[name];
                const cbCompLabel = cbCompMode === "PP" ? "Δ PP" : cbCompMode === "YA" ? "Δ YA" : "Δ PY";

                return kpiSections.map((section) => {
                  const allMetrics = section.subcategories
                    ? section.subcategories.flatMap((sub) => sub.metrics)
                    : section.metrics || [];

                  const metricsToShow = allMetrics.filter((m) => m.byChannel && Object.keys(m.byChannel).length > 0);
                  if (metricsToShow.length === 0) return null;

                  return (
                    <div key={section.key} className="flex rounded-xl overflow-hidden border border-border shadow-sm">
                      <div className="bg-[#008200] text-white flex items-center justify-center px-3 w-[120px] shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">{section.label}</span>
                      </div>
                      <div className="flex-1 overflow-x-auto bg-card/60">
                        <table className="text-[11px] border-collapse w-full" style={{ tableLayout: "fixed" }}>
                          <colgroup>
                            <col style={{ width: "130px" }} />
                            {displayCols.map((name) => (
                              <React.Fragment key={name}>
                                <col />
                                <col />
                                <col />
                              </React.Fragment>
                            ))}
                          </colgroup>
                          <thead>
                            <tr className="border-b border-border">
                              <th className="sticky left-0 z-10 text-left py-1.5 px-3 text-[10px] text-muted-foreground font-semibold bg-muted/30 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                                {cbActiveBrand && (
                                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                                    {cbActiveBrand}
                                  </span>
                                )}
                              </th>
                              {displayCols.map((name) => {
                                const cc = getColColor(name);
                                return (
                                  <React.Fragment key={name}>
                                    <th colSpan={3} className={`text-center py-1.5 px-1 text-[10px] font-bold ${cc.header} ${cc.headerText} border-l border-white/20`}>
                                      {name}
                                    </th>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                            <tr className="border-b border-border/50">
                              <th className="sticky left-0 z-10 bg-muted/30 py-1 px-3 text-[9px] text-muted-foreground font-semibold text-left shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">Metric</th>
                              {displayCols.map((name) => {
                                const cc = getColColor(name);
                                return (
                                  <React.Fragment key={name}>
                                    <th className={`text-right py-1 px-2 text-[9px] font-semibold border-l border-border/40 ${cc.col} text-muted-foreground`}>{periodLabel}</th>
                                    <th className={`text-right py-1 px-2 text-[9px] font-semibold ${cc.col} text-muted-foreground`}>%</th>
                                    <th className={`text-right py-1 px-2 text-[9px] font-semibold ${cc.col} text-muted-foreground`}>{cbCompLabel}</th>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {metricsToShow.map((m, mIdx) => {
                              const isDual = m.unit === "L & %" || m.unit === "€ & %" || m.unit === "€ & % of Revenue";
                              return (
                                <tr key={m.label} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                  <td className="sticky left-0 z-10 bg-card py-1.5 px-3 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                                    <div className="text-muted-foreground font-medium">{m.label}</div>
                                    {m.unit && <div className="text-[8px] text-muted-foreground/50">({m.unit})</div>}
                                  </td>
                                  {displayCols.map((colName) => {
                                    const cc = getColColor(colName);
                                    const d = getChannelDataForBrand(m, colName);
                                    const rowTint = mIdx % 2 === 0 ? cc.col : "";
                                    const changeVal = d ? getChange(d, cbCompMode) : null;
                                    if (!d) return (
                                      <React.Fragment key={colName}>
                                        <td className={`text-right py-1.5 px-2 text-muted-foreground/30 border-l border-border/30 ${rowTint}`}>–</td>
                                        <td className={`text-right py-1.5 px-2 text-muted-foreground/30 ${rowTint}`}>–</td>
                                        <td className={`text-right py-1.5 px-2 text-muted-foreground/30 ${rowTint}`}>–</td>
                                      </React.Fragment>
                                    );
                                     const tc = d.trend === "up" ? "text-[hsl(var(--status-green))]" : d.trend === "down" ? "text-[hsl(var(--status-red))]" : "text-muted-foreground";
                                     const absVal = d.value;
                                     const pctVal = isDual ? d.change : null;
                                     return (
                                       <React.Fragment key={colName}>
                                         <td className={`text-right py-1.5 px-2 font-bold text-foreground border-l border-border/30 ${rowTint}`}>{scaleNumericValue(absVal, cbCombinedScale)}</td>
                                         <td className={`text-right py-1.5 px-2 font-medium text-muted-foreground ${rowTint}`}>{pctVal ?? "—"}</td>
                                         <td className={`text-right py-1.5 px-2 font-medium ${tc} ${rowTint}`}>
                                           <span className="inline-flex items-center gap-0.5">
                                             <TrendIcon dir={d.trend} />
                                             <span className="italic">{changeVal}</span>
                                           </span>
                                         </td>
                                       </React.Fragment>
                                     );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : activeTab === "region_breakdown" ? (
            <div className="p-3 space-y-3">
              {/* Region Breakdown Filters */}
              <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border/50">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Filters:</span>
                <ComparisonDropdown value={rbCompMode} onChange={setRbCompMode} />
                <FilterDropdown
                  label="Brand"
                  options={filterOptions.Brand}
                  selected={rbFilters.Brand}
                  onChange={(v) => setRbFilterSelected("Brand", v)}
                />
                <FilterDropdown
                  label="Channel"
                  options={filterOptions.Channel}
                  selected={rbFilters.Channel}
                  onChange={(v) => setRbFilterSelected("Channel", v)}
                />
              </div>

              {/* Region Breakdown table */}
              {(() => {
                const allRegions = ["Southeast", "South", "Northeast", "Central-West"];
                const rbCombinedScale = periodVariant.valueScale * computeFilterMultiplier(rbFilters);
                const regionColors: Record<string, { header: string; headerText: string; col: string }> = {
                  "Southeast":    { header: "bg-[hsl(138,60%,28%)]", headerText: "text-white", col: "bg-[hsl(138,30%,97%)]" },
                  "South":        { header: "bg-[hsl(200,60%,35%)]", headerText: "text-white", col: "bg-[hsl(200,30%,97%)]" },
                  "Northeast":    { header: "bg-[hsl(35,70%,38%)]",  headerText: "text-white", col: "bg-[hsl(35,40%,97%)]" },
                  "Central-West": { header: "bg-[hsl(270,45%,42%)]", headerText: "text-white", col: "bg-[hsl(270,25%,97%)]" },
                };
                const getRegColor = (name: string) => regionColors[name];
                const rbCompLabel = rbCompMode === "PP" ? "Δ PP" : rbCompMode === "YA" ? "Δ YA" : rbCompMode === "AP" ? "Δ AP" : "Δ PY";

                // Resolve active brand/channel filter keys (single selection takes priority)
                const rbBrandSelected = rbFilters.Brand ?? [];
                const rbChannelSelected = rbFilters.Channel ?? [];
                const activeBrand = rbBrandSelected.length === 1 ? rbBrandSelected[0] : null;
                const activeChannel = rbChannelSelected.length === 1 ? rbChannelSelected[0] : null;

                // Given a metric, compute a scale factor from brand/channel filter vs total.
                // Priority: Brand > Channel. Returns { valueScale, changeOffset }.
                function getFilteredRegionData(m: KpiMetric, baseRegionData: MetricBreakdown): MetricBreakdown {
                  // Try brand first
                  if (activeBrand && m.byBrand?.[activeBrand]) {
                    const brandData = m.byBrand[activeBrand]!;
                    // Derive a plausible region value scaled by brand share of total
                    const totalNum = parseFloat(m.value.replace(/[^\d.-]/g, ""));
                    const brandNum = parseFloat(brandData.value.replace(/[^\d.-]/g, ""));
                    const regionNum = parseFloat(baseRegionData.value.replace(/[^\d.-]/g, ""));
                    const scale = totalNum > 0 ? brandNum / totalNum : 1;
                    const scaledNum = regionNum * scale;
                    // Format preserving prefix/suffix
                    const prefix = m.value.match(/^[€£$]/) ? m.value.match(/^[€£$]/)?.[0] ?? "" : "";
                    const suffix = baseRegionData.value.match(/(%|khl|mln|pp)$/) ? baseRegionData.value.match(/(%|khl|mln|pp)$/)?.[0] ?? "" : "";
                    const scaledVal = scaledNum < 10
                      ? `${prefix}${scaledNum.toFixed(1)}${suffix}`
                      : `${prefix}${Math.round(scaledNum)}${suffix}`;
                    // Scale the change values similarly using brand's change trend
                    return {
                      value: scaledVal,
                      change: brandData.change,
                      changePP: brandData.changePP,
                      trend: brandData.trend,
                    };
                  }
                  // Then channel
                  if (activeChannel && m.byChannel?.[activeChannel]) {
                    const channelData = m.byChannel[activeChannel]!;
                    const totalNum = parseFloat(m.value.replace(/[^\d.-]/g, ""));
                    const channelNum = parseFloat(channelData.value.replace(/[^\d.-]/g, ""));
                    const regionNum = parseFloat(baseRegionData.value.replace(/[^\d.-]/g, ""));
                    const scale = totalNum > 0 ? channelNum / totalNum : 1;
                    const scaledNum = regionNum * scale;
                    const prefix = m.value.match(/^[€£$]/) ? m.value.match(/^[€£$]/)?.[0] ?? "" : "";
                    const suffix = baseRegionData.value.match(/(%|khl|mln|pp)$/) ? baseRegionData.value.match(/(%|khl|mln|pp)$/)?.[0] ?? "" : "";
                    const scaledVal = scaledNum < 10
                      ? `${prefix}${scaledNum.toFixed(1)}${suffix}`
                      : `${prefix}${Math.round(scaledNum)}${suffix}`;
                    return {
                      value: scaledVal,
                      change: channelData.change,
                      changePP: channelData.changePP,
                      trend: channelData.trend,
                    };
                  }
                  return baseRegionData;
                }

                // Active filter label for header annotation
                const filterLabel = activeBrand
                  ? activeBrand
                  : activeChannel
                  ? activeChannel
                  : null;

                return kpiSections.map((section) => {
                  const allMetrics = section.subcategories
                    ? section.subcategories.flatMap((sub) => sub.metrics)
                    : section.metrics || [];

                  const metricsToShow = allMetrics.filter((m) => m.byRegion && Object.keys(m.byRegion).length > 0);
                  if (metricsToShow.length === 0) return null;

                  return (
                    <div key={section.key} className="flex rounded-xl overflow-hidden border border-border shadow-sm">
                      <div className="bg-[#008200] text-white flex items-center justify-center px-3 w-[120px] shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">{section.label}</span>
                      </div>
                      <div className="flex-1 overflow-x-auto bg-card/60">
                        <table className="text-[11px] border-collapse w-full" style={{ tableLayout: "fixed" }}>
                          <colgroup>
                            <col style={{ width: "130px" }} />
                            {allRegions.map((name) => (
                              <React.Fragment key={name}>
                                <col />
                                <col />
                                <col />
                              </React.Fragment>
                            ))}
                          </colgroup>
                          <thead>
                            <tr className="border-b border-border">
                              <th className="sticky left-0 z-10 text-left py-1.5 px-3 text-[10px] text-muted-foreground font-semibold bg-muted/30 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                                {filterLabel && (
                                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                                    {filterLabel}
                                  </span>
                                )}
                              </th>
                              {allRegions.map((name) => {
                                const rc = getRegColor(name);
                                return (
                                  <React.Fragment key={name}>
                                    <th colSpan={3} className={`text-center py-1.5 px-1 text-[10px] font-bold ${rc.header} ${rc.headerText} border-l border-white/20`}>
                                      {name}
                                    </th>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                            <tr className="border-b border-border/50">
                              <th className="sticky left-0 z-10 bg-muted/30 py-1 px-3 text-[9px] text-muted-foreground font-semibold text-left shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">Metric</th>
                              {allRegions.map((name) => {
                                const rc = getRegColor(name);
                                return (
                                  <React.Fragment key={name}>
                                    <th className={`text-right py-1 px-2 text-[9px] font-semibold border-l border-border/40 ${rc.col} text-muted-foreground`}>{periodLabel}</th>
                                    <th className={`text-right py-1 px-2 text-[9px] font-semibold ${rc.col} text-muted-foreground`}>%</th>
                                    <th className={`text-right py-1 px-2 text-[9px] font-semibold ${rc.col} text-muted-foreground`}>{rbCompLabel}</th>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {metricsToShow.map((m, mIdx) => {
                              const isDual = m.unit === "L & %" || m.unit === "€ & %" || m.unit === "€ & % of Revenue";
                              return (
                                <tr key={m.label} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                  <td className="sticky left-0 z-10 bg-card py-1.5 px-3 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                                    <div className="text-muted-foreground font-medium">{m.label}</div>
                                    {m.unit && <div className="text-[8px] text-muted-foreground/50">({m.unit})</div>}
                                  </td>
                                  {allRegions.map((regName) => {
                                    const rc = getRegColor(regName);
                                    const baseD = m.byRegion?.[regName];
                                    const d = baseD ? getFilteredRegionData(m, baseD) : undefined;
                                    const rowTint = mIdx % 2 === 0 ? rc.col : "";
                                    const changeVal = d ? getChange(d, rbCompMode) : null;
                                    if (!d) return (
                                      <React.Fragment key={regName}>
                                        <td className={`text-right py-1.5 px-2 text-muted-foreground/30 border-l border-border/30 ${rowTint}`}>–</td>
                                        <td className={`text-right py-1.5 px-2 text-muted-foreground/30 ${rowTint}`}>–</td>
                                        <td className={`text-right py-1.5 px-2 text-muted-foreground/30 ${rowTint}`}>–</td>
                                      </React.Fragment>
                                    );
                                    const tc = d.trend === "up" ? "text-[hsl(var(--status-green))]" : d.trend === "down" ? "text-[hsl(var(--status-red))]" : "text-muted-foreground";
                                    const absVal = d.value;
                                    const pctVal = isDual ? d.change : null;
                                    return (
                                      <React.Fragment key={regName}>
                                        <td className={`text-right py-1.5 px-2 font-bold text-foreground border-l border-border/30 ${rowTint}`}>{scaleNumericValue(absVal, rbCombinedScale)}</td>
                                        <td className={`text-right py-1.5 px-2 font-medium text-muted-foreground ${rowTint}`}>{pctVal ?? "—"}</td>
                                        <td className={`text-right py-1.5 px-2 font-medium ${tc} ${rowTint}`}>
                                          <span className="inline-flex items-center gap-0.5">
                                            <TrendIcon dir={d.trend} />
                                            <span className="italic">{changeVal}</span>
                                          </span>
                                        </td>
                                      </React.Fragment>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : null}
        </div>
    </div>
  );
}

// ─── Strategic Insight Cards (expandable homepage panels) ────────────────

const STRATEGIC_INSIGHTS: {
  state: AppState;
  label: string;
  icon: React.ElementType;
  color: string;
  colorBg: string;
  colorBorder: string;
  summary: string;
  insights: { text: string; severity: "info" | "warning" | "action" }[];
  navigateLabel: string;
  alertCount?: number;
}[] = [
  {
    state: "shared_reality",
    label: "Shared Reality",
    icon: Map,
    color: "hsl(210,50%,45%)",
    colorBg: "hsl(210,50%,96%)",
    colorBorder: "hsl(210,40%,80%)",
    summary: "Insights and trends covering our company, competition, categories, channels, and consumers",
    navigateLabel: "Open Shared Reality",
    alertCount: 2,
    insights: [
      { text: "Amstel® Sales Power is lagging in On-Trade (-1.8 pts vs PY), where 42% of its volume is concentrated. ATL spend on Amstel is underperforming with ROI at €0.92 — below the €1.50 threshold. Reallocating ATL budget toward On-Trade activations could recover Sales Power.", severity: "warning" },
      { text: "AB InBev is gaining +3pp value share while HEINEKEN is losing -1.5pp — the competitive gap is narrowing. AB InBev is increasing investment in Mainstream where they hold 32% share vs HEINEKEN's 14%. Defend the flank to prevent further share erosion.", severity: "warning" },
    ],
  },
  {
    state: "where_to_play",
    label: "Where to Play",
    icon: Target,
    color: "hsl(138,70%,28%)",
    colorBg: "hsl(138,40%,96%)",
    colorBorder: "hsl(138,40%,78%)",
    summary: "Prioritized opportunities, including demand spaces and repertoires",
    navigateLabel: "Open Where to Play",
    alertCount: 1,
    insights: [
      { text: "Connect & Celebrate is the fastest-growing demand space (+22% YoY) — Heineken holds only 38% share vs. 61% in adjacent segments.", severity: "warning" },
      { text: "Premium Lager repertoire accounts for 34% of category volume — highest share segment with stable growth.", severity: "info" },
    ],
  },
  {
    state: "how_to_win",
    label: "How to Win",
    icon: Trophy,
    color: "hsl(270,40%,48%)",
    colorBg: "hsl(270,30%,96%)",
    colorBorder: "hsl(270,30%,80%)",
    summary: "Insights supporting strategic choices along our 9 Must-Win-Battles",
    navigateLabel: "Open How to Win",
    alertCount: 1,
    insights: [
      { text: "Battle #5 flagged: Innovation Silver from Heineken impacts Original core volume — high cannibalization detected.", severity: "warning" },
      { text: "Penetration growing at +4.2% and volume growth at +18.5% — strong top-line momentum.", severity: "info" },
    ],
  },
  {
    state: "excellent_execution",
    label: "Executional Excellence",
    icon: ZapIcon,
    color: "hsl(35,55%,42%)",
    colorBg: "hsl(35,40%,96%)",
    colorBorder: "hsl(35,40%,78%)",
    summary: "Insights and tools supporting you in the day-to-day activities and choices to execute on our strategy",
    navigateLabel: "Open Executional Excellence",
    alertCount: 1,
    insights: [
      { text: "Opportunity to boost on-trade sales for Amstel through BTL execution — Amstel's On-Trade visibility is the weakest in portfolio at 52% POSM coverage. Shifting ATL budget to BTL would improve ROI and Sales Power.", severity: "warning" },
    ],
  },
];

function StrategicInsightCards({ onStateChange }: { onStateChange?: (state: AppState) => void }) {
  const [expandedCard, setExpandedCard] = useState<AppState | null>(null);
  const activeCard = STRATEGIC_INSIGHTS.find((c) => c.state === expandedCard);

  return (
    <div className="mx-4 mt-3 space-y-2.5">
      {/* Card row */}
      <div className="grid grid-cols-4 gap-2.5">
        {STRATEGIC_INSIGHTS.map((card) => {
          const Icon = card.icon;
          const isExpanded = expandedCard === card.state;

          return (
            <button
              key={card.state}
              onClick={() => setExpandedCard(isExpanded ? null : card.state)}
              className="rounded-xl border-2 p-3 text-left transition-all duration-200 hover:shadow-md cursor-pointer"
              style={{
                borderColor: isExpanded ? card.color : card.colorBorder,
                background: card.colorBg,
                boxShadow: isExpanded ? `0 0 0 1px ${card.color}` : undefined,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: card.color }}>
                  <Icon size={13} color="white" />
                </div>
                <span className="text-[11px] font-bold flex-1" style={{ color: card.color }}>{card.label}</span>
                {card.alertCount && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[hsl(30,100%,94%)] text-[hsl(30,80%,40%)] border border-[hsl(30,70%,82%)]">
                    <AlertTriangle size={9} /> {card.alertCount} alert{card.alertCount > 1 ? "s" : ""}
                  </span>
                )}
                <ChevronDown
                  size={12}
                  className="transition-transform duration-200 shrink-0"
                  style={{ color: card.color, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug mt-2">{card.summary}</p>
            </button>
          );
        })}
      </div>

      {/* Full-width insight panel below all cards */}
      <AnimatePresence mode="wait">
        {activeCard && (
          <motion.div
            key={activeCard.state}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: activeCard.colorBorder, background: activeCard.colorBg }}
          >
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Key Insights</p>
                <button
                  onClick={() => onStateChange?.(activeCard.state)}
                  className="flex items-center gap-1 text-[10px] font-bold transition-colors hover:underline"
                  style={{ color: activeCard.color }}
                >
                  {activeCard.navigateLabel} <ChevronRight size={10} />
                </button>
              </div>
              {activeCard.insights.map((ins, j) => (
                <div
                  key={j}
                  className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
                  style={{
                    background: ins.severity === "warning"
                      ? "hsl(30,100%,96%)"
                      : ins.severity === "action"
                        ? "hsl(138,50%,96%)"
                        : "hsl(210,30%,96%)",
                    border: `1px solid ${
                      ins.severity === "warning"
                        ? "hsl(30,70%,82%)"
                        : ins.severity === "action"
                          ? "hsl(138,40%,80%)"
                          : "hsl(210,30%,85%)"
                    }`,
                  }}
                >
                  {ins.severity === "warning" && <AlertTriangle size={13} className="text-[hsl(30,80%,50%)] mt-0.5 shrink-0" />}
                  {ins.severity === "action" && <ZapIcon size={13} className="text-[hsl(138,60%,35%)] mt-0.5 shrink-0" />}
                  {ins.severity === "info" && <BarChart2 size={13} className="text-[hsl(210,50%,50%)] mt-0.5 shrink-0" />}
                  <p className="text-[11px] leading-relaxed text-foreground/80">{ins.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

