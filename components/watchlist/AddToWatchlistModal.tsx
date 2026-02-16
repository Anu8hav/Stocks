"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WatchlistStock } from "@/components/watchlist/types";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

interface AddToWatchlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: Array<Pick<WatchlistStock, "symbol" | "name" | "sector">>;
  onAdd: (stock: Pick<WatchlistStock, "symbol" | "name" | "sector">) => void;
}

const AddToWatchlistModal = ({
  open,
  onOpenChange,
  suggestions,
  onAdd,
}: AddToWatchlistModalProps) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return suggestions;

    return suggestions.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query),
    );
  }, [search, suggestions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-600 bg-gray-800 text-gray-100 sm:max-w-140">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search stock symbol or company"
            className="border-gray-600 bg-gray-700 pl-9"
          />
        </div>

        <div className="max-h-85 space-y-2 overflow-y-auto pr-1">
          {filtered.map((stock) => (
            <div
              key={stock.symbol}
              className="flex items-center justify-between rounded-md border border-gray-600 bg-gray-700 p-3"
            >
              <div>
                <p className="font-medium text-gray-100">{stock.symbol}</p>
                <p className="text-sm text-gray-400">{stock.name}</p>
              </div>
              <Button
                className="search-btn"
                onClick={() => {
                  onAdd(stock);
                }}
              >
                Add
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToWatchlistModal;
