import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, BookOpen, Plus, Map, Trophy, ChevronDown, MessageCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppState } from "@/data/mockData";
import { mockChats } from "./Layout";

interface LeftPaneProps {
  activeState: AppState;
  selectedBattle: number | null;
  onWidthChange?: (width: number) => void;
  onStateChange?: (state: AppState, options?: { fiveCsTab?: string }) => void;
}


// Scoped demo (Phase 1): prompts only reference Y-marked metrics
// (Vol/Val Market Share, Vol/Val Growth, Off-Trade Vol. Share, Brand Power pillars, MWBs 1–3).
const powerPromptsMap: Record<string, string[]> = {
  shared_reality: [
    "Which Heineken brands drove Brand Power growth in the OpCo?",
    "Where are we losing Value Market Share faster than Volume Market Share?",
    "How is Off-Trade Volume Growth trending vs. On-Trade this period?",
  ],
  how_to_win: [
    "Which Design-to-Win battle (MWB 1–3) has the strongest Brand Power signal?",
    "Why is Amstel Salient down while Meaningful and Different are up?",
    "Recommend a focus for MWB 2 (Iconic Brand Identity) based on the Salient gap",
  ],
  executive_performance: [
    "Which Y-scoped KPI has the biggest gap vs prior year?",
    "Summarise Volume and Value Market Share trends by brand for this period",
    "Compare Brand Power Index across Heineken, Amstel and Schin",
    "What's driving the Off-Trade Volume Growth lift for Heineken?",
  ],
};

// Scoped demo: predefined response uses ONLY Y-marked metrics
// (Brand Power pillars: Meaningful, Different, Salient + Off-Trade Vol. Share).
const AMSTEL_SALIENT_PROMPT = "Why is Amstel Salient down while Meaningful and Different are up?";

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
  [AMSTEL_SALIENT_PROMPT]: {
    text: `Good question. Looking only at the Brand Power pillars we have in DFC, the signal on Amstel is unambiguous:

**1. 🧠 Meaningful and Different are building**
Amstel Meaningful is **+2.8pp vs PY** and Different is **+2.8pp vs PY** — the proposition is resonating. Consumers who engage with the brand rate it more favourably than a year ago.

**2. 📉 Salient is collapsing**
Amstel Salient is **-14.6pp vs PY** — the steepest Brand Power decline in the portfolio. The equity is there, but the brand is not showing up in the consumer's consideration set.

**3. 🛒 Off-Trade is the channel where Amstel can recover fastest**
Off-Trade Vol. Share is the only Y-scoped sell-out metric in growth for Heineken this period. Amstel's Salience gap is biggest in Off-Trade shoppers, so that's where investment will translate fastest into Volume Market Share.

→ **Takeaway:** The Meaningful + Different gains are wasted until Salient is rebuilt. Prioritise MWB 2 (Iconic Brand Identity) activity in Off-Trade.`,
    actions: [
      { label: "Investigate Brand Power in Shared Reality", icon: Map, targetState: "shared_reality", fiveCsTab: "channel" },
      { label: "Investigate MWB 2 in How to Win", icon: Trophy, targetState: "how_to_win" },
    ],
  },
};

function getContextPrompts(activeState: AppState, selectedBattle: number | null): string[] {
  const battleKey = selectedBattle ? `${activeState}_${selectedBattle}` : null;
  if (battleKey && powerPromptsMap[battleKey]) return powerPromptsMap[battleKey];
  return powerPromptsMap[activeState] ?? powerPromptsMap.executive_performance;
}

export default function LeftPane({ activeState, selectedBattle, onStateChange }: LeftPaneProps) {
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string; actions?: ChatAction[] }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isDrinking, setIsDrinking] = useState(false);
  const [isBrewing, setIsBrewing] = useState(false);
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(false);
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
      // Handle sits on the LEFT edge now (pane is on the right side of the viewport),
      // so dragging right should SHRINK and dragging left should GROW.
      const delta = startX.current - ev.clientX;
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
    const richResponse = predefinedResponses[AMSTEL_SALIENT_PROMPT];
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

  // Collapsible, cleaner — opens into a tight stack of prompts instead of always-listed.
  const PowerPromptsSection = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? "mt-2" : "w-full max-w-lg mt-6"}>
      <button
        onClick={() => setPromptsOpen(!promptsOpen)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-accent/50 transition-colors px-3 py-2"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
          <Zap size={12} className="text-accent" />
          Power Prompts
          <span className="ml-1 text-[10px] font-semibold text-muted-foreground bg-muted/60 rounded-full px-1.5 py-[1px]">
            {contextPrompts.length}
          </span>
        </span>
        <ChevronDown
          size={13}
          className={`text-muted-foreground transition-transform duration-200 ${promptsOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {promptsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 mt-1.5">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Your chats — moved from the left sidebar to live under the chat input.
  const YourChatsSection = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? "mt-2" : "w-full max-w-lg mt-2"}>
      <button
        onClick={() => setChatsOpen(!chatsOpen)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-accent/50 transition-colors px-3 py-2"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
          <MessageCircle size={12} className="text-accent" />
          Your Chats
          <span className="ml-1 text-[10px] font-semibold text-muted-foreground bg-muted/60 rounded-full px-1.5 py-[1px]">
            {mockChats.length}
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          <Plus size={12} className="text-accent hover:text-accent/80" />
          <ChevronDown
            size={13}
            className={`text-muted-foreground transition-transform duration-200 ${chatsOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {chatsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 mt-1.5">
              {mockChats.map((c, i) => (
                <button
                  key={i}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:bg-muted/60 transition-colors text-left truncate"
                >
                  <MessageCircle size={12} className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{c}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div ref={containerRef} className="relative flex flex-col overflow-hidden h-full" style={{ width: 300 }}>
      {/* Resize handle on left edge (pane sits on the right side of the viewport) */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-primary/30 transition-colors group"
        title="Drag to resize"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
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

          {/* Power Prompts + Your Chats — compact collapsibles */}
          <PowerPromptsSection compact />
          <YourChatsSection compact />
        </>
      ) : (
        /* Empty state — top-aligned so the greeting + chat start at the top of the pane */
        <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto pt-2">
          {/* Greeting */}
          <div className="text-center mb-6 w-full">
            <h1 className="text-2xl font-bold text-foreground">
              Hi <span className="text-accent">Tony!</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 px-2">
              I'm MyFreddyAI, your AI assistant. How can I help you today?
            </p>
          </div>

          {/* Chat input */}
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

          {/* Power Prompts + Your Chats — collapsible dropdowns */}
          <PowerPromptsSection />
          <YourChatsSection />
        </div>
      )}
      </div>
    </div>
  );
}
