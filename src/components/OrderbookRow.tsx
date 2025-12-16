import { useState } from "react";
import { OrderLevel } from "../core/orderbookTypes";
import {
  formatPrice,
  formatSize,
  formatTotal,
  formatValue,
  formatDistancePercent,
} from "../utils/formatNumbers";

interface OrderbookRowProps {
  level: OrderLevel;
  cumulative: number;
  percentWidth: number;
  recentlyUpdated: boolean;
  side: "bid" | "ask";
  index: number;
  midPrice: number | null;
}

export const OrderbookRow = ({
  level,
  cumulative,
  percentWidth,
  recentlyUpdated,
  side,
  index,
  midPrice,
}: OrderbookRowProps) => {
  const value = level.price * level.size;

  const distancePercent = midPrice
    ? ((level.price - midPrice) / midPrice) * 100
    : null;

  return (
    <div
      key={`${side}-${level.price}-${index}`}
      className={`orderbook-row ${side}-row ${
        recentlyUpdated ? "recently-updated" : ""
      }`}
    >
      <div className="bar-container">
        <div
          className={`bar ${side}-bar`}
          style={{ width: `${percentWidth}%` }}
        />
      </div>
      <div className={`price ${side}-price`}>
        {formatPrice(level.price)}
        {distancePercent !== null && (
          <span className="price-distance">
            {formatDistancePercent(distancePercent)}
          </span>
        )}
      </div>
      <div className="size">{formatSize(level.size)}</div>
      <div className="total">{formatTotal(cumulative)}</div>
      <div className="value">{formatValue(value)}</div>
    </div>
  );
};
