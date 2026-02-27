"use client";

import TradingViewWidget from "@/components/TradingViewWidget";
import TradingViewBoundary from "@/components/TradingViewBoundary";
import { normalizeSymbol } from "@/lib/symbolMapper";
import { useMemo } from "react";

interface StockAnalysisPanelProps {
  symbol: string;
}

const SCRIPT_URL =
  "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";

const StockAnalysisPanel = ({ symbol }: StockAnalysisPanelProps) => {
  const normalized = useMemo(() => normalizeSymbol(symbol), [symbol]);
  const tradingViewSymbol = normalized.tradingViewSymbol;
  const labelSymbol = normalized.apiSymbol;

  const config = useMemo(
    () => ({
      interval: "1h",
      width: "100%",
      isTransparent: true,
      height: 420,
      symbol: tradingViewSymbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale: "en",
      colorTheme: "dark",
    }),
    [tradingViewSymbol],
  );

  return (
    <section className="rounded-lg border border-gray-600 bg-gray-800 p-4 md:p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-100">
        Technical Analysis for {labelSymbol}
      </h2>

      <TradingViewBoundary>
        <TradingViewWidget
          scriptUrl={SCRIPT_URL}
          config={config}
          className="custom-chart"
          height={420}
        />
      </TradingViewBoundary>
    </section>
  );
};

export default StockAnalysisPanel;
