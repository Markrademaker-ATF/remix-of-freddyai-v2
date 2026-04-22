import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, Star, Sparkles, Link2, BarChart3, FileText, LayoutGrid, Settings, User } from "lucide-react";
import { AppState, mockData } from "@/data/mockData";
import LeftPane from "./LeftPane";
import RightPane from "./RightPane";

const tabs: { label: string; state: AppState }[] = [
  { label: "Shared Reality", state: "shared_reality" },
  { label: "How to Win", state: "how_to_win" },
  { label: "Excellent Execution", state: "excellent_execution" },
];

const sidebarItems = [
  { icon: Star, label: "MyFreddyAI", active: true },
  { icon: Sparkles, label: "Freddy Toolkit" },
  { icon: Link2, label: "Freddy.Connect" },
  { icon: BarChart3, label: "Allocation AI" },
  { icon: FileText, label: "Agency" },
  { icon: LayoutGrid, label: "How to use AI" },
];

export default function MobileLayout() {
  const [activeState, setActiveState] = useState<AppState>("shared_reality");
  const [selectedBattle, setSelectedBattle] = useState<number | null>(null);
  const [battleDropdownOpen, setBattleDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const state2 = mockData.scenarios.state_2_how_to_win;

  const battles = activeState === "how_to_win" ? state2.must_win_battles : [];

  const selectedBattleName = battles.find((b) => b.id === selectedBattle)?.name;

  const statusDot = (status: string) => {
    if (status === "green") return "bg-status-green";
    if (status === "orange") return "bg-status-orange";
    if (status === "red") return "bg-status-red";
    return "bg-muted-foreground";
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] bg-sidebar z-50 flex flex-col py-6 px-4 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sidebar-primary text-lg">✦</span>
                <span className="font-bold text-sidebar-foreground text-lg">Freddy</span>
                <span className="text-sidebar-primary font-semibold text-sm italic">ai</span>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                {sidebarItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-medium ${
                      item.active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-1 mt-auto">
                <button className="flex items-center gap-3 px-3 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent text-sm font-medium">
                  <Settings size={18} />
                  <span>Settings</span>
                </button>
                <button className="flex items-center gap-3 px-3 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent text-sm font-medium">
                  <User size={18} />
                  <span>Profile</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      <header className="flex items-center px-4 py-3 bg-background border-b border-border shrink-0">
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 mr-2 text-foreground">
          <Menu size={20} />
        </button>
        <span className="text-accent text-lg">✦</span>
        <span className="font-bold text-primary text-lg tracking-tight ml-1.5">Freddy</span>
        <span className="text-accent font-semibold text-sm italic ml-0.5">ai</span>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Chat section – takes precedence */}
        <LeftPane activeState={activeState} selectedBattle={selectedBattle} />

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-4" />

        {/* State selector pills */}
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Explore</p>
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.state}
                onClick={() => {
                  setActiveState(tab.state);
                  setSelectedBattle(null);
                  setBattleDropdownOpen(false);
                }}
                className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold text-center transition-all border-2 ${
                  activeState === tab.state
                    ? "border-primary bg-secondary text-primary"
                    : "border-transparent bg-muted/50 text-muted-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Battle dropdown (for how_to_win and excellent_execution) */}
        {battles.length > 0 && (
          <div className="px-4 pb-3">
            <button
              onClick={() => setBattleDropdownOpen(!battleDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-card text-sm font-semibold text-foreground"
            >
              <span>{selectedBattleName ? `#${selectedBattle} ${selectedBattleName}` : "Select a Must-Win Battle"}</span>
              <ChevronDown
                size={18}
                className={`text-muted-foreground transition-transform ${battleDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {battleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                    {battles.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBattle(b.id === selectedBattle ? null : b.id);
                          setBattleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-border/50 last:border-b-0 ${
                          selectedBattle === b.id
                            ? "bg-secondary text-primary font-bold"
                            : "text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot(b.status)}`} />
                        <span className="font-semibold text-xs text-muted-foreground mr-1">#{b.id}</span>
                        <span className="flex-1">{b.name}</span>
                        {b.flag && (
                          <span className="text-[10px] text-status-orange font-medium italic">{b.flag}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Performance content (RightPane) */}
        <div className="px-0 pb-8">
          <RightPane activeState={activeState} selectedBattle={selectedBattle} />
        </div>
      </div>
    </div>
  );
}
