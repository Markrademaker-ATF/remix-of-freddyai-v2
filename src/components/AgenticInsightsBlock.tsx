import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  AlertTriangle,
  Zap as ZapIcon,
  BarChart2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export type InsightSeverity = "warning" | "info" | "action";

export interface AgenticInsight {
  severity: InsightSeverity;
  title: string;
  body: string;
  action?: string;
}

interface AgenticInsightsBlockProps {
  accent: string;
  insights: AgenticInsight[];
  defaultOpen?: boolean;
  label?: string;
}

// Single expandable block containing all AI insights as inline subpoints.
// Matches the ExpandableSection style used on the rest of the reporting subtabs.
export default function AgenticInsightsBlock({
  accent,
  insights,
  defaultOpen = true,
  label = "Key Agentic Insights",
}: AgenticInsightsBlockProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-2xl border bg-card shadow-sm overflow-hidden"
      style={{ borderColor: open ? accent : "hsl(var(--border))" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${accent}15`, color: accent }}
          >
            <Sparkles size={12} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
            {label}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 rounded-full px-1.5 py-[1px]">
            {insights.length}
          </span>
        </div>
        <ChevronDown
          size={13}
          className="text-muted-foreground transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-3 space-y-2">
              {insights.map((ins, i) => {
                const tone = toneFor(ins.severity);
                return (
                  <div
                    key={i}
                    className="rounded-xl border px-3 py-2.5"
                    style={{ background: tone.bg, borderColor: tone.border }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "white", border: `1px solid ${tone.border}`, color: tone.accent }}
                      >
                        {ins.severity === "warning" && <AlertTriangle size={12} />}
                        {ins.severity === "action" && <ZapIcon size={12} />}
                        {ins.severity === "info" && <BarChart2 size={12} />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-xs font-bold text-foreground leading-snug">{ins.title}</p>
                        <p className="text-[11px] text-foreground/80 leading-relaxed">{ins.body}</p>
                        {ins.action && (
                          <div
                            className="flex items-start gap-2 rounded-lg border px-2.5 py-1.5 bg-white"
                            style={{ borderColor: tone.border }}
                          >
                            <ZapIcon size={11} className="mt-0.5 shrink-0" style={{ color: tone.accent }} />
                            <div className="flex-1">
                              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                Recommended action
                              </p>
                              <p className="text-[11px] font-semibold text-foreground mt-0.5 leading-snug">
                                {ins.action}
                              </p>
                            </div>
                            <ChevronRight size={11} className="mt-0.5 shrink-0 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function toneFor(severity: InsightSeverity) {
  if (severity === "warning")
    return { accent: "hsl(30,80%,50%)", bg: "hsl(30,100%,97%)", border: "hsl(30,70%,85%)" };
  if (severity === "action")
    return { accent: "hsl(138,60%,35%)", bg: "hsl(138,50%,97%)", border: "hsl(138,40%,82%)" };
  return { accent: "hsl(210,50%,50%)", bg: "hsl(210,30%,97%)", border: "hsl(210,30%,87%)" };
}
