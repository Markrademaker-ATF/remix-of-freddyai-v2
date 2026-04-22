import { useState } from "react";
import { Download, AlertTriangle, CheckSquare, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Repertoire Overlap Matrix helpers ──────────────────────────────────────

const SEGMENTS = [
  "Flv. Beer RGB",
  "Flv. Beer Can",
  "Lager Regional E",
  "Lager Regional W",
  "Lager Mainstream",
  "Lager Em. Prem",
  "Lager Est. Prem",
  "Stout Domestic",
  "Stout Intl Prem",
];

const OVERLAP_DATA = [
  [1.9, 1.7, 1.2, 1.0, 1.2, 1.3, 1.1, 1.3, 1.3],
  [1.7, 3.0, 1.4, 1.4, 1.3, 2.0, 1.3, 1.5, 1.4],
  [1.2, 1.4, 2.5, 1.0, 1.5, 1.5, 1.0, 1.3, 1.3],
  [1.0, 1.4, 1.0, 2.7, 1.3, 1.0, 1.5, 1.4, 1.3],
  [1.2, 1.3, 1.5, 1.3, 1.9, 0.8, 1.1, 1.4, 1.5],
  [1.3, 2.0, 1.5, 1.0, 0.8, 3.0, 1.4, 1.2, 1.6],
  [1.1, 1.3, 1.0, 1.5, 1.1, 1.4, 2.6, 1.1, 1.5],
  [1.3, 1.5, 1.3, 1.4, 1.4, 1.2, 1.1, 1.7, 1.3],
  [1.3, 1.4, 1.3, 1.3, 1.5, 1.6, 1.5, 1.3, 2.0],
];

const MIN_VAL = 0.8;
const MAX_VAL = 3.0;

function getGreenBg(val: number): string {
  const t = (val - MIN_VAL) / (MAX_VAL - MIN_VAL);
  const l = Math.round(14 + t * 32);
  const s = Math.round(42 + t * 22);
  return `hsl(120, ${s}%, ${l}%)`;
}

function getTextColor(val: number): string {
  const t = (val - MIN_VAL) / (MAX_VAL - MIN_VAL);
  return t > 0.42 ? "#ffffff" : "#8a9a8a";
}

function RepertoireOverlapMatrix() {
  return (
    <div className="mt-2">
      <table className="border-collapse" style={{ minWidth: 520, fontSize: 9 }}>
        <thead>
          <tr>
            <th style={{ width: 94 }} />
            {SEGMENTS.map((seg, ci) => (
              <th key={ci} className="px-0.5 pb-1 font-semibold text-muted-foreground" style={{ width: 50 }}>
                <div
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    height: 72,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    whiteSpace: "nowrap",
                  }}
                >
                  {seg}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {OVERLAP_DATA.map((row, ri) => (
            <tr key={ri}>
              <td className="pr-2 py-0.5 font-semibold text-foreground text-right" style={{ whiteSpace: "nowrap", fontSize: 9 }}>
                {SEGMENTS[ri]}
              </td>
              {row.map((val, ci) => {
                const isDiag = ri === ci;
                return (
                  <td key={ci} className="p-0.5">
                    <div
                      style={{
                        background: getGreenBg(val),
                        color: getTextColor(val),
                        width: 42,
                        height: 24,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 9,
                        outline: isDiag ? "2px solid hsl(88,60%,55%)" : "none",
                        outlineOffset: -2,
                      }}
                    >
                      {val.toFixed(1)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 mt-3 justify-center">
        <span className="text-[10px] text-muted-foreground">Low overlap</span>
        <div className="flex rounded overflow-hidden" style={{ width: 80, height: 10 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ flex: 1, background: getGreenBg(MIN_VAL + (i / 19) * (MAX_VAL - MIN_VAL)) }} />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">High overlap</span>
      </div>
    </div>
  );
}

// ── Repertoire Performance data ────────────────────────────────────────────

type PerfRow = { name: string; share: string; vol: number; valCagr: string; volCagr: string; avgPrice: number; hnkShare: string; hnkEvol: string };

const PERF_DATA_BY_CHANNEL: Record<Channel, PerfRow[]> = {
  total: [
    { name: "Flavored Beer/RTD",           share: "7%",  vol: 0.9, valCagr: "+3%",  volCagr: "+17%", avgPrice: 1.0, hnkShare: "58%",  hnkEvol: "-2.6pp" },
    { name: "Lager - Regional Entry",      share: "50%", vol: 6,   valCagr: "-12%", volCagr: "-1%",  avgPrice: 0.7, hnkShare: "57%",  hnkEvol: "-0.8pp" },
    { name: "Lager - Legacy Mainstream",   share: "10%", vol: 1.2, valCagr: "-32%", volCagr: "-25%", avgPrice: 0.7, hnkShare: "100%", hnkEvol: "+1pp"   },
    { name: "Lager - Emerging Premium",    share: "8%",  vol: 1,   valCagr: "-18%", volCagr: "-6%",  avgPrice: 0.8, hnkShare: "57%",  hnkEvol: "-2.8pp" },
    { name: "Lager - Established Premium", share: "8%",  vol: 0.9, valCagr: "-18%", volCagr: "-8%",  avgPrice: 1.0, hnkShare: "100%", hnkEvol: "+0pp"   },
    { name: "Stout - Domestic",            share: "7%",  vol: 0.8, valCagr: "-13%", volCagr: "-3%",  avgPrice: 0.8, hnkShare: "77%",  hnkEvol: "-3pp"   },
    { name: "Stout - International Premium", share: "8%", vol: 1,  valCagr: "-18%", volCagr: "-11%", avgPrice: 1.2, hnkShare: "60%",  hnkEvol: "-2.7pp" },
  ],
  "on-trade": [
    { name: "Flavored Beer/RTD",           share: "5%",  vol: 0.3, valCagr: "+5%",  volCagr: "+20%", avgPrice: 1.3, hnkShare: "62%",  hnkEvol: "-1.8pp" },
    { name: "Lager - Regional Entry",      share: "42%", vol: 2.4, valCagr: "-8%",  volCagr: "+2%",  avgPrice: 0.8, hnkShare: "52%",  hnkEvol: "-1.2pp" },
    { name: "Lager - Legacy Mainstream",   share: "12%", vol: 0.7, valCagr: "-28%", volCagr: "-20%", avgPrice: 0.8, hnkShare: "100%", hnkEvol: "+0.5pp" },
    { name: "Lager - Emerging Premium",    share: "10%", vol: 0.6, valCagr: "-14%", volCagr: "-3%",  avgPrice: 1.0, hnkShare: "60%",  hnkEvol: "-2.0pp" },
    { name: "Lager - Established Premium", share: "12%", vol: 0.7, valCagr: "-10%", volCagr: "-4%",  avgPrice: 1.2, hnkShare: "100%", hnkEvol: "+0pp"   },
    { name: "Stout - Domestic",            share: "9%",  vol: 0.5, valCagr: "-10%", volCagr: "-1%",  avgPrice: 0.9, hnkShare: "80%",  hnkEvol: "-2pp"   },
    { name: "Stout - International Premium", share: "10%", vol: 0.6, valCagr: "-12%", volCagr: "-7%", avgPrice: 1.4, hnkShare: "65%", hnkEvol: "-1.5pp" },
  ],
  "off-trade": [
    { name: "Flavored Beer/RTD",           share: "8%",  vol: 0.5, valCagr: "+2%",  volCagr: "+15%", avgPrice: 0.9, hnkShare: "55%",  hnkEvol: "-3.0pp" },
    { name: "Lager - Regional Entry",      share: "55%", vol: 3.2, valCagr: "-14%", volCagr: "-3%",  avgPrice: 0.6, hnkShare: "60%",  hnkEvol: "-0.5pp" },
    { name: "Lager - Legacy Mainstream",   share: "9%",  vol: 0.5, valCagr: "-35%", volCagr: "-28%", avgPrice: 0.6, hnkShare: "100%", hnkEvol: "+1.5pp" },
    { name: "Lager - Emerging Premium",    share: "7%",  vol: 0.4, valCagr: "-20%", volCagr: "-8%",  avgPrice: 0.7, hnkShare: "54%",  hnkEvol: "-3.5pp" },
    { name: "Lager - Established Premium", share: "6%",  vol: 0.3, valCagr: "-22%", volCagr: "-12%", avgPrice: 0.9, hnkShare: "100%", hnkEvol: "+0pp"   },
    { name: "Stout - Domestic",            share: "6%",  vol: 0.3, valCagr: "-15%", volCagr: "-5%",  avgPrice: 0.7, hnkShare: "75%",  hnkEvol: "-4pp"   },
    { name: "Stout - International Premium", share: "7%", vol: 0.4, valCagr: "-22%", volCagr: "-14%", avgPrice: 1.1, hnkShare: "56%", hnkEvol: "-3.5pp" },
  ],
  "e-commerce": [
    { name: "Flavored Beer/RTD",           share: "12%", vol: 0.1, valCagr: "+8%",  volCagr: "+25%", avgPrice: 1.1, hnkShare: "65%",  hnkEvol: "-1.0pp" },
    { name: "Lager - Regional Entry",      share: "38%", vol: 0.4, valCagr: "-5%",  volCagr: "+5%",  avgPrice: 0.8, hnkShare: "48%",  hnkEvol: "-2.0pp" },
    { name: "Lager - Legacy Mainstream",   share: "8%",  vol: 0.1, valCagr: "-25%", volCagr: "-18%", avgPrice: 0.8, hnkShare: "100%", hnkEvol: "+0pp"   },
    { name: "Lager - Emerging Premium",    share: "10%", vol: 0.1, valCagr: "-10%", volCagr: "+2%",  avgPrice: 0.9, hnkShare: "62%",  hnkEvol: "-1.5pp" },
    { name: "Lager - Established Premium", share: "12%", vol: 0.1, valCagr: "-8%",  volCagr: "-2%",  avgPrice: 1.1, hnkShare: "100%", hnkEvol: "+0pp"   },
    { name: "Stout - Domestic",            share: "8%",  vol: 0.1, valCagr: "-8%",  volCagr: "+1%",  avgPrice: 0.9, hnkShare: "82%",  hnkEvol: "-1pp"   },
    { name: "Stout - International Premium", share: "12%", vol: 0.1, valCagr: "-5%", volCagr: "-3%", avgPrice: 1.3, hnkShare: "68%", hnkEvol: "-1.2pp" },
  ],
};

// ── Demand Spaces – grid layout matching reference image ──────────────────
// Layout (4 cols: 2fr 1fr 1fr 1fr, 2 rows):
//   Row 1 (Looking good):  [Looking Good — cols 1-2] [Quality Socializing — col 3] [Connect & Celebrate — col 4, rowspan 2]
//   Row 2 (Feeling good):  [Unwinding — col 1]       [Sharing a meal — col 2]      [Genuine Connections — col 3]

const TOTAL_MARKET_SIZE = "€12.3B";

type Channel = "total" | "on-trade" | "off-trade" | "e-commerce";

const CHANNEL_OPTIONS: { value: Channel; label: string }[] = [
  { value: "total", label: "Total Market" },
  { value: "on-trade", label: "On-Trade" },
  { value: "off-trade", label: "Off-Trade" },
  { value: "e-commerce", label: "E-Commerce" },
];

interface BrandPoint {
  name: string;
  x: number; // 0-100 energy level
  y: number; // 0-100 feeling good → looking good
}

const BRAND_POINTS_BY_CHANNEL: Record<Channel, BrandPoint[]> = {
  total: [
    { name: "Heineken", x: 68, y: 72 },
    { name: "Amstel",   x: 61, y: 54 },
    { name: "Kaiser",   x: 28, y: 30 },
    { name: "Schin",    x: 88, y: 22 },
  ],
  "on-trade": [
    { name: "Heineken", x: 72, y: 78 },
    { name: "Amstel",   x: 55, y: 60 },
    { name: "Kaiser",   x: 22, y: 35 },
    { name: "Schin",    x: 82, y: 18 },
  ],
  "off-trade": [
    { name: "Heineken", x: 62, y: 65 },
    { name: "Amstel",   x: 65, y: 48 },
    { name: "Kaiser",   x: 35, y: 28 },
    { name: "Schin",    x: 90, y: 25 },
  ],
  "e-commerce": [
    { name: "Heineken", x: 70, y: 80 },
    { name: "Amstel",   x: 58, y: 45 },
    { name: "Kaiser",   x: 30, y: 22 },
    { name: "Schin",    x: 85, y: 30 },
  ],
};

const COMPETITOR_POINTS_BY_CHANNEL: Record<Channel, BrandPoint[]> = {
  total: [
    { name: "Budweiser", x: 74, y: 62 },
    { name: "Brahma",    x: 42, y: 38 },
  ],
  "on-trade": [
    { name: "Budweiser", x: 78, y: 68 },
    { name: "Brahma",    x: 38, y: 42 },
  ],
  "off-trade": [
    { name: "Budweiser", x: 70, y: 58 },
    { name: "Brahma",    x: 45, y: 35 },
  ],
  "e-commerce": [
    { name: "Budweiser", x: 76, y: 70 },
    { name: "Brahma",    x: 40, y: 32 },
  ],
};

const MARKET_SIZE_BY_CHANNEL: Record<Channel, string> = {
  total: "€12.3B",
  "on-trade": "€4.8B",
  "off-trade": "€6.1B",
  "e-commerce": "€1.4B",
};

// Each demand space defined as a polygon in graph coordinates (0-100 scale)
// X = Energy Level (low→high = left→right)
// Y = 0 = Feeling Good (bottom), 100 = Looking Good (top)
// Layout matches reference:
//   Unwinding:            low energy, feeling good  (bottom-left, large)
//   Looking Good:         low-mid energy, looking good (top-left, wide)
//   Sharing a meal:       mid energy, feeling good (bottom-mid)
//   Genuine Connections:  mid-high energy, feeling good (bottom-mid-right)
//   Quality Socializing:  mid-high energy, looking good (top-mid-right)
//   Connect & Celebrate:  high energy, both (right, full height)

interface DemandSpace {
  name: string;
  marketSize: string;
  color: string;
  // polygon points as [x, y][] in 0-100 coordinate space
  points: [number, number][];
}

const DEMAND_SPACES: DemandSpace[] = [
  {
    name: "Unwinding",
    marketSize: "€4.2B",
    color: "hsl(210, 55%, 62%)",
    points: [[0,0],[33,0],[33,50],[0,50]],
  },
  {
    name: "Looking Good",
    marketSize: "€2.8B",
    color: "hsl(88, 52%, 58%)",
    points: [[0,50],[0,100],[50,100],[50,50]],
  },
  {
    name: "Sharing a meal",
    marketSize: "€1.9B",
    color: "hsl(45, 72%, 68%)",
    points: [[33,0],[58,0],[58,50],[33,50]],
  },
  {
    name: "Genuine Connections",
    marketSize: "€1.6B",
    color: "hsl(30, 65%, 58%)",
    points: [[58,0],[76,0],[76,50],[58,50]],
  },
  {
    name: "Quality Socializing",
    marketSize: "€1.8B",
    color: "hsl(140, 45%, 36%)",
    points: [[50,50],[76,50],[76,100],[50,100]],
  },
  {
    name: "Connect & Celebrate",
    marketSize: "€2.2B",
    color: "hsl(0, 55%, 54%)",
    points: [[76,0],[100,0],[100,100],[76,100]],
  },
];

function centroid(pts: [number, number][]): [number, number] {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [cx, cy];
}

// Grid column breakpoints (% of total width): 0, 33, 50, 58, 76, 100
// Cols: [33fr] [17fr] [8fr] [18fr] [24fr]
// Row 1 (Looking good): Looking Good (col 1-2), Quality Socializing (col 3-4), C&C (col 5, rowspan 2)
// Row 2 (Feeling good): Unwinding (col 1), Sharing a meal (col 2-3), Genuine Connections (col 4), C&C (col 5)
//
// Energy column labels align to col midpoints:
//   Relaxing   → cols 1-2 midpoint = ~25% of 76% ≈ 33%
//   Bonding    → cols 3-4 midpoint = (50+76)/2 = 63% of 76% area
//   Socializing → col 5 = 88% overall
//
// Brand/competitor x/y positions (0-100 scale) are mapped to:
//   left% = x%, top% = (100 - y)% within the grid area

const ENERGY_LABELS = [
  { label: "Relaxing",           leftPct: 25 },
  { label: "Bonding",            leftPct: 54 },
  { label: "Socializing / Partying", leftPct: 88 },
];

const GRID_SPACES = [
  // Row 1 (Looking good)
  { name: "Looking Good",        color: "hsl(88, 52%, 62%)",  gridCol: "1 / 3", gridRow: "1",    label: true },
  { name: "Quality Socializing", color: "hsl(140, 45%, 36%)", gridCol: "3 / 5", gridRow: "1",    label: true },
  { name: "Connect & Celebrate", color: "hsl(0, 55%, 54%)",   gridCol: "5 / 6", gridRow: "1 / 3", label: true },
  // Row 2 (Feeling good)
  { name: "Unwinding",           color: "hsl(210, 55%, 62%)", gridCol: "1 / 2", gridRow: "2",    label: true },
  { name: "Sharing a meal",      color: "hsl(45, 72%, 72%)",  gridCol: "2 / 4", gridRow: "2",    label: true },
  { name: "Genuine Connections", color: "hsl(30, 65%, 58%)",  gridCol: "4 / 5", gridRow: "2",    label: true },
];

function DemandSpacesGraph({ channel }: { channel: Channel }) {
  const [showCompetitors, setShowCompetitors] = useState(false);
  const BRAND_POINTS = BRAND_POINTS_BY_CHANNEL[channel];
  const COMPETITOR_POINTS = COMPETITOR_POINTS_BY_CHANNEL[channel];

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total market size:</span>
          <span className="text-[11px] font-bold text-foreground">{MARKET_SIZE_BY_CHANNEL[channel]}</span>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showCompetitors}
            onChange={(e) => setShowCompetitors(e.target.checked)}
            className="w-3.5 h-3.5 accent-primary cursor-pointer"
          />
          <span className="text-[10px] font-semibold text-muted-foreground">Include competitors</span>
        </label>
      </div>

      {/* Graph wrapper: Y-axis labels + grid */}
      <div className="flex gap-0 items-stretch">

        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-2 shrink-0" style={{ width: 44 }}>
          <span className="text-[9px] font-bold text-foreground leading-tight text-right">Looking<br />good</span>
          <span className="text-[9px] font-bold text-foreground leading-tight text-right">Feeling<br />good</span>
        </div>

        {/* Main grid area */}
        <div className="flex-1 flex flex-col gap-0">

          {/* Energy level header */}
          <div className="relative mb-1" style={{ height: 32 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-bold text-foreground">Energy level</span>
            </div>
            {/* Energy column label arrows */}
            <div
              className="absolute inset-0"
              style={{
                display: "grid",
                gridTemplateColumns: "33fr 17fr 8fr 18fr 24fr",
              }}
            >
              {/* col 1-2: Relaxing */}
              <div className="col-span-2 flex items-end justify-center pb-0">
                <span className="text-[10px] font-bold" style={{ color: "hsl(88, 45%, 35%)" }}>Relaxing</span>
              </div>
              {/* col 3-4: Bonding */}
              <div className="col-span-2 flex items-end justify-center pb-0">
                <span className="text-[10px] font-bold" style={{ color: "hsl(88, 45%, 35%)" }}>Bonding</span>
              </div>
              {/* col 5: Socializing */}
              <div className="col-span-1 flex items-end justify-center pb-0">
                <span className="text-[10px] font-bold text-center leading-tight" style={{ color: "hsl(88, 45%, 35%)" }}>Socializing /<br />Partying</span>
              </div>
            </div>
          </div>

          {/* The mosaic grid — relative so we can overlay brand dots */}
          <div
            className="relative rounded-lg overflow-hidden"
            style={{
              display: "grid",
              gridTemplateColumns: "33fr 17fr 8fr 18fr 24fr",
              gridTemplateRows: "1fr 1fr",
              gap: 4,
              minHeight: 320,
            }}
          >
            {GRID_SPACES.map((space) => (
              <div
                key={space.name}
                className="rounded-md flex items-center justify-center"
                style={{
                  gridColumn: space.gridCol,
                  gridRow: space.gridRow,
                  backgroundColor: space.color,
                  minHeight: 130,
                }}
              >
                {space.label && (
                  <span className="text-[10px] font-bold text-white drop-shadow px-1 text-center leading-tight">
                    {space.name}
                  </span>
                )}
              </div>
            ))}

            {/* Brand dots overlay — coordinates relative to the grid area */}
            {/* x=0-100 → left=0%-100%, y=0-100 (0=bottom/feeling good, 100=top/looking good) → top=(100-y)% */}
            {BRAND_POINTS.map((brand) => (
              <div
                key={brand.name}
                className="absolute flex items-center gap-1.5 pointer-events-none"
                style={{
                  left: `calc(${brand.x}% - 6px)`,
                  top: `calc(${100 - brand.y}% - 6px)`,
                }}
              >
                {/* Dot with ring */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    background: "hsl(var(--foreground))",
                    boxShadow: "0 0 0 2px white, 0 2px 6px rgba(0,0,0,0.5)",
                  }}
                />
                {/* Pill label */}
                <span
                  className="text-[11px] font-extrabold whitespace-nowrap px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "white",
                    color: "hsl(var(--foreground))",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.35)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {brand.name}
                </span>
              </div>
            ))}

            {/* Competitor dots overlay */}
            {showCompetitors && COMPETITOR_POINTS.map((brand) => (
              <div
                key={brand.name}
                className="absolute flex items-center gap-1.5 pointer-events-none"
                style={{
                  left: `calc(${brand.x}% - 6px)`,
                  top: `calc(${100 - brand.y}% - 6px)`,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full bg-white shrink-0"
                  style={{
                    outline: "2px dashed hsl(var(--foreground))",
                    boxShadow: "0 0 0 1px white, 0 2px 6px rgba(0,0,0,0.4)",
                  }}
                />
                <span
                  className="text-[11px] font-bold italic whitespace-nowrap px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    color: "hsl(var(--foreground))",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.3)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Where To Play Insights ─────────────────────────────────────────────────

const WHERE_TO_PLAY_INSIGHTS = [
  {
    insight: "Connect & Celebrate is the fastest-growing demand space (+22% YoY) but Heineken holds only 38% share vs. 61% in adjacent segments — significant white space opportunity.",
    action: "Develop a targeted Connect & Celebrate portfolio strategy – go to Innovation Dashboard",
    steps: [
      { step: "Map current SKU coverage across Connect & Celebrate occasions", explanation: "Understanding which of our brands and pack formats currently address this space reveals coverage gaps and duplication.", dataLink: "/innovation", dataLabel: "Innovation Dashboard" },
      { step: "Identify top 3 under-indexed consumption occasions within the space", explanation: "Occasion-level indexing pinpoints where competitor and private-label brands are filling gaps Heineken could own.", dataLink: "/innovation", dataLabel: "Occasion Analysis" },
      { step: "Commission consumer research on unmet needs in this space", explanation: "Qualitative and quantitative research grounds the innovation brief in genuine consumer insight rather than assumption.", dataLink: "/innovation", dataLabel: "Research Briefs" },
      { step: "Define portfolio role for Heineken Silver and Desperados in C&C", explanation: "Clarifying each brand's role prevents internal cannibalization and ensures coherent positioning for the retailer.", dataLink: "/innovation", dataLabel: "Portfolio Map" },
      { step: "Submit portfolio expansion brief to innovation pipeline", explanation: "A formal brief triggers the stage-gate process and secures cross-functional alignment and resourcing.", dataLink: "/innovation", dataLabel: "Innovation Pipeline" },
    ],
  },
  {
    insight: "Lager – Regional Entry accounts for 50% of category volume with declining value CAGR (-12%). Heineken's 57% share in this space is at risk as Brahma aggressively discounts in key Southern accounts.",
    action: "Review pricing defence strategy in Lager Regional Entry – go to Pricing tool",
    steps: [
      { step: "Open Pricing tool and filter to Lager Regional Entry segment", explanation: "Isolating the segment removes noise from premium tiers and focuses attention where the volume threat is greatest.", dataLink: "/pricing", dataLabel: "Pricing Tool" },
      { step: "Benchmark Brahma's promotional price points across Southern accounts", explanation: "Knowing competitor price gaps helps calibrate a proportionate defence without triggering a race to the bottom.", dataLink: "/pricing", dataLabel: "Competitive Pricing" },
      { step: "Model impact of targeted price lock on top 10 volume accounts", explanation: "A selective lock (rather than blanket reduction) protects share where it matters while preserving margin elsewhere.", dataLink: "/pricing", dataLabel: "Account Modeller" },
      { step: "Assess viability of loyalty-linked volume incentives for key retailers", explanation: "Non-price levers such as back-margin rebates reduce consumer-facing price pressure while maintaining retail commitment.", dataLink: "/pricing", dataLabel: "Trade Terms" },
      { step: "Present defence scenario to Revenue Management team for approval", explanation: "Internal alignment ensures the response is coordinated across commercial, finance, and supply chain functions.", dataLink: "/pricing", dataLabel: "RM Dashboard" },
    ],
  },
];

function WhereToPlayInsights() {
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-bold text-xs text-foreground uppercase tracking-wide">Insights & Recommended Actions</h3>
      <div className="border-2 border-[hsl(var(--status-orange))] bg-status-orange-bg rounded-xl shadow-[0_0_12px_hsl(var(--status-orange)/0.15)] overflow-hidden divide-y divide-[hsl(var(--status-orange))]/20">
        {WHERE_TO_PLAY_INSIGHTS.map((item, idx) => {
          const isExpanded = expandedAction === item.action;
          return (
            <div key={idx}>
              <button
                onClick={() => setExpandedAction(isExpanded ? null : item.action)}
                className="w-full text-left p-3 transition-all space-y-2 hover:bg-[hsl(var(--status-orange))]/10"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={13} className="text-[hsl(var(--status-orange))] mt-0.5 shrink-0" />
                  <p className="text-foreground leading-snug text-[11px]">{item.insight}</p>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <CheckSquare size={12} className={`shrink-0 ${isExpanded ? "text-[hsl(var(--status-orange))]" : "text-muted-foreground"}`} />
                  <span className="flex-1 leading-snug font-semibold">
                    {item.action.replace(/\s*–\s*go to\s+.+$/i, "")}
                  </span>
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
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2">
                      {item.steps.map((s, si) => (
                        <div key={si} className="bg-background/60 rounded-lg p-2.5 border border-[hsl(var(--status-orange))]/20">
                          <div className="flex items-start gap-2 mb-1">
                            <span className="text-[9px] font-bold text-[hsl(var(--status-orange))] bg-[hsl(var(--status-orange))]/10 rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
                              {si + 1}
                            </span>
                            <p className="text-[11px] font-semibold text-foreground leading-snug">{s.step}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed ml-6">{s.explanation}</p>
                        </div>
                      ))}
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
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function WhereToPlayPage() {
  const [activeTab, setActiveTab] = useState<"demand" | "repertoires">("demand");
  const [channel, setChannel] = useState<Channel>("total");

  const PERF_DATA = PERF_DATA_BY_CHANNEL[channel];

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="p-4 flex flex-col gap-3">

        {/* Download button */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
            Strategic documents available:
          </span>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            download="strategic-plan-2025.pdf"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-[hsl(140,60%,25%)] text-white hover:bg-[hsl(140,60%,20%)] transition-all shadow-sm"
          >
            <Download size={10} className="shrink-0" />
            Latest Strategic Plan
          </a>
        </div>

        {/* Insights & Recommended Actions */}
        <WhereToPlayInsights />

        {/* Channel filter + Tab navigation */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tab pills (matching 5Cs style) */}
          <div className="flex gap-1">
            {[
              { key: "demand" as const,      label: "Demand Spaces" },
              { key: "repertoires" as const, label: "Repertoires" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-2 px-4 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all ${
                  activeTab === t.key
                    ? "bg-primary text-primary-foreground shadow"
                    : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Channel filter */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Channel:</span>
            <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
              <SelectTrigger className="h-7 text-[10px] font-semibold w-[130px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {CHANNEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-[11px]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Demand Spaces Tab ── */}
        {activeTab === "demand" && (
          <div className="flex flex-col gap-3">
            <DemandSpacesGraph channel={channel} />
          </div>
        )}

        {/* ── Repertoires Tab ── */}
        {activeTab === "repertoires" && (
          <div className="flex flex-col gap-3">
            {/* Repertoire Performance Summary */}
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs font-bold text-foreground">Repertoire Performance Summary</p>
                <p className="text-[10px] text-muted-foreground">Category market by repertoire (2024)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Repertoire</th>
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Share %</th>
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Vol (MHL)</th>
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Val CAGR</th>
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Vol CAGR</th>
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Avg Price</th>
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground">HNK Share</th>
                      <th className="text-right px-4 py-2 font-semibold text-muted-foreground">HNK Evol.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERF_DATA.map((row, i) => {
                      const valUp = row.valCagr.startsWith("+");
                      const volUp = row.volCagr.startsWith("+");
                      const evolUp = row.hnkEvol.startsWith("+");
                      return (
                        <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-foreground">{row.name}</td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">{row.share}</td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">{row.vol}</td>
                          <td className={`px-3 py-2.5 text-right font-semibold ${valUp ? "text-[hsl(140,60%,40%)]" : "text-destructive"}`}>{row.valCagr}</td>
                          <td className={`px-3 py-2.5 text-right font-semibold ${volUp ? "text-[hsl(140,60%,40%)]" : "text-destructive"}`}>{row.volCagr}</td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">{row.avgPrice}</td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">{row.hnkShare}</td>
                          <td className={`px-4 py-2.5 text-right font-semibold ${evolUp ? "text-[hsl(140,60%,40%)]" : "text-destructive"}`}>{row.hnkEvol}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Repertoire Overlap Matrix */}
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs font-bold text-foreground">Repertoire Overlap Matrix</p>
                <p className="text-[10px] text-muted-foreground">Relative overlap index between segments (higher = more overlap)</p>
              </div>
              <div className="overflow-x-auto px-4 pb-4">
                <RepertoireOverlapMatrix />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
