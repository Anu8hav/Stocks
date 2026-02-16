import WatchlistClient from "@/components/watchlist/WatchlistClient";
import { WatchlistStock } from "@/components/watchlist/types";
import { getWatchlistQuoteSnapshots } from "@/lib/actions/finnhub.action";
import { getCurrentUserWatchlist } from "@/lib/actions/watchlist.actions";
import type { Metadata } from "next";

const DEFAULT_WATCHLIST: Array<
  Pick<WatchlistStock, "symbol" | "name" | "sector">
> = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive" },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Communication Services" },
];

const DEFAULT_MOCK_DATA: Record<string, Partial<WatchlistStock>> = {
  AAPL: {
    price: 192.11,
    change: 2.09,
    changePercent: 1.1,
    volume: 58200000,
    marketCap: 2900000000000,
    high52Week: 199.62,
    low52Week: 164.08,
  },
  MSFT: {
    price: 414.72,
    change: -1.41,
    changePercent: -0.34,
    volume: 21200000,
    marketCap: 3100000000000,
    high52Week: 430.82,
    low52Week: 329.39,
  },
  GOOGL: {
    price: 175.18,
    change: 1.8,
    changePercent: 1.04,
    volume: 26100000,
    marketCap: 2200000000000,
    high52Week: 191.75,
    low52Week: 130.66,
  },
  AMZN: {
    price: 186.12,
    change: 0.33,
    changePercent: 0.18,
    volume: 30600000,
    marketCap: 1950000000000,
    high52Week: 201.2,
    low52Week: 144.05,
  },
  TSLA: {
    price: 247.54,
    change: -3.42,
    changePercent: -1.36,
    volume: 86300000,
    marketCap: 790000000000,
    high52Week: 299.29,
    low52Week: 138.8,
  },
  NVDA: {
    price: 131.18,
    change: 2.99,
    changePercent: 2.33,
    volume: 51500000,
    marketCap: 3200000000000,
    high52Week: 140.76,
    low52Week: 75.61,
  },
  META: {
    price: 514.1,
    change: 6.52,
    changePercent: 1.29,
    volume: 17900000,
    marketCap: 1310000000000,
    high52Week: 531.49,
    low52Week: 274.38,
  },
  NFLX: {
    price: 685.34,
    change: -4.88,
    changePercent: -0.71,
    volume: 5100000,
    marketCap: 295000000000,
    high52Week: 704.9,
    low52Week: 445.73,
  },
};

export const metadata: Metadata = {
  title: "My Watchlist",
  description:
    "Track your selected stocks with live pricing, performance summaries, and quick watchlist management.",
};

const buildDefaultStocks = (): WatchlistStock[] => {
  return DEFAULT_WATCHLIST.map((stock, index) => ({
    id: `default-${stock.symbol}`,
    symbol: stock.symbol,
    name: stock.name,
    addedAt: new Date(Date.now() - index * 1000 * 60 * 60).toISOString(),
    sector: stock.sector,
    isDefault: true,
    ...DEFAULT_MOCK_DATA[stock.symbol],
  }));
};

const WatchlistPage = async () => {
  const persisted = await getCurrentUserWatchlist();

  if (persisted.length === 0) {
    return (
      <WatchlistClient
        initialStocks={buildDefaultStocks()}
        defaultSuggestions={DEFAULT_WATCHLIST}
        usesDefaultData
      />
    );
  }

  const symbols = persisted.map((stock) => stock.symbol);

  let snapshots = [] as Awaited<ReturnType<typeof getWatchlistQuoteSnapshots>>;
  try {
    snapshots = await getWatchlistQuoteSnapshots(symbols);
  } catch {
    snapshots = [];
  }

  const snapshotMap = new Map(
    snapshots.map((snapshot) => [snapshot.symbol, snapshot]),
  );

  const merged: WatchlistStock[] = persisted.map((stock) => {
    const quote = snapshotMap.get(stock.symbol);

    return {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.company,
      addedAt: stock.addedAt,
      price: quote?.price || 0,
      change: quote?.change || 0,
      changePercent: quote?.changePercent || 0,
      volume: quote?.volume || 0,
      marketCap: quote?.marketCap || 0,
      sector: quote?.sector || "N/A",
      high52Week: quote?.high52Week || 0,
      low52Week: quote?.low52Week || 0,
      isDefault: false,
    };
  });

  return (
    <WatchlistClient
      initialStocks={merged}
      defaultSuggestions={DEFAULT_WATCHLIST}
      usesDefaultData={false}
    />
  );
};

export default WatchlistPage;
