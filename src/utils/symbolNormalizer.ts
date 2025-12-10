import { PAIR_PREFIX_BTC, PAIR_PREFIX_XBT } from "../core/orderbookTypes";

/**
 * Normalizes Kraken symbol from BTC format to XBT format
 * API returns BTC/USD, we store as XBT/USD
 */
export const normalizeSymbolFromMessage = (symbol: string): string => {
  return symbol.startsWith(PAIR_PREFIX_BTC)
    ? symbol.replace(PAIR_PREFIX_BTC, PAIR_PREFIX_XBT)
    : symbol;
};

/**
 * Converts XBT format to BTC format for Kraken API
 * We use XBT/USD, API expects BTC/USD
 */
export const normalizeSymbolForApi = (symbol: string): string => {
  return symbol.replace(PAIR_PREFIX_XBT, PAIR_PREFIX_BTC);
};

