import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Star, ChevronLeft, FolderOpen, Plus, ChevronDown, Settings, Coins, Globe, Calendar, BarChart3 } from "lucide-react";
import { AppState } from "@/data/mockData";
import { useIsMobile } from "@/hooks/use-mobile";
import TopNav from "./TopNav";
import LeftPane from "./LeftPane";
import MainStage from "./MainStage";
import RightPane from "./RightPane";
import MobileLayout from "./MobileLayout";
import ExecutivePerformancePage from "./ExecutivePerformancePage";
import SharedRealityPage from "./SharedRealityPage";
import WhereToPlayPage from "./WhereToPlayPage";
import ExecutionalExcellencePage from "./ExecutionalExcellencePage";
import AllocationAIPage from "./AllocationAIPage";
import AllocationAIInfoPage from "./AllocationAIInfoPage";

const sidebarItems = [
  { icon: Star, label: "MyFreddyAI", active: true },
  { icon: BarChart3, label: "Allocation AI" },
];

const mockProjects = [
  "Heineken Campaign 2...",
  "Amstel positioning Revo...",
  "Q4 Marketing Strategy",
  "Q3 Marketing Strategy",
];

export const mockChats = [
  "Consumer Insight An...",
  "Performance Metrics ...",
  "Marketing Q4 Metrics...",
  "Brand Campaign Ideas",
];

// Full original Executive KPIs (Vol MS, Val MS, Brand Power, Sales Power, Volume Growth HNK,
// Value Growth HNK, Gross Margin) — matches the original HNK dashboard layout.
export const execKpisByPeriod: Record<string, {
  primary: { label: string; value: string; trend: string; status: "positive" | "negative"; fullWidth: boolean }[];
  dual: { label: string; value: string; trend: string; status: "positive" | "negative" }[];
  secondary: { label: string; value: string; trend: string; status: "positive" | "negative" }[];
}> = {
  L12w: {
    primary: [
      { label: "VOL. MARKET SHARE", value: "31.2%", trend: "-2.5pp vs PY", status: "negative", fullWidth: true },
      { label: "VALUE MARKET SHARE", value: "29.0%", trend: "-3.1pp vs PY", status: "negative", fullWidth: true },
    ],
    dual: [
      { label: "BRAND POWER", value: "6.5%", trend: "+0.3pp vs PY", status: "positive" as const },
    ],
    secondary: [
      { label: "Volume Growth (HNK)", value: "-2,345 khl", trend: "-2.1% vs PY", status: "negative" },
      { label: "Value Growth (HNK)", value: "-€1,195 mln", trend: "-1.6% vs PY", status: "negative" },
      { label: "Gross Margin", value: "60.0%", trend: "-0.8pp vs PY", status: "negative" },
    ],
  },
  L4w: {
    primary: [
      { label: "VOL. MARKET SHARE", value: "30.8%", trend: "-1.4pp vs PY", status: "negative", fullWidth: true },
      { label: "VALUE MARKET SHARE", value: "28.4%", trend: "-1.7pp vs PY", status: "negative", fullWidth: true },
    ],
    dual: [
      { label: "BRAND POWER", value: "6.3%", trend: "+0.2pp vs PY", status: "positive" as const },
    ],
    secondary: [
      { label: "Volume Growth (HNK)", value: "-1,124 khl", trend: "-1.2% vs PY", status: "negative" },
      { label: "Value Growth (HNK)", value: "-€574 mln", trend: "-0.9% vs PY", status: "negative" },
      { label: "Gross Margin", value: "59.6%", trend: "-0.4pp vs PY", status: "negative" },
    ],
  },
  YTD: {
    primary: [
      { label: "VOL. MARKET SHARE", value: "31.5%", trend: "-3.3pp vs PY", status: "negative", fullWidth: true },
      { label: "VALUE MARKET SHARE", value: "29.4%", trend: "-4.0pp vs PY", status: "negative", fullWidth: true },
    ],
    dual: [
      { label: "BRAND POWER", value: "6.7%", trend: "+0.4pp vs PY", status: "positive" as const },
    ],
    secondary: [
      { label: "Volume Growth (HNK)", value: "-12,182 khl", trend: "-2.7% vs PY", status: "negative" },
      { label: "Value Growth (HNK)", value: "-€6,208 mln", trend: "-2.1% vs PY", status: "negative" },
      { label: "Gross Margin", value: "60.4%", trend: "-1.0pp vs PY", status: "negative" },
    ],
  },
  MAT: {
    primary: [
      { label: "VOL. MARKET SHARE", value: "31.3%", trend: "-2.8pp vs PY", status: "negative", fullWidth: true },
      { label: "VALUE MARKET SHARE", value: "29.2%", trend: "-3.4pp vs PY", status: "negative", fullWidth: true },
    ],
    dual: [
      { label: "BRAND POWER", value: "6.6%", trend: "+0.3pp vs PY", status: "positive" as const },
    ],
    secondary: [
      { label: "Volume Growth (HNK)", value: "-9,518 khl", trend: "-2.3% vs PY", status: "negative" },
      { label: "Value Growth (HNK)", value: "-€4,852 mln", trend: "-1.8% vs PY", status: "negative" },
      { label: "Gross Margin", value: "60.2%", trend: "-0.9pp vs PY", status: "negative" },
    ],
  },
};

export default function Layout() {
  const isMobile = useIsMobile();
  const [activeState, setActiveState] = useState<AppState>("executive_performance");
  const [selectedBattle, setSelectedBattle] = useState<number | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [showAllocationAI, setShowAllocationAI] = useState(false);
  const [showAllocationAIInfo, setShowAllocationAIInfo] = useState(false);
  const [region, setRegion] = useState("BR");
  const [period, setPeriod] = useState("L12w");
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [activeSidebarItem, setActiveSidebarItem] = useState("MyFreddyAI");

  const periodKpis = execKpisByPeriod[period] ?? execKpisByPeriod.L12w;
  const execKpisPrimary = periodKpis.primary;
  const execKpisDual = periodKpis.dual;
  const execKpisSecondary = periodKpis.secondary;

  if (isMobile) {
    return <MobileLayout />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarExpanded ? "w-56" : "w-14"} bg-sidebar flex flex-col py-4 shrink-0 transition-all duration-300 overflow-hidden`}>
        {/* Toggle */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="p-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors mb-3 self-end mr-2"
        >
          {sidebarExpanded ? <ChevronLeft size={18} /> : <Menu size={20} />}
        </button>

        {/* User profile (top-left, above nav) */}
        {sidebarExpanded ? (
          <div className="px-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm shrink-0">
                TA
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">Tony</p>
                <p className="text-[11px] text-sidebar-foreground/60 truncate">🇧🇷 São Paulo Office</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-3">
            <div
              className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm"
              title="Tony · São Paulo Office"
            >
              TA
            </div>
          </div>
        )}

        {/* Divider between profile and nav */}
        {sidebarExpanded && <div className="h-px bg-sidebar-border mx-4 mb-3" />}

        {/* Sidebar nav items */}
        <div className={`${sidebarExpanded ? "px-3" : "px-1"} mb-3 space-y-0.5`}>
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setActiveSidebarItem(item.label);
                if (item.label === "Allocation AI") {
                  setShowAllocationAIInfo(true);
                  setShowAllocationAI(false);
                } else {
                  setShowAllocationAIInfo(false);
                  setShowAllocationAI(false);
                }
              }}
              className={`flex items-center gap-3 w-full rounded-xl transition-colors ${
                sidebarExpanded ? "px-3 py-2.5" : "p-2.5 justify-center"
              } ${
                activeSidebarItem === item.label
                  ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-foreground))] font-semibold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/40"
              }`}
              title={item.label}
            >
              <item.icon size={18} className="shrink-0" />
              {sidebarExpanded && <span className="text-xs font-medium truncate">{item.label}</span>}
            </button>
          ))}
        </div>

        {/* OpCo + Period filters (HNK request: keep in left pane) */}
        {sidebarExpanded && (
          <div className="px-4 mb-4 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">Filters</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Globe size={13} className="text-sidebar-foreground/60 shrink-0" />
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="flex-1 bg-sidebar-accent text-sidebar-foreground text-xs rounded-lg px-2 py-1.5 border-none outline-none cursor-pointer"
                  title="OpCo"
                >
                  <option value="UK" disabled>United Kingdom</option>
                  <option value="NL" disabled>Netherlands</option>
                  <option value="BR">Brazil</option>
                  <option value="MX" disabled>Mexico</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-sidebar-foreground/60 shrink-0" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="flex-1 bg-sidebar-accent text-sidebar-foreground text-xs rounded-lg px-2 py-1.5 border-none outline-none cursor-pointer"
                  title="Time period"
                >
                  <option value="L12w">L12w (12 Weeks)</option>
                  <option value="L4w">L4w (4 Weeks)</option>
                  <option value="YTD">YTD</option>
                  <option value="MAT">MAT</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        {sidebarExpanded && <div className="h-px bg-sidebar-border mx-4 mb-3" />}

        {/* Executive KPIs (HNK request: keep in left pane) — Y-scoped Sell-out + Brand Power */}
        {sidebarExpanded && (
          <div className="px-4 mb-4 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold mb-2">
              Executive KPIs
            </div>

            {/* Primary KPIs — full width */}
            {execKpisPrimary.map((kpi, i) => (
              <div
                key={i}
                className="bg-sidebar-accent rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
              >
                <span className="text-[11px] font-bold text-sidebar-foreground tracking-wide">{kpi.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-sidebar-foreground">{kpi.value}</span>
                  <span
                    className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                      kpi.status === "positive"
                        ? "text-[hsl(var(--status-green))]"
                        : "text-[hsl(var(--status-red))]"
                    }`}
                  >
                    {kpi.status === "positive" ? "↗" : "↘"} {kpi.trend}
                  </span>
                </div>
              </div>
            ))}

            {/* Brand Power tile (GREEN, CPM) */}
            {execKpisDual.map((kpi, i) => (
              <div
                key={i}
                className="bg-sidebar-accent rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
              >
                <span className="text-[11px] font-bold text-sidebar-foreground tracking-wide">{kpi.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-sidebar-foreground">{kpi.value}</span>
                  <span
                    className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                      kpi.status === "positive"
                        ? "text-[hsl(var(--status-green))]"
                        : "text-[hsl(var(--status-red))]"
                    }`}
                  >
                    {kpi.status === "positive" ? "↗" : "↘"} {kpi.trend}
                  </span>
                </div>
              </div>
            ))}

            {/* Secondary KPIs */}
            {execKpisSecondary.map((kpi, i) => (
              <div key={i} className="bg-sidebar-accent rounded-xl px-3 py-2.5">
                <div className="text-[10px] text-sidebar-foreground/60 mb-1">{kpi.label}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-sidebar-foreground">{kpi.value}</span>
                  <span
                    className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                      kpi.status === "positive"
                        ? "text-[hsl(var(--status-green))]"
                        : "text-[hsl(var(--status-red))]"
                    }`}
                  >
                    {kpi.status === "positive" ? "↗" : "↘"} {kpi.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        {sidebarExpanded && <div className="h-px bg-sidebar-border mx-4 mb-3" />}

        {/* Projects Section */}
        {sidebarExpanded && (
          <div className="px-3 mb-2 flex-1 overflow-y-auto">
            <div className="mb-3">
              <button
                onClick={() => setProjectsOpen(!projectsOpen)}
                className="flex items-center justify-between w-full text-[11px] font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-1.5 px-1 hover:text-sidebar-foreground transition-colors"
              >
                <span className="flex items-center gap-1">
                  Projects
                  <ChevronDown size={12} className={`transition-transform ${projectsOpen ? "" : "-rotate-90"}`} />
                </span>
                <Plus size={13} className="text-sidebar-primary hover:text-sidebar-primary/80" />
              </button>
              <AnimatePresence>
                {projectsOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="space-y-0.5">
                      {mockProjects.map((p, i) => (
                        <button key={i} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-left truncate">
                          <FolderOpen size={14} className="shrink-0 text-sidebar-foreground/50" />
                          <span className="truncate">{p}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {!sidebarExpanded && (
          <div className="flex flex-col gap-1 items-center flex-1">
            <button className="p-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent" title="Projects"><FolderOpen size={18} /></button>
          </div>
        )}

        {/* Divider */}
        {sidebarExpanded && <div className="h-px bg-sidebar-border mx-4 mb-2" />}

        {/* Bottom */}
        <div className={`flex flex-col gap-1 ${sidebarExpanded ? "px-3" : "items-center px-0"}`}>
          <button className={`${sidebarExpanded ? "flex items-center gap-3 px-3 py-2 rounded-xl" : "p-2.5 rounded-xl"} text-sidebar-foreground hover:bg-sidebar-accent transition-colors`} title="Settings">
            <Settings size={18} />
            {sidebarExpanded && <span className="text-xs font-medium">Settings</span>}
          </button>
          <button className={`${sidebarExpanded ? "flex items-center gap-3 px-3 py-2 rounded-xl" : "p-2.5 rounded-xl"} bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 transition-colors`} title="My Tokens">
            <Coins size={18} />
            {sidebarExpanded && <span className="text-xs font-medium">My Tokens</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav
          activeState={activeState}
          onStateChange={(s) => {
            setActiveState(s);
            setSelectedBattle(null);
            setActiveSidebarItem("MyFreddyAI");
            setShowAllocationAI(false);
            setShowAllocationAIInfo(false);
          }}
        />
        <div className="flex-1 flex overflow-hidden min-h-0">
          {showAllocationAIInfo ? (
            <AllocationAIInfoPage
              onAccessPlatform={() => {
                setShowAllocationAIInfo(false);
                setShowAllocationAI(true);
              }}
            />
          ) : showAllocationAI ? (
            <AllocationAIPage
              onBack={() => {
                setShowAllocationAI(false);
                setShowAllocationAIInfo(true);
              }}
            />
          ) : activeState === "how_to_win" ? (
            // How to Win — original MainStage + RightPane design. MWB 1–3 scope (BGS, GREEN-Y).
            <>
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <MainStage
                  activeState={activeState}
                  selectedBattle={selectedBattle}
                  onSelectBattle={setSelectedBattle}
                />
                <div className="flex-1 overflow-y-auto">
                  <RightPane
                    activeState={activeState}
                    selectedBattle={selectedBattle}
                    period={period}
                    onNavigate={(s, b) => { setActiveState(s); setSelectedBattle(b); }}
                    onOpenAllocationAI={() => setShowAllocationAI(true)}
                  />
                </div>
              </div>
              <div className="shrink-0 overflow-hidden flex flex-col border-l border-border">
                <LeftPane
                  activeState={activeState}
                  selectedBattle={selectedBattle}
                  onStateChange={(s) => {
                    setActiveState(s);
                    setSelectedBattle(null);
                  }}
                />
              </div>
            </>
          ) : (
            // All other tabs: dedicated pages scoped to GREEN-ready data.
            <>
              {activeState === "executive_performance" && (
                <ExecutivePerformancePage region={region} period={period} onStateChange={setActiveState} />
              )}
              {activeState === "shared_reality" && <SharedRealityPage period={period} />}
              {activeState === "where_to_play" && <WhereToPlayPage period={period} />}
              {activeState === "excellent_execution" && <ExecutionalExcellencePage period={period} />}
              <div className="shrink-0 overflow-hidden flex flex-col border-l border-border">
                <LeftPane
                  activeState={activeState}
                  selectedBattle={selectedBattle}
                  onStateChange={(s) => {
                    setActiveState(s);
                    setSelectedBattle(null);
                  }}
                />
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
