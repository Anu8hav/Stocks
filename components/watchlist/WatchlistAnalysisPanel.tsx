"use client";

import TradingViewWidget from "@/components/TradingViewWidget";
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
  const uniqueSymbols = useMemo(
    () => Array.from(new Set(symbols.map((symbol) => symbol.toUpperCase()))),
    [symbols],
  );

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

  const config = useMemo(
    () => ({
      interval: "1h",
      width: "100%",
      isTransparent: true,
      height: 420,
      symbol: selectedSymbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale: "en",
      colorTheme: "dark",
    }),
    [selectedSymbol],
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

      <TradingViewWidget
        scriptUrl={SCRIPT_URL}
        config={config}
        className="custom-chart"
        height={420}
      />
    </section>
  );
};

export default WatchlistAnalysisPanel;
