export type ExchangeCode =
  | "NSE"
  | "BSE"
  | "NASDAQ"
  | "NYSE"
  | "AMEX"
  | "TSX"
  | "LSE"
  | "SGX"
  | "HKEX"
  | "BINANCE";

export type ApiSymbol = string;
export type TradingViewSymbol = `${ExchangeCode}:${string}`;

export interface NormalizationOptions {
  fallbackTradingViewSymbol?: TradingViewSymbol;
  defaultEquityExchange?: ExchangeCode;
}

export interface NormalizedSymbol {
  input: string;
  apiSymbol: ApiSymbol;
  tradingViewSymbol: TradingViewSymbol;
  exchange: ExchangeCode;
  baseSymbol: string;
  usedFallback: boolean;
  reason?: string;
}

const suffixToExchange: Record<string, ExchangeCode> = {
  ".NS": "NSE",
  ".BO": "BSE",
  ".TO": "TSX",
  ".L": "LSE",
  ".SI": "SGX",
};

const exchangeToSuffix: Partial<Record<ExchangeCode, string>> = {
  NSE: ".NS",
  BSE: ".BO",
  TSX: ".TO",
  LSE: ".L",
  SGX: ".SI",
};

const DEFAULT_EQUITY_EXCHANGE: ExchangeCode = "NASDAQ";
export const FALLBACK_API_SYMBOL: ApiSymbol = "AAPL";
export const FALLBACK_TRADINGVIEW_SYMBOL: TradingViewSymbol = "NASDAQ:AAPL";

const sanitizeBase = (value: string): string | null => {
  const trimmed = (value || "").trim().toUpperCase();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^A-Z0-9]/g, "");
  return cleaned.length > 0 ? cleaned : null;
};

const buildResult = (
  input: string,
  exchange: ExchangeCode,
  baseSymbol: string,
  usedFallback: boolean,
  reason?: string,
): NormalizedSymbol => {
  const apiSuffix = exchangeToSuffix[exchange];
  const apiSymbol: ApiSymbol = apiSuffix ? `${baseSymbol}${apiSuffix}` : baseSymbol;
  const tradingViewSymbol: TradingViewSymbol = `${exchange}:${baseSymbol}`;

  return {
    input,
    apiSymbol,
    tradingViewSymbol,
    exchange,
    baseSymbol,
    usedFallback,
    reason,
  };
};

/**
 * Normalize any incoming ticker into a dual-format object.
 * - Yahoo style (e.g. TCS.NS) -> API: TCS.NS, TV: NSE:TCS
 * - TradingView style (e.g. NSE:TCS) -> API: TCS.NS, TV: NSE:TCS
 * - Crypto pair (e.g. BTC-USD) -> API: BTC-USD, TV: BINANCE:BTCUSDT
 */
export function normalizeSymbol(
  symbol: string,
  options?: NormalizationOptions,
): NormalizedSymbol {
  const fallbackExchange = options?.defaultEquityExchange ?? DEFAULT_EQUITY_EXCHANGE;
  const raw = (symbol || "").trim().toUpperCase();

  if (!raw) {
    return buildResult(
      raw,
      fallbackExchange,
      sanitizeBase(FALLBACK_API_SYMBOL) ?? FALLBACK_API_SYMBOL,
      true,
      "empty symbol",
    );
  }

  // Already in TradingView format
  if (raw.includes(":")) {
    const [exchangeRaw, baseRaw] = raw.split(":", 2);
    const exchange = (exchangeRaw as ExchangeCode) || fallbackExchange;
    const safeBase = sanitizeBase(baseRaw || "");

    if (!safeBase) {
      return buildResult(
        raw,
        fallbackExchange,
        sanitizeBase(FALLBACK_API_SYMBOL) ?? FALLBACK_API_SYMBOL,
        true,
        "invalid base in trading view symbol",
      );
    }

    return buildResult(raw, exchange, safeBase, false);
  }

  // Suffix-based exchanges (Yahoo-style)
  for (const [suffix, exchange] of Object.entries(suffixToExchange)) {
    if (raw.endsWith(suffix)) {
      const baseRaw = raw.slice(0, -suffix.length);
      const safeBase = sanitizeBase(baseRaw);
      if (!safeBase) break;
      return buildResult(raw, exchange, safeBase, false);
    }
  }

  // Crypto pattern: BTC-USD -> BINANCE:BTCUSDT
  const cryptoMatch = raw.match(/^([A-Z0-9]+)[-/](USD|USDT)$/);
  if (cryptoMatch) {
    const base = sanitizeBase(cryptoMatch[1]) ?? "";
    if (base) {
      return buildResult(raw, "BINANCE", `${base}USDT`, false);
    }
  }

  // Default to equity fallback exchange
  const safeBase = sanitizeBase(raw);
  if (!safeBase) {
    const fallbackBase = sanitizeBase(FALLBACK_API_SYMBOL) ?? FALLBACK_API_SYMBOL;
    const parsedFallback = buildResult(raw, fallbackExchange, fallbackBase, true, "invalid symbol");
    return parsedFallback;
  }

  return buildResult(raw, fallbackExchange, safeBase, raw !== safeBase);
}

/** Convert a ticker into TradingView-ready format (e.g. TCS.NS -> NSE:TCS). */
export function normalizeToTradingView(
  symbol: string,
  options?: NormalizationOptions,
): TradingViewSymbol {
  const normalized = normalizeSymbol(symbol, options);
  return normalized.tradingViewSymbol;
}

/** Convert a ticker into API/DB safe format (re-applies exchange suffixes). */
export function normalizeToAPI(
  symbol: string,
  options?: NormalizationOptions,
): ApiSymbol {
  return normalizeSymbol(symbol, options).apiSymbol;
}

export interface TradingViewWidgetConfig extends Record<string, unknown> {
  symbol?: string;
}

export const SYMBOL_FALLBACK_MESSAGE =
  "Symbol normalization fallback triggered; verify the mapping rules.";
