import { Diamond, TrendingUp, Users, DollarSign, Target, BarChart3 } from "lucide-react";

const tags = ["Machine Learning", "Budget Optimization", "Predictive Analytics", "Multi-Channel", "ROI Maximization", "Real-time Insights"];

const features = [
  { icon: Diamond, label: "Smart Allocation", desc: "AI-driven optimization" },
  { icon: TrendingUp, label: "Performance Prediction", desc: "Future outcome modeling" },
  { icon: Users, label: "Audience Targeting", desc: "Demographic optimization" },
  { icon: DollarSign, label: "Cost Efficiency", desc: "Maximum ROI targeting" },
];

const quickMetrics = [
  { label: "Active Models", value: "12" },
  { label: "Markets Optimized", value: "18" },
  { label: "Budget Managed", value: "€45M" },
  { label: "Efficiency Gain", value: "+23%" },
];

const stakeholders = [
  { name: "Dr. Elena Rodriguez", role: "AI & Analytics Director", phone: "+31 20 523 9156", email: "elena.rodriguez@heineken.com" },
  { name: "James Chen", role: "Budget Optimization Lead", phone: "+31 20 523 9203", email: "james.chen@heineken.com" },
];

interface AllocationAIInfoPageProps {
  onAccessPlatform: () => void;
}

export default function AllocationAIInfoPage({ onAccessPlatform }: AllocationAIInfoPageProps) {
  return (
    <div className="flex-1 overflow-auto bg-background p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-3 gap-5">
        {/* Main info card - spans 2 cols */}
        <div className="col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[hsl(25,80%,55%)] flex items-center justify-center">
              <BarChart3 size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-foreground">AllocationAI</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Advanced machine learning platform for optimizing media spend allocation across channels, markets, and campaigns.
          </p>

          <h3 className="text-sm font-bold text-foreground mb-2">Platform Overview</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            The Allocation AI platform leverages advanced machine learning algorithms to optimize media budget distribution across digital and traditional channels. Analyze historical performance, predict future outcomes, and automatically recommend optimal budget allocations to maximize ROI and achieve campaign objectives across all HEINEKEN markets and brands.
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {tags.map((tag) => (
              <span key={tag} className="text-[11px] font-medium text-[hsl(var(--status-green))] border border-[hsl(var(--status-green))]/30 bg-[hsl(var(--status-green))]/5 rounded-full px-3 py-1">
                {tag}
              </span>
            ))}
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--status-green))]/10 flex items-center justify-center shrink-0">
                  <f.icon size={15} className="text-[hsl(var(--status-green))]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{f.label}</p>
                  <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-1 flex flex-col gap-5">
          {/* Access card */}
          <div className="bg-card border-2 border-[hsl(var(--status-green))]/30 rounded-2xl p-5 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-[hsl(25,80%,55%)]/10 flex items-center justify-center mb-3">
              <BarChart3 size={24} className="text-[hsl(25,80%,55%)]" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">Allocation AI</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Smart Budget Optimization</p>
            <button
              onClick={onAccessPlatform}
              className="bg-[hsl(var(--status-green))] text-white text-xs font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Access Platform
            </button>
          </div>

          {/* Quick metrics */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Quick metrics</h3>
            <div className="space-y-2.5">
              {quickMetrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  <span className={`text-sm font-bold ${m.value.startsWith("+") ? "text-[hsl(var(--status-green))]" : "text-foreground"}`}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stakeholders - full width */}
        <div className="col-span-3 bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-1">Key Stakeholders</h3>
          <p className="text-xs text-muted-foreground mb-4">Primary contacts for AI allocation platform and budget optimization.</p>
          <div className="grid grid-cols-2 gap-4">
            {stakeholders.map((s) => (
              <div key={s.name} className="border border-border rounded-xl p-4">
                <p className="text-sm font-bold text-foreground">{s.name}</p>
                <p className="text-[11px] text-muted-foreground mb-2">{s.role}</p>
                <div className="space-y-1">
                  <p className="text-[11px] text-[hsl(var(--status-green))] flex items-center gap-1.5">📞 {s.phone}</p>
                  <p className="text-[11px] text-[hsl(var(--status-green))] flex items-center gap-1.5">✉️ {s.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
