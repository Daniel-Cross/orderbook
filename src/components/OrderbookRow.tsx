import { memo } from "react";
import { OrderLevel } from "../core/orderbookTypes";
import { formatPrice, formatSize, formatTotal } from "../utils/formatNumbers";

interface OrderbookRowProps {
  level: OrderLevel;
  cumulative: number;
  percentWidth: number;
  recentlyUpdated: boolean;
  side: "bid" | "ask";
  index: number;
}

const OrderbookRowComponent = ({
  level,
  cumulative,
  percentWidth,
  recentlyUpdated,
  side,
  index,
}: OrderbookRowProps) => {
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
      <div className="size">{formatSize(level.size)}</div>
      <div className={`total ${side}-total`}>{formatTotal(cumulative)}</div>
      <div className={`price ${side}-price`}>{formatPrice(level.price)}</div>
    </div>
  );
};

export const OrderbookRow = memo(OrderbookRowComponent);
