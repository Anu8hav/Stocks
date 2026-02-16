"use client";

import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { searchStocks } from "@/lib/actions/finnhub.action";
import { useDebounce } from "@/hooks/useDebounce";

/* ---------- Default Popular Stocks ---------- */
const DEFAULT_POPULAR_STOCKS: StockWithWatchlistStatus[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchange: "NASDAQ",
    type: "Common Stock",
    isInWatchlist: false,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    exchange: "NASDAQ",
    type: "Common Stock",
    isInWatchlist: false,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    exchange: "NASDAQ",
    type: "Common Stock",
    isInWatchlist: false,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    exchange: "NASDAQ",
    type: "Common Stock",
    isInWatchlist: false,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    exchange: "NASDAQ",
    type: "Common Stock",
    isInWatchlist: false,
  },
  {
    symbol: "META",
    name: "Meta Platforms Inc.",
    exchange: "NASDAQ",
    type: "Common Stock",
    isInWatchlist: false,
  },
  {
    symbol: "NFLX",
    name: "Netflix Inc.",
    exchange: "NASDAQ",
    type: "Common Stock",
    isInWatchlist: false,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    exchange: "NASDAQ",
    type: "Common Stock",
    isInWatchlist: false,
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    exchange: "NYSE",
    type: "Common Stock",
    isInWatchlist: false,
  },
  {
    symbol: "V",
    name: "Visa Inc.",
    exchange: "NYSE",
    type: "Common Stock",
    isInWatchlist: false,
  },
];

export default function SearchCommand({
  renderAs = "button",
  label = "Add stock",
  initialStocks,
}: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------- Always safe stocks ---------- */
  const safeStocks =
    initialStocks && initialStocks.length > 0
      ? initialStocks
      : DEFAULT_POPULAR_STOCKS;

  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(safeStocks);

  const isSearchMode = searchTerm.trim().length > 0;
  const displayStocks = isSearchMode ? stocks : safeStocks.slice(0, 10);

  /* ---------- Reset when dialog opens ---------- */
  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setStocks(safeStocks);
    }
  }, [open, initialStocks]);

  /* ---------- Keyboard Shortcut ---------- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ---------- Search Handler ---------- */
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setStocks(safeStocks);
      return;
    }

    setLoading(true);
    try {
      const results = await searchStocks(searchTerm.trim());
      setStocks(results || []);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
    setStocks(safeStocks);
  };

  return (
    <>
      {renderAs === "text" ? (
        <span onClick={() => setOpen(true)} className="search-text">
          {label}
        </span>
      ) : (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="search-btn"
        >
          {label}
        </Button>
      )}

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="search-dialog"
      >
        <div className="search-field">
          <CommandInput
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Search stocks..."
            className="search-input"
          />
          {loading && <Loader2 className="search-loader animate-spin" />}
        </div>

        <CommandList className="search-list">
          {loading ? (
            <CommandEmpty>Loading stocks...</CommandEmpty>
          ) : displayStocks.length === 0 ? (
            <div>
              {isSearchMode ? "No results found" : "No stocks available"}
            </div>
          ) : (
            <ul>
              <div className="search-count">
                {isSearchMode ? "Search results" : "Popular stocks"} (
                {displayStocks.length})
              </div>

              {displayStocks.map((stock) => (
                <li key={stock.symbol}>
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    onClick={handleSelectStock}
                    className="search-item-link"
                  >
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <div>
                      <div>{stock.name}</div>
                      <div className="text-sm text-gray-500">
                        {stock.symbol} | {stock.exchange} | {stock.type}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
