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
  const maxCumulative = Math.max(
    bidsCumulative[bidsCumulative.length - 1] || 0,
    asksCumulative[asksCumulative.length - 1] || 0
  );

  const spread = showSpread ? calculateSpread(bids, asks) : null;
  const spreadPercent =
    spread && bids.length > 0 && asks.length > 0
      ? (spread / bids[0].price) * 100
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
          <OrderbookSide
            side="ask"
            levels={asks}
            cumulativeTotals={asksCumulative}
            maxCumulative={maxCumulative}
            isRecentlyUpdated={isRecentlyUpdated}
            isEmpty={isEmpty}
          />

          {showSpread && spread !== null && spreadPercent !== null && (
            <div className="spread-display">
              <span className="spread-label">Spread:</span>
              <span className="spread-value">{formatPrice(spread)}</span>
              <span className="spread-percent">
                ({formatSpreadPercent(spreadPercent)})
              </span>
            </div>
          )}

          <OrderbookSide
            side="bid"
            levels={bids}
            cumulativeTotals={bidsCumulative}
            maxCumulative={maxCumulative}
            isRecentlyUpdated={isRecentlyUpdated}
            isEmpty={isEmpty}
          />
        </div>
      )}
    </div>
  );
};
