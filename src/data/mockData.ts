// Scoped demo (Phase 1): only metrics marked Y in the Metric Inventory scope file
// are referenced in this mock data. Domains: Sell-out and Brand Power (DFC / CPM, BGS).
// Removed: Sales Power, ROI / commercial-spend mocks, Penetration / innovation /
// cannibalization narratives, MWBs 4–9, and the Excellent-Execution scenario.

export const mockData = {
  scenarios: {
    state_1_shared_reality: {
      // Only Y-marked metrics from Home → Total Market:
      // Vol. Market Share, Value Market Share, Volume Growth, Brand Power Index.
      top_kpis: {
        vol_market_share: { label: "Vol. Market Share", value: "31.2%", trend: "-2.5pp vs PY", status: "negative" as const },
        value_market_share: { label: "Value Market Share", value: "29.0%", trend: "-3.1pp vs PY", status: "negative" as const },
        brand_power: { label: "Brand Power", value: "6.5%", trend: "+0.3pp vs PY", status: "positive" as const },
        volume_growth: { label: "Volume Growth", value: "-2.1%", trend: "-2,345 khl vs PY", status: "negative" as const },
      },
      freddy_performance: {
        main_metric: "6.5%",
        main_label: "Brand Power",
        // All four actions reference Y-marked metrics only.
        recommended_actions: [
          "Investigate Amstel Salience drop (-14.6pp) in the Shared Reality brand power view",
          "Review Heineken Meaningful drivers in Consumer Insights — Different is already +5 pts",
          "Lean into Off-Trade Vol. Share where the category is in growth for Heineken",
        ],
        data_table: [
          {
            metric: "Brand Power",
            heineken: { l12w: "6.5", dya: "+0.3pp", trend: "up" as const },
            amstel: { l12w: "3.8", dya: "+0.2pp", trend: "up" as const },
            schin: { l12w: "1.4", dya: "+0.1pp", trend: "up" as const },
          },
          {
            metric: "Salient",
            heineken: { l12w: "110", dya: "-2.0", trend: "down" as const },
            amstel: { l12w: "59", dya: "+4.0", trend: "up" as const },
            schin: { l12w: "58", dya: "-2.0", trend: "down" as const },
          },
          {
            metric: "Meaningful",
            heineken: { l12w: "120", dya: "+3.0", trend: "up" as const },
            amstel: { l12w: "96", dya: "+2.0", trend: "up" as const },
            schin: { l12w: "43", dya: "+2.0", trend: "up" as const },
          },
          {
            metric: "Different",
            heineken: { l12w: "135", dya: "+5.0", trend: "up" as const },
            amstel: { l12w: "79", dya: "+3.0", trend: "up" as const },
            schin: { l12w: "47", dya: "+1.0", trend: "up" as const },
          },
        ],
      },
      chat_simulation: {
        user_prompt: "Which Heineken brands drove Brand Power growth in the OpCo?",
        ai_response:
          'Brand Power is up +0.3pp vs PY to 6.5% at OpCo level. The uplift is concentrated in **Heineken®**, where *Different* gained +5 pts and *Meaningful* +3 pts. **Amstel®** is improving across Meaningful (+2 pts) and Different (+3 pts), but its *Salient* is still down -14.6pp vs PY — the equity gains have not yet converted into recall.',
      },
    },

    state_2_how_to_win: {
      // Scoped to BGS MWBs 1–3 (Design to Win) — the three Y-marked battles.
      // Execute-to-Win battles (4–9) are out of scope for Phase 1.
      must_win_battles: [
        { id: 1, name: "Create unique brand positioning", status: "green" as const },
        { id: 2, name: "Establish iconic brand identity", status: "orange" as const, flag: "Salience Gap" },
        { id: 3, name: "Offer great taste & quality drinks", status: "green" as const },
      ],
      freddy_performance: {
        main_metric_1: "+0.3pp",
        main_label_1: "Brand Power",
        main_metric_2: "-14.6pp",
        main_label_2: "Amstel Salient",
        insight_text:
          "Overall Brand Power is improving (+0.3pp vs PY) but MWB 2 (Iconic Brand Identity) is flagged: Amstel Salient is down -14.6pp vs PY while Meaningful (+2.8pp) and Different (+2.8pp) continue to build.",
        recommended_actions: [
          "Prioritise Salience-driving activity for Amstel to convert Meaningful and Different gains into recall",
          "Sustain Heineken Different momentum (+5 pts vs PY) — the strongest Design-to-Win signal in the portfolio",
        ],
        data_table: [
          {
            metric: "Brand Power",
            new_sku: { name: "Heineken®", l12w: "6.5%", trend: "up" as const },
            core_sku: { name: "Amstel®", l12w: "3.8%", trend: "up" as const },
          },
          {
            metric: "Salient (MWB 2 signal)",
            new_sku: { name: "Heineken®", l12w: "110 (-2)", trend: "down" as const },
            core_sku: { name: "Amstel®", l12w: "59 (+4)", trend: "up" as const },
          },
        ],
      },
    },

    state_3_excellent_execution: {
      // Execution lens on the same Y-scoped MWBs (1–3). Status colour-coded by tactical
      // execution health (brand asset usage, identity consistency, taste delivery).
      must_win_battles: [
        { id: 1, name: "Create unique brand positioning", status: "green" as const },
        { id: 2, name: "Establish iconic brand identity", status: "orange" as const, flag: "Identity Gap" },
        { id: 3, name: "Offer great taste & quality drinks", status: "green" as const },
      ],
      freddy_performance: {
        main_metric: "+2.8pp",
        main_label: "Execution Quality Δ vs PY",
        insight_text:
          "MWB 1 & 3 execution on track. MWB 2 tactical flag: on-trade visual asset usage at 71% in interior markets — identity roll-out not matching brand-building momentum.",
        recommended_actions: [
          "Enforce on-trade visual-asset compliance in Nordeste & Central-West to close the MWB 2 execution gap",
          "Codify the Heineken® taste & quality cues driving MWB 3 Meaningful gains into an Amstel® playbook",
        ],
      },
    },
  },
};

export type AppState = "home" | "shared_reality" | "where_to_play" | "how_to_win" | "excellent_execution" | "capability_building" | "executive_performance";
export type BattleStatus = "green" | "orange" | "red";
export type KPIStatus = "positive" | "negative" | "neutral" | "warning";
export type TrendDirection = "up" | "down" | "flat";
