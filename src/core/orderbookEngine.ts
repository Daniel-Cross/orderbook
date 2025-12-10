/**
 * Pure orderbook engine logic
 * Handles snapshot/delta application, sorting, and depth limiting
 */

import { OrderLevel, OrderbookSnapshot } from "./orderbookTypes";

export interface OrderbookMaps {
  bids: Map<string, string>;
  asks: Map<string, string>;
}

/**
 * Apply a snapshot to the orderbook maps
 * Converts Kraken format (price/qty objects) to internal format (string maps)
 */
export const applySnapshot = (
  maps: OrderbookMaps,
  snapshot: {
    bids: Array<{ price: number; qty: number }>;
    asks: Array<{ price: number; qty: number }>;
  }
): OrderbookMaps => {
  const newMaps: OrderbookMaps = {
    bids: new Map<string, string>(),
    asks: new Map<string, string>(),
  };

  // Apply bids
  for (const level of snapshot.bids) {
    if (level.qty > 0) {
      newMaps.bids.set(level.price.toString(), level.qty.toString());
    }
  }

  // Apply asks
  for (const level of snapshot.asks) {
    if (level.qty > 0) {
      newMaps.asks.set(level.price.toString(), level.qty.toString());
    }
  }

  return newMaps;
};

/**
 * Apply a delta update to the orderbook maps
 * Converts Kraken format (price/qty objects) to internal format (string maps)
 */
export const applyDelta = (
  maps: OrderbookMaps,
  delta: {
    bids: Array<{ price: number; qty: number }>;
    asks: Array<{ price: number; qty: number }>;
  }
): OrderbookMaps => {
  const newMaps: OrderbookMaps = {
    bids: new Map<string, string>(maps.bids),
    asks: new Map<string, string>(maps.asks),
  };

  // Apply bid updates
  for (const level of delta.bids) {
    const priceStr = level.price.toString();
    if (level.qty === 0) {
      newMaps.bids.delete(priceStr);
    } else {
      newMaps.bids.set(priceStr, level.qty.toString());
    }
  }

  // Apply ask updates
  for (const level of delta.asks) {
    const priceStr = level.price.toString();
    if (level.qty === 0) {
      newMaps.asks.delete(priceStr);
    } else {
      newMaps.asks.set(priceStr, level.qty.toString());
    }
  }

  return newMaps;
};

/**
 * Convert maps to sorted arrays and limit depth
 * Preserves lastUpdated timestamps from existing levels
 */
export const mapsToSnapshot = (
  maps: OrderbookMaps,
  depth: number,
  existingLevels?: { bids: OrderLevel[]; asks: OrderLevel[] }
): OrderbookSnapshot => {
  const now = Date.now();

  // Create a map of existing levels by price for timestamp preservation
  const existingBidsMap = new Map<number, number>();
  const existingAsksMap = new Map<number, number>();

  if (existingLevels) {
    existingLevels.bids.forEach((level) => {
      if (level.lastUpdated) {
        existingBidsMap.set(level.price, level.lastUpdated);
      }
    });
    existingLevels.asks.forEach((level) => {
      if (level.lastUpdated) {
        existingAsksMap.set(level.price, level.lastUpdated);
      }
    });
  }

  // Convert bids to array and sort descending by price
  const bidsArray: OrderLevel[] = Array.from(maps.bids.entries())
    .map(([price, size]) => {
      const priceNum = parseFloat(price);
      // If price exists in existing map, keep timestamp, otherwise set new timestamp
      const lastUpdated = existingBidsMap.has(priceNum)
        ? existingBidsMap.get(priceNum)
        : now;
      return {
        price: priceNum,
        size: parseFloat(size),
        lastUpdated,
      };
    })
    .sort((a, b) => b.price - a.price)
    .slice(0, depth);

  // Convert asks to array and sort ascending by price
  const asksArray: OrderLevel[] = Array.from(maps.asks.entries())
    .map(([price, size]) => {
      const priceNum = parseFloat(price);
      // If price exists in existing map, keep timestamp, otherwise set new timestamp
      const lastUpdated = existingAsksMap.has(priceNum)
        ? existingAsksMap.get(priceNum)
        : now;
      return {
        price: priceNum,
        size: parseFloat(size),
        lastUpdated,
      };
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, depth);

  return {
    timestamp: now,
    bids: bidsArray,
    asks: asksArray,
  };
};

/**
 * Calculate cumulative sizes for visualization
 */
export const calculateCumulative = (levels: OrderLevel[]): number[] => {
  let cumulative = 0;
  return levels.map((level) => {
    cumulative += level.size;
    return cumulative;
  });
};

/**
 * Calculate spread (best ask - best bid)
 */
export const calculateSpread = (
  bids: OrderLevel[],
  asks: OrderLevel[]
): number | null => {
  if (bids.length === 0 || asks.length === 0) {
    return null;
  }
  const bestBid = bids[0]?.price;
  const bestAsk = asks[0]?.price;
  if (bestBid === undefined || bestAsk === undefined) {
    return null;
  }
  return bestAsk - bestBid;
};
