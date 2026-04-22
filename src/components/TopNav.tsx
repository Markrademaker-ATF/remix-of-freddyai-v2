import { AppState } from "@/data/mockData";
import freddyLogo from "@/assets/freddy-ai-logo.png";
import { Home } from "lucide-react";

interface TopNavProps {
  activeState: AppState;
  onStateChange: (state: AppState) => void;
}

const tabs: { label: string; state: AppState; base: string; active: string }[] = [
  { label: "Shared Reality", state: "shared_reality", base: "bg-[hsl(210,20%,90%)] text-[hsl(210,30%,40%)]", active: "bg-[hsl(210,50%,45%)] text-white ring-2 ring-[hsl(210,50%,35%)] scale-105 shadow-lg" },
  { label: "Where to Play", state: "where_to_play", base: "bg-[hsl(150,15%,90%)] text-[hsl(150,25%,35%)]", active: "bg-[hsl(138,100%,25.5%)] text-white ring-2 ring-[hsl(138,80%,18%)] scale-105 shadow-lg" },
  { label: "How to Win", state: "how_to_win", base: "bg-[hsl(270,15%,90%)] text-[hsl(270,25%,40%)]", active: "bg-[hsl(270,35%,48%)] text-white ring-2 ring-[hsl(270,35%,36%)] scale-105 shadow-lg" },
  { label: "Executional Excellence", state: "excellent_execution", base: "bg-[hsl(40,15%,90%)] text-[hsl(40,25%,40%)]", active: "bg-[hsl(35,45%,50%)] text-white ring-2 ring-[hsl(35,45%,38%)] scale-105 shadow-lg" },
];

export default function TopNav({ activeState, onStateChange }: TopNavProps) {
  return (
    <header className="flex items-center px-5 py-3.5 gap-5 bg-white border-b border-border">
      {/* Logo */}
      <div className="flex items-center shrink-0">
        <img src={freddyLogo} alt="Freddy AI" className="h-8" />
      </div>


      {/* Home / Executive Performance button */}
      <button
        onClick={() => onStateChange("executive_performance")}
        title="Home"
        className={`flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-all duration-200 shrink-0 border-2 ${
          activeState === "executive_performance"
            ? "bg-[hsl(200,40%,45%)] text-white border-[hsl(200,40%,35%)] shadow-[0_4px_16px_hsl(200,40%,45%/0.4)] scale-[1.05]"
            : "bg-[hsl(200,30%,95%)] text-[hsl(200,35%,30%)] border-[hsl(200,25%,85%)] hover:border-[hsl(200,35%,70%)] hover:shadow-md hover:bg-[hsl(200,30%,92%)]"
        }`}
      >
        <Home size={18} />
      </button>

      {/* Decorative separator */}
      <div className="flex flex-col items-center gap-[3px] shrink-0 py-1">
        <div className="w-px h-2.5 bg-gradient-to-b from-transparent to-border" />
        <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
        <div className="w-px h-2.5 bg-gradient-to-t from-transparent to-border" />
      </div>

      {/* Main 3 nav pills */}
      <div className="flex gap-1.5 flex-1 justify-center bg-gradient-to-b from-muted/30 to-muted/50 rounded-2xl px-3 py-2 border border-border/40 shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.state}
            onClick={() => onStateChange(tab.state)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 text-center ${
              activeState === tab.state ? tab.active : `${tab.base} hover:shadow-sm`
            } hover:opacity-95`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
