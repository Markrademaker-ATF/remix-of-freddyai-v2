import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap as ZapIcon,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import ExpandableSection from "./ExpandableSection";

interface ExecutionalExcellencePageProps {
  period: string;
}

// Phase 1 note: Executional Excellence is the tactical lens — it uses GREEN-readiness
// commercial data (ATL / BTL / Promo from CSP) and channel-level Sell-out signals.
// Strategic Brand Power / MWB framing lives in How to Win, not here.

// Commercial Investment tiles (CSP). Matches the Home page ATL/BTL/Promo data.
const investmentTiles = [
  { label: "ATL",   value: "€250M", share: "12.5%", trend: "+4.7% vs PY", direction: "up" as const,   note: "Growing ahead of inflation" },
  { label: "BTL",   value: "€120M", share: "6.0%",  trend: "+2.4% vs PY", direction: "up" as const,   note: "Below plan but stable" },
  { label: "Promo", value: "€390M", share: "19.5%", trend: "-1.5% vs PY", direction: "down" as const, note: "Depth reducing — margin positive" },
];

// Spend mix pie
const atlBtlMix = [
  { name: "ATL",   value: 250, color: "hsl(35,75%,45%)" },
  { name: "BTL",   value: 120, color: "hsl(200,60%,45%)" },
  { name: "Promo", value: 390, color: "hsl(0,65%,50%)" },
];

// Channel execution table — Y + GREEN metrics (Vol MS + Vol Growth by channel)
const channelExecution: { channel: string; volShare: string; dVolShare: string; volGrowth: string; dVolGrowth: "up" | "down"; atl: string; btl: string; promo: string }[] = [
  { channel: "Off-trade",  volShare: "29.5%", dVolShare: "+2.8pp", volGrowth: "+2.4%", dVolGrowth: "up",   atl: "€75M",  btl: "€65M", promo: "€190M" },
  { channel: "On-trade",   volShare: "34.1%", dVolShare: "-1.9pp", volGrowth: "-1.5%", dVolGrowth: "down", atl: "€115M", btl: "€35M", promo: "€125M" },
  { channel: "E-commerce", volShare: "22.4%", dVolShare: "+1.2pp", volGrowth: "+3.2%", dVolGrowth: "up",   atl: "€60M",  btl: "€20M", promo: "€75M"  },
];

// Regional execution variance — Volume Growth byRegion
const regionalExecution = [
  { region: "Southeast",    volGrowth: "-1.9%", atl: "€98M",  promo: "€152M" },
  { region: "South",        volGrowth: "-1.6%", atl: "€64M",  promo: "€102M" },
  { region: "Northeast",    volGrowth: "-2.9%", atl: "€52M",  promo: "€82M"  },
  { region: "Central-West", volGrowth: "-1.2%", atl: "€36M",  promo: "€54M"  },
];

// Top-of-page tactical insights
const insights: { severity: "warning" | "info" | "action"; title: string; body: string; action?: string }[] = [
  {
    severity: "warning",
    title: "On-Trade investment outpacing On-Trade returns",
    body:
      "ATL in On-Trade is €115M (the largest channel allocation) but On-Trade Volume Growth is -1.5% and Vol. Share is -1.9pp vs PY. Spend efficiency is deteriorating.",
    action: "Reallocate 10–15% of On-Trade ATL toward Off-Trade and E-commerce where growth is positive",
  },
  {
    severity: "action",
    title: "Off-Trade execution is compounding — double down",
    body:
      "Off-Trade carries +2.8pp Vol. Share and +2.4% Volume Growth on €75M ATL + €190M Promo. It's the highest-ROI execution lane in the portfolio this period.",
    action: "Protect Off-Trade shelf and Promo depth before competitors close the gap",
  },
  {
    severity: "info",
    title: "Promo depth reducing without hurting volume",
    body:
      "Promo spend is -1.5% vs PY, but Volume Growth in Off-Trade remains positive. Pricing discipline is holding — margin should benefit.",
    action: "Maintain Promo discipline for one more quarter, monitor weekly volume sensitivity",
  },
];

export default function ExecutionalExcellencePage({ period }: ExecutionalExcellencePageProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="mx-4 my-3 space-y-3">
        {/* Page header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-[hsl(35,40%,96%)] border border-[hsl(35,40%,78%)] text-[hsl(35,55%,42%)]">
            <ZapIcon size={14} />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">Executional Excellence</h1>
            <p className="text-[11px] text-muted-foreground">
              Tactical view · commercial investment &amp; channel execution tracking · {period}
            </p>
          </div>
        </div>

        {/* Phase 1 scope banner — MWB tactical rows 110–119 are RED-readiness */}
        <div className="rounded-2xl border border-[hsl(35,40%,78%)] bg-[hsl(35,40%,97%)] px-3 py-2 flex items-start gap-2">
          <AlertTriangle size={13} className="text-[hsl(35,55%,42%)] mt-0.5 shrink-0" />
          <p className="text-[11px] text-foreground/80 leading-relaxed">
            <span className="font-semibold text-[hsl(35,55%,32%)]">Phase 1 scope:</span>{" "}
            MWB tactical execution metrics (brand positioning tracker, visual identity audits,
            draught quality scores, etc. — Metric Inventory rows #110–#119) are
            <span className="font-semibold"> RED readiness</span> and unlock in a later phase.
            This view uses only GREEN-ready execution data: Commercial Investment (ATL / BTL / Promo)
            and channel-level Sell-out signals.
          </p>
        </div>

        {/* Key Agentic Insights — top of page */}
        <div className="flex items-center gap-2 pt-1">
          <div className="w-1 h-3.5 rounded-full bg-[hsl(35,55%,42%)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Key Agentic Insights
          </span>
        </div>
        <div className="space-y-2">
          {insights.map((ins, i) => {
            const isOpen = expandedInsight === i;
            const tone = toneFor(ins.severity);
            return (
              <div
                key={i}
                className="rounded-2xl border bg-card shadow-sm overflow-hidden transition-all"
                style={{ borderColor: isOpen ? tone.accent : "hsl(var(--border))" }}
              >
                <button
                  onClick={() => setExpandedInsight(isOpen ? null : i)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: tone.bg, border: `1px solid ${tone.border}`, color: tone.accent }}
                  >
                    {ins.severity === "warning" && <AlertTriangle size={14} />}
                    {ins.severity === "action" && <ZapIcon size={14} />}
                    {ins.severity === "info" && <BarChart2 size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{ins.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{ins.body}</p>
                  </div>
                  <ChevronDown
                    size={14}
                    className="shrink-0 text-muted-foreground transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t"
                      style={{ borderColor: tone.border, background: tone.bg }}
                    >
                      <div className="p-4 space-y-2">
                        <p className="text-xs text-foreground/85 leading-relaxed">{ins.body}</p>
                        {ins.action && (
                          <div
                            className="flex items-start gap-2 rounded-xl border px-3 py-2"
                            style={{ borderColor: tone.border, background: "white" }}
                          >
                            <ZapIcon size={12} className="mt-0.5 shrink-0" style={{ color: tone.accent }} />
                            <div className="flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                Recommended action
                              </p>
                              <p className="text-xs font-semibold text-foreground mt-0.5">{ins.action}</p>
                            </div>
                            <ChevronRight size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Commercial Investment */}
        <ExpandableSection label="Commercial Investment · ATL / BTL / Promo" accent="hsl(35,55%,42%)">
          <div className="grid grid-cols-3 gap-2">
            {investmentTiles.map((t) => {
              const isUp = t.direction === "up";
              return (
                <div key={t.label} className="rounded-xl border border-border bg-card px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {t.label}
                    </div>
                    <span className="text-[8px] font-semibold text-muted-foreground/60 bg-muted/50 rounded px-1 py-[1px]">
                      CSP
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-extrabold text-foreground">{t.value}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{t.share}</span>
                  </div>
                  <div
                    className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${
                      isUp ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]"
                    }`}
                  >
                    {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {t.trend}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{t.note}</p>
                </div>
              );
            })}
          </div>
        </ExpandableSection>

        {/* ATL / BTL / Promo mix chart */}
        <ExpandableSection label="Spend Mix · ATL vs BTL vs Promo" accent="hsl(35,55%,42%)">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={atlBtlMix}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {atlBtlMix.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
                formatter={(v: number) => [`€${v}M`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
            Promo is <span className="font-semibold text-foreground">51%</span> of total commercial spend;
            ATL <span className="font-semibold text-foreground">33%</span>,
            BTL <span className="font-semibold text-foreground">16%</span>.
          </p>
        </ExpandableSection>

        {/* Channel execution — Vol MS + Vol Growth × spend lanes */}
        <ExpandableSection label="Channel Execution · Share × Growth × Spend" accent="hsl(35,55%,42%)">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1.1fr_repeat(5,minmax(0,1fr))] text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground bg-muted/40 border-b border-border">
              <div className="px-3 py-2">Channel</div>
              <div className="px-2 py-2 text-right">Vol. Share</div>
              <div className="px-2 py-2 text-right">Vol. Growth</div>
              <div className="px-2 py-2 text-right">ATL</div>
              <div className="px-2 py-2 text-right">BTL</div>
              <div className="px-2 py-2 text-right">Promo</div>
            </div>
            {channelExecution.map((c) => {
              const isUp = c.dVolGrowth === "up";
              return (
                <div
                  key={c.channel}
                  className="grid grid-cols-[1.1fr_repeat(5,minmax(0,1fr))] items-center text-xs border-b last:border-b-0 border-border/60 hover:bg-muted/20 transition-colors"
                >
                  <div className="px-3 py-2.5 font-bold text-foreground">{c.channel}</div>
                  <div className="px-2 py-2.5 text-right">
                    <div className="font-extrabold text-foreground">{c.volShare}</div>
                    <div
                      className={`text-[10px] font-semibold ${
                        c.dVolShare.trim().startsWith("+")
                          ? "text-[hsl(var(--status-green))]"
                          : "text-[hsl(var(--status-red))]"
                      }`}
                    >
                      {c.dVolShare}
                    </div>
                  </div>
                  <div
                    className={`px-2 py-2.5 text-right font-extrabold ${
                      isUp ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {c.volGrowth}
                    </span>
                  </div>
                  <div className="px-2 py-2.5 text-right font-semibold text-foreground">{c.atl}</div>
                  <div className="px-2 py-2.5 text-right font-semibold text-foreground">{c.btl}</div>
                  <div className="px-2 py-2.5 text-right font-semibold text-foreground">{c.promo}</div>
                </div>
              );
            })}
          </div>
        </ExpandableSection>

        {/* Regional execution */}
        <ExpandableSection label="Regional Execution · Growth × Spend" accent="hsl(35,55%,42%)">
          <div className="space-y-1.5">
            {regionalExecution.map((r) => (
              <div
                key={r.region}
                className="rounded-xl border border-border bg-card px-4 py-2.5 flex items-center gap-4"
              >
                <div className="w-24 shrink-0">
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Region</div>
                  <div className="text-sm font-bold text-foreground">{r.region}</div>
                </div>
                <div className="w-24 shrink-0">
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Vol. Growth</div>
                  <div className="text-sm font-extrabold text-[hsl(var(--status-red))] flex items-center gap-1">
                    <TrendingDown size={11} />
                    {r.volGrowth}
                  </div>
                </div>
                <div className="w-20 shrink-0">
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">ATL</div>
                  <div className="text-sm font-semibold text-foreground">{r.atl}</div>
                </div>
                <div className="w-20 shrink-0">
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Promo</div>
                  <div className="text-sm font-semibold text-foreground">{r.promo}</div>
                </div>
              </div>
            ))}
          </div>
        </ExpandableSection>

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
