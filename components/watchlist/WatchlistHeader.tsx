"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Grid3X3, List, Plus, Search } from "lucide-react";
import Link from "next/link";
import { WatchlistSortKey, WatchlistView } from "@/components/watchlist/types";

interface WatchlistHeaderProps {
  stockCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  view: WatchlistView;
  onViewChange: (view: WatchlistView) => void;
  sortBy: WatchlistSortKey;
  onSortChange: (sortBy: WatchlistSortKey) => void;
  onOpenAddModal: () => void;
}

const WatchlistHeader = ({
  stockCount,
  search,
  onSearchChange,
  view,
  onViewChange,
  sortBy,
  onSortChange,
  onOpenAddModal,
}: WatchlistHeaderProps) => {
  return (
    <section className="rounded-lg border border-gray-600 bg-gray-800 p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">My Watchlist</h1>
          <p className="text-sm text-gray-400">
            {stockCount} stock{stockCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild className="search-btn">
            <Link href="/search">
              <Search className="size-4" />
              Add Stocks
            </Link>
          </Button>

          <Button variant="outline" onClick={onOpenAddModal}>
            <Plus className="size-4" />
            Quick Add
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Filter watchlist..."
            className="border-gray-600 bg-gray-700 pl-9 text-gray-200"
          />
        </div>

        <Select
          value={sortBy}
          onValueChange={(value) => onSortChange(value as WatchlistSortKey)}
        >
          <SelectTrigger className="w-full border-gray-600 bg-gray-700 text-gray-200 lg:w-45">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="symbol">Symbol</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="change">Change</SelectItem>
            <SelectItem value="marketCap">Market Cap</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center rounded-md border border-gray-600 bg-gray-700 p-1">
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            className={`rounded px-3 py-1.5 text-sm transition ${
              view === "grid"
                ? "bg-red-500 text-white"
                : "text-gray-300 hover:bg-gray-600"
            }`}
            aria-label="Grid view"
          >
            <Grid3X3 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("list")}
            className={`rounded px-3 py-1.5 text-sm transition ${
              view === "list"
                ? "bg-red-500 text-white"
                : "text-gray-300 hover:bg-gray-600"
            }`}
            aria-label="List view"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default WatchlistHeader;
