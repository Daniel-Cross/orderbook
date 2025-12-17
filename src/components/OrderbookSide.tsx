import { OrderLevel } from "../core/orderbookTypes";
import { OrderbookRow } from "./OrderbookRow";

interface OrderbookSideProps {
  side: "bid" | "ask";
  levels: OrderLevel[];
  cumulativeTotals: number[];
  maxSize: number;
  isRecentlyUpdated: (level: OrderLevel) => boolean;
  isEmpty: boolean;
}

export const OrderbookSide = ({
  side,
  levels,
  cumulativeTotals,
  maxSize,
  isRecentlyUpdated,
  isEmpty,
}: OrderbookSideProps) => {
  const pluralSide = side === "bid" ? "bids" : "asks";
  const sideLabel = side === "bid" ? "Bid" : "Ask";

  return (
    <div className={`orderbook-side ${pluralSide}-side`}>
      <div className={`side-header ${side}-header`}>{sideLabel}</div>
      <div className="orderbook-rows">
        {isEmpty ? (
          <div className="orderbook-empty">Waiting for orderbook data…</div>
        ) : (
          levels.map((level: OrderLevel, idx: number) => {
            const cumulative = cumulativeTotals[idx];
            const percentWidth = maxSize > 0 ? (level.size / maxSize) * 100 : 0;
            const recentlyUpdated = isRecentlyUpdated(level);

            return (
              <OrderbookRow
                key={`${side}-${level.price}-${idx}`}
                level={level}
                cumulative={cumulative}
                percentWidth={percentWidth}
                recentlyUpdated={recentlyUpdated}
                side={side}
                index={idx}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
