import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Zap as ZapIcon,
  AlertTriangle,
  BarChart2,
} from "lucide-react";
import ExpandableSection from "./ExpandableSection";
import AgenticInsightsBlock from "./AgenticInsightsBlock";

interface WhereToPlayPageProps {
  period: string;
}

// Phase 1 caveat: Where-to-Play normally runs on demand-space / repertoire data, which is
// AMBER/RED in the Metric Inventory. This page intentionally uses ONLY the Y-scoped metrics
// we already ship — Volume/Value Growth, Volume MS, Off-Trade Vol. Share, Brand Power —
// to surface "where to lean in" as a directional proxy, not the full WtP framework.

const priorityTiles: {
  label: string;
  value: string;
  trend: string;
  direction: "up" | "down";
  sub: string;
}[] = [
  { label: "Off-Trade Vol. Growth",   value: "+2.4%",  trend: "+1,408 khl vs PY",  direction: "up", sub: "Only channel in volume growth" },
  { label: "Off-Trade Value Growth",  value: "+1.8%",  trend: "+€648 mln vs PY",   direction: "up", sub: "Sell-out value pocket" },
  { label: "Off-Trade Vol. Share",    value: "29.5%",  trend: "+2.8pp vs PY",      direction: "up", sub: "Share momentum" },
  { label: "E-commerce Vol. Growth",  value: "+3.2%",  trend: "+235 khl vs PY",    direction: "up", sub: "Small but fastest-growing" },
];

// Channel × brand Volume Growth signal (Y-scope: byChannel × byBrand decomposition).
const channelBrandMatrix: {
  channel: string;
  brands: { name: string; volGrowth: string; direction: "up" | "down" }[];
}[] = [
  {
    channel: "Off-Trade",
    brands: [
      { name: "Heineken®", volGrowth: "+2.6%", direction: "up" },
      { name: "Amstel®",   volGrowth: "+1.4%", direction: "up" },
      { name: "Schin®",    volGrowth: "+0.8%", direction: "up" },
    ],
  },
  {
    channel: "On-Trade",
    brands: [
      { name: "Heineken®", volGrowth: "-1.1%", direction: "down" },
      { name: "Amstel®",   volGrowth: "-1.9%", direction: "down" },
      { name: "Schin®",    volGrowth: "-2.8%", direction: "down" },
    ],
  },
  {
    channel: "E-commerce",
    brands: [
      { name: "Heineken®", volGrowth: "+3.6%", direction: "up" },
      { name: "Amstel®",   volGrowth: "+2.9%", direction: "up" },
      { name: "Schin®",    volGrowth: "+1.4%", direction: "up" },
    ],
  },
];

// Regional priority — Y-scope: Brand Power byRegion + Volume Growth byRegion.
const regionalPriority: {
  region: string;
  brandPower: string;
  dBp: string;
  volGrowth: string;
  direction: "up" | "down";
  take: string;
}[] = [
  { region: "Southeast",    brandPower: "7.2%", dBp: "+0.4pp", volGrowth: "-1.9%", direction: "down", take: "Highest Brand Power — defend before erosion accelerates" },
  { region: "South",        brandPower: "6.8%", dBp: "+0.3pp", volGrowth: "-1.6%", direction: "down", take: "Strong equity, softer volume — protect the base" },
  { region: "Central-West", brandPower: "6.1%", dBp: "+0.3pp", volGrowth: "-1.2%", direction: "down", take: "Smallest volume gap — best ROI pocket to stabilise" },
  { region: "Northeast",    brandPower: "5.4%", dBp: "+0.1pp", volGrowth: "-2.9%", direction: "down", take: "Weakest on all Y metrics — long-term build" },
];

// AI priorities — same vocabulary as Agentic Takeaways on Home.
const insights: {
  severity: "warning" | "info" | "action";
  title: string;
  body: string;
  action?: string;
}[] = [
  {
    severity: "action",
    title: "Off-Trade is the primary where-to-win pocket",
    body:
      "Off-Trade is the only channel with positive Y-scope signals across the board: Volume Growth +2.4%, Value Growth +1.8%, and Off-Trade Vol. Share +2.8pp vs PY. All three brands are in growth here.",
    action: "Concentrate execution and spend in Off-Trade to compound the only directional tailwind",
  },
  {
    severity: "info",
    title: "E-commerce is small but the fastest-growing lane",
    body:
      "E-commerce Volume Growth is +3.2% vs PY, outpacing Off-Trade (+2.4%). The base is smaller, so absolute volume is modest, but the growth curve is steeper — early positioning compounds.",
    action: "Protect E-commerce shelf presence for Heineken® to keep compounding the +3.6% brand-level lift",
  },
  {
    severity: "warning",
    title: "Southeast is the biggest defend-first call",
    body:
      "Southeast holds the portfolio's highest Brand Power (7.2%, +0.4pp vs PY) but Volume Growth is -1.9%. The equity is intact — the sell-out conversion is slipping. This is an at-risk priority, not an opportunity.",
    action: "Prioritise Southeast sell-out activation to turn Brand Power strength into volume",
  },
];

export default function WhereToPlayPage({ period }: WhereToPlayPageProps) {
  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="mx-4 my-3 space-y-3">
        {/* Page header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-[hsl(138,40%,96%)] border border-[hsl(138,40%,78%)] text-[hsl(138,70%,28%)]">
            <Target size={14} />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">Where to Play</h1>
            <p className="text-[11px] text-muted-foreground">
              Priority pockets surfaced from Y-scoped Sell-out &amp; Brand Power signals · {period}
            </p>
          </div>
        </div>

        {/* Key Agentic Insights — one expandable block with subpoints */}
        <AgenticInsightsBlock accent="hsl(138,70%,28%)" insights={insights} />

        {/* Reporting subtabs — collapsible */}
        <ExpandableSection label="Priority Pockets · Y-scoped Signals" accent="hsl(138,70%,28%)">
          <div className="grid grid-cols-4 gap-2">
            {priorityTiles.map((k) => (
              <PriorityTile key={k.label} {...k} />
            ))}
          </div>
        </ExpandableSection>

        <ExpandableSection label="Channel × Brand · Volume Growth" accent="hsl(138,70%,28%)">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[130px_repeat(3,minmax(0,1fr))] text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground bg-muted/40 border-b border-border">
              <div className="px-3 py-2">Channel</div>
              {channelBrandMatrix[0].brands.map((b) => (
                <div key={b.name} className="px-2 py-2 text-right">{b.name}</div>
              ))}
            </div>
            {channelBrandMatrix.map((row) => (
              <div
                key={row.channel}
                className="grid grid-cols-[130px_repeat(3,minmax(0,1fr))] items-center border-b last:border-b-0 border-border/60 hover:bg-muted/20 transition-colors"
              >
                <div className="px-3 py-3 text-sm font-bold text-foreground">{row.channel}</div>
                {row.brands.map((b) => {
                  const isUp = b.direction === "up";
                  return (
                    <div key={b.name} className="px-2 py-3 text-right">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                          isUp
                            ? "bg-[hsl(var(--status-green))]/10 text-[hsl(var(--status-green))]"
                            : "bg-[hsl(var(--status-red))]/10 text-[hsl(var(--status-red))]"
                        }`}
                      >
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {b.volGrowth}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </ExpandableSection>

        <ExpandableSection label="Regional Priority · Brand Power × Volume Growth" accent="hsl(138,70%,28%)">
          <div className="space-y-2">
            {regionalPriority.map((r) => {
              const isUp = r.direction === "up";
              return (
                <div
                  key={r.region}
                  className="rounded-xl border border-border bg-card shadow-sm px-4 py-3 flex items-center gap-4"
                >
                  <div className="w-20 shrink-0">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Region</div>
                    <div className="text-sm font-bold text-foreground">{r.region}</div>
                  </div>
                  <div className="w-28 shrink-0">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Brand Power</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-extrabold text-foreground">{r.brandPower}</span>
                      <span className="text-[10px] font-semibold text-[hsl(var(--status-green))]">{r.dBp}</span>
                    </div>
                  </div>
                  <div className="w-28 shrink-0">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Vol. Growth</div>
                    <div
                      className={`flex items-center gap-1 text-sm font-extrabold ${
                        isUp ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]"
                      }`}
                    >
                      {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {r.volGrowth}
                    </div>
                  </div>
                  <div className="flex-1 text-[11px] text-muted-foreground leading-snug">{r.take}</div>
                </div>
              );
            })}
          </div>
        </ExpandableSection>
      </div>
    </div>
  );
}

function SectionHeader({ label, accent }: { label: string; accent: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="w-1 h-3.5 rounded-full" style={{ background: accent }} />
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
    </div>
  );
}

function PriorityTile({
  label,
  value,
  trend,
  direction,
  sub,
}: {
  label: string;
  value: string;
  trend: string;
  direction: "up" | "down";
  sub: string;
}) {
  const isUp = direction === "up";
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm px-3 py-2.5 hover:shadow-md transition-shadow">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground leading-tight">
        {label}
      </div>
      <div className="text-xl font-extrabold text-foreground leading-tight mt-1">{value}</div>
      <div
        className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${
          isUp ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]"
        }`}
      >
        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {trend}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{sub}</p>
    </div>
  );
}

function toneFor(severity: "warning" | "info" | "action") {
  if (severity === "warning")
    return { accent: "hsl(30,80%,50%)", bg: "hsl(30,100%,97%)", border: "hsl(30,70%,85%)" };
  if (severity === "action")
    return { accent: "hsl(138,60%,35%)", bg: "hsl(138,50%,97%)", border: "hsl(138,40%,82%)" };
  return { accent: "hsl(210,50%,50%)", bg: "hsl(210,30%,97%)", border: "hsl(210,30%,87%)" };
}
