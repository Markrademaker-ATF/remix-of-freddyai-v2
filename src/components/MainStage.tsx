import { motion, AnimatePresence } from "framer-motion";
import { Download } from "lucide-react";
import { mockData, AppState } from "@/data/mockData";

import mwb1 from "@/assets/mwb/mwb-1-positioning.png";
import mwb2 from "@/assets/mwb/mwb-2-identity.png";
import mwb3 from "@/assets/mwb/mwb-3-taste.png";
import mwb4 from "@/assets/mwb/mwb-4-communication.png";
import mwb5 from "@/assets/mwb/mwb-5-innovation.png";
import mwb6 from "@/assets/mwb/mwb-6-pack-price.png";
import mwb7 from "@/assets/mwb/mwb-7-activations.png";
import mwb8 from "@/assets/mwb/mwb-8-availability.png";
import mwb9 from "@/assets/mwb/mwb-9-visibility.png";

import mwb1o from "@/assets/mwb/mwb-1-positioning-orange.png";
import mwb2o from "@/assets/mwb/mwb-2-identity-orange.png";
import mwb3o from "@/assets/mwb/mwb-3-taste-orange.png";
import mwb4o from "@/assets/mwb/mwb-4-communication-orange.png";
import mwb5o from "@/assets/mwb/mwb-5-innovation-orange.png";
import mwb6o from "@/assets/mwb/mwb-6-pack-price-orange.png";
import mwb7o from "@/assets/mwb/mwb-7-activations-orange.png";
import mwb8o from "@/assets/mwb/mwb-8-availability-orange.png";
import mwb9o from "@/assets/mwb/mwb-9-visibility-orange.png";

import mwb1g from "@/assets/mwb/mwb-1-positioning-grey.png";
import mwb2g from "@/assets/mwb/mwb-2-identity-grey.png";
import mwb3g from "@/assets/mwb/mwb-3-taste-grey.png";
import mwb4g from "@/assets/mwb/mwb-4-communication-grey.png";
import mwb5g from "@/assets/mwb/mwb-5-innovation-grey.png";
import mwb6g from "@/assets/mwb/mwb-6-pack-price-grey.png";
import mwb7g from "@/assets/mwb/mwb-7-activations-grey.png";
import mwb8g from "@/assets/mwb/mwb-8-availability-grey.png";
import mwb9g from "@/assets/mwb/mwb-9-visibility-grey.png";

const mwbIcons: Record<number, string> = {
  1: mwb1, 2: mwb2, 3: mwb3, 4: mwb4, 5: mwb5,
  6: mwb6, 7: mwb7, 8: mwb8, 9: mwb9,
};

const mwbIconsOrange: Record<number, string> = {
  1: mwb1o, 2: mwb2o, 3: mwb3o, 4: mwb4o, 5: mwb5o,
  6: mwb6o, 7: mwb7o, 8: mwb8o, 9: mwb9o,
};

const mwbIconsGrey: Record<number, string> = {
  1: mwb1g, 2: mwb2g, 3: mwb3g, 4: mwb4g, 5: mwb5g,
  6: mwb6g, 7: mwb7g, 8: mwb8g, 9: mwb9g,
};

interface MainStageProps {
  activeState: AppState;
  selectedBattle: number | null;
  onSelectBattle: (id: number | null) => void;
}

function BattleCard({ b, selected, onSelect }: { b: { id: number; name: string; status: string; flag?: string }; selected: boolean; onSelect: () => void }) {
  const isOrange = b.status === "orange";

  // Background: grey when unselected, green/orange when selected
  const bgColor = selected
    ? isOrange
      ? "bg-[hsl(var(--status-orange))]"
      : "bg-[#008200]"
    : "bg-[#C5C6C7]";

  // Icon: grey version when unselected, coloured when selected
  const iconSrc = selected
    ? isOrange
      ? mwbIconsOrange[b.id]
      : mwbIcons[b.id]
    : mwbIconsGrey[b.id];

  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col items-center ${bgColor} rounded-xl px-3 pt-2 pb-2 flex-1 min-w-0 min-h-[90px] transition-all hover:scale-105 hover:shadow-lg ${
        selected ? "shadow-xl scale-105" : ""
      }`}
    >
      {/* Number + Label */}
      <div className={`text-[9px] font-extrabold uppercase leading-tight text-center tracking-wide ${selected ? "text-white" : "text-white/80"}`}>
        <span className="opacity-80">№{b.id}.</span> {b.name}
      </div>
      {/* Icon */}
      <img
        src={iconSrc}
        alt={b.name}
        className="w-8 h-8 object-contain mt-1.5 opacity-90"
      />
      {/* Status flag */}
      {b.flag && (
        <div className="absolute -top-2 -right-2 bg-[hsl(var(--status-orange))] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow">!</div>
      )}
    </button>
  );
}

export default function MainStage({ activeState, selectedBattle, onSelectBattle }: MainStageProps) {
  const state2 = mockData.scenarios.state_2_how_to_win;
  const state3 = mockData.scenarios.state_3_excellent_execution;

  const STRATEGIC_DOCS = [
    { label: "Latest Annual Plan", file: "annual-plan-2025.pdf" },
    { label: "Latest Brand Plan", file: "brand-plan-2025.pdf" },
    { label: "Latest Channel Plan", file: "channel-plan-2025.pdf" },
  ];

  const renderBattles = (battles: Array<{ id: number; name: string; status: string; flag?: string }>, groupLabel1: string, groupLabel2: string) => {
    const group1 = battles.filter((b) => b.id >= 1 && b.id <= 3);
    const group2 = battles.filter((b) => b.id >= 4 && b.id <= 9);
    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Strategic Documents bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">Strategic Documents:</span>
          {STRATEGIC_DOCS.map((doc) => (
            <a
              key={doc.file}
              href="#"
              onClick={(e) => e.preventDefault()}
              download={doc.file}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-[#008200] text-white hover:bg-[#006600] transition-all shadow-sm"
            >
              <Download size={10} className="shrink-0" />
              {doc.label}
            </a>
          ))}
        </div>

        {/* Battle card groups — Execute-to-Win hidden when empty (MWB 1-3 scope) */}
        <div className="flex gap-4 justify-center items-stretch w-full">
          {group1.length > 0 && (
            <div className="flex flex-col items-stretch gap-1.5 flex-[3]">
              <div className="bg-[#008200] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-t-lg text-center">
                {groupLabel1}
              </div>
              <div className="flex gap-2 w-full">
                {group1.map((b) => (
                  <BattleCard key={b.id} b={b} selected={selectedBattle === b.id} onSelect={() => onSelectBattle(b.id === selectedBattle ? null : b.id)} />
                ))}
              </div>
            </div>
          )}
          {group2.length > 0 && (
            <div className="flex flex-col items-stretch gap-1.5 flex-[6]">
              <div className="bg-[#008200] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-t-lg text-center">
                {groupLabel2}
              </div>
              <div className="flex gap-2 w-full">
                {group2.map((b) => (
                  <BattleCard key={b.id} b={b} selected={selectedBattle === b.id} onSelect={() => onSelectBattle(b.id === selectedBattle ? null : b.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeState}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25 }}
        className={`px-4 py-3 border-b border-border flex items-center justify-center ${activeState !== "shared_reality" ? "min-h-[72px]" : ""}`}
      >
        {activeState === "shared_reality" && null}

        {activeState === "how_to_win" && renderBattles(state2.must_win_battles, "Design to Win", "Execute to Win")}

        {activeState === "excellent_execution" && renderBattles(state3.must_win_battles, "Design to Win", "Execute to Win")}
      </motion.div>
    </AnimatePresence>
  );
}