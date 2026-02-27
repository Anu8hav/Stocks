"use client";
import { useEffect, useRef } from "react";
import {
  FALLBACK_TRADINGVIEW_SYMBOL,
  SYMBOL_FALLBACK_MESSAGE,
  TradingViewWidgetConfig,
  normalizeSymbol,
} from "@/lib/symbolMapper";

const useTradingViewWidget = (
  scriptUrl: string,
  config: TradingViewWidgetConfig,
  height = 600,
) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    if (containerRef.current.dataset.loaded) return;

    const shouldNormalize = typeof config.symbol === "string" && config.symbol.length > 0;
    const normalized = shouldNormalize
      ? normalizeSymbol(config.symbol, {
          fallbackTradingViewSymbol: FALLBACK_TRADINGVIEW_SYMBOL,
        })
      : null;

    if (normalized?.usedFallback) {
      console.warn(SYMBOL_FALLBACK_MESSAGE, {
        input: config.symbol,
        resolved: normalized.tradingViewSymbol,
        reason: normalized.reason,
      });
    }

    const widgetConfig = shouldNormalize && normalized
      ? { ...config, symbol: normalized.tradingViewSymbol }
      : config;

    containerRef.current.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px;"></div>`;

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.innerHTML = JSON.stringify(widgetConfig);
    script.onerror = (error) => {
      console.error("TradingView widget script failed to load", {
        scriptUrl,
        symbol: widgetConfig.symbol,
        error,
      });
    };
    containerRef.current.appendChild(script);
    containerRef.current.dataset.loaded = "true";
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        delete containerRef.current.dataset.loaded;
      }
    };
  }, [scriptUrl, config, height]);
  return containerRef;
};

export default useTradingViewWidget;
