import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Sparkles,
  Palette,
  Beer,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap as ZapIcon,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  BarChart2,
  FileText,
  Download,
  ExternalLink,
} from "lucide-react";
import ExpandableSection from "./ExpandableSection";

// GREEN-readiness extension (Metric Inventory row #100 — BGS / SharePoint).
const strategicDocs: { label: string; owner: string; updated: string; size: string }[] = [
  { label: "Annual Plan 2026",    owner: "BGS",       updated: "Mar 2026", size: "12 MB PDF" },
  { label: "Brand Plan 2026",     owner: "Brand Ops", updated: "Feb 2026", size: "8 MB PDF" },
  { label: "Channel Plan 2026",   owner: "Commercial", updated: "Feb 2026", size: "6 MB PDF" },
];

interface HowToWinPageProps {
  period: string;
}

// Scoped to BGS MWBs 1–3 (Design-to-Win) — the three Y-marked battles (rows #101, #102, #103).
// Each battle is interpreted through Brand Power pillars, which are the GREEN-readiness
// signals that fire for these battles today (per the Metric Inventory).
type Status = "on-track" | "at-risk";

const battles: {
  id: number;
  name: string;
  shortName: string;
  status: Status;
  statusLabel: string;
  accent: string;
  bg: string;
  border: string;
  icon: typeof Sparkles;
  intent: string;
  signal: { label: string; value: string; delta: string; direction: "up" | "down" }[];
  insight: string;
  action: string;
}[] = [
  {
    id: 1,
    name: "Create Unique Brand Positioning",
    shortName: "Unique Positioning",
    status: "on-track",
    statusLabel: "On track",
    accent: "hsl(270,45%,45%)",
    bg: "hsl(270,35%,97%)",
    border: "hsl(270,30%,82%)",
    icon: Sparkles,
    intent:
      "Sharpen a differentiated place for each brand in the consumer's mind. Tracked through the Different pillar of Brand Power.",
    signal: [
      { label: "Different (Heineken®)", value: "135", delta: "+5", direction: "up" },
      { label: "Different (Amstel®)", value: "79", delta: "+3", direction: "up" },
      { label: "Different (Schin®)", value: "47", delta: "+1", direction: "up" },
    ],
    insight:
      "All three brands are gaining on Different vs PY — Heineken® leads at +5 pts. Positioning work is translating into consumer perception.",
    action: "Sustain the Heineken® Different momentum into the next planning cycle",
  },
  {
    id: 2,
    name: "Establish Iconic Brand Identity",
    shortName: "Iconic Identity",
    status: "at-risk",
    statusLabel: "Salience Gap",
    accent: "hsl(30,80%,45%)",
    bg: "hsl(30,100%,97%)",
    border: "hsl(30,70%,82%)",
    icon: Palette,
    intent:
      "Make the brand unmistakable and top-of-mind. Tracked through the Salient pillar of Brand Power.",
    signal: [
      { label: "Salient (Heineken®)", value: "110", delta: "-2", direction: "down" },
      { label: "Salient (Amstel®)", value: "59", delta: "+4", direction: "up" },
      { label: "Salient (Schin®)", value: "58", delta: "-2", direction: "down" },
    ],
    insight:
      "Amstel® Salient is up +4 pts but the OpCo-level gap is -14.6pp vs PY — Meaningful and Different have built, yet awareness has not caught up. Iconic identity investment is underpowered.",
    action: "Prioritise Salience-building activity for Amstel® to convert equity into recall",
  },
  {
    id: 3,
    name: "Offer Great Taste & Quality Drinks",
    shortName: "Taste & Quality",
    status: "on-track",
    statusLabel: "On track",
    accent: "hsl(138,60%,35%)",
    bg: "hsl(138,45%,97%)",
    border: "hsl(138,40%,80%)",
    icon: Beer,
    intent:
      "Protect and grow consumer resonance. Tracked through the Meaningful pillar of Brand Power.",
    signal: [
      { label: "Meaningful (Heineken®)", value: "120", delta: "+3", direction: "up" },
      { label: "Meaningful (Amstel®)", value: "96", delta: "+2", direction: "up" },
      { label: "Meaningful (Schin®)", value: "43", delta: "+2", direction: "up" },
    ],
    insight:
      "Meaningful is improving across the portfolio — taste and quality perception is strengthening. Heineken® leads but Amstel® and Schin® are both directionally positive.",
    action: "Codify the Heineken® quality cues into Amstel® comms to accelerate its Meaningful gain",
  },
];

const portfolioKpis = [
  { label: "Brand Power", value: "6.5%", trend: "+0.3pp vs PY", direction: "up" as const },
  { label: "Meaningful", value: "120", trend: "+3 pts vs PY", direction: "up" as const },
  { label: "Different", value: "135", trend: "+5 pts vs PY", direction: "up" as const },
  { label: "Salient", value: "110", trend: "-2 pts vs PY", direction: "down" as const },
];

// Top-of-page agentic insights summarising the MWB 1–3 portfolio story.
const insights: {
  severity: "warning" | "info" | "action";
  title: string;
  body: string;
  action?: string;
}[] = [
  {
    severity: "warning",
    title: "MWB 2 Iconic Identity is the at-risk battle",
    body:
      "Meaningful (+3 pts) and Different (+5 pts) have built across the portfolio, but Salient is down -2 pts and the Amstel Salience gap at OpCo level is -14.6pp vs PY. The equity is there — consumers are not recalling it.",
    action: "Prioritise Salience-building activity, concentrated on Amstel®",
  },
  {
    severity: "action",
    title: "MWB 1 Unique Positioning is the strongest signal",
    body:
      "Different is +5 pts on Heineken®, +3 on Amstel®, +1 on Schin® — positioning work is translating into consumer perception across all three brands. This is the Design-to-Win battle with the clearest upward trajectory.",
    action: "Sustain the Heineken® Different momentum into the next planning cycle",
  },
  {
    severity: "info",
    title: "MWB 3 Taste & Quality is broad-based on the rise",
    body:
      "Meaningful is +3 on Heineken®, +2 on Amstel® and Schin®. All three brands are improving — directional win, with Heineken® leading.",
    action: "Codify the Heineken® quality cues into Amstel® comms to accelerate the Meaningful gain",
  },
];

export default function HowToWinPage({ period }: HowToWinPageProps) {
  const [selectedBattle, setSelectedBattle] = useState<number | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="mx-4 my-3 space-y-3">
        {/* Page header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-[hsl(270,30%,96%)] border border-[hsl(270,30%,80%)] text-[hsl(270,40%,48%)]">
            <Trophy size={14} />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">How to Win</h1>
            <p className="text-[11px] text-muted-foreground">
              Design-to-Win battles tracked through Brand Power pillars · {period}
            </p>
          </div>
        </div>

        {/* Key Agentic Insights — top of page */}
        <div className="flex items-center gap-2 pt-1">
          <div className="w-1 h-3.5 rounded-full bg-[hsl(270,40%,48%)]" />
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

        {/* Portfolio Brand Power strip — collapsible */}
        <ExpandableSection label="Portfolio · Brand Power" accent="hsl(270,40%,48%)">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-4 py-2.5 border-r border-border bg-[hsl(270,40%,48%)] text-white">
                <Trophy size={13} />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-90">Portfolio</span>
                  <span className="text-[10px] font-semibold opacity-80">{period}</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-4 divide-x divide-border">
                {portfolioKpis.map((k) => {
                  const isUp = k.direction === "up";
                  return (
                    <div key={k.label} className="px-4 py-2 min-w-0">
                      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground truncate">
                        {k.label}
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-base font-extrabold text-foreground">{k.value}</span>
                        <span
                          className={`text-[10px] font-semibold flex items-center gap-0.5 shrink-0 ${
                            isUp ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]"
                          }`}
                        >
                          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {k.trend}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ExpandableSection>

        {/* Strategic Documents (GREEN from BGS / SharePoint) */}
        <ExpandableSection label="Strategic Documents" accent="hsl(270,40%,48%)">
          <div className="grid grid-cols-3 gap-2">
            {strategicDocs.map((doc) => (
              <a
                key={doc.label}
                href="#"
                onClick={(e) => e.preventDefault()}
                className="group rounded-xl border border-border bg-card px-3 py-2.5 flex items-center gap-3 hover:border-[hsl(270,40%,48%)] hover:shadow-md transition-all"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[hsl(270,30%,96%)] border border-[hsl(270,30%,80%)] text-[hsl(270,40%,48%)]">
                  <FileText size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">{doc.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {doc.owner} · {doc.updated} · {doc.size}
                  </div>
                </div>
                <Download
                  size={13}
                  className="text-muted-foreground/60 group-hover:text-[hsl(270,40%,48%)] transition-colors shrink-0"
                />
              </a>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ExternalLink size={10} />
            <span>Source: BGS / SharePoint — plan docs backing the Must-Win Battles</span>
          </div>
        </ExpandableSection>

        {/* Battles section */}
        <div className="flex items-center gap-2 pt-1">
          <div className="w-1 h-3.5 rounded-full bg-[hsl(270,40%,48%)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Design-to-Win Battles · MWB 1–3
          </span>
        </div>

        {/* Battle cards — stacked vertically, expandable inline */}
        <div className="space-y-2">
          {battles.map((b) => {
            const Icon = b.icon;
            const isOpen = selectedBattle === b.id;
            const isAtRisk = b.status === "at-risk";
            return (
              <div
                key={b.id}
                className="rounded-2xl border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md"
                style={{ borderColor: isOpen ? b.accent : "hsl(var(--border))" }}
              >
                {/* Left accent stripe */}
                <div className="relative">
                  <span
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ background: b.accent }}
                  />
                  <button
                    onClick={() => setSelectedBattle(isOpen ? null : b.id)}
                    className="w-full text-left pl-4 pr-3 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                  >
                    {/* Battle number chip */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: b.bg, border: `1px solid ${b.border}`, color: b.accent }}
                    >
                      <Icon size={15} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          MWB {b.id}
                        </span>
                        <span
                          className="px-1.5 py-[1px] rounded-full text-[9px] font-bold flex items-center gap-1"
                          style={{
                            color: b.accent,
                            background: b.bg,
                            border: `1px solid ${b.border}`,
                          }}
                        >
                          {isAtRisk ? <AlertTriangle size={9} /> : <CheckSquare size={9} />}
                          {b.statusLabel}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-foreground truncate mt-0.5">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{b.intent}</p>
                    </div>

                    <ChevronDown
                      size={14}
                      className="shrink-0 text-muted-foreground transition-transform"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden border-t"
                        style={{ borderColor: b.border, background: b.bg }}
                      >
                        <div className="p-4 space-y-3">
                          {/* Signal pills */}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
                              Brand Power signal
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {b.signal.map((s) => {
                                const isUp = s.direction === "up";
                                return (
                                  <div
                                    key={s.label}
                                    className="rounded-xl border bg-white px-3 py-2"
                                    style={{ borderColor: b.border }}
                                  >
                                    <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground truncate">
                                      {s.label}
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-0.5">
                                      <span className="text-base font-extrabold text-foreground">{s.value}</span>
                                      <span
                                        className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                                          isUp
                                            ? "text-[hsl(var(--status-green))]"
                                            : "text-[hsl(var(--status-red))]"
                                        }`}
                                      >
                                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        {s.delta}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* AI insight */}
                          <div
                            className="rounded-xl border bg-white px-3 py-2.5 flex items-start gap-2.5"
                            style={{ borderColor: b.border }}
                          >
                            {isAtRisk ? (
                              <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: b.accent }} />
                            ) : (
                              <CheckSquare size={14} className="mt-0.5 shrink-0" style={{ color: b.accent }} />
                            )}
                            <p className="text-xs text-foreground/85 leading-relaxed">{b.insight}</p>
                          </div>

                          {/* Recommended action */}
                          <div
                            className="rounded-xl border bg-white px-3 py-2.5 flex items-start gap-2.5"
                            style={{ borderColor: b.border }}
                          >
                            <ZapIcon size={14} className="mt-0.5 shrink-0" style={{ color: b.accent }} />
                            <div className="flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                Recommended action
                              </p>
                              <p className="text-xs font-semibold text-foreground mt-0.5">{b.action}</p>
                            </div>
                            <ChevronRight size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
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
