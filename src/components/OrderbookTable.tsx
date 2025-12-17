import { useState, useEffect } from "react";
import { OrderLevel } from "../core/orderbookTypes";
import { calculateCumulative, calculateSpread } from "../core/orderbookEngine";
import {
  useOrderbookStore,
  OrderbookState,
} from "../core/createOrderbookStore";
import { formatPrice, formatSpreadPercent } from "../utils/formatNumbers";
import { OrderbookSide } from "./OrderbookSide";

interface OrderbookTableProps {
  showSpread?: boolean;
}

const HIGHLIGHT_DURATION_MS = 1000;

export const OrderbookTable = ({ showSpread = false }: OrderbookTableProps) => {
  const bids = useOrderbookStore((s: OrderbookState) => s.bids);
  const asks = useOrderbookStore((s: OrderbookState) => s.asks);
  const loading = useOrderbookStore((s: OrderbookState) => s.loading);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const isRecentlyUpdated = (level: OrderLevel): boolean => {
    if (!level.lastUpdated) return false;
    const age = now - level.lastUpdated;
    return age < HIGHLIGHT_DURATION_MS;
  };

  const bidsCumulative = calculateCumulative(bids);
  const asksCumulative = calculateCumulative(asks);

  // Calculate max individual size for bar visualization
  const maxSize = Math.max(
    ...bids.map((b) => b.size),
    ...asks.map((a) => a.size),
    0
  );

  const spread = showSpread ? calculateSpread(bids, asks) : null;
  const spreadPercent =
    spread && bids.length > 0 && asks.length > 0
      ? (spread / bids[0].price) * 100
      : null;

  // Calculate mid-price
  const midPrice =
    bids.length > 0 && asks.length > 0
      ? (bids[0].price + asks[0].price) / 2
      : null;

  const isEmpty = bids.length === 0 && asks.length === 0;

  return (
    <div className="orderbook-table-container">
      {loading ? (
        <div className="orderbook-loading">
          <div className="loading-spinner"></div>
          <span>Loading orderbook data...</span>
        </div>
      ) : (
        <div className="orderbook-table">
          <div className="orderbook-sides-container">
            <OrderbookSide
              side="bid"
              levels={bids}
              cumulativeTotals={bidsCumulative}
              maxSize={maxSize}
              isRecentlyUpdated={isRecentlyUpdated}
              isEmpty={isEmpty}
            />

            <OrderbookSide
              side="ask"
              levels={asks.slice().reverse()}
              cumulativeTotals={asksCumulative.slice().reverse()}
              maxSize={maxSize}
              isRecentlyUpdated={isRecentlyUpdated}
              isEmpty={isEmpty}
            />
          </div>

          <div className="spread-display">
            {spread !== null && spreadPercent !== null ? (
              <>
                <span className="spread-label">Spread:</span>
                <span className="spread-value">{formatPrice(spread)}</span>
                <span className="spread-percent">
                  ({formatSpreadPercent(spreadPercent)})
                </span>
              </>
            ) : midPrice !== null ? (
              <>
                <span className="spread-label">Mid Price:</span>
                <span className="spread-value">{formatPrice(midPrice)}</span>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
