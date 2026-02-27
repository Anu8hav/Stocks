"use client";

import AddToWatchlistModal from "@/components/watchlist/AddToWatchlistModal";
import WatchlistAnalysisPanel from "@/components/watchlist/WatchlistAnalysisPanel";
import WatchlistGridList from "@/components/watchlist/WatchlistGridList";
import WatchlistHeader from "@/components/watchlist/WatchlistHeader";
import WatchlistStats from "@/components/watchlist/WatchlistStats";
import {
  WatchlistSortKey,
  WatchlistStock,
  WatchlistView,
} from "@/components/watchlist/types";
import { Button } from "@/components/ui/button";
import {
  addStockToWatchlist,
  clearCurrentUserWatchlist,
  removeManyFromWatchlist,
  removeStockFromWatchlist,
} from "@/lib/actions/watchlist.actions";
import { getWatchlistQuoteSnapshots } from "@/lib/actions/finnhub.action";
import { normalizeToAPI } from "@/lib/symbolMapper";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, Share2, Trash2 } from "lucide-react";

interface WatchlistClientProps {
  initialStocks: WatchlistStock[];
  defaultSuggestions: Array<Pick<WatchlistStock, "symbol" | "name" | "sector">>;
  usesDefaultData: boolean;
}

const LOCAL_STORAGE_KEY = "stocks.watchlist.v1";

const WatchlistClient = ({
  initialStocks,
  defaultSuggestions,
  usesDefaultData,
}: WatchlistClientProps) => {
  const [stocks, setStocks] = useState<WatchlistStock[]>(initialStocks);
  const [view, setView] = useState<WatchlistView>("grid");
  const [sortBy, setSortBy] = useState<WatchlistSortKey>("symbol");
  const [search, setSearch] = useState("");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!usesDefaultData) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return;
    }

    const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw) as WatchlistStock[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStocks(parsed);
          return;
        }
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialStocks));
  }, [initialStocks, usesDefaultData]);

  useEffect(() => {
    if (usesDefaultData) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stocks));
    }
  }, [stocks, usesDefaultData]);

  useEffect(() => {
    if (stocks.length === 0) return;

    let cancelled = false;

    const refreshQuotes = async () => {
      const symbols = stocks.map((stock) => normalizeToAPI(stock.symbol));
      try {
        const snapshots = await getWatchlistQuoteSnapshots(symbols);
        if (cancelled || snapshots.length === 0) return;

        const map = new Map(
          snapshots.map((snapshot) => [snapshot.symbol, snapshot]),
        );
        setStocks((current) =>
          current.map((stock) => {
            const snapshot = map.get(stock.symbol);
            if (!snapshot) return stock;
            return {
              ...stock,
              price: snapshot.price,
              change: snapshot.change,
              changePercent: snapshot.changePercent,
              high52Week: snapshot.high52Week ?? stock.high52Week,
              low52Week: snapshot.low52Week ?? stock.low52Week,
              volume: snapshot.volume ?? stock.volume,
              marketCap: snapshot.marketCap ?? stock.marketCap,
              sector: snapshot.sector ?? stock.sector,
            };
          }),
        );
      } catch {
        if (!cancelled) {
          toast.error("Unable to refresh live prices right now");
        }
      }
    };

    refreshQuotes();
    const timer = window.setInterval(refreshQuotes, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [stocks.length]);

  const filteredStocks = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = !query
      ? stocks
      : stocks.filter(
          (stock) =>
            stock.symbol.toLowerCase().includes(query) ||
            stock.name.toLowerCase().includes(query),
        );

    const sorted = [...filtered].sort((left, right) => {
      if (sortBy === "symbol") {
        return left.symbol.localeCompare(right.symbol);
      }
      if (sortBy === "price") {
        return (right.price || 0) - (left.price || 0);
      }
      if (sortBy === "change") {
        return (right.changePercent || 0) - (left.changePercent || 0);
      }
      return (right.marketCap || 0) - (left.marketCap || 0);
    });

    return sorted;
  }, [search, sortBy, stocks]);

  const optimisticRemove = (symbol: string) => {
    const current = stocks;
    const next = current.filter((stock) => stock.symbol !== symbol);
    setStocks(next);
    setSelectedSymbols((selected) =>
      selected.filter((item) => item !== symbol),
    );

    startTransition(async () => {
      if (usesDefaultData) return;

      const result = await removeStockFromWatchlist(symbol);
      if (!result.success) {
        setStocks(current);
        toast.error(result.message || "Failed to remove stock");
      }
    });
  };

  const optimisticAdd = (
    stock: Pick<WatchlistStock, "symbol" | "name" | "sector">,
  ) => {
    const normalized = normalizeToAPI(stock.symbol);
    if (!normalized) return;

    if (stocks.some((item) => item.symbol === normalized)) {
      toast.info(`${normalized} is already in your watchlist`);
      return;
    }

    const nextStock: WatchlistStock = {
      id: `local-${normalized}-${Date.now()}`,
      symbol: normalized,
      name: stock.name,
      addedAt: new Date().toISOString(),
      sector: stock.sector,
      isDefault: usesDefaultData,
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      marketCap: 0,
      high52Week: 0,
      low52Week: 0,
    };

    const current = stocks;
    setStocks((prev) => [nextStock, ...prev]);
    setIsAddModalOpen(false);

    startTransition(async () => {
      if (usesDefaultData) return;

      const result = await addStockToWatchlist(normalized, stock.name);
      if (!result.success) {
        setStocks(current);
        toast.error(result.message || "Failed to add stock");
      }
    });
  };

  const handleBulkRemove = () => {
    if (selectedSymbols.length === 0) {
      toast.info("Select at least one stock to remove");
      return;
    }

    if (!window.confirm(`Remove ${selectedSymbols.length} selected stock(s)?`))
      return;

    const current = stocks;
    const next = current.filter(
      (stock) => !selectedSymbols.includes(stock.symbol),
    );
    setStocks(next);
    const symbolsToRemove = [...selectedSymbols];
    setSelectedSymbols([]);

    startTransition(async () => {
      if (usesDefaultData) return;

      const result = await removeManyFromWatchlist(symbolsToRemove);
      if (!result.success) {
        setStocks(current);
        toast.error(result.message || "Failed to remove selected stocks");
      }
    });
  };

  const handleClearAll = () => {
    if (stocks.length === 0) return;
    if (!window.confirm("Clear your entire watchlist?")) return;

    const current = stocks;
    setStocks([]);
    setSelectedSymbols([]);

    startTransition(async () => {
      if (usesDefaultData) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return;
      }

      const result = await clearCurrentUserWatchlist();
      if (!result.success) {
        setStocks(current);
        toast.error(result.message || "Failed to clear watchlist");
      }
    });
  };

  const handleExportCsv = () => {
    if (stocks.length === 0) return;

    const header = [
      "Symbol",
      "Name",
      "Price",
      "Change",
      "ChangePercent",
      "Volume",
      "MarketCap",
      "Sector",
      "AddedAt",
    ];

    const rows = stocks.map((stock) => [
      stock.symbol,
      stock.name,
      stock.price || 0,
      stock.change || 0,
      stock.changePercent || 0,
      stock.volume || 0,
      stock.marketCap || 0,
      stock.sector || "",
      stock.addedAt,
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "watchlist.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const symbols = stocks.map((stock) => normalizeToAPI(stock.symbol)).join(",");
    const url = `${window.location.origin}/watchlist?symbols=${encodeURIComponent(symbols)}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Shareable watchlist link copied");
    } catch {
      toast.error("Failed to copy share link");
    }
  };

  const handleReorder = (dragSymbol: string, dropSymbol: string) => {
    setStocks((current) => {
      const fromIndex = current.findIndex(
        (stock) => stock.symbol === dragSymbol,
      );
      const toIndex = current.findIndex((stock) => stock.symbol === dropSymbol);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex)
        return current;

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const emptyState = filteredStocks.length === 0;

  return (
    <div className="space-y-6">
      <WatchlistHeader
        stockCount={stocks.length}
        search={search}
        onSearchChange={setSearch}
        view={view}
        onViewChange={setView}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      <WatchlistStats stocks={stocks} />

      <WatchlistAnalysisPanel
        symbols={stocks.map((stock) => stock.symbol).filter(Boolean)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={handleBulkRemove}
          disabled={isPending}
        >
          <Trash2 className="size-4" />
          Bulk Remove
        </Button>
        <Button variant="outline" onClick={handleClearAll} disabled={isPending}>
          Clear All
        </Button>
        <Button variant="outline" onClick={handleExportCsv}>
          <Download className="size-4" />
          Export CSV
        </Button>
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="size-4" />
          Share
        </Button>
      </div>

      {usesDefaultData && (
        <p className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
          Showing default suggestions for demonstration. Add or remove stocks to
          customize this watchlist.
        </p>
      )}

      {emptyState ? (
        <section className="rounded-lg border border-gray-600 bg-gray-800 p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-100">
            Your watchlist is empty
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Add stocks to track performance, get quick insights, and monitor
            price moves.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button asChild className="search-btn">
              <Link href="/search">Go to Search</Link>
            </Button>
            <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
              Browse Popular Stocks
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {defaultSuggestions.slice(0, 8).map((stock) => (
              <button
                key={stock.symbol}
                type="button"
                onClick={() => optimisticAdd(stock)}
                className="rounded-full border border-gray-600 bg-gray-700 px-3 py-1 text-sm text-gray-200 hover:border-red-500"
              >
                {stock.symbol}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <WatchlistGridList
          stocks={filteredStocks}
          view={view}
          selectedSymbols={selectedSymbols}
          onSelect={(symbol, checked) => {
            setSelectedSymbols((current) =>
              checked
                ? Array.from(new Set([...current, symbol]))
                : current.filter((item) => item !== symbol),
            );
          }}
          onRequestRemove={(stock) => {
            if (!window.confirm(`Remove ${stock.symbol} from watchlist?`))
              return;
            optimisticRemove(stock.symbol);
          }}
          onReorder={handleReorder}
        />
      )}

      <AddToWatchlistModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        suggestions={defaultSuggestions}
        onAdd={optimisticAdd}
      />
    </div>
  );
};

export default WatchlistClient;
