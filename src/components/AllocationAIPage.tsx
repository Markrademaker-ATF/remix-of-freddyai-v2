import React, { useState } from "react";
import { ChevronDown, Search, Settings, Calendar, TrendingUp, BarChart3, X, Send, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import freddyLogo from "@/assets/freddy-ai-logo.png";

const brands = ["Heineken®", "Amstel®", "Schin®"];

type CellValue = { value: string; color: "green" | "red" | "neutral" | "light-green" | "light-red" };

interface RowData {
  metric: string;
  values: CellValue[];
  total: CellValue;
  isSubtotal?: boolean;
}

interface Section {
  key: string;
  label: string;
  rows: RowData[];
}

function cellColor(c: CellValue["color"]): string {
  if (c === "green") return "bg-[hsl(140,50%,45%)] text-white";
  if (c === "light-green") return "bg-[hsl(140,40%,85%)] text-[hsl(140,40%,25%)]";
  if (c === "red") return "bg-[hsl(0,55%,50%)] text-white";
  if (c === "light-red") return "bg-[hsl(0,40%,88%)] text-[hsl(0,40%,35%)]";
  return "text-foreground";
}

function cellBorder(c: CellValue["color"]): string {
  if (c === "green") return "border border-[hsl(140,50%,35%)]";
  if (c === "light-green") return "border border-[hsl(140,40%,70%)]";
  if (c === "red") return "border border-[hsl(0,55%,40%)]";
  if (c === "light-red") return "border border-[hsl(0,40%,75%)]";
  return "border border-border/30";
}

const sections: Section[] = [
  {
    key: "atl_digital",
    label: "ATL Digital",
    rows: [
      { metric: "ATL - Digital Display and Audio", values: [
        { value: "+100%", color: "green" }, { value: "0%", color: "neutral" }, { value: "+100%", color: "green" }, { value: "-100%", color: "red" }
      ], total: { value: "+25%", color: "light-green" } },
      { metric: "ATL - OLV", values: [
        { value: "+100%", color: "green" }, { value: "+100%", color: "green" }, { value: "-25%", color: "light-red" }, { value: "-100%", color: "red" }
      ], total: { value: "+19%", color: "light-green" } },
      { metric: "ATL - Social", values: [
        { value: "+100%", color: "green" }, { value: "0%", color: "neutral" }, { value: "+100%", color: "green" }, { value: "+92%", color: "green" }
      ], total: { value: "+73%", color: "light-green" } },
      { metric: "Subtotal", isSubtotal: true, values: [
        { value: "+100%", color: "green" }, { value: "+33%", color: "green" }, { value: "+58%", color: "green" }, { value: "-36%", color: "red" }
      ], total: { value: "+39%", color: "light-green" } },
    ],
  },
  {
    key: "atl_traditional",
    label: "ATL Traditional",
    rows: [
      { metric: "ATL - Cinema", values: [
        { value: "0%", color: "neutral" }, { value: "0%", color: "neutral" }, { value: "0%", color: "neutral" }, { value: "0%", color: "neutral" }
      ], total: { value: "0%", color: "neutral" } },
      { metric: "ATL - Radio", values: [
        { value: "0%", color: "neutral" }, { value: "0%", color: "neutral" }, { value: "+100%", color: "green" }, { value: "0%", color: "neutral" }
      ], total: { value: "+25%", color: "light-green" } },
      { metric: "ATL - TV", values: [
        { value: "-100%", color: "red" }, { value: "+100%", color: "green" }, { value: "-90%", color: "red" }, { value: "0%", color: "neutral" }
      ], total: { value: "-23%", color: "light-red" } },
      { metric: "Subtotal", isSubtotal: true, values: [
        { value: "-100%", color: "red" }, { value: "+100%", color: "green" }, { value: "-83%", color: "red" }, { value: "0%", color: "neutral" }
      ], total: { value: "-21%", color: "light-red" } },
    ],
  },
  {
    key: "btl_retail",
    label: "BTL Retail",
    rows: [
      { metric: "BTL Retail - Digital Campaigns", values: [
        { value: "-100%", color: "red" }, { value: "0%", color: "neutral" }, { value: "-64%", color: "red" }, { value: "+88%", color: "green" }
      ], total: { value: "-19%", color: "light-red" } },
      { metric: "BTL Retail - POS Campaigns", values: [
        { value: "-5%", color: "light-red" }, { value: "-68%", color: "red" }, { value: "+100%", color: "green" }, { value: "-98%", color: "red" }
      ], total: { value: "-18%", color: "light-red" } },
      { metric: "Subtotal", isSubtotal: true, values: [
        { value: "-53%", color: "red" }, { value: "-34%", color: "red" }, { value: "+18%", color: "green" }, { value: "-5%", color: "light-red" }
      ], total: { value: "-19%", color: "light-red" } },
    ],
  },
  {
    key: "btl_ontrade",
    label: "BTL On-trade",
    rows: [
      { metric: "BTL On Trade - Digital Campaigns", values: [
        { value: "0%", color: "neutral" }, { value: "+100%", color: "green" }, { value: "+100%", color: "green" }, { value: "-96%", color: "red" }
      ], total: { value: "+26%", color: "light-green" } },
      { metric: "BTL On Trade - POS Campaigns", values: [
        { value: "+72%", color: "green" }, { value: "+100%", color: "green" }, { value: "-23%", color: "light-red" }, { value: "+100%", color: "green" }
      ], total: { value: "+62%", color: "light-green" } },
      { metric: "Subtotal", isSubtotal: true, values: [
        { value: "+36%", color: "green" }, { value: "+100%", color: "green" }, { value: "+39%", color: "green" }, { value: "+2%", color: "light-green" }
      ], total: { value: "+44%", color: "light-green" } },
    ],
  },
];

interface AllocationAIPageProps {
  onBack: () => void;
}

export default function AllocationAIPage({ onBack }: AllocationAIPageProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    atl_digital: true,
    atl_traditional: true,
    btl_retail: true,
    btl_ontrade: true,
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: `Based on the AllocationAI optimization data, here's my analysis regarding "${userMsg}": The current budget reallocation suggests shifting spend toward high-performing digital channels while reducing traditional media allocation.` },
      ]);
    }, 900);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={onBack} className="text-xs font-medium text-primary hover:underline mr-2">
              ← Back
            </button>
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 min-w-[180px]">
              <Search size={13} className="text-muted-foreground" />
              <input type="text" placeholder="Choose scenario..." className="text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground flex-1" />
            </div>
            <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-1.5">
              <Settings size={13} className="text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground">Active parameters</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5">
              <TrendingUp size={13} className="text-primary" />
              <span className="text-[10px] font-semibold text-primary">Optimization</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-1.5">
              <Calendar size={13} className="text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground">2026</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <BarChart3 size={13} className="text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Metric</span>
                <span className="text-[10px] font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded">Budget alloc.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground">View</span>
                <span className="text-[10px] font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded">Δ [%]</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data table */}
        <div className="px-4 py-4">
          <div className="border border-border rounded-xl bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2.5 text-left font-semibold text-foreground border-r border-border sticky left-0 bg-muted/50 z-10 min-w-[220px]">
                    Channel / Metric
                  </th>
                  {brands.map((brand) => (
                    <th key={brand} className="px-2 py-2.5 text-center font-bold text-foreground border-r border-border/50 min-w-[100px]">
                      {brand}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-center font-bold text-foreground min-w-[90px]">
                    TP Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => {
                  const isExpanded = expandedSections[section.key];
                  return (
                    <React.Fragment key={section.key}>
                      <tr
                        className="bg-primary/8 border-t-2 border-primary/20 cursor-pointer hover:bg-primary/12 transition-colors"
                        onClick={() => toggleSection(section.key)}
                      >
                        <td colSpan={brands.length + 2} className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <ChevronDown
                              size={14}
                              className={`text-primary transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                            />
                            <span className="font-bold text-[11px] text-primary uppercase tracking-wider">{section.label}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">({section.rows.length} rows)</span>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && section.rows.map((row, idx) => (
                        <tr
                          key={`${section.key}-${idx}`}
                          className={`border-t border-border/30 ${row.isSubtotal ? "bg-muted/20" : idx % 2 === 0 ? "bg-card" : "bg-muted/10"} hover:bg-accent/10 transition-colors animate-fade-in`}
                        >
                          <td
                            className={`px-3 py-2.5 border-r border-border sticky left-0 z-10 whitespace-nowrap ${row.isSubtotal ? "font-bold text-foreground bg-muted/20" : "font-medium text-foreground"}`}
                            style={!row.isSubtotal ? { backgroundColor: idx % 2 === 0 ? "hsl(var(--card))" : "hsl(var(--muted) / 0.1)" } : undefined}
                          >
                            {row.metric}
                          </td>
                          {row.values.map((cell, ci) => (
                            <td key={ci} className="px-1 py-1.5 text-center border-r border-border/30">
                              <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold ${cellColor(cell.color)} ${cellBorder(cell.color)} ${row.isSubtotal ? "font-bold text-xs" : ""}`}>
                                {cell.value}
                              </span>
                            </td>
                          ))}
                          <td className="px-1 py-1.5 text-center">
                            <span className={`inline-block px-3 py-1 rounded text-[11px] font-bold ${cellColor(row.total.color)} ${cellBorder(row.total.color)}`}>
                              {row.total.value}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Ask FreddyAI Button */}
          {!chatOpen && (
            <div className="fixed bottom-6 right-6 z-30">
              <button
                onClick={() => setChatOpen(true)}
                className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center justify-center"
              >
                <MessageCircle size={22} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-l border-border bg-card flex flex-col h-full overflow-hidden"
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80">
              <img src={freddyLogo} alt="Freddy AI" className="w-12 h-12 object-contain shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-bold text-foreground">FreddyAI</span>
                <p className="text-[10px] text-muted-foreground">AllocationAI Assistant</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <img src={freddyLogo} alt="Freddy AI" className="w-24 h-24 object-contain" />
                  <p className="text-xs text-muted-foreground max-w-[240px]">
                    Ask me anything about budget allocations, optimization scenarios, or channel performance.
                  </p>
                  <div className="flex flex-col gap-2 w-full max-w-[280px]">
                    {[
                      "Why is ATL Digital getting +39% more budget?",
                      "Which brand benefits most from the reallocation?",
                      "Explain the BTL Retail budget decrease",
                      "Compare Heineken vs Schin allocation shifts",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => { setChatInput(prompt); }}
                        className="text-left text-[11px] text-foreground bg-muted/40 hover:bg-muted/70 border border-border/50 rounded-lg px-3 py-2 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted/60 text-foreground rounded-bl-sm border border-border/40"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-border px-3 py-3">
              <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-xl px-3 py-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                  placeholder="Ask about allocations..."
                  className="flex-1 text-xs bg-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground max-h-20"
                  rows={1}
                />
                <button onClick={handleSendChat} disabled={!chatInput.trim()} className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
