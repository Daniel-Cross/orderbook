import { OrderLevel } from "../core/orderbookTypes";

export const markUpdatedPrices = (
  levels: OrderLevel[],
  updatedPrices: Set<number>,
  timestamp: number = Date.now()
): void => {
  levels.forEach((level) => {
    if (updatedPrices.has(level.price)) {
      level.lastUpdated = timestamp;
    }
  });
};
