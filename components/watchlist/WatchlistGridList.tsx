"use client";

import { useMemo, useRef, useState } from "react";
import WatchlistItem from "@/components/watchlist/WatchlistItem";
import { WatchlistStock, WatchlistView } from "@/components/watchlist/types";

interface WatchlistGridListProps {
  stocks: WatchlistStock[];
  view: WatchlistView;
  selectedSymbols: string[];
  onSelect: (symbol: string, checked: boolean) => void;
  onRequestRemove: (stock: WatchlistStock) => void;
  onReorder: (dragSymbol: string, dropSymbol: string) => void;
}

const ROW_HEIGHT = 292;
const OVERSCAN = 4;

const WatchlistGridList = ({
  stocks,
  view,
  selectedSymbols,
  onSelect,
  onRequestRemove,
  onReorder,
}: WatchlistGridListProps) => {
  const [dragSymbol, setDragSymbol] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isVirtual = view === "list" && stocks.length > 20;
  const viewportHeight = 620;

  const visibleRange = useMemo(() => {
    if (!isVirtual) return { start: 0, end: stocks.length - 1 };

    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
    const end = Math.min(stocks.length - 1, start + visibleCount);

    return { start, end };
  }, [isVirtual, scrollTop, stocks.length]);

  const virtualStocks = isVirtual
    ? stocks.slice(visibleRange.start, visibleRange.end + 1)
    : stocks;

  const topSpacer = isVirtual ? visibleRange.start * ROW_HEIGHT : 0;
  const bottomSpacer = isVirtual
    ? Math.max(0, (stocks.length - visibleRange.end - 1) * ROW_HEIGHT)
    : 0;

  return (
    <section
      ref={containerRef}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      className={`rounded-lg border border-gray-600 bg-gray-900/30 p-3 ${
        view === "list" ? "max-h-155 overflow-y-auto" : ""
      }`}
      style={{ minHeight: 120 }}
    >
      {isVirtual && <div style={{ height: topSpacer }} />}

      <div
        className={
          view === "grid"
            ? "grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3"
            : "space-y-3"
        }
      >
        {virtualStocks.map((stock) => (
          <WatchlistItem
            key={stock.id}
            stock={stock}
            view={view}
            isSelected={selectedSymbols.includes(stock.symbol)}
            isDragging={dragSymbol === stock.symbol}
            onSelect={onSelect}
            onRequestRemove={onRequestRemove}
            onDragStart={(symbol) => setDragSymbol(symbol)}
            onDrop={(symbol) => {
              if (!dragSymbol || dragSymbol === symbol) return;
              onReorder(dragSymbol, symbol);
              setDragSymbol(null);
            }}
          />
        ))}
      </div>

      {isVirtual && <div style={{ height: bottomSpacer }} />}
    </section>
  );
};

export default WatchlistGridList;
