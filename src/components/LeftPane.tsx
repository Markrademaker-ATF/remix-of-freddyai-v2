import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, BookOpen, Plus, Map, Trophy, AlertTriangle, ArrowRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { mockData, AppState } from "@/data/mockData";

interface LeftPaneProps {
  activeState: AppState;
  selectedBattle: number | null;
  onWidthChange?: (width: number) => void;
  onStateChange?: (state: AppState, options?: { fiveCsTab?: string }) => void;
}


// Context-aware power prompts per state / battle
const powerPromptsMap: Record<string, string[]> = {
  home: [
    "How has non-alcoholic beer demand changed in the last 12 months?",
    "What marketing strategies make Stella Artois successful in the premium segment?",
    "Create a campaign brief for sustainability initiatives targeting Gen Z consumers",
  ],
  shared_reality: [
    "Which Heineken brands drove Brand Power growth in the OpCo?",
    "How is our Category performing vs. the total beverage market?",
    "Summarize the competitive landscape for Brazil in the past 12 weeks",
  ],
  how_to_win: [
    "Which Must-Win Battles need the most urgent attention?",
    "Compare our brand positioning vs. Carlsberg and AB InBev",
    "Recommend a prioritisation strategy for the Execute to Win battles",
  ],
  how_to_win_5: [
    "What is the cannibalization rate between Silver and Original?",
    "Show me penetration overlap by channel",
    "Recommend pack size strategy to reduce cannibalization",
  ],
  how_to_win_4: [
    "What is driving the Budget Optimization alert for Battle #4?",
    "How does our ATL mix compare to industry benchmarks?",
    "Recommend media channel reallocation for Breakthrough Communication",
  ],
  how_to_win_7: [
    "Which promotions are below ROI threshold?",
    "Recommend activation budget reallocation",
    "Show promotional uplift by retailer",
  ],
  excellent_execution: [
    "Which execution battle has the biggest ROI gap to close?",
    "How does our distribution footprint compare to Carlsberg?",
    "Show the activation calendar efficiency for Q4",
  ],
  excellent_execution_4: [
    "Why is the UCL Sponsorship ROI outperforming Desperados promo?",
    "Which brand drove Spontaneous Awareness growth most?",
    "Show Amstel's Meaningful vs Salient correlation over time",
  ],
  excellent_execution_7: [
    "Which promotions are below ROI threshold?",
    "Recommend activation budget reallocation",
    "Show promotional uplift by retailer",
  ],
  executive_performance: [
    "Which KPI has the biggest gap vs prior year?",
    "Summarize market share trends by brand for this period",
    "Compare brand power vs sales power performance",
    "What's driving the volume decline in Off-trade?",
  ],
};

// Predefined rich responses with action buttons
const AMSTEL_ROS_PROMPT = "I see Amstel RoS is lagging, and I suspect that promo/BTL might be the issue. Can you suggest what is driving this exactly?";

interface ChatAction {
  label: string;
  icon: typeof Map;
  targetState: AppState;
  fiveCsTab?: string;
}

interface RichResponse {
  text: string;
  actions?: ChatAction[];
}

const predefinedResponses: Record<string, RichResponse> = {
  [AMSTEL_ROS_PROMPT]: {
    text: `Great question. Based on the data, I've identified **three key hypotheses** that are likely driving Amstel's declining Rate of Sales:

**1. 📉 Promo pressure & depth below target**
Amstel's promotional intensity is running below plan in On-trade. Promo depth is ~15% below the category average, meaning fewer consumers are being incentivized to trial or repeat purchase.
→ **Action:** Use the **Promo Advisor** tool to optimize promo calendar and maximize efficiency per €1 spent.

**2. 🏪 POSM coverage gap in on-trade**
Amstel's Point-of-Sale Material coverage in on-trade outlets is **22% lower** than Heineken® and **18% lower** than Brahma — whose aggressive on-trade expansion is closing the visibility gap. This directly impacts impulse purchase conversion at the point of sale.
→ **Action:** Assess the opportunity to amplify POSM visibility in high-traffic on-trade locations, particularly in Southeast and South regions where Brahma is strongest.

**3. ☀️ Carnival season weather opportunity**
Weather forecasts indicate **excellent conditions** during the upcoming carnival period — a prime window for on-trade consumption. This presents a tactical opportunity to boost Amstel sales through targeted BTL execution and sampling activations.
→ **Action:** Fast-track carnival BTL activation plan with focus on On-trade and festival venues.

I recommend investigating these areas further:`,
    actions: [
      { label: "Investigate channel share in Shared Reality", icon: Map, targetState: "shared_reality", fiveCsTab: "channel" },
      { label: "Investigate visibility in How to Win", icon: Trophy, targetState: "how_to_win" },
    ],
  },
};

function getContextPrompts(activeState: AppState, selectedBattle: number | null): string[] {
  const battleKey = selectedBattle ? `${activeState}_${selectedBattle}` : null;
  if (battleKey && powerPromptsMap[battleKey]) return powerPromptsMap[battleKey];
  return powerPromptsMap[activeState] ?? powerPromptsMap.home;
}

export default function LeftPane({ activeState, selectedBattle, onStateChange }: LeftPaneProps) {
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string; actions?: ChatAction[] }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isDrinking, setIsDrinking] = useState(false);
  const [isBrewing, setIsBrewing] = useState(false);
  const chatSim = mockData.scenarios.state_1_shared_reality.chat_simulation;
  // Resize state
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = (e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = containerRef.current?.offsetWidth ?? 300;
    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = ev.clientX - startX.current;
      const newW = Math.max(220, Math.min(600, startWidth.current + delta));
      if (containerRef.current) {
        containerRef.current.style.width = `${newW}px`;
      }
    };
    const onMouseUp = () => {
      isResizing.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const contextPrompts = getContextPrompts(activeState, selectedBattle);

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleSendMessage = (prompt: string) => {
    const richResponse = predefinedResponses[AMSTEL_ROS_PROMPT];
    setChatMessages([{ role: "user", text: prompt }]);
    setIsBrewing(true);
    setTimeout(() => {
      setIsBrewing(false);
      setChatMessages([
        { role: "user", text: prompt },
        { role: "ai", text: richResponse.text, actions: richResponse.actions },
      ]);
    }, 2500);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setIsDrinking(true);
    setTimeout(() => {
      setIsDrinking(false);
      handleSendMessage(inputValue);
      setInputValue("");
    }, 600);
  };

  const BeerStein = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2h8v2H8z" opacity="0.5" />
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M18 8h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M10 10v6" opacity="0.4" />
      <path d="M14 10v6" opacity="0.4" />
      <path d="M6 20h12v2H6z" opacity="0.5" />
    </svg>
  );

  // Render markdown-like text with bold support
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      // Render bold segments
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return <span key={j}>{part}</span>;
      });

      // Empty line = paragraph break
      if (line.trim() === "") return <div key={lineIdx} className="h-2" />;

      // Lines starting with → are action callouts
      if (line.trim().startsWith("→")) {
        return (
          <div key={lineIdx} className="text-[hsl(var(--status-orange))] text-xs font-semibold ml-1 mt-0.5 mb-1">
            {rendered}
          </div>
        );
      }

      return <div key={lineIdx}>{rendered}</div>;
    });
  };

  const hasMessages = chatMessages.length > 0;

  const PowerPromptsSection = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? "mt-2" : "w-full max-w-lg mt-6"}>
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <Zap size={11} className="text-accent" />
        Power Prompts
      </div>
      <div className="flex flex-col gap-1.5">
        {contextPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handlePromptClick(p)}
            className="suggested-prompt text-left px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-primary text-sm">↗</span>
              <span className={`${compact ? "text-xs" : "text-sm"} font-medium`}>{p}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative flex flex-col overflow-hidden h-full" style={{ width: 300 }}>
      {/* Resize handle on right edge */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-primary/30 transition-colors group"
        title="Drag to resize"
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
      </div>
      <div className="flex-1 flex flex-col p-4 overflow-hidden h-full">
      {hasMessages ? (
        <>
          {/* Compact greeting when chatting */}
          <div className="text-center mb-3">
            <h1 className="text-lg font-bold text-foreground">
              Hi <span className="text-accent">Tony!</span>
            </h1>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto mb-3 space-y-3">
            <AnimatePresence>
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div
                    className={`text-sm rounded-2xl px-4 py-3 max-w-[90%] ${
                      msg.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    {msg.role === "ai" ? renderFormattedText(msg.text) : (
                      msg.text.split("**").map((part, j) =>
                        j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                      )
                    )}
                  </div>
                  {/* Action buttons below AI message */}
                  {msg.role === "ai" && msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-2 ml-1">
                      {msg.actions.map((action, aIdx) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={aIdx}
                            onClick={() => onStateChange?.(action.targetState, action.fiveCsTab ? { fiveCsTab: action.fiveCsTab } : undefined)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
                          >
                            <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                              <Icon size={12} className="text-primary" />
                            </div>
                            <span className="text-xs font-semibold text-primary flex-1">{action.label}</span>
                            <ArrowRight size={12} className="text-primary/50 group-hover:text-primary transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isBrewing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-3"
              >
                <span className="text-base">🍺</span>
                <span className="italic">Brewing</span>
                <span className="flex gap-0.5">
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}>.</motion.span>
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}>.</motion.span>
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}>.</motion.span>
                </span>
              </motion.div>
            )}
          </div>

          {/* Chat input */}
          <div className="chat-input-box mt-auto">
            <div className="flex items-start gap-2">
              <textarea
                placeholder="Ask Freddy anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                rows={2}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
              />
              <motion.button
                onClick={handleSend}
                animate={isDrinking ? { rotate: -45, scale: 0.9 } : { rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-9 h-9 rounded-full bg-accent flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <BeerStein size={16} />
              </motion.button>
            </div>
          </div>

          {/* Power Prompts — always visible, compact mode */}
          <PowerPromptsSection compact />
        </>
      ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Greeting */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              Hi <span className="text-accent">Tony!</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              I'm MyFreddyAI, your AI assistant. How can I help you today?
            </p>
          </div>

          {/* Large centered chat input */}
          <div className="w-full max-w-md">
            <div className="chat-input-box">
              <div className="flex items-start gap-2">
                <textarea
                  placeholder="Ask Freddy anything...."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  rows={4}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
                />
              </div>
              <div className="flex items-center justify-end mt-4">
                <motion.button
                  onClick={handleSend}
                  animate={isDrinking ? { rotate: -45, scale: 0.9 } : { rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="w-10 h-10 rounded-full bg-accent flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <BeerStein size={18} />
                </motion.button>
              </div>
              <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
                <span>Context:</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">Heineken</span>
                <span>Internet & Uploaded Documents</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="ml-1 w-5 h-5 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                      <Plus size={12} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="flex flex-col gap-1">
                      <button className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-secondary transition-colors text-left">
                        <Search size={14} className="text-muted-foreground" /> Research
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-secondary transition-colors text-left">
                        <Zap size={14} className="text-muted-foreground" /> Freddy-1
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-secondary transition-colors text-left">
                        <BookOpen size={14} className="text-muted-foreground" /> Agent Library
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Power Prompts — always visible */}
          <PowerPromptsSection />
        </div>
      )}
      </div>
    </div>
  );
}
