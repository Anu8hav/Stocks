"use server";

import { getDateRange, validateArticle, formatArticle } from "@/lib/utils";
import { POPULAR_STOCK_SYMBOLS } from "@/lib/constants";
import { cache } from "react";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const NEXT_PUBLIC_FINNHUB_API_KEY =
  process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

async function fetchJSON<T>(
  url: string,
  revalidateSeconds?: number,
): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } =
    revalidateSeconds
      ? { cache: "force-cache", next: { revalidate: revalidateSeconds } }
      : { cache: "no-store" };

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export { fetchJSON };

export async function getNews(
  symbols?: string[],
): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error("FINNHUB API key is not configured");
    }
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            // Silently handle errors (e.g., 403 for unsupported stocks)
            perSymbolArticles[sym] = [];
          }
        }),
      );

      const collected: MarketNewsArticle[] = [];
      // Round-robin up to 6 picks
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Sort by datetime desc
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // If none collected, fall through to general news
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break; // cap early before final slicing
    }

    const formatted = unique
      .slice(0, maxArticles)
      .map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error("getNews error:", err);
    throw new Error("Failed to fetch news");
  }
}

export const searchStocks = cache(
  async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
      const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
      if (!token) {
        // If no token, log and return empty to avoid throwing per requirements
        console.error(
          "Error in stock search:",
          new Error("FINNHUB API key is not configured"),
        );
        return [];
      }

      const trimmed = typeof query === "string" ? query.trim() : "";

      type SearchProfile = {
        name?: string;
        ticker?: string;
        exchange?: string;
      };

      type SearchMappedResult = {
        symbol: string;
        description: string;
        displaySymbol?: string;
        type: string;
        exchange?: string;
      };

      let results: SearchMappedResult[] = [];

      if (!trimmed) {
        // Fetch top 10 popular symbols' profiles
        const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
        const profiles = await Promise.all(
          top.map(async (sym) => {
            try {
              const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
              // Revalidate every hour
              const profile = await fetchJSON<SearchProfile>(url, 3600);
              return { sym, profile } as {
                sym: string;
                profile: SearchProfile | null;
              };
            } catch (e) {
              console.error("Error fetching profile2 for", sym, e);
              return { sym, profile: null } as {
                sym: string;
                profile: SearchProfile | null;
              };
            }
          }),
        );

        results = profiles
          .map(({ sym, profile }) => {
            const symbol = sym.toUpperCase();
            const name: string | undefined =
              profile?.name || profile?.ticker || undefined;
            const exchange: string | undefined = profile?.exchange || undefined;
            if (!name) return undefined;
            const r: SearchMappedResult = {
              symbol,
              description: name,
              displaySymbol: symbol,
              type: "Common Stock",
              exchange,
            };
            return r;
          })
          .filter((x): x is SearchMappedResult => Boolean(x));
      } else {
        const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
        const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
        results = Array.isArray(data?.result)
          ? data.result.map((item) => ({
              symbol: item.symbol,
              description: item.description,
              displaySymbol: item.displaySymbol,
              type: item.type,
            }))
          : [];
      }

      const mapped: StockWithWatchlistStatus[] = results
        .map((r) => {
          const upper = (r.symbol || "").toUpperCase();
          const name = r.description || upper;
          const exchangeFromDisplay =
            (r.displaySymbol as string | undefined) || undefined;
          const exchangeFromProfile = r.exchange;
          const exchange = exchangeFromDisplay || exchangeFromProfile || "US";
          const type = r.type || "Stock";
          const item: StockWithWatchlistStatus = {
            symbol: upper,
            name,
            exchange,
            type,
            isInWatchlist: false,
          };
          return item;
        })
        .slice(0, 15);

      return mapped;
    } catch (err) {
      console.error("Error in stock search:", err);
      return [];
    }
  },
);

export interface StockQuote {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

export interface CompanyProfile {
  country?: string;
  currency?: string;
  exchange?: string;
  finnhubIndustry?: string;
  ipo?: string;
  logo?: string;
  marketCapitalization?: number;
  name?: string;
  phone?: string;
  shareOutstanding?: number;
  ticker?: string;
  weburl?: string;
}

export interface StockHistoricalData {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  t: number[];
  v: number[];
  s: string;
}

export interface BasicFinancialsResponse {
  metric?: Record<string, number | string | null | undefined>;
}

export interface PeerStockPerformance {
  symbol: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

export interface StockExecutive {
  name?: string;
  title?: string;
  since?: string;
  age?: number;
}

export interface StockDetailPayload {
  symbol: string;
  quote: StockQuote | null;
  profile: CompanyProfile | null;
  historical: StockHistoricalData | null;
  metrics: BasicFinancialsResponse | null;
  news: MarketNewsArticle[];
  peers: PeerStockPerformance[];
  executives: StockExecutive[];
}

export interface WatchlistQuoteSnapshot {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high52Week?: number;
  low52Week?: number;
  volume?: number;
  marketCap?: number;
  sector?: string;
}

async function getCompanyNameBySymbol(symbol: string, token: string) {
  try {
    const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`;
    const profile = await fetchJSON<CompanyProfile>(url, 3600);
    return profile?.name || symbol;
  } catch {
    return symbol;
  }
}

export const getStockDetails = cache(
  async (symbolInput: string): Promise<StockDetailPayload> => {
    const symbol = symbolInput.trim().toUpperCase();
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;

    if (!token) {
      throw new Error("FINNHUB API key is not configured");
    }

    const now = Math.floor(Date.now() / 1000);
    const fiveYearsAgo = now - 60 * 60 * 24 * 365 * 5;

    const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
    const profileUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`;
    const historicalUrl = `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${fiveYearsAgo}&to=${now}&token=${token}`;
    const metricsUrl = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${token}`;
    const peersUrl = `${FINNHUB_BASE_URL}/stock/peers?symbol=${encodeURIComponent(symbol)}&token=${token}`;
    const executivesUrl = `${FINNHUB_BASE_URL}/stock/executive?symbol=${encodeURIComponent(symbol)}&token=${token}`;

    const [
      quoteRes,
      profileRes,
      historicalRes,
      metricsRes,
      peersRes,
      executivesRes,
      newsRes,
    ] = await Promise.allSettled([
      fetchJSON<StockQuote>(quoteUrl, 30),
      fetchJSON<CompanyProfile>(profileUrl, 3600),
      fetchJSON<StockHistoricalData>(historicalUrl, 300),
      fetchJSON<BasicFinancialsResponse>(metricsUrl, 3600),
      fetchJSON<string[]>(peersUrl, 3600),
      fetchJSON<{ data?: StockExecutive[] } | StockExecutive[]>(
        executivesUrl,
        3600,
      ),
      getNews([symbol]),
    ]);

    const quote = quoteRes.status === "fulfilled" ? quoteRes.value : null;
    const profile = profileRes.status === "fulfilled" ? profileRes.value : null;
    const historical =
      historicalRes.status === "fulfilled" && historicalRes.value?.s === "ok"
        ? historicalRes.value
        : null;
    const metrics =
      metricsRes.status === "fulfilled" ? metricsRes.value : { metric: {} };
    const news = newsRes.status === "fulfilled" ? newsRes.value : [];
    const peerSymbols =
      peersRes.status === "fulfilled"
        ? peersRes.value.filter((peer) => peer && peer !== symbol).slice(0, 6)
        : [];

    const executivesRaw =
      executivesRes.status === "fulfilled" ? executivesRes.value : [];
    const executives = Array.isArray(executivesRaw)
      ? executivesRaw
      : Array.isArray(executivesRaw?.data)
        ? executivesRaw.data
        : [];

    const peers = await Promise.all(
      peerSymbols.map(async (peerSymbol): Promise<PeerStockPerformance> => {
        try {
          const peerQuoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(peerSymbol)}&token=${token}`;
          const [peerQuote, peerName] = await Promise.all([
            fetchJSON<StockQuote>(peerQuoteUrl, 60),
            getCompanyNameBySymbol(peerSymbol, token),
          ]);

          return {
            symbol: peerSymbol,
            companyName: peerName,
            currentPrice: peerQuote?.c || 0,
            change: peerQuote?.d || 0,
            changePercent: peerQuote?.dp || 0,
          };
        } catch {
          return {
            symbol: peerSymbol,
            companyName: peerSymbol,
            currentPrice: 0,
            change: 0,
            changePercent: 0,
          };
        }
      }),
    );

    return {
      symbol,
      quote,
      profile,
      historical,
      metrics,
      news,
      peers,
      executives: executives.slice(0, 6),
    };
  },
);

export async function getWatchlistQuoteSnapshots(
  symbols: string[],
): Promise<WatchlistQuoteSnapshot[]> {
  const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!token) {
    throw new Error("FINNHUB API key is not configured");
  }

  const uniqueSymbols = Array.from(
    new Set(
      (symbols || [])
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean),
    ),
  );

  const results = await Promise.all(
    uniqueSymbols.map(async (symbol): Promise<WatchlistQuoteSnapshot> => {
      try {
        const [quote, profile, metrics] = await Promise.all([
          fetchJSON<StockQuote>(
            `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`,
            30,
          ),
          fetchJSON<CompanyProfile>(
            `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`,
            3600,
          ),
          fetchJSON<BasicFinancialsResponse>(
            `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${token}`,
            3600,
          ),
        ]);

        const metric = metrics?.metric || {};
        const high52Week =
          typeof metric["52WeekHigh"] === "number"
            ? (metric["52WeekHigh"] as number)
            : undefined;
        const low52Week =
          typeof metric["52WeekLow"] === "number"
            ? (metric["52WeekLow"] as number)
            : undefined;
        const volume =
          typeof metric["10DayAverageTradingVolume"] === "number"
            ? (metric["10DayAverageTradingVolume"] as number)
            : undefined;

        return {
          symbol,
          price: quote?.c || 0,
          change: quote?.d || 0,
          changePercent: quote?.dp || 0,
          high52Week,
          low52Week,
          volume,
          marketCap:
            typeof profile?.marketCapitalization === "number"
              ? profile.marketCapitalization * 1_000_000
              : undefined,
          sector: profile?.finnhubIndustry,
        };
      } catch {
        return {
          symbol,
          price: 0,
          change: 0,
          changePercent: 0,
        };
      }
    }),
  );

  return results;
}
