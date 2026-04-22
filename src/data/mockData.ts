export const mockData = {
  scenarios: {
    state_1_shared_reality: {
      top_kpis: {
        market_share: { label: "Market Share", value: "30%", trend: "+0.4pp", status: "positive" as const },
        brand_power: { label: "Brand Power", value: "53.1", trend: "-2.0 pts vs PY", status: "negative" as const },
        sales_power: { label: "Sales Power", value: "62.3", trend: "-1.8 pts vs PY", status: "negative" as const },
        margin: { label: "Margin", value: "40%", trend: "+0.3pp", status: "positive" as const },
      },
      freddy_performance: {
        main_metric: "53.1%",
        main_label: "Brand Power",
        recommended_actions: [
          "Investigate Salience drop for Amstel in Key Accounts – go to Trade dashboard",
          "Review Meaningful drivers for Heineken 0.0 – go to Consumer Insights tool",
          "Adjust media spend to counter competitor momentum – go to Media dashboard",
        ],
        data_table: [
          {
            metric: "Brand Power",
            heineken: { l12w: "11.3", dya: "+0.6pp", trend: "up" as const },
            amstel: { l12w: "5.6", dya: "-1.0pp", trend: "down" as const },
            schin: { l12w: "2.0", dya: "+0.1pp", trend: "up" as const },
          },
          {
            metric: "Salient",
            heineken: { l12w: "155.1", dya: "+11.8pp", trend: "up" as const },
            amstel: { l12w: "86.1", dya: "-14.6pp", trend: "down" as const },
            schin: { l12w: "84.1", dya: "-3.2pp", trend: "down" as const },
          },
          {
            metric: "Meaningful",
            heineken: { l12w: "184.8", dya: "+2.4pp", trend: "up" as const },
            amstel: { l12w: "139.9", dya: "+2.8pp", trend: "up" as const },
            schin: { l12w: "62.4", dya: "+2.7pp", trend: "up" as const },
          },
          {
            metric: "Different",
            heineken: { l12w: "169.5", dya: "-4.3pp", trend: "down" as const },
            amstel: { l12w: "114.2", dya: "+2.8pp", trend: "up" as const },
            schin: { l12w: "68.8", dya: "+0.5pp", trend: "up" as const },
          },
        ],
      },
      chat_simulation: {
        user_prompt: "Which Heineken brands drove Brand Power growth in the OpCo?",
        ai_response:
          'In the latest quarter, **Birra Moretti** was the primary driver of Brand Power growth, contributing +1.8 points, largely driven by a spike in Salience from the recent summer campaign. **Heineken 0.0** followed closely (+1.1 pts) with strong gains in the "Meaningful" metric among the 25-34 demographic.',
      },
    },

    state_2_how_to_win: {
      must_win_battles: [
        { id: 1, name: "Create unique brand positioning", status: "green" as const },
        { id: 2, name: "Establish iconic brand identity", status: "green" as const },
        { id: 3, name: "Offer great taste & quality drinks", status: "green" as const },
        { id: 4, name: "Develop breakthrough communication", status: "green" as const },
        { id: 5, name: "Innovate to drive penetration", status: "orange" as const, flag: "Cannibalization Detected" },
        { id: 6, name: "Ensure right pack & price", status: "green" as const },
        { id: 7, name: "Optimize activations & promotions", status: "green" as const },
        { id: 8, name: "Maximize availability of focus SKU's", status: "green" as const },
        { id: 9, name: "Amplify visibility & experience", status: "green" as const },
      ],
      freddy_performance: {
        main_metric_1: "+4.2%",
        main_label_1: "Penetration",
        main_metric_2: "+18.5%",
        main_label_2: "Volume growth",
        insight_text: "Innovation Silver from Heineken impacts Original core volume. This yields high cannibalization in HUK.",
        recommended_actions: [
          "Launch smaller pack size for the new SKU, adjusting price points to maintain core SKU volume – go to Pricing tool",
          "Bundle offers to balance sales – go to Promotions dashboard",
        ],
        data_table: [
          {
            metric: "Volume Growth",
            new_sku: { name: "Heineken Silver", l12w: "+18.5%", trend: "up" as const },
            core_sku: { name: "Heineken Original", l12w: "-6.1%", trend: "down" as const },
          },
          {
            metric: "Penetration",
            new_sku: { name: "Heineken Silver", l12w: "+4.2%", trend: "up" as const },
            core_sku: { name: "Heineken Original", l12w: "-1.5%", trend: "down" as const },
          },
        ],
      },
    },

    state_3_excellent_execution: {
      must_win_battles: [
        { id: 1, name: "Create unique brand positioning", status: "green" as const },
        { id: 2, name: "Establish iconic brand identity", status: "green" as const },
        { id: 3, name: "Offer great taste & quality drinks", status: "green" as const },
        { id: 4, name: "Develop breakthrough communication", status: "orange" as const, flag: "Budget Optimization Required" },
        { id: 5, name: "Innovate to drive penetration", status: "green" as const },
        { id: 6, name: "Ensure right pack & price", status: "green" as const },
        { id: 7, name: "Optimize activations & promotions", status: "orange" as const, flag: "ROI Below Threshold" },
        { id: 8, name: "Maximize availability of focus SKU's", status: "green" as const },
        { id: 9, name: "Amplify visibility & experience", status: "orange" as const, flag: "Amstel OOH Visibility Gap" },
      ],
      freddy_performance: {
        main_metric: "€2.45",
        main_label: "ROI (ATL Campaign)",
        recommended_actions: [
          "AllocationAI recommends shifting budget from Promotions to UCL Sponsorship to maximize overall ROI. – go to AllocationAI tool",
          "Pause underperforming Desperados digital activation – go to Media tool",
        ],
        data_table: [
          {
            metric: "UCL Sponsorship (ATL)",
            spend: "€4.2M",
            roi: "€2.45",
            roi_status: "Exceeding" as const,
            volume_lift: "+8.4%",
            volume_trend: "up" as const,
          },
          {
            metric: "Desperados Promo (BTL)",
            spend: "€1.8M",
            roi: "€0.85",
            roi_status: "Below Threshold" as const,
            volume_lift: "+1.2%",
            volume_trend: "down" as const,
          },
        ],
      },
    },
  },
};

export type AppState = "home" | "shared_reality" | "where_to_play" | "how_to_win" | "excellent_execution" | "capability_building" | "executive_performance";
export type BattleStatus = "green" | "orange" | "red";
export type KPIStatus = "positive" | "negative" | "neutral" | "warning";
export type TrendDirection = "up" | "down" | "flat";
