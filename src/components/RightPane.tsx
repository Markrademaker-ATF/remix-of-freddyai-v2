import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, TrendingUp, TrendingDown, Minus, AlertTriangle, ExternalLink, Zap, ArrowRight, ChevronRight, Play, BookOpen } from "lucide-react";

import { mockData, AppState, TrendDirection } from "@/data/mockData";
import { howToWinBattleKpis, execExcellenceBattleKpis, type BattleKpiConfig } from "@/data/battleKpiData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import HowToWinBattleDetail from "@/components/HowToWinBattleDetail";

interface RightPaneProps {
  activeState: AppState;
  selectedBattle: number | null;
  period?: string;
  onNavigate?: (state: AppState, battle: number | null) => void;
  onOpenAllocationAI?: () => void;
  initialFiveCsTab?: string | null;
  onFiveCsTabConsumed?: () => void;
}

// Per-period multipliers for KPI numeric values
const kpiPeriodScale: Record<string, number> = {
  L12w: 1.00,
  L4w:  0.88,
  YTD:  1.06,
  MAT:  1.03,
};

function scaleBattleKpiValue(value: string, scale: number): string {
  if (scale === 1.0) return value;
  // Match a leading sign, optional currency, number, optional suffix
  const m = value.match(/^([+-]?)([€£$]?)(\d[\d,.]*)(\s?(?:pp|pts|%|x|M|B|khl)?.*)$/);
  if (!m) return value;
  const [, sign, currency, num, suffix] = m;
  const raw = parseFloat(num.replace(/,/g, ""));
  if (isNaN(raw)) return value;
  // For pp/pts-style changes keep 1 decimal, otherwise 0 for large numbers
  const isDecimal = num.includes(".") || suffix.includes("pp") || suffix.includes("pts");
  const scaled = (raw * scale).toFixed(isDecimal ? 1 : 0);
  return `${sign}${currency}${scaled}${suffix}`;
}

const TrendIcon = ({ trend, size = 10 }: { trend: TrendDirection; size?: number }) => {
  if (trend === "up") return <TrendingUp size={size} className="text-status-green" />;
  if (trend === "down") return <TrendingDown size={size} className="text-status-red" />;
  return <Minus size={size} className="text-muted-foreground" />;
};

const trendColor = (trend: TrendDirection) => {
  if (trend === "up") return "text-status-green";
  if (trend === "down") return "text-status-red";
  return "text-muted-foreground";
};

export default function RightPane({ activeState, selectedBattle, period = "L12w", onNavigate, onOpenAllocationAI, initialFiveCsTab, onFiveCsTabConsumed }: RightPaneProps) {
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [expandedStepReadMore, setExpandedStepReadMore] = useState<string | null>(null);
  const [fiveCsTab, setFiveCsTab] = useState<"consumers" | "category" | "channel" | "competition" | "company">("category");
  const [battleBrandFilter, setBattleBrandFilter] = useState<string>("All Brands");
  const [consumerSegTab, setConsumerSegTab] = useState<number>(0);

  // Handle external tab navigation (e.g., from chatbot)
  useEffect(() => {
    if (initialFiveCsTab && activeState === "shared_reality") {
      setFiveCsTab(initialFiveCsTab as typeof fiveCsTab);
      onFiveCsTabConsumed?.();
    }
  }, [initialFiveCsTab, activeState]);

  useEffect(() => {
    setBattleBrandFilter("All Brands");
  }, [selectedBattle]);
  const state1 = mockData.scenarios.state_1_shared_reality;
  const state2 = mockData.scenarios.state_2_how_to_win;
  const state3 = mockData.scenarios.state_3_excellent_execution;

  const toolRoutes: Record<string, string> = {
    "Trade dashboard": "/trade",
    "Consumer Insights tool": "/consumer-insights",
    "Media dashboard": "/media",
    "Media tool": "/media",
    "Pricing tool": "/pricing",
    "Promotions dashboard": "/promotions",
    "AllocationAI tool": "/allocation-ai",
    "Innovation Dashboard": "/innovation",
  };

  type StepDetail = { step: string; explanation: string; dataLink: string; dataLabel: string };
  const executionSteps: Record<string, StepDetail[]> = {
    "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard": [
      { step: "Open Trade dashboard and filter by Amstel brand", explanation: "Start by isolating Amstel's data to remove noise from other brands and focus on its specific Key Account performance trends.", dataLink: "/trade", dataLabel: "Trade Dashboard" },
      { step: "Compare Salience scores across Key Account segments (L12w vs. PY)", explanation: "Benchmarking current 12-week Salience against prior year reveals whether the decline is seasonal or structural across account tiers.", dataLink: "/trade", dataLabel: "Salience Report" },
      { step: "Identify top 3 underperforming accounts with largest Salience decline", explanation: "Prioritizing the worst-performing accounts ensures resource allocation targets the biggest opportunities for recovery.", dataLink: "/trade", dataLabel: "Account Rankings" },
      { step: "Cross-reference with distribution and shelf-space data", explanation: "Salience drops often correlate with reduced visibility — checking distribution gaps can reveal root causes.", dataLink: "/trade", dataLabel: "Distribution Data" },
      { step: "Schedule review meeting with Key Account managers", explanation: "Align with field teams on findings to co-create corrective action plans with account-level buy-in.", dataLink: "/trade", dataLabel: "Account Contacts" },
    ],
    "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool": [
      { step: "Open Consumer Insights tool filtered to Heineken 0.0", explanation: "Isolate the zero-alcohol variant to analyze its unique positioning drivers without portfolio-level dilution.", dataLink: "/consumer-insights", dataLabel: "Consumer Insights" },
      { step: "Analyze 'Meaningful' metric decomposition by age cohort", explanation: "Different age groups respond to distinct emotional and functional benefits — decomposition reveals where messaging resonates most.", dataLink: "/consumer-insights", dataLabel: "Cohort Analysis" },
      { step: "Compare messaging resonance across campaign touchpoints", explanation: "Evaluate which channels (TV, digital, POS) are driving or diluting Meaningful scores to optimize the media mix.", dataLink: "/consumer-insights", dataLabel: "Campaign Touchpoints" },
      { step: "Identify top 2 underperforming driver attributes", explanation: "Pinpointing weak attributes (e.g., taste perception, occasion fit) focuses creative briefs on the highest-impact improvements.", dataLink: "/consumer-insights", dataLabel: "Driver Attributes" },
      { step: "Draft brief for creative agency with revised messaging priorities", explanation: "Translate data insights into a clear, actionable creative brief that aligns agency output with brand strategy.", dataLink: "/consumer-insights", dataLabel: "Brief Templates" },
    ],
    "Adjust media spend to counter Kaiser momentum – go to Media dashboard": [
      { step: "Open Media dashboard and pull Kaiser competitive spend analysis", explanation: "Understanding Kaiser's investment levels and timing helps identify where they're gaining share-of-voice advantage.", dataLink: "/media", dataLabel: "Media Dashboard" },
      { step: "Map Kaiser's media weight by channel (TV, Digital, OOH)", explanation: "Channel-level mapping reveals Kaiser's strategy — heavy digital may require different counter-tactics than traditional media.", dataLink: "/media", dataLabel: "Channel Analysis" },
      { step: "Identify counter-programming windows with low Kaiser presence", explanation: "Exploiting gaps in competitor scheduling maximizes impact per euro spent on counter-programming.", dataLink: "/media", dataLabel: "Schedule Gaps" },
      { step: "Reallocate 15% of reserve budget to high-impact digital slots", explanation: "Digital channels offer fastest response time and precise targeting to counteract competitor momentum in real-time.", dataLink: "/media", dataLabel: "Budget Planner" },
      { step: "Set up weekly monitoring alert for Kaiser SOV changes", explanation: "Continuous monitoring ensures early detection of further competitive shifts before they impact brand metrics.", dataLink: "/media", dataLabel: "SOV Tracker" },
    ],
    "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool": [
      { step: "Open Pricing tool and model a 250ml pack variant for Silver", explanation: "A smaller pack creates a lower entry price point, attracting trial without directly competing with Original's core pack sizes.", dataLink: "/pricing", dataLabel: "Pricing Tool" },
      { step: "Run price elasticity simulation at €1.29, €1.49, €1.69 price points", explanation: "Simulating multiple price tiers quantifies demand sensitivity and helps find the sweet spot between volume and margin.", dataLink: "/pricing", dataLabel: "Elasticity Model" },
      { step: "Assess cannibalization impact on Original at each price tier", explanation: "Each price point has different cross-SKU substitution risk — lower prices may drive trial but increase cannibalization.", dataLink: "/pricing", dataLabel: "Cannibalization Report" },
      { step: "Select optimal price point minimizing cross-SKU substitution", explanation: "The ideal price balances Silver's growth potential while protecting Original's volume base and overall portfolio margin.", dataLink: "/pricing", dataLabel: "Price Optimization" },
      { step: "Submit pack-price proposal to commercial planning team", explanation: "Formal submission ensures alignment with commercial strategy and triggers the internal approval workflow.", dataLink: "/pricing", dataLabel: "Proposal Builder" },
    ],
    "Bundle offers to balance sales – go to Promotions dashboard": [
      { step: "Open Promotions dashboard and review current Silver/Original overlap", explanation: "Understanding existing promotional overlap prevents conflicting offers that could accelerate cannibalization.", dataLink: "/promotions", dataLabel: "Promotions Dashboard" },
      { step: "Design 3 bundle configurations (mixed-pack, volume tier, occasion-based)", explanation: "Multiple configurations allow testing different consumer motivations — variety, value, or occasion — to find best fit.", dataLink: "/promotions", dataLabel: "Bundle Designer" },
      { step: "Simulate uplift and margin impact for each bundle option", explanation: "Simulation quantifies the trade-off between incremental volume uplift and margin dilution for each bundle type.", dataLink: "/promotions", dataLabel: "Uplift Simulator" },
      { step: "Select top bundle and define promotional calendar slots", explanation: "Aligning the winning bundle with optimal calendar windows (e.g., summer, sports events) maximizes reach and relevance.", dataLink: "/promotions", dataLabel: "Calendar Planner" },
      { step: "Brief trade marketing team on execution timeline", explanation: "Clear timelines ensure in-store execution aligns with above-the-line campaign timing for maximum impact.", dataLink: "/promotions", dataLabel: "Execution Brief" },
    ],
    "AllocationAI recommends shifting budget from Promotions to UCL Sponsorship to maximize overall ROI. – go to AllocationAI tool": [
      { step: "Open AllocationAI tool and review current budget allocation", explanation: "A baseline view of current spend distribution is essential before modelling any reallocation scenarios.", dataLink: "/allocation-ai", dataLabel: "AllocationAI Tool" },
      { step: "Model scenario: shift €500K from BTL Promotions to UCL Sponsorship", explanation: "This scenario tests the hypothesis that sponsorship delivers higher ROI than below-the-line promotions at scale.", dataLink: "/allocation-ai", dataLabel: "Scenario Modeller" },
      { step: "Validate projected ROI uplift (€0.85 → €2.45 range improvement)", explanation: "Confirming the projected improvement range builds the business case and quantifies the financial upside.", dataLink: "/allocation-ai", dataLabel: "ROI Projections" },
      { step: "Check for minimum spend commitments on existing promo contracts", explanation: "Existing contractual obligations may constrain the reallocation timeline — early identification prevents execution delays.", dataLink: "/allocation-ai", dataLabel: "Contract Review" },
      { step: "Submit reallocation request to Finance for approval", explanation: "Finance sign-off formalizes the budget shift and triggers the procurement and planning workflows.", dataLink: "/allocation-ai", dataLabel: "Approval Workflow" },
    ],
    "Pause underperforming Desperados digital activation – go to Media tool": [
      { step: "Open Media tool and pull Desperados digital campaign report", explanation: "The campaign report provides granular performance data needed to confirm underperformance isn't a measurement artefact.", dataLink: "/media", dataLabel: "Media Tool" },
      { step: "Confirm ROI remains below €1.00 threshold for 4+ consecutive weeks", explanation: "A 4-week threshold filters out short-term fluctuations and confirms a sustained underperformance pattern.", dataLink: "/media", dataLabel: "ROI Trend Report" },
      { step: "Identify salvageable creative assets for future reuse", explanation: "High-quality creative assets can be repurposed in future campaigns, preserving production investment value.", dataLink: "/media", dataLabel: "Asset Library" },
      { step: "Submit pause request through campaign management system", explanation: "A formal pause request ensures proper documentation and enables clean reactivation if conditions change.", dataLink: "/media", dataLabel: "Campaign Manager" },
      { step: "Reallocate freed budget to top-performing channels", explanation: "Redirecting budget to proven high-ROI channels immediately improves overall portfolio return on investment.", dataLink: "/media", dataLabel: "Channel Performance" },
    ],
  };

  const getExecutionSteps = (action: string): StepDetail[] => {
    return executionSteps[action] || [
      { step: "Review the relevant dashboard data", explanation: "Start with the data to ensure decisions are grounded in current performance.", dataLink: "/", dataLabel: "Dashboard" },
      { step: "Identify key areas requiring attention", explanation: "Prioritize the metrics with the largest gaps to focus effort where it matters most.", dataLink: "/", dataLabel: "Analytics" },
      { step: "Prepare action plan with stakeholders", explanation: "Collaborative planning ensures buy-in and aligns cross-functional teams.", dataLink: "/", dataLabel: "Planning" },
      { step: "Execute recommended changes", explanation: "Implement the agreed actions with clear ownership and timelines.", dataLink: "/", dataLabel: "Execution" },
      { step: "Monitor results and iterate", explanation: "Track outcomes weekly and adjust tactics based on real-time performance feedback.", dataLink: "/", dataLabel: "Monitoring" },
    ];
  };

  const renderActionText = (text: string) => {
    const cleaned = text.replace(/\s*–\s*go to\s+.+$/i, "");
    return <span>{cleaned}</span>;
  };

  const kpiScale = kpiPeriodScale[period] ?? 1.0;

  const renderBattleKpiSection = (config: BattleKpiConfig, showInsights = true) => (
    <>
      {/* KPI Pills — 3-column grid to handle up to 6 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {config.kpis.map((kpi, i) => {
          const isPositive = kpi.status === "positive";
          const isWarning = kpi.status === "warning";
          const isNegative = kpi.status === "negative";
          return (
            <div
              key={i}
              className={`rounded-2xl border-2 px-3 py-3 text-center transition-all shadow-sm relative ${
                isWarning
                  ? "border-[hsl(var(--status-orange))] bg-status-orange-bg shadow-[0_0_10px_hsl(var(--status-orange)/0.2)]"
                  : "border-border bg-card"
              }`}
            >
              {isWarning && (
                <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[hsl(var(--status-orange))] flex items-center justify-center shadow">
                  <AlertTriangle size={9} className="text-white" />
                </div>
              )}
              <div className="text-[10px] font-medium text-muted-foreground tracking-wide leading-tight">{kpi.label}</div>
              <div className={`text-sm font-extrabold mt-1 ${
                isWarning || isNegative
                  ? "text-[hsl(var(--status-orange))]"
                  : isPositive
                    ? "text-[hsl(var(--status-green))]"
                    : "text-foreground"
              }`}>
                {scaleBattleKpiValue(kpi.value, kpiScale)}
              </div>
            </div>
          );
        })}
      </div>


      {showInsights && (
        <>
          {/* Insights & Recommended Actions */}
          <h3 className="font-bold text-xs text-foreground mb-3 uppercase tracking-wide">Insights & Recommended Actions</h3>
          <div className="border-2 border-[hsl(var(--status-orange))] bg-status-orange-bg rounded-xl mb-4 shadow-[0_0_12px_hsl(var(--status-orange)/0.15)] overflow-hidden divide-y divide-[hsl(var(--status-orange))]/20">
              {config.insights.map((item, idx) => {
                const isExpanded = expandedAction === item.action;
                const steps = getExecutionSteps(item.action);
                return (
                  <div key={idx}>
                    <button
                      onClick={() => setExpandedAction(isExpanded ? null : item.action)}
                      className="w-full text-left p-3 transition-all space-y-2 hover:bg-[hsl(var(--status-orange))]/10"
                    >
                      <div className="flex items-start gap-2 text-sm">
                        <AlertTriangle size={13} className="text-[hsl(var(--status-orange))] mt-0.5 shrink-0" />
                        <p className="text-foreground leading-snug text-[11px]">{item.insight}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <CheckSquare size={12} className={`shrink-0 ${isExpanded ? "text-[hsl(var(--status-orange))]" : "text-muted-foreground"}`} />
                        <span className="flex-1 leading-snug font-semibold">{renderActionText(item.action)}</span>
                        <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full transition-colors ${
                          isExpanded ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}>
                          <ChevronRight size={10} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          View Execution
                        </span>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-muted/40 border border-t-0 border-border rounded-b-xl p-4 space-y-2">
                            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wide mb-2">Execution Steps</h4>
                            {steps.map((stepDetail, j) => {
                              const stepReadMoreKey = `${item.action}-${j}`;
                              const isReadMoreOpen = expandedStepReadMore === stepReadMoreKey;
                              return (
                                <div key={j} className="space-y-1">
                                  <div className="flex items-start gap-2 text-[12px] text-foreground/90 leading-snug">
                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                                      {j + 1}
                                    </div>
                                    <span>{stepDetail.step}</span>
                                  </div>
                                  <div className="ml-7">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setExpandedStepReadMore(isReadMoreOpen ? null : stepReadMoreKey); }}
                                      className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
                                    >
                                      <BookOpen size={10} />
                                      {isReadMoreOpen ? "Show less" : "Read more"}
                                    </button>
                                    <AnimatePresence>
                                      {isReadMoreOpen && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 mb-1.5">{stepDetail.explanation}</p>
                                          <a href={stepDetail.dataLink} className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:text-accent/80 transition-colors">
                                            <ExternalLink size={9} />
                                            Explore in {stepDetail.dataLabel}
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
        </>
      )}

    </>
  );

  const renderActions = (actions: string[]) => (
    <div className="mb-5">
      <h3 className="font-bold text-sm text-foreground mb-3 uppercase tracking-wide">Recommended actions</h3>
      <div className="rounded-xl overflow-hidden border-2 border-[hsl(var(--status-orange))] bg-status-orange-bg shadow-[0_0_12px_hsl(var(--status-orange)/0.15)] divide-y divide-[hsl(var(--status-orange))]/20">
        {actions.map((a, i) => {
          const isExpanded = expandedAction === a;
          const steps = getExecutionSteps(a);
          return (
            <div key={i}>
              <button
                onClick={() => setExpandedAction(isExpanded ? null : a)}
                className="w-full flex items-center gap-2.5 text-left p-3 transition-all hover:bg-[hsl(var(--status-orange))]/10"
              >
                <CheckSquare size={14} className={`mt-0.5 shrink-0 ${isExpanded ? "text-[hsl(var(--status-orange))]" : "text-muted-foreground"}`} />
                <div className="flex-1 leading-snug text-[11px] font-semibold">
                  {renderActionText(a)}
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full transition-colors ${
                  isExpanded ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}>
                  <ChevronRight size={10} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  View Execution
                </span>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-muted/40 border-t border-border p-4 space-y-2">
                      <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wide mb-2">Execution Steps</h4>
                      {steps.map((stepDetail, j) => {
                        const stepReadMoreKey = `${a}-${j}`;
                        const isReadMoreOpen = expandedStepReadMore === stepReadMoreKey;
                        return (
                          <div key={j} className="space-y-1">
                            <div className="flex items-start gap-2 text-[12px] text-foreground/90 leading-snug">
                              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                                {j + 1}
                              </div>
                              <span>{stepDetail.step}</span>
                            </div>
                            <div className="ml-7">
                              <button
                                onClick={(e) => { e.stopPropagation(); setExpandedStepReadMore(isReadMoreOpen ? null : stepReadMoreKey); }}
                                className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
                              >
                                <BookOpen size={10} />
                                {isReadMoreOpen ? "Show less" : "Read more"}
                              </button>
                              <AnimatePresence>
                                {isReadMoreOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 mb-1.5">{stepDetail.explanation}</p>
                                    <a href={stepDetail.dataLink} className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:text-accent/80 transition-colors">
                                      <ExternalLink size={9} />
                                      Explore in {stepDetail.dataLabel}
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
  );



  const renderState1 = () => {
    const fp = state1.freddy_performance;
    const brands = ["heineken", "amstel", "schin"] as const;

    const tabInsights: Record<string, { insight: string; action: string; steps: { step: string; explanation: string; dataLink: string; dataLabel: string }[] } | null> = {
      category: null,
      consumers: null,
      channel: {
        insight: "Amstel® Sales Power is lagging in On-Trade (-1.8 pts vs PY), where 42% of its volume is concentrated. ATL spend on Amstel is underperforming with ROI at €0.92 — below the €1.50 threshold. Reallocating ATL budget toward On-Trade activations could recover Sales Power.",
        action: "Shift Amstel ATL budget to targeted On-Trade activations to recover Sales Power – go to Trade dashboard",
        steps: [
          { step: "Open Trade dashboard and filter by Amstel On-Trade performance", explanation: "Isolate Amstel's On-Trade data to quantify the Sales Power gap and identify the worst-performing account tiers.", dataLink: "/trade", dataLabel: "Trade Dashboard" },
          { step: "Analyse ATL campaign ROI breakdown for Amstel by channel", explanation: "Understanding which ATL touchpoints are delivering below-threshold ROI reveals where budget is being wasted.", dataLink: "/media", dataLabel: "ATL ROI Report" },
          { step: "Model reallocation of 30% ATL budget to On-Trade BTL activations", explanation: "Shifting spend from underperforming ATL to On-Trade promotions directly targets the channel where Amstel is most concentrated.", dataLink: "/allocation-ai", dataLabel: "AllocationAI Tool" },
          { step: "Design Amstel On-Trade activation plan for top 50 accounts", explanation: "Focused activation in high-volume On-Trade accounts maximises Sales Power recovery with the reallocated budget.", dataLink: "/trade", dataLabel: "Activation Planner" },
          { step: "Set up weekly Sales Power tracker for Amstel On-Trade", explanation: "Continuous monitoring ensures the reallocation is delivering the expected Sales Power improvement.", dataLink: "/trade", dataLabel: "Sales Power Tracker" },
        ],
      },
      company: null,
        competition: {
        insight: "AB InBev is gaining +3pp value share over the last 2 years, primarily driven by Brahma and Budweiser growth in Mainstream Lager. HEINEKEN is losing -1.5pp share in the same period. The competitive gap is narrowing from +28pp to +24pp. Urgent action needed to defend share in Mainstream segment.",
        action: "Strengthen Mainstream Lager defence against AB InBev to reverse share loss trajectory – go to Media dashboard",
        steps: [
          { step: "Pull AB InBev competitive spend analysis in Mainstream Lager", explanation: "Understanding AB InBev's investment intensity in their strongest segment reveals the scale of defensive action required.", dataLink: "/media", dataLabel: "Media Dashboard" },
          { step: "Map AB InBev's Mainstream Lager distribution gains by channel", explanation: "Identifying where AB InBev is gaining distribution points shows the most vulnerable accounts that need reinforcement.", dataLink: "/trade", dataLabel: "Distribution Map" },
          { step: "Model the impact of losing 2pp Mainstream share on total portfolio gap", explanation: "Quantifying the downstream impact on the narrowing gap motivates decisive action and secures budget approval.", dataLink: "/allocation-ai", dataLabel: "Gap Impact Model" },
          { step: "Design targeted price-pack response for top 20 Mainstream accounts", explanation: "A surgical price-pack response in key accounts is more cost-effective than broad-based category-wide action.", dataLink: "/pricing", dataLabel: "Price-Pack Tool" },
          { step: "Set up monthly competitive gap alert for AB InBev", explanation: "Automated monitoring ensures the team can respond rapidly if AB InBev's Mainstream push continues eroding the overall gap.", dataLink: "/media", dataLabel: "Gap Tracker" },
        ],
      },
    };

    const fiveCsTabs = [
      { key: "category" as const, label: "CATEGORY" },
      { key: "consumers" as const, label: "CONSUMERS" },
      { key: "channel" as const, label: "CHANNEL / CUSTOMER" },
      { key: "company" as const, label: "COMPANY" },
      { key: "competition" as const, label: "COMPETITION" },
    ];

    const renderTabInsight = (tabKey: string) => {
      const item = tabInsights[tabKey];
      if (!item) return null;
      const isExpanded = expandedAction === item.action;
      return (
        <div className="mb-4 rounded-xl overflow-hidden border-2 border-status-orange bg-status-orange-bg shadow-[0_0_12px_hsl(var(--status-orange)/0.15)]">
          <button
            onClick={() => setExpandedAction(isExpanded ? null : item.action)}
            className={`w-full text-left p-3 space-y-2 transition-all ${isExpanded ? "border-b border-status-orange" : ""}`}
          >
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle size={14} className="text-status-orange mt-0.5 shrink-0" />
              <p className="text-foreground leading-snug">{item.insight}</p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <CheckSquare size={12} className={`shrink-0 ${isExpanded ? "text-accent" : "text-muted-foreground"}`} />
              <span className="flex-1 leading-snug font-semibold">{renderActionText(item.action)}</span>
              <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full transition-colors ${
                isExpanded ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}>
                <ChevronRight size={10} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                View Execution
              </span>
            </div>
          </button>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="bg-card p-3 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Execution Plan</p>
                  {item.steps.map((s, si) => {
                    const stepKey = `${item.action}-${si}`;
                    const stepExpanded = expandedStepReadMore === stepKey;
                    return (
                      <div key={si} className="flex gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">{si + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-foreground leading-snug">{s.step}</p>
                          <AnimatePresence>
                            {stepExpanded && (
                              <motion.p
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="text-[10px] text-muted-foreground mt-1 leading-relaxed overflow-hidden"
                              >
                                {s.explanation}
                              </motion.p>
                            )}
                          </AnimatePresence>
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedStepReadMore(stepExpanded ? null : stepKey); }}
                              className="text-[9px] font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              <BookOpen size={9} />{stepExpanded ? "Show less" : "Read more"}
                            </button>
                            <a href={s.dataLink} className="text-[9px] font-semibold text-accent hover:underline flex items-center gap-1 ml-auto">
                              <ExternalLink size={9} /> {s.dataLabel}
                            </a>
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
    };

    return (
      <>
        {/* 5Cs Framework */}
        <div className="mb-4">
          {/* Tab pills */}
          <div className="flex gap-1 mb-4">
            {fiveCsTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFiveCsTab(tab.key)}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all ${
                  fiveCsTab === tab.key
                    ? "bg-primary text-primary-foreground shadow"
                    : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={fiveCsTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {fiveCsTab === "category" && (
                <div>
                  {renderTabInsight("category")}
                  {/* KPI Pills */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { kpis: [{ label: "Total Mkt Vol.", value: "221 MHL", change: "+5.2% vs PY", up: true }, { label: "Value Growth", value: "+8.3%", change: "vs PY", up: true }] },
                      { kpis: [{ label: "Premium Share", value: "30%", change: "+2pp vs PY", up: true }, { label: "Beer / Total Bev.", value: "45%", change: "+0.3pp vs PY", up: true }] },
                      { kpis: [{ label: "CAGR 2024–30", value: "+4.9%", change: "6yr proj.", up: true }, { label: "PCC (L p.p.a.)", value: "68L", change: "+1.2 vs PY", up: true }] },
                    ].map((box, i) => (
                      <div key={i} className="rounded-2xl border-2 border-border bg-card px-3 py-3 shadow-sm flex flex-col gap-2">
                        {box.kpis.map((k, j) => (
                          <div key={j} className={`text-center ${j > 0 ? "border-t border-border pt-2" : ""}`}>
                            <div className="text-[10px] font-medium text-muted-foreground tracking-wide leading-tight">{k.label}</div>
                            <div className="text-sm font-extrabold mt-0.5 text-foreground">{k.value}</div>
                            <div className={`text-[9px] font-semibold ${k.up ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]"}`}>{k.change}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {/* 1. Beer Market Volume bar chart */}
                  <p className="text-[11px] font-bold text-foreground mb-1">Beer Market Volume, MHL</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={[
                      { year: "2016", vol: 200 }, { year: "2019", vol: 210 }, { year: "2024", vol: 221 },
                      { year: "2025", vol: 232 }, { year: "2026", vol: 243 }, { year: "2027", vol: 255 },
                      { year: "2028", vol: 268 }, { year: "2029", vol: 281 }, { year: "2030", vol: 295 },
                    ]} margin={{ top: 12, right: 4, left: -20, bottom: 0 }} barSize={14}>
                      <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} domain={[180, 310]} />
                      <Tooltip formatter={(v: number) => [`${v} MHL`, "Volume"]} contentStyle={{ fontSize: 10 }} />
                      <Bar dataKey="vol" fill="hsl(var(--primary))" radius={[2,2,0,0]}>
                        {[200,210,221,232,243,255,268,281,295].map((v,i) => (
                          <text key={i} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* 2. Drivers of growth table */}
                  <p className="text-[11px] font-bold text-foreground mb-1 mt-3">Drivers of Growth</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[9px] border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left py-1 pr-1 font-semibold text-muted-foreground"></th>
                          {["2016","2019","2024","2025","2026","2027","2028","2029","2030"].map(y => (
                            <th key={y} className={`text-center py-1 px-0.5 font-bold ${["2024","2025"].includes(y) ? "bg-primary text-primary-foreground rounded" : "text-foreground"}`}>{y}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "HL Growth (%)",             vals: ["+3.2%","+2.8%","+5.2%","+5.0%","+4.8%","+4.9%","+4.7%","+4.6%","+4.9%"] },
                          { label: "PCC (L p.p.)",              vals: ["58","61","68","71","74","78","82","86","90"] },
                          { label: "PCC growth (%)",            vals: ["+2.1%","+1.9%","+3.5%","+4.4%","+4.2%","+5.4%","+5.1%","+4.9%","+4.7%"] },
                          { label: "Income/Capita (PPP p.p.)", vals: ["9,200","10,100","12,800","13,400","14,100","14,900","15,800","16,700","17,600"] },
                          { label: "Income/Capita Growth (%)", vals: ["+4.1%","+3.6%","+5.8%","+4.7%","+5.2%","+5.7%","+6.0%","+5.7%","+5.4%"] },
                          { label: "Population (M)",            vals: ["210","212","215","216","217","218","219","220","221"] },
                          { label: "Population Growth (%)",     vals: ["+0.8%","+0.7%","+0.9%","+0.5%","+0.5%","+0.5%","+0.5%","+0.5%","+0.5%"] },
                          { label: "Inflation vs. LY",          vals: ["+3.4%","+4.1%","+6.9%","+5.2%","+4.1%","+3.5%","+3.0%","+2.8%","+2.6%"] },
                        ].map((row, i) => (
                          <tr key={row.label} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                            <td className="py-1 pr-1 font-medium text-foreground">{row.label}</td>
                            {row.vals.map((v, j) => (
                              <td key={j} className="text-center py-1 px-0.5 text-muted-foreground">{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {fiveCsTab === "category" && false && (
                <div>
                  {/* kept for reference */}
                </div>
              )}

              {fiveCsTab === "consumers" && (
                <div className="space-y-4">
                  {renderTabInsight("consumers")}
                  {/* KPI Pills */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { kpis: [{ label: "Category Penetration", value: "72%", change: "+1.4pp vs PY", up: true }, { label: "Purchase Frequency", value: "18/yr", change: "+0.8 vs PY", up: true }] },
                      { kpis: [{ label: "Premium Share", value: "30%", change: "+2pp vs PY", up: true }, { label: "18–34 Index", value: "112", change: "+4pts vs PY", up: true }] },
                      { kpis: [{ label: "Low/No Alc. Growth", value: "+14%", change: "vs PY", up: true }, { label: "Brand Loyalty", value: "61%", change: "-1.2pp vs PY", up: false }] },
                    ].map((box, i) => (
                      <div key={i} className="rounded-2xl border-2 border-border bg-card px-3 py-3 shadow-sm flex flex-col gap-2">
                        {box.kpis.map((k, j) => (
                          <div key={j} className={`text-center ${j > 0 ? "border-t border-border pt-2" : ""}`}>
                            <div className="text-[10px] font-medium text-muted-foreground tracking-wide leading-tight">{k.label}</div>
                            <div className="text-sm font-extrabold mt-0.5 text-foreground">{k.value}</div>
                            <div className={`text-[9px] font-semibold ${k.up ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]"}`}>{k.change}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>


                  {/* Segment tabs — Price Segment / Sub-Category / Pack-Type */}
                  {(() => {
                    const panels = [
                      {
                        title: "By Price Segment",
                        subtitle: "Sell out Value (M€)",
                        data: [
                          { year: "20xx-3", rows: [42, 29, 29] },
                          { year: "20xx-2", rows: [42, 29, 29] },
                          { year: "20xx-1", rows: [40, 30, 30] },
                          { year: "20xx",   rows: [40, 30, 30] },
                          { year: "HNK",    rows: [34, 33, 33], highlight: true },
                        ],
                        layers: [
                          { label: "Economy",    color: "#5c2244" },
                          { label: "Mainstream", color: "#9b4f72" },
                          { label: "Premium",    color: "#d4a0ba" },
                        ],
                      },
                      {
                        title: "By Sub-Category",
                        subtitle: "Sell out Value (M€)",
                        data: [
                          { year: "20xx-3", rows: [33, 22, 22, 23] },
                          { year: "20xx-2", rows: [32, 23, 23, 22] },
                          { year: "20xx-1", rows: [32, 23, 23, 22] },
                          { year: "20xx",   rows: [32, 23, 23, 22] },
                          { year: "HNK",    rows: [25, 25, 25, 25], highlight: true },
                        ],
                        layers: [
                          { label: "Lager",      color: "#1b4332" },
                          { label: "Abbey",      color: "#2d6a4f" },
                          { label: "Flavored",   color: "#52b788" },
                          { label: "Wheat Beer", color: "#95d5b2" },
                        ],
                      },
                      {
                        title: "By Pack-Type",
                        subtitle: "Sell out Value (M€)",
                        data: [
                          { year: "20xx-3", rows: [33, 22, 22, 23] },
                          { year: "20xx-2", rows: [32, 23, 23, 22] },
                          { year: "20xx-1", rows: [32, 23, 23, 22] },
                          { year: "20xx",   rows: [32, 23, 23, 22] },
                          { year: "HNK",    rows: [25, 25, 25, 25], highlight: true },
                        ],
                        layers: [
                          { label: "RGB",    color: "#1d3557" },
                          { label: "Cans",   color: "#457b9d" },
                          { label: "OWB",    color: "#6baed6" },
                          { label: "Others", color: "#9ecae1" },
                        ],
                      },
                    ];
                    const panel = panels[consumerSegTab];
                    return (
                      <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="flex border-b border-border bg-muted/30">
                          {panels.map((p, i) => (
                            <button
                              key={p.title}
                              onClick={() => setConsumerSegTab(i)}
                              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                                consumerSegTab === i
                                  ? "bg-card text-primary border-b-2 border-primary"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {p.title}
                            </button>
                          ))}
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-bold text-foreground">{panel.title} — {panel.subtitle}</p>
                            <p className="text-[9px] text-muted-foreground">CAGR x%</p>
                          </div>
                          <div className="flex items-stretch gap-2">
                            <div className="flex gap-2 flex-1">
                              {panel.data.map((col) => (
                                <div key={col.year} className="flex-1 flex flex-col">
                                  <div className="flex flex-col-reverse" style={{ height: "160px" }}>
                                    {col.rows.map((pct, li) => (
                                      <div
                                        key={li}
                                        style={{ flex: pct, backgroundColor: panel.layers[li].color }}
                                        className="flex items-center justify-center overflow-hidden min-h-0"
                                      >
                                        <span className="text-white text-[9px] font-bold leading-none">{pct}%</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className={`text-center text-[9px] mt-1 font-medium ${col.highlight ? "text-primary font-bold" : "text-muted-foreground"}`}>
                                    {col.year}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-col-reverse" style={{ height: "160px" }}>
                              {panel.layers.map((l, li) => (
                                <div
                                  key={l.label}
                                  style={{ flex: panel.data[0].rows[li] }}
                                  className="flex items-center min-h-0 pl-1"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: l.color }} />
                                    <span className="text-[9px] text-muted-foreground whitespace-nowrap leading-none">{l.label}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2. Seasonality – Industry Value by Season */}
                  <div>
                    <p className="text-[11px] font-bold text-foreground mb-1">Industry Value by Season (20xx–20xx | MHL)</p>
                    <div className="flex text-[8px] font-bold text-center mb-1">
                      <div className="flex-none w-[25%] bg-blue-200 text-blue-800 py-0.5 rounded-sm mr-0.5">WINTER</div>
                      <div className="flex-none w-[25%] bg-yellow-200 text-yellow-800 py-0.5 rounded-sm mr-0.5">SPRING</div>
                      <div className="flex-none w-[25%] bg-orange-200 text-orange-800 py-0.5 rounded-sm mr-0.5">SUMMER</div>
                      <div className="flex-none w-[25%] bg-purple-200 text-purple-800 py-0.5 rounded-sm">FALL</div>
                    </div>
                    {(() => {
                      const months = [
                        { m: "Dec", v: 4.8, season: "winter" }, { m: "Jan", v: 2.5, season: "winter" }, { m: "Feb", v: 3.8, season: "winter" },
                        { m: "Mar", v: 3.9, season: "spring" }, { m: "Apr", v: 4.5, season: "spring" }, { m: "May", v: 4.7, season: "spring" },
                        { m: "Jun", v: 4.9, season: "summer" }, { m: "Jul", v: 5.1, season: "summer" }, { m: "Aug", v: 3.6, season: "summer" },
                        { m: "Sep", v: 2.5, season: "fall" }, { m: "Oct", v: 2.6, season: "fall" }, { m: "Nov", v: 3.7, season: "fall" },
                      ];
                      const max = 5.5;
                      const barColors: Record<string,string> = { winter: "#93c5fd", spring: "#fbbf24", summer: "#fb923c", fall: "#c084fc" };
                      return (
                        <div className="space-y-1">
                          <div className="flex items-end gap-0.5 h-[80px]">
                            {months.map((d) => (
                              <div key={d.m} className="flex-1 flex flex-col items-center justify-end h-full">
                                <span className="text-[7px] font-bold text-foreground mb-0.5">{d.v}</span>
                                <div className="w-full rounded-t-sm" style={{ height: `${(d.v / max) * 68}px`, backgroundColor: barColors[d.season] }} />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-0.5">
                            {months.map((d) => (
                              <div key={d.m} className="flex-1 text-center text-[7px] text-muted-foreground">{d.m}</div>
                            ))}
                          </div>
                          <div className="border-t border-border pt-1">
                            <div className="flex gap-0.5">
                              <div className="w-8 shrink-0 text-[7px] text-muted-foreground">MHL</div>
                              {months.map((d) => <div key={d.m} className="flex-1 text-center text-[7px] text-foreground font-medium">{d.v}</div>)}
                            </div>
                            <div className="flex gap-0.5">
                              <div className="w-8 shrink-0 text-[7px] text-muted-foreground">% vol</div>
                              {[3,3,4,6,5,6,6,6,5,5,5,5].map((pct, i) => (
                                <div key={i} className="flex-1 text-center text-[7px] text-muted-foreground">{pct}%</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Consumer trends */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-foreground">Key Consumer Trends</p>
                    {[
                      { label: "Premiumisation", desc: "Consumers trading up – premium growing +7% CAGR" },
                      { label: "Affordability", desc: "Value-seeking in economy tier persists in interior markets" },
                      { label: "Sustainability", desc: "Eco-packaging preferences rising among 18–34 segment" },
                    ].map(t => (
                      <div key={t.label} className="flex items-start gap-2 bg-muted/40 rounded-lg p-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] font-bold text-foreground">{t.label}: </span>
                          <span className="text-[9px] text-muted-foreground">{t.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {fiveCsTab === "channel" && (
                <div className="space-y-3">
                  {renderTabInsight("channel")}
                  {/* KPI Pills */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { kpis: [{ label: "Off-Trade Vol. Share", value: "49%", change: "-2pp vs PY", up: false }, { label: "On-Trade Vol. Share", value: "28%", change: "+1pp vs PY", up: true }] },
                      { kpis: [{ label: "E-commerce Growth", value: "+23%", change: "vs PY", up: true }, { label: "Wtd. Distribution", value: "87%", change: "+1.5pp vs PY", up: true }] },
                      { kpis: [{ label: "Customer NPS", value: "68", change: "+3pts vs PY", up: true }, { label: "OOS Rate", value: "4.1%", change: "-0.8pp vs PY", up: true }] },
                    ].map((box, i) => (
                      <div key={i} className="rounded-2xl border-2 border-border bg-card px-3 py-3 shadow-sm flex flex-col gap-2">
                        {box.kpis.map((k, j) => (
                          <div key={j} className={`text-center ${j > 0 ? "border-t border-border pt-2" : ""}`}>
                            <div className="text-[10px] font-medium text-muted-foreground tracking-wide leading-tight">{k.label}</div>
                            <div className="text-sm font-extrabold mt-0.5 text-foreground">{k.value}</div>
                            <div className={`text-[9px] font-semibold ${k.up ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]"}`}>{k.change}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {/* 1. Channel volume over time – stacked bar with brand breakdown */}
                  <p className="text-[11px] font-bold text-foreground">Channel Sell-Out Volume over Time (%)</p>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={[
                      { year: "20xx-3", ch1: 55, ch2: 26, ch3: 19 },
                      { year: "20xx-2", ch1: 53, ch2: 27, ch3: 21 },
                      { year: "20xx-1", ch1: 51, ch2: 28, ch3: 21 },
                      { year: "20xx",   ch1: 49, ch2: 28, ch3: 23 },
                    ]} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barSize={20}>
                      <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} unit="%" />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Legend wrapperStyle={{ fontSize: 9 }} iconSize={8} />
                      <Bar dataKey="ch1" name="Off-Trade" stackId="a" fill="#1b5e20" />
                      <Bar dataKey="ch2" name="On-Trade" stackId="a" fill="#4caf50" />
                      <Bar dataKey="ch3" name="E-commerce" stackId="a" fill="#a5d6a7" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Brand mix by channel */}
                  <p className="text-[11px] font-bold text-foreground mt-2">Brand Volume Mix by Channel (%)</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={[
                      { channel: "Off-Trade",  heineken: 38, amstel: 14, schin: 22, other: 26 },
                      { channel: "On-Trade",   heineken: 28, amstel: 42, schin: 12, other: 18 },
                      { channel: "E-commerce", heineken: 44, amstel: 18, schin: 16, other: 22 },
                    ]} layout="vertical" margin={{ top: 4, right: 4, left: 10, bottom: 0 }} barSize={18}>
                      <XAxis type="number" tick={{ fontSize: 8 }} unit="%" />
                      <YAxis type="category" dataKey="channel" tick={{ fontSize: 9 }} width={65} />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Legend wrapperStyle={{ fontSize: 8 }} iconSize={7} />
                      <Bar dataKey="heineken" name="Heineken®" stackId="a" fill="hsl(138,100%,25.5%)" />
                      <Bar dataKey="amstel" name="Amstel®" stackId="a" fill="hsl(0,70%,45%)" />
                      <Bar dataKey="schin" name="Schin®" stackId="a" fill="hsl(210,70%,45%)" />
                      <Bar dataKey="other" name="Other" stackId="a" fill="#c8c8c8" radius={[0,2,2,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="rounded-lg border border-[hsl(var(--status-orange))]/30 bg-[hsl(var(--status-orange))]/5 px-3 py-2 mt-1">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={12} className="text-[hsl(var(--status-orange))] shrink-0 mt-0.5" />
                      <span className="text-[9px] text-foreground"><strong>Amstel® is disproportionately concentrated in On-Trade (42%)</strong> — making this channel critical for Amstel performance. Low Sales Power and RoS in On-Trade directly drags overall brand metrics.</span>
                    </div>
                  </div>

                  {/* 2. Market map – beverage market by channel type and segment */}
                  <p className="text-[11px] font-bold text-foreground mt-3">Market Value by Channel & Segment (M€)</p>
                  <div className="space-y-1">
                    {[
                      { channel: "Modern Off-Trade", segs: [38, 14, 34, 10, 4] },
                      { channel: "Modern On-Trade", segs: [80, 6, 10, 3, 1] },
                      { channel: "Traditional Off-Trade", segs: [42, 12, 28, 10, 8] },
                      { channel: "Traditional On-Trade", segs: [70, 8, 12, 6, 4] },
                      { channel: "E-retail", segs: [35, 20, 25, 12, 8] },
                    ].map((row) => (
                      <div key={row.channel} className="flex items-center gap-1.5">
                        <span className="text-[9px] w-28 shrink-0 text-foreground">{row.channel}</span>
                        <div className="flex-1 flex h-4 rounded overflow-hidden">
                          {row.segs.map((pct, j) => (
                            <div key={j} style={{ width: `${pct}%` }}
                              className={["bg-[#1b4332]","bg-[#2d6a4f]","bg-[#40916c]","bg-[#74c69d]","bg-[#b7e4c7]"][j]}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {["Premium Lager","Mainstream Lager","Economy Lager","Craft / Specialty","Non-Alcoholic"].map((s, j) => (
                        <div key={s} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: ["#1b4332","#2d6a4f","#40916c","#74c69d","#b7e4c7"][j] }} />
                          <span className="text-[9px] text-muted-foreground">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Market share by channel */}
                  <p className="text-[11px] font-bold text-foreground mt-1">Volume Mkt Share by Channel (2024)</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[9px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1 font-semibold text-muted-foreground">Brand</th>
                          {["Mod. Off-Trade","Mod. On-Trade","Trad. Off-Trade","Trad. On-Trade","E-retail"].map(c => (
                            <th key={c} className="text-center py-1 font-semibold text-muted-foreground">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                         {[
                           { brand: "HEINEKEN",    vals: ["30%","38%","25%","42%","35%"], highlight: true },
                           { brand: "Carlsberg",   vals: ["18%","14%","20%","16%","14%"] },
                           { brand: "AB InBev",    vals: ["10%","9%","12%","8%","11%"] },
                           { brand: "Molson Coors",vals: ["8%","7%","9%","6%","9%"] },
                           { brand: "Asahi",       vals: ["5%","6%","4%","5%","8%"] },
                           { brand: "Other",       vals: ["29%","26%","30%","23%","23%"] },
                         ].map((row) => (
                          <tr key={row.brand} className={row.highlight ? "bg-primary/10 font-bold" : "border-b border-border/30"}>
                            <td className="py-1 pr-1 text-foreground">{row.brand}</td>
                            {row.vals.map((v, j) => (
                              <td key={j} className="text-center py-1">{v}</td>
                            ))}
                          </tr>
                        ))}
                        <tr className="border-t border-border">
                          <td className="py-1 text-[9px] text-muted-foreground">Vol CAGR (%)</td>
                          {["+3.1%","+5.4%","+1.8%","+4.2%","+23.0%"].map((v,j) => <td key={j} className="text-center py-1 text-muted-foreground">{v}</td>)}
                        </tr>
                        <tr>
                          <td className="py-1 text-[9px] text-muted-foreground">HNK mkt share Δ</td>
                          {["-2.0pp","+1.0pp","-0.5pp","+1.5pp","+3.2pp"].map((v,j) => <td key={j} className="text-center py-1 text-muted-foreground">{v}</td>)}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {fiveCsTab === "competition" && (() => {
                // Brand palette
                const brands = [
                  { key: "heineken",    label: "HEINEKEN",       color: "hsl(138,100%,25.5%)" },
                  { key: "carlsberg",   label: "Carlsberg",       color: "hsl(28,80%,45%)" },
                  { key: "abinbev",     label: "AB InBev",        color: "hsl(45,90%,52%)" },
                  { key: "molsoncoors", label: "Molson Coors",    color: "hsl(210,60%,42%)" },
                  { key: "asahi",       label: "Asahi Group",     color: "hsl(355,75%,48%)" },
                  { key: "other",       label: "Other",           color: "#c8c8c8", hatched: true },
                ];

                // Segments — width prop = relative market size
                type SegRow = { heineken: number; carlsberg: number; abinbev: number; molsoncoors: number; asahi: number; other: number };


                const volSegs: { seg: string; total: string; hnkMs: string; rows: SegRow }[] = [
                  { seg: "Beer – Premium Lager",    total: "12.8", hnkMs: "42%", rows: { heineken: 42, carlsberg: 14, abinbev: 8,  molsoncoors: 6,  asahi: 4,  other: 26 } },
                  { seg: "Beer – Mainstream Lager", total: "9.4",  hnkMs: "28%", rows: { heineken: 28, carlsberg: 18, abinbev: 22, molsoncoors: 8,  asahi: 3,  other: 21 } },
                  { seg: "Beer – Mainstream",    total: "5.2",  hnkMs: "14%", rows: { heineken: 14, carlsberg: 6,  abinbev: 32, molsoncoors: 4,  asahi: 2,  other: 42 } },
                ];
                const valSegs: { seg: string; total: string; hnkMs: string; rows: SegRow }[] = [
                  { seg: "Beer – Premium Lager",    total: "45.1", hnkMs: "48%", rows: { heineken: 48, carlsberg: 12, abinbev: 8,  molsoncoors: 6,  asahi: 4,  other: 22 } },
                  { seg: "Beer – Mainstream Lager", total: "28.4", hnkMs: "31%", rows: { heineken: 31, carlsberg: 16, abinbev: 20, molsoncoors: 8,  asahi: 4,  other: 21 } },
                  { seg: "Beer – Mainstream",    total: "10.6", hnkMs: "12%", rows: { heineken: 12, carlsberg: 5,  abinbev: 30, molsoncoors: 3,  asahi: 2,  other: 48 } },
                ];

                const totalVol = volSegs.reduce((s, d) => s + parseFloat(d.total), 0);
                const totalVal = valSegs.reduce((s, d) => s + parseFloat(d.total), 0);

                const MosaicChart = ({ segs, unitLabel, totalBase }: { segs: typeof volSegs; unitLabel: string; totalBase: number }) => (
                  <div className="flex flex-col gap-0" style={{ minHeight: 0 }}>
                    {/* Total labels row */}
                    <div className="flex gap-0.5 mb-0.5">
                      {segs.map((s) => {
                        const widthPct = (parseFloat(s.total) / totalBase) * 100;
                        return (
                          <div key={s.seg} style={{ width: `${widthPct}%` }} className="text-center text-[8px] font-bold text-foreground truncate">
                            {s.total}
                          </div>
                        );
                      })}
                    </div>

                    {/* Y-axis labels + bars */}
                    <div className="flex gap-1 items-stretch">
                      {/* Y axis */}
                      <div className="flex flex-col justify-between text-[8px] text-muted-foreground shrink-0 pr-0.5" style={{ height: 150 }}>
                        {["100%","80%","60%","40%","20%","0%"].map(l => <span key={l}>{l}</span>)}
                      </div>

                      {/* Bars */}
                      <div className="flex gap-0.5 flex-1" style={{ height: 150 }}>
                        {segs.map((s) => {
                          const widthPct = (parseFloat(s.total) / totalBase) * 100;
                          const stackKeys = ["heineken","carlsberg","abinbev","molsoncoors","asahi","other"] as const;
                          return (
                            <div key={s.seg} style={{ width: `${widthPct}%`, height: "100%" }} className="flex flex-col-reverse relative">
                              {/* dashed line at 60% */}
                              <div className="absolute w-full border-t border-dashed border-white/50 z-10" style={{ bottom: "60%" }} />
                              {stackKeys.map((k) => {
                                const pct = s.rows[k];
                                const brand = brands.find(b => b.key === k)!;
                                return (
                                  <div
                                    key={k}
                                    style={{ height: `${pct}%`, backgroundColor: brand.color, flexShrink: 0, position: "relative", overflow: "hidden" }}
                                    className="flex items-center justify-center"
                                  >
                                    {brand.hatched && (
                                      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.35 }}>
                                        <defs>
                                          <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                            <line x1="0" y1="0" x2="0" y2="4" stroke="#666" strokeWidth="1.5" />
                                          </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#hatch)" />
                                      </svg>
                                    )}
                                    {pct >= 8 && (
                                      <span className="text-[7px] font-bold text-white z-10 leading-none px-0.5 text-center truncate">{pct}%</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Segment labels — plain text */}
                    <div className="flex gap-0.5 mt-1 pl-6">
                      {segs.map((s) => {
                        const widthPct = (parseFloat(s.total) / totalBase) * 100;
                        return (
                          <div
                            key={s.seg}
                            style={{ width: `${widthPct}%` }}
                            className="text-center"
                          >
                            <span className="text-[7px] text-muted-foreground font-semibold leading-tight break-words whitespace-normal">{s.seg}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Heineken MS row */}
                    <div className="flex gap-0.5 mt-1 pl-6">
                      <div className="text-[8px] text-muted-foreground shrink-0 leading-tight" style={{ width: "0px", overflow: "visible", whiteSpace: "nowrap", marginLeft: "-24px" }}>
                        HNK MS
                      </div>
                      {segs.map((s) => {
                        const widthPct = (parseFloat(s.total) / totalBase) * 100;
                        return (
                          <div key={s.seg} style={{ width: `${widthPct}%` }} className="text-center text-[8px] font-bold text-[hsl(138,100%,25.5%)]">
                            {s.hnkMs}
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-[8px] text-muted-foreground mt-1 pl-6">{unitLabel}</p>
                  </div>
                );

                return (
                  <div className="space-y-3">
                    {renderTabInsight("competition")}
                    <p className="text-[11px] font-bold text-foreground">Market Shares by Segment & Brand/Competitor</p>
                    {/* KPI Pills */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { kpis: [{ label: "HNK Mkt Share", value: "36%", change: "+1.2pp vs PY", up: true }, { label: "Share of Voice", value: "41%", change: "+2pp vs PY", up: true }] },
                        { kpis: [{ label: "vs Carlsberg", value: "+22pp", change: "gap widening", up: true }, { label: "vs Molson Coors", value: "+31pp", change: "gap widening", up: true }] },
                        { kpis: [{ label: "vs AB InBev", value: "+28pp", change: "gap accelerating ↑", up: true }, { label: "vs Asahi", value: "+33pp", change: "gap widening", up: true }] },
                      ].map((box, i) => (
                        <div key={i} className="rounded-2xl border-2 border-border bg-card px-3 py-3 shadow-sm flex flex-col gap-2">
                          {box.kpis.map((k, j) => (
                            <div key={j} className={`text-center ${j > 0 ? "border-t border-border pt-2" : ""}`}>
                              <div className="text-[10px] font-medium text-muted-foreground tracking-wide leading-tight">{k.label}</div>
                              <div className="text-sm font-extrabold mt-0.5 text-foreground">{k.value}</div>
                              <div className={`text-[9px] font-semibold ${k.up ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]"}`}>{k.change}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {brands.map(b => (
                        <div key={b.key} className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/30" style={{ backgroundColor: b.color }} />
                          <span className="text-[8px] text-muted-foreground">{b.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Two panels */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] font-semibold text-foreground mb-1">Volume Share (MAT 20xx, MHL)</p>
                        <MosaicChart segs={volSegs} unitLabel="Vol. Share (MAT 20xx, in MHL)" totalBase={totalVol} />
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-foreground mb-1">Value Share (20xx, in €M)</p>
                        <MosaicChart segs={valSegs} unitLabel="Value Share (20xx, in €M)" totalBase={totalVal} />
                      </div>
                    </div>

                    {/* Market share by brand – stacked bar chart */}
                    <p className="text-[11px] font-bold text-foreground mt-2">Market Share by Brand</p>
                    <p className="text-[9px] text-muted-foreground">Category Vol market share development (%, 20xx-3 – 20xx)</p>
                    {(() => {
                      const brandColors: Record<string, string> = {
                        "Heineken®": "hsl(138,100%,20%)",
                        "Amstel®": "hsl(152,60%,40%)",
                        "Schin®": "hsl(80,55%,48%)",
                        "Brahma": "hsl(45,90%,52%)",
                        "Budweiser": "hsl(30,70%,60%)",
                        "Other": "#c8c8c8",
                      };
                      const brandShareData = [
                        { year: "20xx-3", heineken: 20, amstel: 10, schin: 10, brahma: 25, budweiser: 10, other: 25 },
                        { year: "20xx-2", heineken: 20, amstel: 10, schin: 10, brahma: 25, budweiser: 10, other: 25 },
                        { year: "20xx-1", heineken: 20, amstel: 10, schin: 10, brahma: 25, budweiser: 10, other: 25 },
                        { year: "20xx",   heineken: 20, amstel: 8,  schin: 6,  brahma: 25, budweiser: 10, other: 31 },
                      ];
                      const deltaData = [
                        { brand: "Heineken®", delta: 5, color: "hsl(138,100%,25.5%)" },
                        { brand: "Amstel®", delta: -5, color: "hsl(138,70%,35%)" },
                        { brand: "Schin®", delta: 2, color: "hsl(138,50%,50%)" },
                        { brand: "Brahma", delta: -2, color: "hsl(45,90%,52%)" },
                        { brand: "Budweiser", delta: 1, color: "hsl(45,70%,65%)" },
                        { brand: "Other", delta: 0, color: "#c8c8c8" },
                      ];
                      const brandKeys = ["heineken","amstel","schin","brahma","budweiser","other"];
                      const brandNames = ["Heineken®","Amstel®","Schin®","Brahma","Budweiser","Other"];
                      return (
                        <div className="space-y-2">
                          <div className="flex gap-2 flex-wrap mb-1">
                            {brandNames.map((n) => (
                              <div key={n} className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: brandColors[n] }} />
                                <span className="text-[8px] text-muted-foreground">{n}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-3 items-end">
                            <div className="flex-1">
                              <ResponsiveContainer width="100%" height={150}>
                                <BarChart data={brandShareData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
                                  <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                                  <YAxis tick={{ fontSize: 8 }} unit="%" />
                                  <Tooltip contentStyle={{ fontSize: 10 }} />
                                  {brandKeys.map((k, i) => (
                                    <Bar key={k} dataKey={k} name={brandNames[i]} stackId="a" fill={brandColors[brandNames[i]]} radius={i === brandKeys.length - 1 ? [2,2,0,0] : undefined} />
                                  ))}
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="shrink-0 w-16 flex flex-col gap-0.5 pb-5">
                              <p className="text-[7px] font-semibold text-muted-foreground mb-0.5">Δ pp<br/>vs L3Y</p>
                              {deltaData.map(d => (
                                <div key={d.brand} className="flex items-center justify-end gap-1">
                                  <span className={`text-[9px] font-bold ${d.delta > 0 ? "text-[hsl(var(--status-green))]" : d.delta < 0 ? "text-[hsl(var(--status-red))]" : "text-muted-foreground"}`}>
                                    {d.delta > 0 ? `+${d.delta}` : d.delta}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Key Drivers table */}
                          <p className="text-[11px] font-bold text-foreground mt-2">Key Drivers</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-[9px]">
                              <thead>
                                <tr className="border-b border-border bg-primary/10">
                                  <th className="text-left py-1 px-1 font-semibold text-foreground">Brand</th>
                                  <th className="text-center py-1 px-1 font-semibold text-foreground">Brand Value Equation</th>
                                  <th className="text-center py-1 px-1 font-semibold text-foreground">% of TDP</th>
                                  <th className="text-center py-1 px-1 font-semibold text-foreground">Salience</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  { brand: "Heineken®", bve: "1.12", bveDir: "stable", tdp: "78.4%", tdpDir: "up", sal: "155.1", salDir: "down", isHnk: true },
                                  { brand: "Amstel®", bve: "0.94", bveDir: "stable", tdp: "65.2%", tdpDir: "up", sal: "86.1", salDir: "down", isHnk: true },
                                  { brand: "Schin®", bve: "0.71", bveDir: "stable", tdp: "52.8%", tdpDir: "up", sal: "84.1", salDir: "down", isHnk: true },
                                  { brand: "Brahma", bve: "1.08", bveDir: "stable", tdp: "81.6%", tdpDir: "up", sal: "142.3", salDir: "down", isHnk: false },
                                  { brand: "Budweiser", bve: "0.96", bveDir: "stable", tdp: "69.1%", tdpDir: "up", sal: "118.7", salDir: "down", isHnk: false },
                                ].map(row => (
                                  <tr key={row.brand} className={`border-b border-border/30 ${row.isHnk ? "bg-primary/5" : ""}`}>
                                    <td className="py-1 px-1 font-semibold text-foreground">{row.brand}</td>
                                    <td className="text-center py-1 px-1">
                                      <span className="inline-flex items-center gap-0.5">
                                        {row.bve}
                                        <ArrowRight size={10} className="text-[hsl(45,90%,52%)]" />
                                      </span>
                                    </td>
                                    <td className="text-center py-1 px-1">
                                      <span className="inline-flex items-center gap-0.5">
                                        {row.tdp}
                                        <TrendingUp size={10} className="text-[hsl(var(--status-green))]" />
                                      </span>
                                    </td>
                                    <td className="text-center py-1 px-1">
                                      <span className="inline-flex items-center gap-0.5">
                                        {row.sal}
                                        <TrendingDown size={10} className="text-[hsl(var(--status-red))]" />
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {fiveCsTab === "company" && (() => {
                // Brand colors matching Executive Performance Brand Breakdown
                const companyBrands = [
                  { key: "heineken", name: "Heineken®", fill: "hsl(138,100%,25.5%)" },
                  { key: "amstel",   name: "Amstel®",   fill: "hsl(0,70%,45%)" },
                  { key: "schin",    name: "Schin®",    fill: "hsl(220,60%,40%)" },
                ];
                const spendData = [
                  { year: "2019", heineken: 0.89, amstel: 0.30, schin: 0.01 },
                  { year: "2020", heineken: 0.89, amstel: 0.24, schin: 0.06 },
                  { year: "2021", heineken: 0.62, amstel: 0.15, schin: 0.12 },
                  { year: "2022", heineken: 0.95, amstel: 0.33, schin: 0.18 },
                  { year: "2023", heineken: 0.75, amstel: 0.29, schin: 0.22 },
                  { year: "2024", heineken: 0.89, amstel: 0.32, schin: 0.25 },
                ];
                return (
                  <div className="space-y-3">
                    {renderTabInsight("company")}
                    {/* KPI Pills */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { kpis: [{ label: "Net Revenue", value: "€1.5B", change: "+8.3% vs PY", up: true }, { label: "Gross Margin", value: "45.7%", change: "+0.7pp vs PY", up: true }] },
                        { kpis: [{ label: "Comm. Spend", value: "€1.5B", change: "+15.4% vs PY", up: true }, { label: "ATL/BTL Split", value: "74/26", change: "Stable vs PY", up: true }] },
                        { kpis: [{ label: "Portfolio ROI", value: "€2.1x", change: "+0.3x vs PY", up: true }, { label: "Innovation Rate", value: "8.4%", change: "-0.6pp vs PY", up: false }] },
                      ].map((box, i) => (
                        <div key={i} className="rounded-2xl border-2 border-border bg-card px-3 py-3 shadow-sm flex flex-col gap-2">
                          {box.kpis.map((k, j) => (
                            <div key={j} className={`text-center ${j > 0 ? "border-t border-border pt-2" : ""}`}>
                              <div className="text-[10px] font-medium text-muted-foreground tracking-wide leading-tight">{k.label}</div>
                              <div className="text-sm font-extrabold mt-0.5 text-foreground">{k.value}</div>
                              <div className={`text-[9px] font-semibold ${k.up ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]"}`}>{k.change}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    {/* 1. Commercial spend by brand evolution – stacked bar */}
                    <p className="text-[11px] font-bold text-foreground">Commercial Spend by Brand (Local currency, bn)</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={spendData} margin={{ top: 16, right: 4, left: -10, bottom: 0 }} barSize={22}>
                        <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => [v.toFixed(2), ""]} />
                        {companyBrands.map((b, i) => (
                          <Bar key={b.key} dataKey={b.key} name={b.name} stackId="a" fill={b.fill} radius={i === companyBrands.length - 1 ? [2,2,0,0] : undefined} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-2">
                      {companyBrands.map(b => (
                        <div key={b.key} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: b.fill }} />
                          <span className="text-[9px] text-muted-foreground">{b.name}</span>
                        </div>
                      ))}
                    </div>

                    {/* KPI summary grid */}
                    <p className="text-[11px] font-bold text-foreground mt-1">Key Financials (Full Year)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Net Revenue", value: "€1.5B", trend: "+8.3% vs PY", neg: false },
                        { label: "Gross Margin", value: "45.7%", trend: "+0.7pp", neg: false },
                        { label: "Commercial Spend", value: "€1.5B", trend: "+15.4% vs PY", neg: false },
                        { label: "ATL/BTL Split", value: "74/26", trend: "Stable", neg: false },
                      ].map((kpi) => (
                        <div key={kpi.label} className="bg-card border border-border rounded-xl p-2.5">
                          <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
                          <p className="text-sm font-bold text-foreground mt-0.5">{kpi.value}</p>
                          <p className={`text-[9px] font-semibold ${kpi.neg ? "text-[hsl(var(--status-red))]" : "text-[hsl(var(--status-green))]"}`}>{kpi.trend}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </motion.div>
          </AnimatePresence>
        </div>
      </>
    );
  };

  // Shared brand filter data for battles #1 and #2 (used by both How to Win and Exec Excellence)
  const brandFilterOptions = ["All Brands", "Heineken", "Amstel", "Schin"];

  const battle1BrandKpis: Record<string, { label: string; value: string; vs: string }[]> = {
    "All Brands": [
      { label: "Brand Power (+ vs. comp.)", value: "6.5%", vs: "+0.3pp vs. PY" },
      { label: "Meaningful (+ vs. comp.)", value: "+3", vs: "Leaders +4" },
      { label: "Different (+ vs. comp.)", value: "+5", vs: "Brahma +1" },
    ],
    "Heineken": [
      { label: "Brand Power", value: "6.5%", vs: "+0.3pp vs. PY" },
      { label: "Meaningful", value: "+3", vs: "Above portfolio avg" },
      { label: "Different", value: "+5", vs: "UCL halo effect" },
    ],
    "Amstel": [
      { label: "Brand Power", value: "3.8%", vs: "+0.2pp vs. PY" },
      { label: "Meaningful", value: "+2", vs: "Below portfolio avg" },
      { label: "Different", value: "+3", vs: "Improving vs. Brahma" },
    ],
    "Schin": [
      { label: "Brand Power", value: "1.4%", vs: "+0.1pp vs. PY" },
      { label: "Meaningful", value: "+2", vs: "Value segment" },
      { label: "Different", value: "+1", vs: "Commodity risk" },
    ],
  };

  const battle2BrandKpis: Record<string, { label: string; value: string; vs: string }[]> = {
    "All Brands": [
      { label: "BGS: Attractive Packaging", value: "74%", vs: "+3pp vs. comp." },
      { label: "BGS: Unique", value: "68%", vs: "+1pp vs. comp." },
    ],
    "Heineken": [
      { label: "BGS: Attractive Packaging", value: "82%", vs: "Icon status" },
      { label: "BGS: Unique", value: "76%", vs: "Green bottle equity" },
    ],
    "Amstel": [
      { label: "BGS: Attractive Packaging", value: "68%", vs: "-4pp vs. PY" },
      { label: "BGS: Unique", value: "59%", vs: "Below avg." },
    ],
    "Schin": [
      { label: "BGS: Attractive Packaging", value: "58%", vs: "Value perception" },
      { label: "BGS: Unique", value: "48%", vs: "Low differentiation" },
    ],
  };

  const renderBrandFilter = () => (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">Brand:</span>
      <div className="relative">
        <select
          value={battleBrandFilter}
          onChange={(e) => setBattleBrandFilter(e.target.value)}
          className="appearance-none bg-card border border-border text-foreground text-[11px] font-semibold rounded-lg px-3 py-1.5 pr-7 cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary transition-colors shadow-sm"
        >
          {brandFilterOptions.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" width="10" height="10" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );

  const renderBrandKpiPills = (brandKpis: Record<string, { label: string; value: string; vs: string }[]>) => {
    const pills = brandKpis[battleBrandFilter] ?? brandKpis["All Brands"];
    return (
      <div className="grid grid-cols-3 gap-2 mb-4">
        {pills.map((kpi, i) => (
          <div key={i} className="rounded-2xl border-2 border-border bg-card px-3 py-3 text-center shadow-sm">
            <div className="text-[10px] font-medium text-muted-foreground tracking-wide leading-tight">{kpi.label}</div>
            <div className="text-sm font-extrabold mt-1 text-[hsl(var(--status-green))]">{scaleBattleKpiValue(kpi.value, kpiScale)}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{kpi.vs}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderState2 = () => {
    if (!selectedBattle || !howToWinBattleKpis[selectedBattle]) {
      const mwbAlerts: { id: number; name: string; insight: string; action: string; flag?: boolean; kpis: string[] }[] = [
        {
          id: 1,
          name: "Create Unique Brand Positioning",
          insight: "Heineken Brand Power growing (+2.1pp) but 18–34 yo consumers over-index on Brahma. Risk of becoming perceived as 'premium but distant' in Nordeste & Centro-Oeste.",
          action: "Reframe positioning as 'the smart premium' — accessible yet aspirational. Prioritize younger audiences in digital and OOH in emerging regions.",
          kpis: ["Brand Power (+ vs. competitors)", "Meaningful (+ vs. comp.)", "Different (+ vs. comp.)", "Salient (+ vs. comp.)"],
        },
        {
          id: 2,
          name: "Establish Iconic Brand Identity",
          insight: "Green bottle & star icon recognition is strong in SP & Rio, but brand asset usage is inconsistent across on-trade partners in interior markets.",
          action: "Enforce brand identity standards with on-trade partners nationally. Invest in POS materials for boteco & Horeca channels in Nordeste.",
          kpis: ["Brand Power (+ vs. competitors)", "Meaningful (+ vs. comp.)", "Different (+ vs. comp.)", "Salient (+ vs. comp.)"],
        },
        {
          id: 3,
          name: "Offer Great Taste & Quality Drinks",
          insight: "Perceived as premium and easy-to-drink in key Horeca. Gap vs. Skol and Brahma in mainstream on-trade — quality messaging not reaching interior markets.",
          action: "Extend taste & quality communication beyond premium outlets. Activate 'Heineken com churrasco' pairing campaign across mainstream off-trade in Sudeste & Sul.",
          kpis: ["BGS: Taste Perception", "BGS: Ease of Drinking", "BGS: Quality"],
        },
        {
          id: 4,
          name: "Develop Breakthrough Communication",
          insight: "Share of Voice below Market Share in digital channels. Brahma and Skol outspend Heineken in TVC during key seasonal peaks (Carnaval, Copa do Brasil).",
          action: "Increase digital SOV in Q2–Q3 and establish always-on content strategy. Leverage UEFA Champions League & Rock in Rio to build differentiated media moments.",
          kpis: ["ATL%", "BTL%", "In-channel Growth Impact", "Adherence to AP", "Share of Voice", "Share of Mouth"],
        },
        {
          id: 5,
          name: "Innovate to Drive Penetration",
          insight: "Innovation Rate of Sales in off-trade below portfolio target. Innovation Weighted Distribution lagging vs. ABI in key modern trade channels across Sudeste.",
          action: "Prioritize weighted distribution gains for 0.0 and Silver. Improve Innovation Rate of Sales through targeted Horeca activation and bundled off-trade promotions.",
          flag: true,
          kpis: ["Innovation Rate", "Innovation Volume", "Innovation Value", "Innovation GP", "Innovation Wtd. Distribution", "Innovation Rate of Sales"],
        },
        {
          id: 6,
          name: "Ensure Right Pack & Price",
          insight: "Heineken 600ml is priced at a premium vs. Brahma/Skol equivalents in mainstream off-trade. Pack mix skewed toward 350ml — missing volume opportunity.",
          action: "Optimize PPA on 600ml in key retailers (Carrefour, Pão de Açúcar). Introduce 1L returnable to compete in price-sensitive channels in interior markets.",
          kpis: ["Price / L (+ vs. competitors)", "Price Index"],
        },
        {
          id: 7,
          name: "Optimize Activations & Promotions",
          insight: "Desperados promo ROI below €1.00 for 4+ consecutive weeks. Promo depth in mainstream off-trade at risk of diluting premium equity.",
          action: "Pause Desperados digital activation and reallocate budget to high-performing Heineken ATL. Maintain promo guidelines — avoid deep discounting in Horeca.",
          kpis: ["Promo Pressure", "Promo Depth", "Promo Intensity", "Promo Share", "Share of Promo / Share of Market"],
        },
        {
          id: 8,
          name: "Maximize Availability of Focus SKUs",
          insight: "Heineken 350ml OOS rate at 8.2% in C-stores and independents in Nordeste. Distribution gaps in emerging modern trade accounts.",
          action: "Prioritize distribution fill for 350ml and 0.0 in Nordeste independents. Set OOS alert threshold at 5% and escalate to field sales within 48h.",
          kpis: ["Sales Power", "Rate of Sales", "Distribution", "Levers", "Customer NPS", "Sales Rep Productivity"],
        },
        {
          id: 9,
          name: "Amplify Visibility & Experience",
          insight: "SOS in off-trade below target nationally. On-trade branded presence weak in Sul & Centro-Oeste vs. Skol and Itaipava.",
          action: "Deploy branded coolers and POS refresh across top 500 on-trade accounts in Sul. Increase shelf blocking in key modern trade for improved brand visibility.",
          kpis: ["Picture of Success"],
        },
      ];

      return (
        <div className="p-4 space-y-4">
          {/* Header */}
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Overview of Must Win Battles (MWB)</h2>

          {/* 3-column grid of MWB cards */}
          <div className="grid grid-cols-3 gap-3">
            {mwbAlerts.map((m) => (
              <div key={m.id} className={`rounded-xl border bg-card overflow-hidden ${m.flag ? "border-[hsl(var(--status-orange))]" : "border-border"}`}>
                {/* Card header */}
                <div className={`flex items-center gap-2 px-3 py-2 ${m.flag ? "bg-[hsl(var(--status-orange))]" : "bg-primary"}`}>
                  <span className="text-[9px] font-extrabold text-white/80 uppercase tracking-wider shrink-0">MWB {m.id}</span>
                  <span className="text-[10px] font-bold text-white leading-tight">{m.name}</span>
                </div>
                {/* Card body */}
                <div className="px-3 py-2.5 space-y-2">
                  {/* Insight */}
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle size={11} className={`mt-0.5 shrink-0 ${m.flag ? "text-[hsl(var(--status-orange))]" : "text-muted-foreground"}`} />
                    <p className="text-[10px] text-foreground/80 leading-snug">{m.insight}</p>
                  </div>
                  {/* Divider */}
                  <div className="h-px bg-border" />
                  {/* Action */}
                  <div className="flex items-start gap-1.5">
                    <CheckSquare size={11} className="mt-0.5 shrink-0 text-primary" />
                    <p className="text-[10px] font-semibold text-foreground leading-snug">{m.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    const config = howToWinBattleKpis[selectedBattle];
    const fp = state2.freddy_performance;

    // Battle #1: Brand filter + 3 KPIs (no alerts) + Insights
    if (selectedBattle === 1) {
      return (
        <>
          {renderBrandFilter()}
          {renderBrandKpiPills(battle1BrandKpis)}
        </>
      );
    }

    // Battle #2: Brand filter + 2 KPIs
    if (selectedBattle === 2) {
      return (
        <>
          {renderBrandFilter()}
          {renderBrandKpiPills(battle2BrandKpis)}
        </>
      );
    }

    // Battles #3–9: handled by dedicated component with filters + insights
    return <HowToWinBattleDetail battleId={selectedBattle} period={period} onOpenAllocationAI={onOpenAllocationAI} />;
  };

  const renderState3 = () => {
    if (!selectedBattle || !execExcellenceBattleKpis[selectedBattle]) {
      const execMwbAlerts = [
        {
          id: 1,
          name: "Create Unique Brand Positioning",
          flag: false,
          insight: "Heineken brand positioning tracker shows 3 key retail accounts with outdated POS materials from Q3 campaign. Compliance audit due this week.",
          action: "Dispatch field reps to the 3 flagged accounts to replace POS materials with current Q4 creative by Friday. Log compliance in CRM.",
        },
        {
          id: 2,
          name: "Establish Iconic Brand Identity",
          flag: false,
          insight: "Visual identity audit reveals 12% of on-trade tap handles are off-brand or damaged across São Paulo and Rio territories.",
          action: "Issue replacement tap handles and branded glassware to the 45 affected outlets within 2 weeks. Schedule follow-up audit in 30 days.",
        },
        {
          id: 3,
          name: "Offer Great Taste & Quality Drinks",
          flag: false,
          insight: "Draught quality scores dropped 4pp in Nordeste on-trade — cleaning cycle compliance fell below 80% in 28 outlets this month.",
          action: "Activate emergency draught line cleaning for 28 flagged outlets this week. Retrain bar staff on serve standards and schedule re-audit in 14 days.",
        },
        {
          id: 4,
          name: "Develop Breakthrough Communication",
          flag: true,
          insight: "UCL digital activation CTR is 40% above benchmark but Desperados BTL promo ROI has fallen below €1.00 for 4 consecutive weeks.",
          action: "Pause the underperforming Desperados digital activation immediately. Reallocate freed budget (€180K) to UCL sponsorship amplification this cycle.",
        },
        {
          id: 5,
          name: "Innovate to Drive Penetration",
          flag: false,
          insight: "Heineken Silver 250ml trial packs have 68% distribution in modern trade but only 22% in traditional off-trade — gap concentrated in Nordeste.",
          action: "Brief distributor network to prioritize Silver 250ml listings in top 200 traditional off-trade accounts in Nordeste within 3 weeks.",
        },
        {
          id: 6,
          name: "Ensure Right Pack & Price",
          flag: false,
          insight: "Price compliance at 91% nationally but 3 key supermarket chains in Sul are running unauthorized deep discounts on Heineken 350ml cans.",
          action: "Escalate pricing violations to trade marketing today. Issue corrective notices to the 3 chains and confirm price restoration within 7 days.",
        },
        {
          id: 7,
          name: "Optimize Activations & Promotions",
          flag: true,
          insight: "Current promo cycle shows promo pressure at 24% vs. 20% target. Promo depth exceeding guidelines in 6 of top 10 modern trade accounts.",
          action: "Reduce promo depth to guideline levels in the 6 over-investing accounts this week. Reallocate excess spend to underperforming promo mechanics.",
        },
        {
          id: 8,
          name: "Maximize Availability of Focus SKUs",
          flag: false,
          insight: "Heineken 350ml OOS rate spiked to 8.2% in C-stores this week — root cause is a logistics delay at the Nordeste distribution hub.",
          action: "Expedite emergency stock transfer from Centro-Oeste hub to Nordeste today. Set OOS alert threshold at 5% with 48-hour field escalation protocol.",
        },
        {
          id: 9,
          name: "Amplify Visibility & Experience",
          flag: true,
          insight: "Amstel On-Trade POSM coverage at 52% (lowest in portfolio) and Sales Power declining -1.8 pts. ATL ROI at €0.92 — opportunity to shift budget to BTL execution.",
          action: "Shift Amstel ATL budget to targeted On-Trade BTL activations. Reallocate 30% of ATL spend to POSM, branded coolers and draught equipment in top 1,000 OOH accounts.",
        },
      ];

      return (
        <div className="p-4 space-y-4">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Executional Excellence — MWB Overview</h2>
          <p className="text-[10px] text-muted-foreground -mt-2">Tactical insights & immediate actions for each Must Win Battle — Brazil market</p>

          <div className="grid grid-cols-3 gap-3">
            {execMwbAlerts.map((m) => (
              <div key={m.id} className={`rounded-xl border bg-card overflow-hidden ${m.flag ? "border-[hsl(var(--status-orange))]" : "border-border"}`}>
                <div className={`flex items-center gap-2 px-3 py-2 ${m.flag ? "bg-[hsl(var(--status-orange))]" : "bg-primary"}`}>
                  <span className="text-[9px] font-extrabold text-white/80 uppercase tracking-wider shrink-0">MWB {m.id}</span>
                  <span className="text-[10px] font-bold text-white leading-tight">{m.name}</span>
                </div>
                <div className="px-3 py-2.5 space-y-2">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle size={11} className={`mt-0.5 shrink-0 ${m.flag ? "text-[hsl(var(--status-orange))]" : "text-muted-foreground"}`} />
                    <p className="text-[10px] text-foreground/80 leading-snug">{m.insight}</p>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-start gap-1.5">
                    <CheckSquare size={11} className="mt-0.5 shrink-0 text-primary" />
                    <p className="text-[10px] font-semibold text-foreground leading-snug">{m.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Battle #1: Brand filter + 3 KPIs (same as How to Win)
    if (selectedBattle === 1) {
      return (
        <>
          {renderBrandFilter()}
          {renderBrandKpiPills(battle1BrandKpis)}
        </>
      );
    }

    // Battle #2: Brand filter + 2 KPIs (same as How to Win)
    if (selectedBattle === 2) {
      return (
        <>
          {renderBrandFilter()}
          {renderBrandKpiPills(battle2BrandKpis)}
        </>
      );
    }

    // Battle #4: KPIs + Insights + Graphs + AllocationAI deep-dive (Exec Excellence specific)
    if (selectedBattle === 4) {
      const config = execExcellenceBattleKpis[4];
      const fp = state3.freddy_performance;
      return (
        <>
          {renderBattleKpiSection(config, true)}
          <div className="border-t border-border pt-3 mt-1">
            <h3 className="font-bold text-xs text-foreground mb-2 uppercase tracking-wide">ATL / BTL Split vs. Target</h3>
            <div className="mb-3">
              <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                  { name: "Actual", ATL: 62, BTL: 38 },
                  { name: "Target", ATL: 65, BTL: 35 },
                ]} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={50} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(value: number) => `${value}%`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="ATL" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="BTL" stackId="a" fill="hsl(var(--status-orange))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mb-4">
              <h3 className="font-bold text-xs text-foreground mb-2 uppercase tracking-wide">ABTL Golden Rules Adherence (L6 Flights)</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[
                  { rule: "Pre-test", adherence: 75 },
                  { rule: "Brief Sign-off", adherence: 92 },
                  { rule: "Media Plan", adherence: 83 },
                  { rule: "Budget Gate", adherence: 67 },
                  { rule: "Post-eval", adherence: 58 },
                  { rule: "Overall", adherence: 76 },
                ]} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="rule" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(value: number) => `${value}%`} />
                  <Bar dataKey="adherence" fill="hsl(var(--status-orange))" radius={[4, 4, 0, 0]}>
                    {[75, 92, 83, 67, 58, 76].map((val, idx) => (
                      <Cell key={idx} fill={val >= 80 ? "hsl(var(--status-green))" : "hsl(var(--status-orange))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <button onClick={onOpenAllocationAI} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl py-3 px-4 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] mb-4">
              <Zap size={16} />
              Deep-dive into {config.deepDiveLabel}
              <ExternalLink size={14} />
            </button>
            <div className="pt-3 border-t border-border">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Data Sources</h4>
              <div className="flex flex-wrap gap-1.5">
                {["Media Mix Model (MMM)", "SAP Revenue Cockpit", "Campaign Performance Tracker", "AllocationAI Engine v2.1"].map((src, i) => (
                  <span key={i} className="inline-flex items-center text-[9px] font-medium text-muted-foreground bg-muted/50 border border-border rounded-md px-2 py-1">
                    {src}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      );
    }

    // Battles #3, 5–9: same KPIs & filters as How to Win
    return <HowToWinBattleDetail battleId={selectedBattle} period={period} onOpenAllocationAI={onOpenAllocationAI} />;
  };

  const renderHome = () => {
    const fp1 = state1.freddy_performance;
    const fp2 = state2.freddy_performance;
    const fp3 = state3.freddy_performance;
    const topKpis = Object.values(state1.top_kpis);

    const sections = [
      {
        title: "Shared Reality",
        subtitle: "Insights and trends covering our company, competition, categories, channels, and consumers",
        state: "executive_performance" as AppState,
        battle: null as number | null,
        color: "bg-[hsl(200,40%,45%)]",
        icon: "📊",
        alert: null as string | null,
        highlights: [
          "Category Growth & HNK OpCo metrics",
          "Brand Power & Sales Power tracking",
          "Commercial Investment overview",
          "Competitor benchmarks (Carlsberg, ABI)",
        ],
      },
      {
        title: "Where to Play",
        subtitle: "Prioritized opportunities, including demand spaces and repertoires",
        state: "shared_reality" as AppState,
        battle: null as number | null,
        color: "bg-[hsl(150,35%,55%)]",
        icon: "🎯",
        alert: "Brand Power declined -2.0 pts vs PY. Amstel Salience dropped -14.6pp – investigate Key Account performance.",
        highlights: [
          `Market Share: ${topKpis[0].value} (${topKpis[0].trend})`,
          `Brand Power: ${topKpis[1].value} (${topKpis[1].trend})`,
          `Sales Power: ${topKpis[2].value} (${topKpis[2].trend})`,
          `${fp1.recommended_actions.length} recommended actions`,
        ],
      },
      {
        title: "How to Win",
        subtitle: "Insights supporting strategic choices along our 9 Must-Win-Battles",
        state: "how_to_win" as AppState,
        battle: null as number | null,
        color: "bg-[hsl(140,40%,40%)]",
        icon: "⚔️",
        alert: fp2.insight_text,
        highlights: [
          "9 Must-Win Battles across Design & Execute",
          `Penetration: ${fp2.main_metric_1}`,
          `Volume growth: ${fp2.main_metric_2}`,
          "Cannibalization monitoring (Silver vs Original)",
        ],
      },
      {
        title: "Executional Excellence",
        subtitle: "Insights and tools supporting you in the day-to-day activities and choices to execute on our strategy",
        state: "excellent_execution" as AppState,
        battle: null as number | null,
        color: "bg-[hsl(35,45%,50%)]",
        icon: "🏆",
        alert: "Desperados Promo ROI (€0.85) is below threshold. Activations & Promotions battle flagged red – budget reallocation recommended.",
        highlights: [
          `ROI (ATL Campaign): ${fp3.main_metric}`,
          "AllocationAI budget optimization",
          "Brand performance comparison across competitors",
          `${fp3.recommended_actions.length} recommended actions`,
        ],
      },
    ];

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-lg text-foreground">Welcome back, Tony</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Here's an overview of your key dashboards and insights.</p>
        </div>
        {sections.map((section, i) => (
          <div key={i} className="border border-border rounded-2xl overflow-hidden bg-card hover:shadow-md transition-shadow">
            <div className={`${section.color} px-4 py-2.5 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{section.icon}</span>
                <div>
                  <h4 className="text-sm font-bold text-white">{section.title}</h4>
                  <p className="text-[11px] text-white/75">{section.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.(section.state, section.battle)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 transition-colors"
              >
                Open <ArrowRight size={12} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {section.alert && (
                <div className="flex items-start gap-2.5 bg-[hsl(30,100%,97%)] border border-[hsl(30,80%,75%)] rounded-lg px-3.5 py-2.5">
                  <AlertTriangle size={14} className="text-[hsl(30,80%,50%)] mt-0.5 shrink-0" />
                  <p className="text-xs text-[hsl(30,40%,30%)] leading-relaxed">{section.alert}</p>
                </div>
              )}
              <ul className="space-y-1.5">
                {section.highlights.map((h, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    );
  };


  return (
    <div className="w-full md:border-l border-border overflow-y-auto p-4 flex flex-col h-full">
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeState}-${selectedBattle}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeState === "home" && renderHome()}
            {activeState === "shared_reality" && renderState1()}
            {activeState === "how_to_win" && renderState2()}
            {activeState === "excellent_execution" && renderState3()}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
