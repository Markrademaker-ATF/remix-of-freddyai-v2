import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  BarChart3,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Map,
  Target,
  Trophy,
  Zap as ZapIcon,
  BarChart2,
} from "lucide-react";
import type { AppState } from "@/data/mockData";

// ─── Types & helpers ─────────────────────────────────────────────────────────

type ComparisonMode = "PY" | "PP" | "YA" | "AP";
type ActiveTab = "aggregated" | "brand_breakdown" | "channel_breakdown" | "region_breakdown";
type TrendDir = "up" | "down" | "flat" | "none";

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
    ? Math.round(scaled).toLocaleString("en-US")
    : scaled.toFixed(raw < 10 ? 1 : 0);
  return `${neg}${prefix}${formatted}${suffix}`;
}

function computeFilterMultiplier(filters: Record<string, string[]>): number {
  let mult = 1.0;
  const catSel = filters["Category"] ?? [];
  if (catSel.length > 0) {
    const beerOn = catSel.includes("Beer: Low/No") || catSel.includes("Beer: Alcoholic");
    const ciderOn = catSel.includes("Cider");
    if (!beerOn) mult -= 4 / 5;
    if (!ciderOn) mult -= 1 / 5;
  }
  const chanSel = filters["Channel"] ?? [];
  if (chanSel.length > 0 && chanSel.length < 3) {
    if (!chanSel.includes("Off-trade")) mult -= 1 / 4;
    if (!chanSel.includes("On-trade")) mult -= 1 / 4;
    if (!chanSel.includes("E-commerce")) mult -= 1 / 2;
  }
  const brandSel = filters["Brand"] ?? [];
  if (brandSel.length > 0 && brandSel.length < 3) {
    const allBrands = ["Heineken®", "Amstel®", "Schin®"];
    const offCount = allBrands.filter((b) => !brandSel.includes(b)).length;
    mult -= offCount * (1 / 3);
  }
  const regSel = filters["Region"] ?? [];
  if (regSel.length > 0 && regSel.length < 4) {
    const allRegs = ["Southeast", "South", "Northeast", "Central-West"];
    const offCount = allRegs.filter((r) => !regSel.includes(r)).length;
    mult -= offCount * (1 / 4);
  }
  return Math.max(0, mult);
}

function TrendIcon({ dir, className = "" }: { dir: TrendDir; className?: string }) {
  if (dir === "up") return <TrendingUp size={12} className={`text-[hsl(var(--status-green))] ${className}`} />;
  if (dir === "down") return <TrendingDown size={12} className={`text-[hsl(var(--status-red))] ${className}`} />;
  if (dir === "flat") return <Minus size={12} className={`text-muted-foreground ${className}`} />;
  return null;
}

interface CompetitorData { value: string; change: string; changePP?: string; trend: TrendDir; }
interface MetricBreakdown { value: string; change: string; changePP?: string; trend: TrendDir; }

interface KpiMetric {
  label: string;
  unit: string;
  value: string;
  valueAbs?: string;
  valuePct?: string;
  change: string;
  changePP?: string;
  trend: TrendDir;
  hideTrend?: boolean;
  pctAsMain?: boolean;
  displayPctPlain?: boolean;
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

// ─── GREEN-readiness scope (Metric Inventory) ────────────────────────────────
// Kept: Are We Winning? (Vol MS, Val MS, Gross Margin), Are We Delivering?
// (Vol Growth, Val Growth, Revenue/HL, Operating Profit), Brand Power pillars,
// Commercial Investment (ATL, BTL, Promo).
// Removed: Category Growth (not in inventory), Penetration (RED),
// Sales Power family (AMBER).
const kpiSections: KpiSection[] = [
  {
    key: "hnk_opco",
    label: "Are we winning? / delivering?",
    subcategories: [
      {
        key: "winning",
        label: "Are we winning?",
        metrics: [
          {
            label: "Volume Market Share", unit: "%", value: "31.2%", change: "-2.5pp", changePP: "-1.0pp", trend: "down", hasCompetitor: true,
            competitors: { "AB InBev": { value: "26.4%", change: "-0.2pp", changePP: "-0.1pp", trend: "down" }, "Carlsberg": { value: "12.8%", change: "+0.3pp", changePP: "+0.1pp", trend: "up" } },
            brandCompetitors: { "Brahma": { value: "14.2%", change: "+0.5pp", changePP: "+0.2pp", trend: "up" }, "Budweiser": { value: "8.6%", change: "-0.3pp", changePP: "-0.1pp", trend: "down" } },
            byCategory: { "Beer": { value: "33.5%", change: "-2.1pp", changePP: "-0.8pp", trend: "down" }, "Cider": { value: "18.4%", change: "-3.2pp", changePP: "-1.3pp", trend: "down" } },
            byChannel: { "Off-trade": { value: "29.5%", change: "+2.8pp", changePP: "+1.1pp", trend: "up" }, "On-trade": { value: "34.1%", change: "-1.9pp", changePP: "-0.8pp", trend: "down" }, "E-commerce": { value: "22.4%", change: "+1.2pp", changePP: "+0.5pp", trend: "up" } },
            byBrand: { "Heineken®": { value: "15.6%", change: "-0.8pp", changePP: "-0.3pp", trend: "down" }, "Amstel®": { value: "8.2%", change: "-0.5pp", changePP: "-0.2pp", trend: "down" }, "Schin®": { value: "3.8%", change: "-0.6pp", changePP: "-0.2pp", trend: "down" } },
            byRegion: { "Southeast": { value: "34.6%", change: "-2.2pp", changePP: "-0.9pp", trend: "down" }, "South": { value: "32.8%", change: "-2.0pp", changePP: "-0.8pp", trend: "down" }, "Northeast": { value: "26.4%", change: "-3.4pp", changePP: "-1.4pp", trend: "down" }, "Central-West": { value: "29.5%", change: "-2.1pp", changePP: "-0.9pp", trend: "down" } },
          },
          {
            label: "Value Market Share", unit: "%", value: "29.0%", change: "-3.1pp", changePP: "-1.2pp", trend: "down", hasCompetitor: true,
            competitors: { "AB InBev": { value: "25.3%", change: "+1.4pp", changePP: "+0.5pp", trend: "up" }, "Carlsberg": { value: "11.2%", change: "+0.6pp", changePP: "+0.2pp", trend: "up" } },
            brandCompetitors: { "Brahma": { value: "13.1%", change: "+0.8pp", changePP: "+0.3pp", trend: "up" }, "Budweiser": { value: "7.4%", change: "+0.4pp", changePP: "+0.2pp", trend: "up" } },
            byCategory: { "Beer": { value: "31.8%", change: "-2.7pp", changePP: "-1.1pp", trend: "down" }, "Cider": { value: "19.2%", change: "-4.1pp", changePP: "-1.6pp", trend: "down" } },
            byChannel: { "Off-trade": { value: "27.2%", change: "+3.4pp", changePP: "+1.4pp", trend: "up" }, "On-trade": { value: "32.5%", change: "-2.6pp", changePP: "-1.0pp", trend: "down" }, "E-commerce": { value: "24.8%", change: "+1.4pp", changePP: "+0.6pp", trend: "up" } },
            byBrand: { "Heineken®": { value: "14.8%", change: "-1.2pp", changePP: "-0.5pp", trend: "down" }, "Amstel®": { value: "7.0%", change: "-0.8pp", changePP: "-0.3pp", trend: "down" }, "Schin®": { value: "3.6%", change: "-0.5pp", changePP: "-0.2pp", trend: "down" } },
            byRegion: { "Southeast": { value: "32.4%", change: "-2.8pp", changePP: "-1.1pp", trend: "down" }, "South": { value: "30.2%", change: "-2.6pp", changePP: "-1.0pp", trend: "down" }, "Northeast": { value: "23.8%", change: "-4.1pp", changePP: "-1.6pp", trend: "down" }, "Central-West": { value: "27.1%", change: "-2.9pp", changePP: "-1.2pp", trend: "down" } },
          },
          {
            label: "Gross Margin", unit: "%", value: "60.0%", change: "-0.8pp", changePP: "-0.3pp", trend: "down",
            byBrand: { "Heineken®": { value: "64.2%", change: "-0.6pp", changePP: "-0.2pp", trend: "down" }, "Amstel®": { value: "56.8%", change: "-1.0pp", changePP: "-0.4pp", trend: "down" }, "Schin®": { value: "52.4%", change: "-0.9pp", changePP: "-0.4pp", trend: "down" } },
            byRegion: { "Southeast": { value: "61.8%", change: "-0.7pp", changePP: "-0.3pp", trend: "down" }, "South": { value: "60.4%", change: "-0.8pp", changePP: "-0.3pp", trend: "down" }, "Northeast": { value: "56.2%", change: "-1.1pp", changePP: "-0.5pp", trend: "down" }, "Central-West": { value: "58.7%", change: "-0.9pp", changePP: "-0.4pp", trend: "down" } },
          },
        ],
      },
      {
        key: "delivering",
        label: "Are we delivering?",
        metrics: [
          {
            label: "Volume Growth", unit: "L & %", value: "-2,345 khl", valueAbs: "-2,345 khl", valuePct: "-2.1%", change: "-2.1%", changePP: "-1.0%", trend: "down", hideTrend: true, pctAsMain: true, hasCompetitor: true,
            competitors: { "AB InBev": { value: "-2,470 khl", change: "-1.5%", changePP: "-0.7%", trend: "down" }, "Carlsberg": { value: "-1,120 khl", change: "-1.8%", changePP: "-0.9%", trend: "down" } },
            brandCompetitors: { "Brahma": { value: "-1,420 khl", change: "-1.2%", changePP: "-0.6%", trend: "down" }, "Budweiser": { value: "-780 khl", change: "-1.8%", changePP: "-0.9%", trend: "down" } },
            byCategory: { "Beer": { value: "-2,095 khl", change: "-1.8%", changePP: "-0.9%", trend: "down" }, "Cider": { value: "-250 khl", change: "-3.2%", changePP: "-1.6%", trend: "down" } },
            byChannel: { "Off-trade": { value: "1,408 khl", change: "+2.4%", changePP: "+1.2%", trend: "up" }, "On-trade": { value: "-702 khl", change: "-1.5%", changePP: "-0.8%", trend: "down" }, "E-commerce": { value: "235 khl", change: "+3.2%", changePP: "+1.6%", trend: "up" } },
            byBrand: { "Heineken®": { value: "-680 khl", change: "-0.8%", changePP: "-0.4%", trend: "down" }, "Amstel®": { value: "-420 khl", change: "-1.5%", changePP: "-0.8%", trend: "down" }, "Schin®": { value: "-625 khl", change: "-3.8%", changePP: "-1.9%", trend: "down" } },
            byCustomer: { "Grupo Pão de Açúcar": { value: "-825 khl", change: "-1.8%", changePP: "-0.9%", trend: "down" }, "Carrefour Brasil": { value: "-740 khl", change: "-2.4%", changePP: "-1.2%", trend: "down" }, "Atacadão": { value: "-780 khl", change: "-2.2%", changePP: "-1.1%", trend: "down" } },
            byRegion: { "Southeast": { value: "-980 khl", change: "-1.9%", changePP: "-0.9%", trend: "down" }, "South": { value: "-515 khl", change: "-1.6%", changePP: "-0.8%", trend: "down" }, "Northeast": { value: "-680 khl", change: "-2.9%", changePP: "-1.4%", trend: "down" }, "Central-West": { value: "-170 khl", change: "-1.2%", changePP: "-0.6%", trend: "down" } },
          },
          {
            label: "Value Growth", unit: "€ & %", value: "-€1,195 mln", valueAbs: "-€1,195 mln", valuePct: "-1.6%", change: "-1.6%", changePP: "-0.8%", trend: "down", hideTrend: true, pctAsMain: true, hasCompetitor: true,
            competitors: { "AB InBev": { value: "-€1,100 mln", change: "-1.0%", changePP: "-0.5%", trend: "down" }, "Carlsberg": { value: "-€580 mln", change: "-1.3%", changePP: "-0.6%", trend: "down" } },
            brandCompetitors: { "Brahma": { value: "-€640 mln", change: "-0.8%", changePP: "-0.4%", trend: "down" }, "Budweiser": { value: "-€320 mln", change: "-1.4%", changePP: "-0.7%", trend: "down" } },
            byCategory: { "Beer": { value: "-€1,070 mln", change: "-1.4%", changePP: "-0.7%", trend: "down" }, "Cider": { value: "-€125 mln", change: "-2.4%", changePP: "-1.2%", trend: "down" } },
            byChannel: { "Off-trade": { value: "€648 mln", change: "+1.8%", changePP: "+0.9%", trend: "up" }, "On-trade": { value: "-€390 mln", change: "-1.2%", changePP: "-0.6%", trend: "down" }, "E-commerce": { value: "€157 mln", change: "+2.8%", changePP: "+1.4%", trend: "up" } },
            byBrand: { "Heineken®": { value: "-€380 mln", change: "-0.6%", changePP: "-0.3%", trend: "down" }, "Amstel®": { value: "-€260 mln", change: "-1.2%", changePP: "-0.6%", trend: "down" }, "Schin®": { value: "-€280 mln", change: "-2.8%", changePP: "-1.4%", trend: "down" } },
            byCustomer: { "Grupo Pão de Açúcar": { value: "-€420 mln", change: "-1.4%", changePP: "-0.7%", trend: "down" }, "Carrefour Brasil": { value: "-€380 mln", change: "-1.8%", changePP: "-0.9%", trend: "down" }, "Atacadão": { value: "-€395 mln", change: "-1.6%", changePP: "-0.8%", trend: "down" } },
            byRegion: { "Southeast": { value: "-€498 mln", change: "-1.4%", changePP: "-0.7%", trend: "down" }, "South": { value: "-€262 mln", change: "-1.2%", changePP: "-0.6%", trend: "down" }, "Northeast": { value: "-€352 mln", change: "-2.3%", changePP: "-1.1%", trend: "down" }, "Central-West": { value: "-€83 mln", change: "-0.9%", changePP: "-0.5%", trend: "down" } },
          },
          {
            label: "Revenue / HL", unit: "€/HL", value: "€48.8", change: "-4.5%", changePP: "-2.2%", trend: "down", hasCompetitor: true,
            competitors: { "AB InBev": { value: "€42.6", change: "-2.9%", changePP: "-1.4%", trend: "down" }, "Carlsberg": { value: "€51.8", change: "-3.1%", changePP: "-1.5%", trend: "down" } },
            byBrand: { "Heineken®": { value: "€48.8", change: "-4.5%", changePP: "-2.2%", trend: "down" }, "Amstel®": { value: "€44.2", change: "-3.8%", changePP: "-1.9%", trend: "down" }, "Schin®": { value: "€28.9", change: "-5.2%", changePP: "-2.6%", trend: "down" } },
          },
          {
            label: "Operating Profit", unit: "€ & %", value: "€560 mln", valueAbs: "€560 mln", valuePct: "32%", change: "+0.9pp", changePP: "+0.4pp", trend: "up", pctAsMain: true, displayPctPlain: true,
            byBrand: { "Heineken®": { value: "€295 mln", change: "+1.2pp", changePP: "+0.5pp", trend: "up" }, "Amstel®": { value: "€115 mln", change: "+0.6pp", changePP: "+0.2pp", trend: "up" }, "Schin®": { value: "€72 mln", change: "-0.4pp", changePP: "-0.2pp", trend: "down" } },
          },
        ],
      },
    ],
  },
  {
    key: "brand_power",
    label: "Brand Power",
    metrics: [
      {
        label: "Brand Power", unit: "%", value: "6.5%", change: "+0.3pp", changePP: "+0.1pp", trend: "up", hasCompetitor: true,
        competitors: { "AB InBev": { value: "8.7%", change: "-0.1pp", changePP: "-0.0pp", trend: "down" }, "Carlsberg": { value: "5.2%", change: "+0.2pp", changePP: "+0.1pp", trend: "up" } },
        brandCompetitors: { "Brahma": { value: "4.8%", change: "+0.1pp", changePP: "+0.0pp", trend: "up" }, "Budweiser": { value: "3.2%", change: "-0.2pp", changePP: "-0.1pp", trend: "down" } },
        byBrand: { "Heineken®": { value: "6.5%", change: "+0.3pp", changePP: "+0.1pp", trend: "up" }, "Amstel®": { value: "3.8%", change: "+0.2pp", changePP: "+0.1pp", trend: "up" }, "Schin®": { value: "1.4%", change: "+0.1pp", changePP: "+0.0pp", trend: "up" } },
        byRegion: { "Southeast": { value: "7.2%", change: "+0.4pp", changePP: "+0.2pp", trend: "up" }, "South": { value: "6.8%", change: "+0.3pp", changePP: "+0.1pp", trend: "up" }, "Northeast": { value: "5.4%", change: "+0.1pp", changePP: "+0.0pp", trend: "up" }, "Central-West": { value: "6.1%", change: "+0.3pp", changePP: "+0.1pp", trend: "up" } },
      },
      {
        label: "Meaningful", unit: "", value: "120", change: "+3", changePP: "+1", trend: "up", hasCompetitor: true,
        competitors: { "AB InBev": { value: "95", change: "+1", changePP: "+0", trend: "up" }, "Carlsberg": { value: "78", change: "+2", changePP: "+1", trend: "up" } },
        brandCompetitors: { "Brahma": { value: "88", change: "+2", changePP: "+1", trend: "up" }, "Budweiser": { value: "72", change: "+1", changePP: "+0", trend: "up" } },
        byBrand: { "Heineken®": { value: "120", change: "+3", changePP: "+1", trend: "up" }, "Amstel®": { value: "96", change: "+2", changePP: "+1", trend: "up" }, "Schin®": { value: "43", change: "+2", changePP: "+1", trend: "up" } },
        byRegion: { "Southeast": { value: "128", change: "+4", changePP: "+2", trend: "up" }, "South": { value: "122", change: "+3", changePP: "+1", trend: "up" }, "Northeast": { value: "108", change: "+2", changePP: "+1", trend: "up" }, "Central-West": { value: "116", change: "+3", changePP: "+1", trend: "up" } },
      },
      {
        label: "Different", unit: "", value: "135", change: "+5", changePP: "+2", trend: "up", hasCompetitor: true,
        competitors: { "AB InBev": { value: "78", change: "+2", changePP: "+1", trend: "up" }, "Carlsberg": { value: "65", change: "+3", changePP: "+1", trend: "up" } },
        brandCompetitors: { "Brahma": { value: "62", change: "+1", changePP: "+0", trend: "up" }, "Budweiser": { value: "55", change: "+2", changePP: "+1", trend: "up" } },
        byBrand: { "Heineken®": { value: "135", change: "+5", changePP: "+2", trend: "up" }, "Amstel®": { value: "79", change: "+3", changePP: "+1", trend: "up" }, "Schin®": { value: "47", change: "+1", changePP: "+0", trend: "up" } },
        byRegion: { "Southeast": { value: "142", change: "+6", changePP: "+3", trend: "up" }, "South": { value: "138", change: "+5", changePP: "+2", trend: "up" }, "Northeast": { value: "124", change: "+3", changePP: "+1", trend: "up" }, "Central-West": { value: "130", change: "+4", changePP: "+2", trend: "up" } },
      },
      {
        label: "Salient", unit: "", value: "110", change: "-2", changePP: "-1", trend: "down", hasCompetitor: true,
        competitors: { "AB InBev": { value: "72", change: "+3", changePP: "+1", trend: "up" }, "Carlsberg": { value: "56", change: "+1", changePP: "+0", trend: "up" } },
        brandCompetitors: { "Brahma": { value: "68", change: "+4", changePP: "+2", trend: "up" }, "Budweiser": { value: "48", change: "+1", changePP: "+0", trend: "up" } },
        byBrand: { "Heineken®": { value: "110", change: "-2", changePP: "-1", trend: "down" }, "Amstel®": { value: "59", change: "+4", changePP: "+2", trend: "up" }, "Schin®": { value: "58", change: "-2", changePP: "-1", trend: "down" } },
        byRegion: { "Southeast": { value: "115", change: "-3", changePP: "-1", trend: "down" }, "South": { value: "112", change: "-2", changePP: "-1", trend: "down" }, "Northeast": { value: "101", change: "-4", changePP: "-2", trend: "down" }, "Central-West": { value: "106", change: "-1", changePP: "-0", trend: "down" } },
      },
    ],
  },
  {
    key: "commercial_investment",
    label: "Commercial Investment",
    metrics: [
      {
        label: "ATL", unit: "€ & % of Revenue", value: "€250 mln", valueAbs: "€250 mln", valuePct: "12.5%", change: "+4.7%", changePP: "+2.3%", trend: "up", displayPctPlain: true,
        byCategory: { "Beer": { value: "€215 mln", change: "+5.2%", changePP: "+2.6%", trend: "up" }, "Cider": { value: "€22 mln", change: "+2.8%", changePP: "+1.4%", trend: "up" } },
        byBrand: { "Heineken®": { value: "€128 mln", change: "+4.7%", changePP: "+2.3%", trend: "up" }, "Amstel®": { value: "€72 mln", change: "+6.8%", changePP: "+3.4%", trend: "up" }, "Schin®": { value: "€30 mln", change: "+1.5%", changePP: "+0.8%", trend: "up" } },
        byChannel: { "Off-trade": { value: "€75 mln", change: "+3.8%", changePP: "+1.9%", trend: "up" }, "On-trade": { value: "€115 mln", change: "+5.4%", changePP: "+2.7%", trend: "up" }, "E-commerce": { value: "€60 mln", change: "+5.8%", changePP: "+2.9%", trend: "up" } },
      },
      {
        label: "BTL", unit: "€ & % of Revenue", value: "€120 mln", valueAbs: "€120 mln", valuePct: "6%", change: "+2.4%", changePP: "+1.2%", trend: "up", displayPctPlain: true,
        byCategory: { "Beer": { value: "€98 mln", change: "+2.8%", changePP: "+1.4%", trend: "up" }, "Cider": { value: "€14 mln", change: "+1.5%", changePP: "+0.8%", trend: "up" } },
        byBrand: { "Heineken®": { value: "€60 mln", change: "+2.4%", changePP: "+1.2%", trend: "up" }, "Amstel®": { value: "€32 mln", change: "+3.1%", changePP: "+1.5%", trend: "up" }, "Schin®": { value: "€16 mln", change: "+1.2%", changePP: "+0.6%", trend: "up" } },
        byChannel: { "Off-trade": { value: "€65 mln", change: "+2.8%", changePP: "+1.4%", trend: "up" }, "On-trade": { value: "€35 mln", change: "+1.8%", changePP: "+0.9%", trend: "up" }, "E-commerce": { value: "€20 mln", change: "+3.2%", changePP: "+1.6%", trend: "up" } },
      },
      {
        label: "Promo", unit: "€ & % of Revenue", value: "€390 mln", valueAbs: "€390 mln", valuePct: "19.5%", change: "-1.5%", changePP: "-0.8%", trend: "down", displayPctPlain: true,
        byCategory: { "Beer": { value: "€318 mln", change: "-1.2%", changePP: "-0.6%", trend: "down" }, "Cider": { value: "€45 mln", change: "-2.1%", changePP: "-1.0%", trend: "down" } },
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

const allFilterDimensions = ["Category", "Channel", "Brand", "Region", "Customer"];

// ─── Filter dropdowns ────────────────────────────────────────────────────────

function CategoryFilterDropdown({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [beerOpen, setBeerOpen] = useState(true);
  const allLeaves = ["Beer: Low/No", "Beer: Alcoholic", "Cider"];
  const noneSelected = selected.length === 0;
  const isLeafChecked = (leaf: string) => noneSelected || selected.includes(leaf);
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
    const next = allBeerSelected
      ? current.filter((s) => !beerSubs.includes(s))
      : [...new Set([...current, ...beerSubs])];
    onChange(next.length === allLeaves.length ? [] : next);
  };
  const toggleAll = () => onChange([]);

  const displayLabel = noneSelected || selected.length === allLeaves.length ? "All" : selected.length === 1 ? selected[0].replace("Beer: ", "") : `${selected.length} selected`;
  const isActive = !noneSelected && selected.length < allLeaves.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          isActive ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
        }`}
      >
        <Filter size={10} /> Category: {displayLabel}
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[180px] py-1">
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted/50">
              <input type="checkbox" checked={noneSelected} onChange={toggleAll} className="accent-[#008200] w-3.5 h-3.5 rounded" />
              <span className={`font-semibold ${noneSelected ? "text-primary" : "text-foreground"}`}>Select All</span>
            </label>
            <div className="h-px bg-border mx-2 my-0.5" />
            <div className="flex items-center gap-0 px-3 py-1.5 hover:bg-muted/50">
              <input type="checkbox" checked={beerChecked} ref={(el) => { if (el) el.indeterminate = beerIndeterminate; }} onChange={toggleBeer} className="accent-[#008200] w-3.5 h-3.5 rounded mr-2 cursor-pointer" />
              <span className="text-xs font-semibold text-foreground flex-1 cursor-pointer" onClick={toggleBeer}>Beer</span>
              <button onClick={() => setBeerOpen(!beerOpen)} className="p-0.5 text-muted-foreground hover:text-foreground">
                <ChevronDown size={10} className={`transition-transform ${beerOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
            <AnimatePresence>
              {beerOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  {beerSubs.map((sub) => (
                    <label key={sub} className="flex items-center gap-2 pl-8 pr-3 py-1 text-xs cursor-pointer hover:bg-muted/50">
                      <input type="checkbox" checked={isLeafChecked(sub)} onChange={() => toggleLeaf(sub)} className="accent-[#008200] w-3 h-3 rounded" />
                      <span className="text-muted-foreground">{sub.replace("Beer: ", "")}</span>
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted/50">
              <input type="checkbox" checked={ciderChecked} onChange={() => toggleLeaf("Cider")} className="accent-[#008200] w-3.5 h-3.5 rounded" />
              <span className="text-foreground">Cider</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterDropdown({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === options.length;
  const noneSelected = selected.length === 0;
  const displayLabel = (allSelected || noneSelected) ? "All" : selected.length === 1 ? selected[0] : `${selected.length} selected`;
  const toggleOption = (opt: string) => {
    if (noneSelected) onChange(options.filter((o) => o !== opt));
    else if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt));
    else onChange([...selected, opt]);
  };
  const toggleAll = () => allSelected ? onChange([]) : onChange([...options]);
  const isChecked = (opt: string) => noneSelected || selected.includes(opt);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          !noneSelected && !allSelected ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
        }`}>
        <Filter size={10} /> {label}: {displayLabel}
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[160px] py-1">
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted/50">
              <input type="checkbox" checked={allSelected || noneSelected} onChange={toggleAll} className="accent-[#008200] w-3.5 h-3.5 rounded" />
              <span className={`font-semibold ${(allSelected || noneSelected) ? "text-primary" : "text-foreground"}`}>Select All</span>
            </label>
            <div className="h-px bg-border mx-2 my-0.5" />
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted/50">
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
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:border-primary/40 transition-all">
        <RefreshCw size={9} className="text-primary" /> {selected.label}
        <ChevronDown size={9} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-30 min-w-[170px] py-1 overflow-hidden">
            {compModeOptions.map((opt) => (
              <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50 ${value === opt.value ? "bg-primary/10" : ""}`}>
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

function getChange(d: { change: string; changePP?: string }, compMode: ComparisonMode) {
  if (compMode === "PP" && d.changePP) return d.changePP;
  if (compMode === "AP") return d.changePP ?? d.change;
  return d.change;
}

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

function KpiCard({ metric, filters, showCompetitors, compMode, periodLabel, periodMultiplier, valueScale }: {
  metric: KpiMetric; filters: Record<string, string[]>; showCompetitors: boolean; compMode: ComparisonMode; periodLabel: string; periodMultiplier: number; valueScale: number;
}) {
  const filterMult = computeFilterMultiplier(filters);
  const combinedScale = valueScale * filterMult;
  const rawChange = getChange(metric, compMode);
  const displayChange = scaleChange(rawChange, periodMultiplier);
  const compLabel = compMode === "PP" ? `vs PP (${periodLabel})` : compMode === "YA" ? "vs YA" : "vs PY";
  const trendColorClass = metric.trend === "up" ? "text-[hsl(var(--status-green))]" : metric.trend === "down" ? "text-[hsl(var(--status-red))]" : "text-muted-foreground";
  const showComp = showCompetitors && metric.hasCompetitor && metric.competitors;

  return (
    <div className="bg-card border border-border rounded-lg p-2.5 hover:shadow-md transition-shadow">
      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
        {metric.label}
        {metric.hasCompetitor && <span className="text-accent ml-0.5">*</span>}
      </div>
      {metric.unit && <div className="text-[8px] text-muted-foreground/50">({metric.unit})</div>}
      <DualValue metric={metric} valueScale={combinedScale} />
      {!metric.hideTrend ? (
        <div className={`flex items-center gap-1 text-[10px] font-semibold ${trendColorClass}`}>
          <TrendIcon dir={metric.trend} /> {displayChange} <span className="text-muted-foreground font-normal">{compLabel}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
          {displayChange} <span className="font-normal">{compLabel}</span>
        </div>
      )}
      {showComp && metric.competitors && (
        <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
          <div className="text-[8px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">Competitors</div>
          {Object.entries(metric.competitors).map(([name, data]) => {
            const tc = data.trend === "up" ? "text-[hsl(var(--status-green))]" : data.trend === "down" ? "text-[hsl(var(--status-red))]" : "text-muted-foreground";
            const compChange = scaleChange(getChange(data, compMode), periodMultiplier);
            return (
              <div key={name} className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground font-medium">{name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground">{data.value}</span>
                  <span className={`flex items-center gap-0.5 font-medium ${tc}`}>
                    <TrendIcon dir={data.trend} /> {compChange}
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

// ─── Strategic Insight Cards (4 cards) ───────────────────────────────────────

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
      { text: "Heineken Value Market Share is -3.1pp vs PY while Volume Market Share is -2.5pp — value is eroding faster than volume. AB InBev's Value Share is +1.4pp over the same window.", severity: "warning" },
      { text: "Amstel Salient is down -14.6pp vs PY while Meaningful (+2.8) and Different (+2.8) continue to build — awareness is the portfolio bottleneck.", severity: "warning" },
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
      { text: "Off-Trade is the only channel with positive Y-scope signals — Vol. Growth +2.4%, Value Growth +1.8%, Vol. Share +2.8pp vs PY. Compound it.", severity: "action" },
      { text: "Southeast holds the highest Brand Power (7.2%) but Volume Growth is -1.9% — equity intact, sell-out conversion slipping.", severity: "warning" },
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
      { text: "MWB 2 Iconic Identity is flagged: Amstel Salient -14.6pp vs PY while Meaningful and Different continue to build.", severity: "warning" },
      { text: "MWB 1 Unique Positioning strongest signal — Different is +5 on Heineken®, +3 on Amstel®, +1 on Schin®.", severity: "info" },
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
      { text: "On-Trade ATL (€115M) is the largest channel allocation but On-Trade Volume Growth is -1.5% — spend efficiency deteriorating.", severity: "warning" },
      { text: "Promo -1.5% vs PY, but Off-Trade Volume Growth still positive — pricing discipline holding, margin should benefit.", severity: "info" },
    ],
  },
];

function StrategicInsightCards({ onStateChange }: { onStateChange?: (state: AppState) => void }) {
  const [expandedCard, setExpandedCard] = useState<AppState | null>(null);
  const activeCard = STRATEGIC_INSIGHTS.find((c) => c.state === expandedCard);

  return (
    <div className="mx-4 mt-3 space-y-2.5">
      <div className="grid grid-cols-4 gap-2.5">
        {STRATEGIC_INSIGHTS.map((card) => {
          const Icon = card.icon;
          const isExpanded = expandedCard === card.state;
          return (
            <button
              key={card.state}
              onClick={() => setExpandedCard(isExpanded ? null : card.state)}
              className="rounded-xl border-2 p-3 text-left transition-all duration-200 hover:shadow-md cursor-pointer"
              style={{ borderColor: isExpanded ? card.color : card.colorBorder, background: card.colorBg, boxShadow: isExpanded ? `0 0 0 1px ${card.color}` : undefined }}
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
                <ChevronDown size={12} className="transition-transform duration-200 shrink-0"
                  style={{ color: card.color, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug mt-2">{card.summary}</p>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {activeCard && (
          <motion.div key={activeCard.state}
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: activeCard.colorBorder, background: activeCard.colorBg }}>
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Key Insights</p>
                <button onClick={() => onStateChange?.(activeCard.state)}
                  className="flex items-center gap-1 text-[10px] font-bold transition-colors hover:underline"
                  style={{ color: activeCard.color }}>
                  {activeCard.navigateLabel} <ChevronRight size={10} />
                </button>
              </div>
              {activeCard.insights.map((ins, j) => (
                <div key={j} className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
                  style={{
                    background: ins.severity === "warning" ? "hsl(30,100%,96%)" : ins.severity === "action" ? "hsl(138,50%,96%)" : "hsl(210,30%,96%)",
                    border: `1px solid ${ins.severity === "warning" ? "hsl(30,70%,82%)" : ins.severity === "action" ? "hsl(138,40%,80%)" : "hsl(210,30%,85%)"}`,
                  }}>
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

// ─── Main page ───────────────────────────────────────────────────────────────

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

  const [filters, setFilters] = useState<Record<string, string[]>>({ Category: [], Channel: [], Brand: [], Region: [], Customer: [] });
  const setFilterSelected = (dim: string, selected: string[]) => setFilters((prev) => ({ ...prev, [dim]: selected }));
  const [compMode, setCompMode] = useState<ComparisonMode>("PY");
  const [activeTab, setActiveTab] = useState<ActiveTab>("aggregated");
  const [showCompetitors, setShowCompetitors] = useState(false);

  const isFiltered = (dim: string) => {
    const sel = filters[dim];
    if (dim === "Category") return sel.length > 0 && sel.length < 3;
    return sel.length > 0 && sel.length < (filterOptions[dim]?.length ?? 0);
  };

  return (
    <div className="flex-1 overflow-auto bg-background">
      {/* Header strip: region + period + Freddy.PERFORM label */}
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

      {/* Strategic Insight Cards — 4 cards */}
      <StrategicInsightCards onStateChange={onStateChange} />

      {/* Tabs card */}
      <div className="mx-4 mt-3 mb-4 border border-border rounded-xl shadow-sm bg-card overflow-hidden">
        <div className="flex border-b border-border bg-muted/30">
          {(["aggregated", "brand_breakdown", "channel_breakdown", "region_breakdown"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === t ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "aggregated" ? "Total Market" : t === "brand_breakdown" ? "Brand Breakdown" : t === "channel_breakdown" ? "Channel Breakdown" : "Region Breakdown"}
            </button>
          ))}
        </div>

        {activeTab === "aggregated" ? (
          <div className="p-3 space-y-3">
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border/50">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Filters:</span>
              <ComparisonDropdown value={compMode} onChange={setCompMode} />
              <CategoryFilterDropdown selected={filters.Category} onChange={(v) => setFilterSelected("Category", v)} />
              {allFilterDimensions.filter((d) => d !== "Category").map((dim) => (
                <FilterDropdown key={dim} label={dim} options={filterOptions[dim]} selected={filters[dim]} onChange={(v) => setFilterSelected(dim, v)} />
              ))}
              <div className="ml-auto flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={showCompetitors} onChange={(e) => setShowCompetitors(e.target.checked)} className="accent-[#008200] w-3.5 h-3.5 rounded" />
                  <span className="text-xs font-semibold text-foreground">Include Competitors</span>
                  <span className="text-[9px] text-muted-foreground">(ABI, Carlsberg)</span>
                </label>
              </div>
            </div>

            {/* KPI sections */}
            {kpiSections.map((section) => {
              const regionActive = isFiltered("Region");
              const channelActive = isFiltered("Channel");
              const customerActive = isFiltered("Customer");
              if (section.key === "brand_power" && (regionActive || channelActive)) return null;
              if (section.key === "hnk_opco" && regionActive) return null;
              if (customerActive && section.key !== "hnk_opco") return null;

              return (
                <div key={section.key} className="flex rounded-xl overflow-hidden border border-border shadow-sm">
                  <div className="bg-[#008200] text-white flex items-center justify-center px-4 w-[140px] shrink-0">
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
        ) : (
          <BreakdownTable kind={activeTab} periodLabel={periodLabel} periodVariant={periodVariant} />
        )}
      </div>
    </div>
  );
}

// ─── Breakdown tables (brand / channel / region) ─────────────────────────────

function BreakdownTable({
  kind,
  periodLabel,
  periodVariant,
}: {
  kind: "brand_breakdown" | "channel_breakdown" | "region_breakdown";
  periodLabel: string;
  periodVariant: { valueScale: number; changeScale: number };
}) {
  const cols: string[] =
    kind === "brand_breakdown"
      ? ["Heineken®", "Amstel®", "Schin®"]
      : kind === "channel_breakdown"
        ? ["Off-trade", "On-trade", "E-commerce"]
        : ["Southeast", "South", "Northeast", "Central-West"];

  const colorMap: Record<string, { header: string; col: string }> = {
    "Heineken®": { header: "bg-[hsl(138,100%,25.5%)]", col: "bg-[hsl(138,40%,96%)]" },
    "Amstel®":   { header: "bg-[hsl(0,70%,45%)]",      col: "bg-[hsl(0,40%,97%)]" },
    "Schin®":    { header: "bg-[hsl(210,70%,45%)]",    col: "bg-[hsl(210,40%,97%)]" },
    "Off-trade": { header: "bg-[hsl(210,60%,35%)]",    col: "bg-[hsl(210,30%,97%)]" },
    "On-trade":  { header: "bg-[hsl(260,50%,40%)]",    col: "bg-[hsl(260,25%,97%)]" },
    "E-commerce":{ header: "bg-[hsl(28,80%,38%)]",     col: "bg-[hsl(28,40%,97%)]" },
    "Southeast": { header: "bg-[hsl(138,60%,28%)]",    col: "bg-[hsl(138,30%,97%)]" },
    "South":     { header: "bg-[hsl(200,60%,35%)]",    col: "bg-[hsl(200,30%,97%)]" },
    "Northeast": { header: "bg-[hsl(35,70%,38%)]",     col: "bg-[hsl(35,40%,97%)]" },
    "Central-West": { header: "bg-[hsl(270,45%,42%)]", col: "bg-[hsl(270,25%,97%)]" },
  };

  const pickKey = kind === "brand_breakdown" ? "byBrand" : kind === "channel_breakdown" ? "byChannel" : "byRegion";

  return (
    <div className="p-3 space-y-3">
      {kpiSections.map((section) => {
        const allMetrics = section.subcategories ? section.subcategories.flatMap((s) => s.metrics) : section.metrics || [];
        const metricsToShow = allMetrics.filter((m) => {
          const bd = m[pickKey as keyof KpiMetric] as Record<string, MetricBreakdown> | undefined;
          return bd && Object.keys(bd).length > 0;
        });
        if (metricsToShow.length === 0) return null;

        return (
          <div key={section.key} className="flex rounded-xl overflow-hidden border border-border shadow-sm">
            <div className="bg-[#008200] text-white flex items-center justify-center px-3 w-[120px] shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">{section.label}</span>
            </div>
            <div className="flex-1 overflow-x-auto bg-card/60">
              <table className="text-[11px] border-collapse w-full" style={{ tableLayout: "fixed" }}>
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 px-3 text-[10px] text-muted-foreground font-semibold bg-muted/30 w-[130px]" />
                    {cols.map((name) => {
                      const c = colorMap[name];
                      return (
                        <th key={name} colSpan={2} className={`text-center py-1.5 px-1 text-[10px] font-bold ${c.header} text-white border-l border-white/20`}>
                          {name}
                        </th>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-border/50">
                    <th className="bg-muted/30 py-1 px-3 text-[9px] text-muted-foreground font-semibold text-left">Metric</th>
                    {cols.map((name) => {
                      const c = colorMap[name];
                      return (
                        <React.Fragment key={name}>
                          <th className={`text-right py-1 px-2 text-[9px] font-semibold border-l border-border/40 ${c.col} text-muted-foreground`}>{periodLabel}</th>
                          <th className={`text-right py-1 px-2 text-[9px] font-semibold ${c.col} text-muted-foreground`}>Δ PY</th>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {metricsToShow.map((m, mIdx) => (
                    <tr key={m.label} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="bg-card py-1.5 px-3">
                        <div className="text-muted-foreground font-medium">{m.label}</div>
                        {m.unit && <div className="text-[8px] text-muted-foreground/50">({m.unit})</div>}
                      </td>
                      {cols.map((colName) => {
                        const c = colorMap[colName];
                        const bd = m[pickKey as keyof KpiMetric] as Record<string, MetricBreakdown> | undefined;
                        const d = bd?.[colName];
                        const rowTint = mIdx % 2 === 0 ? c.col : "";
                        if (!d) return (
                          <React.Fragment key={colName}>
                            <td className={`text-right py-1.5 px-2 text-muted-foreground/30 border-l border-border/30 ${rowTint}`}>–</td>
                            <td className={`text-right py-1.5 px-2 text-muted-foreground/30 ${rowTint}`}>–</td>
                          </React.Fragment>
                        );
                        const tc = d.trend === "up" ? "text-[hsl(var(--status-green))]" : d.trend === "down" ? "text-[hsl(var(--status-red))]" : "text-muted-foreground";
                        const scaled = scaleNumericValue(d.value, periodVariant.valueScale);
                        return (
                          <React.Fragment key={colName}>
                            <td className={`text-right py-1.5 px-2 font-bold text-foreground border-l border-border/30 ${rowTint}`}>{scaled}</td>
                            <td className={`text-right py-1.5 px-2 font-medium ${tc} ${rowTint}`}>
                              <span className="inline-flex items-center gap-0.5">
                                <TrendIcon dir={d.trend} /><span className="italic">{d.change}</span>
                              </span>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
