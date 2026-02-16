"use client";

import { WatchlistStock } from "@/components/watchlist/types";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

interface WatchlistStatsProps {
  stocks: WatchlistStock[];
}

const WatchlistStats = ({ stocks }: WatchlistStatsProps) => {
  const totalValue = stocks.reduce((sum, stock) => sum + (stock.price || 0), 0);
  const todayGainLoss = stocks.reduce(
    (sum, stock) => sum + (stock.change || 0),
    0,
  );

  const sorted = [...stocks].sort(
    (left, right) => (right.changePercent || 0) - (left.changePercent || 0),
  );

  const topPerformer = sorted[0];
  const worstPerformer = sorted[sorted.length - 1];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <p className="text-xs uppercase tracking-wide text-gray-400">
          Total Value
        </p>
        <p className="mt-1 text-xl font-semibold text-gray-100">
          {formatCurrency(totalValue)}
        </p>
      </article>

      <article className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <p className="text-xs uppercase tracking-wide text-gray-400">
          Today’s Gain/Loss
        </p>
        <p
          className={`mt-1 text-xl font-semibold ${todayGainLoss >= 0 ? "text-green-500" : "text-red-500"}`}
        >
          {formatCurrency(todayGainLoss)}
        </p>
      </article>

      <article className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <p className="text-xs uppercase tracking-wide text-gray-400">
          Top Performer
        </p>
        <p className="mt-1 text-base font-semibold text-gray-100">
          {topPerformer
            ? `${topPerformer.symbol} (${(topPerformer.changePercent || 0).toFixed(2)}%)`
            : "N/A"}
        </p>
      </article>

      <article className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <p className="text-xs uppercase tracking-wide text-gray-400">
          Worst Performer
        </p>
        <p className="mt-1 text-base font-semibold text-gray-100">
          {worstPerformer
            ? `${worstPerformer.symbol} (${(worstPerformer.changePercent || 0).toFixed(2)}%)`
            : "N/A"}
        </p>
      </article>
    </section>
  );
};

export default WatchlistStats;
