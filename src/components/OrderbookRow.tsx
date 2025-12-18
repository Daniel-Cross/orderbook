import { memo } from "react";
import { OrderLevel } from "../core/orderbookTypes";
import { formatPrice, formatSize, formatTotal } from "../utils/formatNumbers";

interface OrderbookRowProps {
  level: OrderLevel;
  cumulative: number;
  percentWidth: number;
  side: "bid" | "ask";
  index: number;
}

const OrderbookRowComponent = ({
  level,
  cumulative,
  percentWidth,
  side,
  index,
}: OrderbookRowProps) => {
  const rowKey = `${side}-${level.price}-${index}-${level.lastUpdated || 0}`;
  const hasUpdate = level.lastUpdated !== undefined;

  return (
    <div
      key={rowKey}
      className={`orderbook-row ${side}-row ${
        hasUpdate ? "recently-updated" : ""
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
