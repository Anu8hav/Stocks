"use client";

import TradingViewWidget from "@/components/TradingViewWidget";
import { useMemo, useState } from "react";

type Timeframe = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";
type ChartType = "candlestick" | "line" | "area";

interface StockChartPanelProps {
  symbol: string;
}

const SCRIPT_URL =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

const intervalByTimeframe: Record<Timeframe, string> = {
  "1D": "5",
  "1W": "30",
  "1M": "60",
  "3M": "D",
  "1Y": "W",
  "5Y": "M",
};

const rangeByTimeframe: Record<Timeframe, string> = {
  "1D": "1D",
  "1W": "5D",
  "1M": "1M",
  "3M": "3M",
  "1Y": "12M",
  "5Y": "60M",
};

const styleByChartType: Record<ChartType, number> = {
  candlestick: 1,
  line: 3,
  area: 2,
};

const indicatorMap = {
  rsi: "RSI@tv-basicstudies",
  macd: "MACD@tv-basicstudies",
  sma: "MASimple@tv-basicstudies",
};

const StockChartPanel = ({ symbol }: StockChartPanelProps) => {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [selectedIndicators, setSelectedIndicators] = useState<
    Array<keyof typeof indicatorMap>
  >([]);

  const config = useMemo(() => {
    const studies = [
      "Volume@tv-basicstudies",
      ...selectedIndicators.map((key) => indicatorMap[key]),
    ];

    return {
      allow_symbol_change: false,
      calendar: false,
      details: true,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      interval: intervalByTimeframe[timeframe],
      range: rangeByTimeframe[timeframe],
      locale: "en",
      save_image: false,
      style: styleByChartType[chartType],
      symbol: symbol.toUpperCase(),
      theme: "dark",
      timezone: "Etc/UTC",
      backgroundColor: "#141414",
      gridColor: "#141414",
      watchlist: [],
      withdateranges: true,
      compareSymbols: [],
      studies,
      width: "100%",
      height: 540,
    };
  }, [chartType, selectedIndicators, symbol, timeframe]);

  const toggleIndicator = (indicator: keyof typeof indicatorMap) => {
    setSelectedIndicators((current) =>
      current.includes(indicator)
        ? current.filter((item) => item !== indicator)
        : [...current, indicator],
    );
  };

  return (
    <section className="rounded-lg border border-gray-600 bg-gray-800 p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["1D", "1W", "1M", "3M", "1Y", "5Y"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                timeframe === tf
                  ? "bg-red-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-400" htmlFor="chart-type">
            Chart
          </label>
          <select
            id="chart-type"
            value={chartType}
            onChange={(event) => setChartType(event.target.value as ChartType)}
            className="rounded-md border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-200"
          >
            <option value="candlestick">Candlestick</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-400">Indicators</span>
        {(
          [
            { key: "rsi", label: "RSI" },
            { key: "macd", label: "MACD" },
            { key: "sma", label: "SMA" },
          ] as Array<{ key: keyof typeof indicatorMap; label: string }>
        ).map((indicator) => {
          const active = selectedIndicators.includes(indicator.key);
          return (
            <button
              key={indicator.key}
              type="button"
              onClick={() => toggleIndicator(indicator.key)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                active
                  ? "bg-red-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {indicator.label}
            </button>
          );
        })}
      </div>

      <TradingViewWidget
        title={`${symbol.toUpperCase()} Chart`}
        scriptUrl={SCRIPT_URL}
        config={config}
        className="custom-chart"
        height={540}
      />
    </section>
  );
};

export default StockChartPanel;
