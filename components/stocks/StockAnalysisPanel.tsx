"use client";

import TradingViewWidget from "@/components/TradingViewWidget";
import { useMemo } from "react";

interface StockAnalysisPanelProps {
  symbol: string;
}

const SCRIPT_URL =
  "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";

const StockAnalysisPanel = ({ symbol }: StockAnalysisPanelProps) => {
  const config = useMemo(
    () => ({
      interval: "1h",
      width: "100%",
      isTransparent: true,
      height: 420,
      symbol: symbol.toUpperCase(),
      showIntervalTabs: true,
      displayMode: "single",
      locale: "en",
      colorTheme: "dark",
    }),
    [symbol],
  );

  return (
    <section className="rounded-lg border border-gray-600 bg-gray-800 p-4 md:p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-100">
        Technical Analysis for {symbol.toUpperCase()}
      </h2>

      <TradingViewWidget
        scriptUrl={SCRIPT_URL}
        config={config}
        className="custom-chart"
        height={420}
      />
    </section>
  );
};

export default StockAnalysisPanel;
