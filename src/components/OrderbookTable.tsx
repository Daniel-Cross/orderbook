import { useMemo } from "react";
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

const selectOrderbookData = (s: OrderbookState) => ({
  bids: s.bids,
  asks: s.asks,
  loading: s.loading,
});

export const OrderbookTable = ({ showSpread = false }: OrderbookTableProps) => {
  const { bids, asks, loading } = useOrderbookStore(selectOrderbookData);

  const bidsCumulative = useMemo(() => calculateCumulative(bids), [bids]);
  const asksCumulative = useMemo(() => calculateCumulative(asks), [asks]);

  const maxSize = useMemo(
    () => Math.max(...bids.map((b) => b.size), ...asks.map((a) => a.size), 0),
    [bids, asks]
  );

  const isEmpty = bids.length === 0 && asks.length === 0;
  const hasData = !isEmpty;

  const spread = useMemo(
    () => (showSpread && hasData ? calculateSpread(bids, asks) : null),
    [showSpread, hasData, bids, asks]
  );

  const spreadPercent = spread ? (spread / bids[0].price) * 100 : null;
  const midPrice = hasData ? (bids[0].price + asks[0].price) / 2 : null;

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
              isEmpty={isEmpty}
            />

            <OrderbookSide
              side="ask"
              levels={asks.slice().reverse()}
              cumulativeTotals={asksCumulative.slice().reverse()}
              maxSize={maxSize}
              isEmpty={isEmpty}
            />
          </div>

          {hasData && (
            <div className="spread-display">
              {spread ? (
                <>
                  <span className="spread-label">Spread:</span>
                  <span className="spread-value">{formatPrice(spread)}</span>
                  <span className="spread-percent">
                    ({formatSpreadPercent(spreadPercent!)})
                  </span>
                </>
              ) : (
                <>
                  <span className="spread-label">Mid Price:</span>
                  <span className="spread-value">{formatPrice(midPrice!)}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
