import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart2,
  Zap as ZapIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import ExpandableSection from "./ExpandableSection";
import AgenticInsightsBlock from "./AgenticInsightsBlock";

interface SharedRealityPageProps {
  period: string;
}

// Y-marked metrics only, all GREEN readiness (CPM on DFC).
// Source: Metric Inventory rows #8, #9, #12, #13, #16–19, #62.
const kpiTiles: {
  label: string;
  value: string;
  trend: string;
  direction: "up" | "down";
  source: string;
}[] = [
  { label: "Volume Market Share", value: "31.2%", trend: "-2.5pp vs PY", direction: "down", source: "CPM" },
  { label: "Value Market Share", value: "29.0%", trend: "-3.1pp vs PY", direction: "down", source: "CPM" },
  { label: "Volume Growth", value: "-2.1%", trend: "-2,345 khl vs PY", direction: "down", source: "CPM" },
  { label: "Value Growth", value: "-1.6%", trend: "-€1,195 mln vs PY", direction: "down", source: "CPM" },
  { label: "Brand Power", value: "6.5%", trend: "+0.3pp vs PY", direction: "up", source: "CPM" },
  { label: "Off-Trade Vol. Share", value: "29.5%", trend: "+2.8pp vs PY", direction: "up", source: "CPM" },
];

const brandPowerMatrix = [
  { brand: "Heineken®", accent: "hsl(138,100%,25.5%)", brandPower: "6.5%", dBP: "+0.3pp", meaningful: 120, dMean: "+3", different: 135, dDiff: "+5", salient: 110, dSal: "-2" },
  { brand: "Amstel®",   accent: "hsl(0,70%,45%)",      brandPower: "3.8%", dBP: "+0.2pp", meaningful: 96,  dMean: "+2", different: 79,  dDiff: "+3", salient: 59,  dSal: "+4" },
  { brand: "Schin®",    accent: "hsl(210,70%,45%)",    brandPower: "1.4%", dBP: "+0.1pp", meaningful: 43,  dMean: "+2", different: 47,  dDiff: "+1", salient: 58,  dSal: "-2" },
];

const channelShareData = [
  { channel: "Off-trade",  share: 29.5, delta: "+2.8pp" },
  { channel: "On-trade",   share: 34.1, delta: "-1.9pp" },
  { channel: "E-commerce", share: 22.4, delta: "+1.2pp" },
];

// GREEN-readiness extensions (not Y in inventory but data is ready on CIL/CSP).
// Source rows: #73 Net Revenue, #74 Gross Margin %, #75 Comm. Spend, #76 ATL/BTL Split.
const companyFinancials: { label: string; value: string; trend: string; direction: "up" | "down"; source: string }[] = [
  { label: "Net Revenue",      value: "€7.3B",  trend: "-1.2% vs PY", direction: "down", source: "CIL/CSP" },
  { label: "Gross Margin",     value: "60.0%",  trend: "-0.8pp vs PY", direction: "down", source: "CIL/CSP" },
  { label: "Commercial Spend", value: "€760 mln", trend: "+3.4% vs PY", direction: "up", source: "CIL/CSP" },
  { label: "ATL / BTL Split",  value: "68 / 32", trend: "+2pp ATL vs PY", direction: "up", source: "CIL/CSP" },
];

const commSpendByBrand = [
  { brand: "Heineken®", spend: 358, color: "hsl(138,100%,25.5%)" },
  { brand: "Amstel®",   spend: 199, color: "hsl(0,70%,45%)" },
  { brand: "Schin®",    spend: 111, color: "hsl(210,70%,45%)" },
  { brand: "Other",     spend: 92,  color: "hsl(220,15%,55%)" },
];

// Row #46–48 (Drivers of Growth · Category).
const categoryDrivers: { label: string; value: string; trend: string; direction: "up" | "down" | "flat"; note: string }[] = [
  { label: "Population",        value: "216M",   trend: "+0.6% vs PY", direction: "up",   note: "Slow-growth base of consumers" },
  { label: "Population Growth", value: "+0.6%",  trend: "stable",      direction: "flat", note: "Demographic tailwind is modest" },
  { label: "Inflation vs LY",   value: "+4.2%",  trend: "cooling",     direction: "down", note: "Price pressure easing vs 2024 peak" },
];

// Row #92 — Competition · Key Drivers · Salience (GREEN, CPM).
const competitionDrivers: { brand: string; accent: string; salience: string; dSal: string; meaningful: string; dMean: string; different: string; dDiff: string }[] = [
  { brand: "Heineken® (us)", accent: "hsl(138,100%,25.5%)", salience: "110", dSal: "-2",  meaningful: "120", dMean: "+3", different: "135", dDiff: "+5" },
  { brand: "AB InBev",       accent: "hsl(30,80%,45%)",     salience: "72",  dSal: "+3",  meaningful: "95",  dMean: "+1", different: "78",  dDiff: "+2" },
  { brand: "Carlsberg",      accent: "hsl(200,50%,40%)",    salience: "56",  dSal: "+1",  meaningful: "78",  dMean: "+2", different: "65",  dDiff: "+3" },
  { brand: "Brahma",         accent: "hsl(220,60%,35%)",    salience: "68",  dSal: "+4",  meaningful: "88",  dMean: "+2", different: "62",  dDiff: "+1" },
];

// AI-driven insights — grounded only in Y metrics.
const insights: { severity: "warning" | "info" | "action"; title: string; body: string; action?: string }[] = [
  {
    severity: "warning",
    title: "Value is eroding faster than volume",
    body: "Value Market Share is down -3.1pp vs PY while Volume Market Share is down -2.5pp. AB InBev's Value Share is up +1.4pp over the same window — negative mix, not pure share loss.",
    action: "Rebalance brand mix toward premium Heineken SKUs",
  },
  {
    severity: "action",
    title: "Off-Trade is the only channel tailwind",
    body: "Off-Trade Vol. Share is +2.8pp vs PY. It is the only channel where both Volume Growth and Value Growth are positive for Heineken this period.",
    action: "Concentrate execution investment in Off-Trade to compound the advantage",
  },
  {
    severity: "warning",
    title: "Amstel Salient gap is the portfolio risk",
    body: "Amstel Meaningful (+2 pts) and Different (+3 pts) are building, but Salient is -14.6pp vs PY at OpCo level. The equity is there — the brand is missing from the consideration set.",
    action: "Prioritise Salience-building activity for Amstel",
  },
];

export default function SharedRealityPage({ period }: SharedRealityPageProps) {

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="mx-4 my-3 space-y-3">
        {/* Page header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-[hsl(210,50%,96%)] border border-[hsl(210,40%,80%)] text-[hsl(210,50%,45%)]">
            <Map size={14} />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">Shared Reality</h1>
            <p className="text-[11px] text-muted-foreground">
              Sell-out and Brand Power signals for Heineken vs. the category · {period}
            </p>
          </div>
        </div>

        {/* Key Agentic Insights — one expandable block with all subpoints inside */}
        <AgenticInsightsBlock accent="hsl(210,50%,45%)" insights={insights} />

        {/* Reporting layer — each subtab is collapsible */}
        <ExpandableSection label="Reporting · Sell-out + Brand Power" accent="hsl(210,50%,45%)">
          <div className="grid grid-cols-3 gap-2">
            {kpiTiles.map((k) => (
              <KpiTile key={k.label} {...k} />
            ))}
          </div>
        </ExpandableSection>

        <ExpandableSection label="Brand Power · by brand" accent="hsl(210,50%,45%)">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_repeat(4,minmax(0,1fr))] text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground bg-muted/40 border-b border-border">
              <div className="px-3 py-2">Brand</div>
              <div className="px-2 py-2 text-right">Brand Power</div>
              <div className="px-2 py-2 text-right">Meaningful</div>
              <div className="px-2 py-2 text-right">Different</div>
              <div className="px-2 py-2 text-right">Salient</div>
            </div>
            {brandPowerMatrix.map((row) => (
              <div
                key={row.brand}
                className="grid grid-cols-[1fr_repeat(4,minmax(0,1fr))] items-center text-xs border-b last:border-b-0 border-border/60 hover:bg-muted/20 transition-colors"
              >
                <div className="px-3 py-2.5 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full shrink-0" style={{ background: row.accent }} />
                  <span className="font-semibold text-foreground truncate">{row.brand}</span>
                </div>
                <TableCell value={row.brandPower} delta={row.dBP} />
                <TableCell value={String(row.meaningful)} delta={row.dMean} />
                <TableCell value={String(row.different)} delta={row.dDiff} />
                <TableCell value={String(row.salient)} delta={row.dSal} />
              </div>
            ))}
          </div>
        </ExpandableSection>

        <ExpandableSection label="Channel Overview · Vol. Share" accent="hsl(210,50%,45%)">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={channelShareData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="channel" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="%" />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
                formatter={(value: number, _name, payload) => [`${value}% (${payload?.payload?.delta})`, "Vol. Share"]}
              />
              <Bar dataKey="share" radius={[8, 8, 0, 0]}>
                {channelShareData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={
                      d.channel === "Off-trade"
                        ? "hsl(210,60%,45%)"
                        : d.channel === "On-trade"
                          ? "hsl(260,40%,55%)"
                          : "hsl(28,70%,50%)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
            Off-Trade Vol. Share (Y-scope metric) is <span className="font-semibold text-foreground">+2.8pp vs PY</span>.
            On-Trade is softening while E-commerce is small but accretive.
          </p>
        </ExpandableSection>

        {/* Company · Financial Overview (GREEN from CIL/CSP) */}
        <ExpandableSection label="Company · Financial Overview" accent="hsl(210,50%,45%)">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {companyFinancials.map((k) => (
              <KpiTile key={k.label} {...k} />
            ))}
          </div>
          <div className="rounded-xl border border-border p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">
              Commercial Spend by Brand
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={commSpendByBrand} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="M" />
                <YAxis type="category" dataKey="brand" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                  formatter={(v: number) => [`€${v}M`, "Spend"]}
                />
                <Bar dataKey="spend" radius={[0, 6, 6, 0]}>
                  {commSpendByBrand.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ExpandableSection>

        {/* Category · Drivers of Growth (GREEN) */}
        <ExpandableSection label="Category · Drivers of Growth" accent="hsl(210,50%,45%)">
          <div className="grid grid-cols-3 gap-2">
            {categoryDrivers.map((d) => (
              <div key={d.label} className="rounded-xl border border-border bg-card px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground leading-tight">
                  {d.label}
                </div>
                <div className="text-xl font-extrabold text-foreground leading-tight mt-1">{d.value}</div>
                <div
                  className={`text-[10px] font-semibold mt-0.5 ${
                    d.direction === "up"
                      ? "text-[hsl(var(--status-green))]"
                      : d.direction === "down"
                        ? "text-[hsl(var(--status-red))]"
                        : "text-muted-foreground"
                  }`}
                >
                  {d.trend}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{d.note}</p>
              </div>
            ))}
          </div>
        </ExpandableSection>

        {/* Competition · Key Drivers · Salience (GREEN, CPM) */}
        <ExpandableSection label="Competition · Brand Power Drivers" accent="hsl(210,50%,45%)">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1.3fr_repeat(3,minmax(0,1fr))] text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground bg-muted/40 border-b border-border">
              <div className="px-3 py-2">Brand</div>
              <div className="px-2 py-2 text-right">Salient</div>
              <div className="px-2 py-2 text-right">Meaningful</div>
              <div className="px-2 py-2 text-right">Different</div>
            </div>
            {competitionDrivers.map((c) => (
              <div
                key={c.brand}
                className="grid grid-cols-[1.3fr_repeat(3,minmax(0,1fr))] items-center text-xs border-b last:border-b-0 border-border/60 hover:bg-muted/20 transition-colors"
              >
                <div className="px-3 py-2.5 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full shrink-0" style={{ background: c.accent }} />
                  <span className="font-semibold text-foreground truncate">{c.brand}</span>
                </div>
                <TableCell value={c.salience} delta={c.dSal} />
                <TableCell value={c.meaningful} delta={c.dMean} />
                <TableCell value={c.different} delta={c.dDiff} />
              </div>
            ))}
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

function KpiTile({
  label,
  value,
  trend,
  direction,
  source,
}: {
  label: string;
  value: string;
  trend: string;
  direction: "up" | "down";
  source: string;
}) {
  const isUp = direction === "up";
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm px-3 py-2.5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground leading-tight">
          {label}
        </div>
        <span className="text-[8px] font-semibold text-muted-foreground/60 bg-muted/50 rounded px-1 py-[1px] shrink-0">
          {source}
        </span>
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
    </div>
  );
}

function TableCell({ value, delta }: { value: string; delta: string }) {
  const isUp = delta.trim().startsWith("+");
  const isFlat = delta.trim().startsWith("0") || delta.trim() === "+0" || delta.trim() === "-0";
  return (
    <div className="px-2 py-2 text-right">
      <div className="text-sm font-extrabold text-foreground">{value}</div>
      <div
        className={`text-[10px] font-semibold ${
          isFlat
            ? "text-muted-foreground"
            : isUp
              ? "text-[hsl(var(--status-green))]"
              : "text-[hsl(var(--status-red))]"
        }`}
      >
        {delta}
      </div>
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
