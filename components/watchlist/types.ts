export interface WatchlistStock {
  id: string;
  symbol: string;
  name: string;
  addedAt: string;
  notes?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  sector?: string;
  high52Week?: number;
  low52Week?: number;
  isDefault?: boolean;
}

export interface Watchlist {
  id: string;
  name: string;
  stocks: WatchlistStock[];
  createdAt: string;
  updatedAt: string;
  isPrimary?: boolean;
}

export type WatchlistSortKey = "symbol" | "price" | "change" | "marketCap";
export type WatchlistView = "grid" | "list";
