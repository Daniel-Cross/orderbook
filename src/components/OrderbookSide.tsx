import { OrderLevel } from "../core/orderbookTypes";
import { OrderbookRow } from "./OrderbookRow";

interface OrderbookSideProps {
  side: "bid" | "ask";
  levels: OrderLevel[];
  cumulativeTotals: number[];
  maxCumulative: number;
  isRecentlyUpdated: (level: OrderLevel) => boolean;
  isEmpty: boolean;
  midPrice: number | null;
}

export const OrderbookSide = ({
  side,
  levels,
  cumulativeTotals,
  maxCumulative,
  isRecentlyUpdated,
  isEmpty,
  midPrice,
}: OrderbookSideProps) => {
  const pluralSide = side === "bid" ? "bids" : "asks";

  return (
    <div className={`orderbook-side ${pluralSide}-side`}>
      <div className="orderbook-header">
        <div>PRICE (USD)</div>
        <div>AMOUNT (BTC)</div>
        <div>TOTAL (BTC)</div>
        <div>VALUE (USD)</div>
      </div>
      <div className="orderbook-rows">
        {isEmpty ? (
          <div className="orderbook-empty">Waiting for orderbook data…</div>
        ) : (
          levels.map((level: OrderLevel, idx: number) => {
            const cumulative = cumulativeTotals[idx];
            const percentWidth =
              maxCumulative > 0 ? (cumulative / maxCumulative) * 100 : 0;
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
                midPrice={midPrice}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
