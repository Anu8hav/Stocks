import StockChartPanel from "@/components/stocks/StockChartPanel";
import StockAnalysisPanel from "@/components/stocks/StockAnalysisPanel";
import {
  getStockDetails,
  type StockDetailPayload,
} from "@/lib/actions/finnhub.action";
import {
  addStockToWatchlist,
  isSymbolInWatchlist,
  removeStockFromWatchlist,
} from "@/lib/actions/watchlist.actions";
import { formatTimeAgo } from "@/lib/utils";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface StockSymbolPageProps {
  params: Promise<{ symbol: string }>;
}

const formatCurrency = (value?: number, digits = 2) => {
  if (!Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value as number);
};

const formatCompactNumber = (value?: number) => {
  if (!Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value as number);
};

const formatPercent = (value?: number) => {
  if (!Number.isFinite(value)) return "N/A";
  const numeric = value as number;
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(2)}%`;
};

const metricValue = (
  metric: Record<string, number | string | null | undefined> | undefined,
  keys: string[],
) => {
  for (const key of keys) {
    const value = metric?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
};

function getHighLowFromHistorical(data: StockDetailPayload["historical"]) {
  if (!data?.h?.length || !data?.l?.length)
    return { high: undefined, low: undefined };

  const high = Math.max(...data.h);
  const low = Math.min(...data.l);
  return { high, low };
}

export async function generateMetadata({
  params,
}: StockSymbolPageProps): Promise<Metadata> {
  const { symbol } = await params;
  const normalizedSymbol = symbol.toUpperCase();

  try {
    const data = await getStockDetails(normalizedSymbol);
    const titleName = data.profile?.name || normalizedSymbol;

    return {
      title: `${normalizedSymbol} Stock Price, Chart & News`,
      description: `Track ${titleName} (${normalizedSymbol}) live quote, key stats, financial metrics, related news, and peers.`,
      openGraph: {
        title: `${normalizedSymbol} Stock Overview`,
        description: `Live stock insights for ${titleName}.`,
      },
    };
  } catch {
    return {
      title: `${normalizedSymbol} Stock`,
      description: `Stock data and latest updates for ${normalizedSymbol}.`,
    };
  }
}

const StockSymbolPage = async ({ params }: StockSymbolPageProps) => {
  const { symbol } = await params;
  const normalizedSymbol = symbol?.trim().toUpperCase();

  if (!normalizedSymbol) notFound();

  const [data, inWatchlist] = await Promise.all([
    getStockDetails(normalizedSymbol),
    isSymbolInWatchlist(normalizedSymbol),
  ]);

  const companyName = data.profile?.name || normalizedSymbol;
  const quote = data.quote;
  const metrics = data.metrics?.metric;

  const changeClass =
    (quote?.dp || 0) > 0
      ? "text-green-500"
      : (quote?.dp || 0) < 0
        ? "text-red-500"
        : "text-gray-400";

  const marketCapFromProfile =
    typeof data.profile?.marketCapitalization === "number"
      ? data.profile.marketCapitalization * 1_000_000
      : undefined;

  const peRatio = metricValue(metrics, [
    "peBasicExclExtraTTM",
    "peTTM",
    "peNormalizedAnnual",
  ]);

  const volume = quote?.t
    ? metricValue(metrics, [
        "10DayAverageTradingVolume",
        "3MonthAverageTradingVolume",
      ])
    : undefined;

  const highLow = getHighLowFromHistorical(data.historical);
  const dividendYield = metricValue(metrics, [
    "dividendYieldIndicatedAnnual",
    "dividendYield5Y",
  ]);

  const historicalClose = data.historical?.c || [];
  const fiveYearReturn =
    historicalClose.length > 1
      ? ((historicalClose[historicalClose.length - 1] - historicalClose[0]) /
          historicalClose[0]) *
        100
      : undefined;

  const watchlistAction = async () => {
    "use server";

    if (inWatchlist) {
      await removeStockFromWatchlist(normalizedSymbol);
      return;
    }

    await addStockToWatchlist(normalizedSymbol, companyName);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-gray-600 bg-gray-800 p-5 md:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {data.profile?.logo && (
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-white p-3">
                  <Image
                    src={data.profile.logo}
                    alt={`${companyName} logo`}
                    fill
                    className="object-contain"
                    sizes="96px"
                  />
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">{normalizedSymbol}</p>
                <h1 className="text-2xl font-semibold text-gray-100 md:text-3xl">
                  {companyName}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <p className="text-3xl font-bold text-gray-100">
                {formatCurrency(quote?.c)}
              </p>
              <p className={`text-lg font-medium ${changeClass}`}>
                {formatCurrency(quote?.d)} ({formatPercent(quote?.dp)})
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
              <p>52W High: {formatCurrency(highLow.high)}</p>
              <p>52W Low: {formatCurrency(highLow.low)}</p>
              <p>Exchange: {data.profile?.exchange || "N/A"}</p>
              <p>Sector: {data.profile?.finnhubIndustry || "N/A"}</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 lg:w-[340px]">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-gray-700 p-3">
                <p className="text-gray-400">Market Cap</p>
                <p className="font-semibold text-gray-100">
                  {formatCompactNumber(marketCapFromProfile)}
                </p>
              </div>
              <div className="rounded-md bg-gray-700 p-3">
                <p className="text-gray-400">P/E Ratio</p>
                <p className="font-semibold text-gray-100">
                  {Number.isFinite(peRatio)
                    ? (peRatio as number).toFixed(2)
                    : "N/A"}
                </p>
              </div>
              <div className="rounded-md bg-gray-700 p-3">
                <p className="text-gray-400">Volume</p>
                <p className="font-semibold text-gray-100">
                  {formatCompactNumber(volume)}
                </p>
              </div>
              <div className="rounded-md bg-gray-700 p-3">
                <p className="text-gray-400">5Y Return</p>
                <p className="font-semibold text-gray-100">
                  {formatPercent(fiveYearReturn)}
                </p>
              </div>
            </div>

            <form action={watchlistAction}>
              <button
                type="submit"
                className="watchlist-btn h-11 w-full rounded-md font-medium"
              >
                {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <StockChartPanel symbol={normalizedSymbol} />

      <StockAnalysisPanel symbol={normalizedSymbol} />

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-lg border border-gray-600 bg-gray-800 p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-100">
            Key Statistics
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                label: "Valuation (P/B)",
                value: metricValue(metrics, ["pbAnnual", "pbQuarterly"]),
                formatter: (value?: number) =>
                  Number.isFinite(value) ? (value as number).toFixed(2) : "N/A",
              },
              {
                label: "Price/Sales",
                value: metricValue(metrics, ["psTTM", "psAnnual"]),
                formatter: (value?: number) =>
                  Number.isFinite(value) ? (value as number).toFixed(2) : "N/A",
              },
              {
                label: "ROE",
                value: metricValue(metrics, ["roeTTM", "roeRfy"]),
                formatter: formatPercent,
              },
              {
                label: "ROA",
                value: metricValue(metrics, ["roaTTM", "roaRfy"]),
                formatter: formatPercent,
              },
              {
                label: "Current Ratio",
                value: metricValue(metrics, [
                  "currentRatioQuarterly",
                  "currentRatioAnnual",
                ]),
                formatter: (value?: number) =>
                  Number.isFinite(value) ? (value as number).toFixed(2) : "N/A",
              },
              {
                label: "Debt/Equity",
                value: metricValue(metrics, [
                  "totalDebt/totalEquityQuarterly",
                  "totalDebt/totalEquityAnnual",
                ]),
                formatter: (value?: number) =>
                  Number.isFinite(value) ? (value as number).toFixed(2) : "N/A",
              },
              {
                label: "Dividend Yield",
                value: dividendYield,
                formatter: formatPercent,
              },
              {
                label: "Beta",
                value: metricValue(metrics, ["beta"]),
                formatter: (value?: number) =>
                  Number.isFinite(value) ? (value as number).toFixed(2) : "N/A",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-md bg-gray-700 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  {item.label}
                </p>
                <p className="mt-1 text-base font-semibold text-gray-100">
                  {item.formatter(item.value)}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-gray-600 bg-gray-800 p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-100">
            Company Information
          </h2>

          <p className="mb-4 text-sm leading-6 text-gray-300">
            {companyName} operates in the{" "}
            {data.profile?.finnhubIndustry || "N/A"} sector and is listed on{" "}
            {data.profile?.exchange || "N/A"}. The company IPO date is{" "}
            {data.profile?.ipo || "N/A"}.
          </p>

          <div className="mb-5 grid grid-cols-1 gap-2 text-sm text-gray-300 sm:grid-cols-2">
            <p>Industry: {data.profile?.finnhubIndustry || "N/A"}</p>
            <p>Sector: {data.profile?.finnhubIndustry || "N/A"}</p>
            <p>
              Website:{" "}
              {data.profile?.weburl ? (
                <Link
                  href={data.profile.weburl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-600"
                >
                  Visit Website
                </Link>
              ) : (
                "N/A"
              )}
            </p>
            <p>
              Employees:{" "}
              {formatCompactNumber(metricValue(metrics, ["employeeTotal"]))}
            </p>
            <p>Headquarters: {data.profile?.country || "N/A"}</p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-200">
              Key Executives
            </h3>
            {data.executives.length > 0 ? (
              <ul className="space-y-2">
                {data.executives.map((executive, index) => (
                  <li
                    key={`${executive.name}-${index}`}
                    className="rounded-md bg-gray-700 p-3 text-sm"
                  >
                    <p className="font-medium text-gray-100">
                      {executive.name || "N/A"}
                    </p>
                    <p className="text-gray-400">
                      {executive.title || "Executive"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">
                No executive data available.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-lg border border-gray-600 bg-gray-800 p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-100">
            Latest News
          </h2>
          <div className="space-y-3">
            {data.news.length > 0 ? (
              data.news.map((article) => (
                <Link
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-item block"
                >
                  <p className="text-xs text-gray-400">
                    {article.source} · {formatTimeAgo(article.datetime)}
                  </p>
                  <h3 className="mt-1 font-medium text-gray-100">
                    {article.headline}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-300">
                    {article.summary}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No recent company news available.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-gray-600 bg-gray-800 p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-100">
            Similar Stocks / Peers
          </h2>

          {data.peers.length > 0 ? (
            <div className="space-y-3">
              {data.peers.map((peer) => {
                const peerPositive = peer.changePercent >= 0;
                return (
                  <Link
                    key={peer.symbol}
                    href={`/stocks/${peer.symbol}`}
                    className="flex items-center justify-between rounded-md bg-gray-700 p-3 transition hover:bg-gray-600"
                  >
                    <div>
                      <p className="font-medium text-gray-100">{peer.symbol}</p>
                      <p className="text-sm text-gray-400">
                        {peer.companyName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-100">
                        {formatCurrency(peer.currentPrice)}
                      </p>
                      <p
                        className={`text-sm ${peerPositive ? "text-green-500" : "text-red-500"}`}
                      >
                        {formatCurrency(peer.change)} (
                        {formatPercent(peer.changePercent)})
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No peer symbols available.</p>
          )}
        </article>
      </section>
    </div>
  );
};

export default StockSymbolPage;
