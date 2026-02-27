"use client";

import { WatchlistStock, WatchlistView } from "@/components/watchlist/types";
import { Button } from "@/components/ui/button";
import { BarChart3, Trash2 } from "lucide-react";
import Link from "next/link";
import { normalizeToAPI } from "@/lib/symbolMapper";

const formatCurrency = (value?: number) => {
  if (!Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value as number);
};

const formatCompact = (value?: number) => {
  if (!Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value as number);
};

const rangePercent = (stock: WatchlistStock) => {
  const low = stock.low52Week || 0;
  const high = stock.high52Week || 0;
  const price = stock.price || 0;
  if (high <= low || price <= 0) return 0;
  const value = ((price - low) / (high - low)) * 100;
  return Math.max(0, Math.min(100, value));
};

const sparklineData = (seed: number) => {
  const points = Array.from({ length: 12 }).map((_, index) => {
    const base = 40 + (seed % 17);
    const wave = Math.sin(index / 2) * 8;
    const drift = index * ((seed % 5) - 2) * 0.4;
    return Math.max(8, Math.min(88, base + wave + drift));
  });
  return points;
};

interface WatchlistItemProps {
  stock: WatchlistStock;
  view: WatchlistView;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: (symbol: string, checked: boolean) => void;
  onRequestRemove: (stock: WatchlistStock) => void;
  onDragStart: (symbol: string) => void;
  onDrop: (symbol: string) => void;
}

const WatchlistItem = ({
  stock,
  view,
  isSelected,
  isDragging,
  onSelect,
  onRequestRemove,
  onDragStart,
  onDrop,
}: WatchlistItemProps) => {
  const positive = (stock.changePercent || 0) >= 0;
  const highlight = Math.abs(stock.changePercent || 0) >= 3;
  const linePoints = sparklineData(stock.symbol.charCodeAt(0)).map(
    (value, index) => `${index * 12},${100 - value}`,
  );

  return (
    <article
      draggable
      onDragStart={() => onDragStart(stock.symbol)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(stock.symbol)}
      className={`rounded-lg border bg-gray-800 p-4 transition ${
        isDragging ? "opacity-50" : "opacity-100"
      } ${highlight ? "border-red-500/70" : "border-gray-600"} hover:border-gray-500`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(event) => onSelect(stock.symbol, event.target.checked)}
            className="mt-1"
          />
          <div>
            <Link
              href={`/stocks/${normalizeToAPI(stock.symbol)}`}
              className="text-lg font-semibold text-gray-100 hover:text-red-500"
            >
              {stock.symbol}
            </Link>
            <p className="text-sm text-gray-400">{stock.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gray-700 px-2 py-1 text-xs text-gray-300">
            {stock.sector || "N/A"}
          </span>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => onRequestRemove(stock)}
          >
            <Trash2 className="size-4 text-red-400" />
          </Button>
        </div>
      </div>

      <div
        className={`mb-3 flex flex-wrap items-end gap-x-3 gap-y-1 ${positive ? "text-green-500" : "text-red-500"}`}
      >
        <p className="text-xl font-semibold text-gray-100">
          {formatCurrency(stock.price)}
        </p>
        <p>
          {formatCurrency(stock.change)} (
          {(stock.changePercent || 0).toFixed(2)}%)
        </p>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
          <span>52W Low {formatCurrency(stock.low52Week)}</span>
          <span>52W High {formatCurrency(stock.high52Week)}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-700">
          <div
            className="h-full rounded-full bg-red-500"
            style={{ width: `${rangePercent(stock)}%` }}
          />
        </div>
      </div>

      {view === "list" ? (
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 md:grid-cols-4">
          <p>Volume: {formatCompact(stock.volume)}</p>
          <p>Market Cap: {formatCompact(stock.marketCap)}</p>
          <p>Added: {new Date(stock.addedAt).toLocaleDateString()}</p>
          <p>{stock.isDefault ? "Default suggestion" : "In watchlist"}</p>
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm text-gray-300">
          <p>Market Cap: {formatCompact(stock.marketCap)}</p>
          <p>Volume: {formatCompact(stock.volume)}</p>
        </div>
      )}

      <div className="mt-3 rounded-md border border-gray-700 bg-gray-900/60 p-2">
        <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
          <BarChart3 className="size-3.5" />
          Mini Trend
        </div>
        <svg
          width="100%"
          height="42"
          viewBox="0 0 132 100"
          preserveAspectRatio="none"
        >
          <polyline
            fill="none"
            stroke={positive ? "#22c55e" : "#ef4444"}
            strokeWidth="3"
            points={linePoints.join(" ")}
          />
        </svg>
      </div>
    </article>
  );
};

export default WatchlistItem;
