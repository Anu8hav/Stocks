"use client";

import TradingViewWidget from "@/components/TradingViewWidget";
import TradingViewBoundary from "@/components/TradingViewBoundary";
import { normalizeSymbol } from "@/lib/symbolMapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";

interface WatchlistAnalysisPanelProps {
  symbols: string[];
}

const SCRIPT_URL =
  "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";

const WatchlistAnalysisPanel = ({ symbols }: WatchlistAnalysisPanelProps) => {
  const uniqueSymbols = useMemo(() => {
    return Array.from(
      new Set(symbols.map((symbol) => normalizeSymbol(symbol).apiSymbol)),
    );
  }, [symbols]);

  const [selectedSymbol, setSelectedSymbol] = useState(
    uniqueSymbols[0] || "AAPL",
  );

  useEffect(() => {
    if (uniqueSymbols.length === 0) {
      setSelectedSymbol("AAPL");
      return;
    }

    if (!uniqueSymbols.includes(selectedSymbol)) {
      setSelectedSymbol(uniqueSymbols[0]);
    }
  }, [uniqueSymbols, selectedSymbol]);

  const normalized = useMemo(() => normalizeSymbol(selectedSymbol), [selectedSymbol]);

  const config = useMemo(
    () => ({
      interval: "1h",
      width: "100%",
      isTransparent: true,
      height: 420,
      symbol: normalized.tradingViewSymbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale: "en",
      colorTheme: "dark",
    }),
    [normalized.tradingViewSymbol],
  );

  return (
    <section className="rounded-lg border border-gray-600 bg-gray-800 p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-100">
          Technical Analysis
        </h2>

        <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
          <SelectTrigger className="w-full border-gray-600 bg-gray-700 text-gray-100 sm:w-44">
            <SelectValue placeholder="Select stock" />
          </SelectTrigger>
          <SelectContent>
            {uniqueSymbols.map((symbol) => (
              <SelectItem key={symbol} value={symbol}>
                {symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

export default WatchlistAnalysisPanel;
