import { useState, useEffect } from "react";
import { OrderLevel } from "../core/orderbookTypes";
import { calculateCumulative, calculateSpread } from "../core/orderbookEngine";
import {
  useOrderbookStore,
  OrderbookState,
} from "../core/createOrderbookStore";
import {
  formatPrice,
  formatSize,
  formatTotal,
  formatSpreadPercent,
} from "../utils/formatNumbers";

interface OrderbookTableProps {
  showSpread?: boolean;
}

const HIGHLIGHT_DURATION_MS = 1000; // How long to highlight updated levels

export const OrderbookTable = ({ showSpread = false }: OrderbookTableProps) => {
  const bids = useOrderbookStore((s: OrderbookState) => s.bids);
  const asks = useOrderbookStore((s: OrderbookState) => s.asks);
  const loading = useOrderbookStore((s: OrderbookState) => s.loading);
  const [now, setNow] = useState(Date.now());

  // Update time every 100ms to trigger highlight fade animations
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
          {/* Asks Section (Top) */}
          <div className="orderbook-side asks-side">
            <div className="orderbook-header">
              <div>PRICE</div>
              <div>SIZE</div>
              <div>TOTAL</div>
            </div>
            <div className="orderbook-rows">
              {isEmpty ? (
                <div className="orderbook-empty">
                  Waiting for orderbook data…
                </div>
              ) : (
                asks.map((ask: OrderLevel, idx: number) => {
                  const cumulative = asksCumulative[idx];
                  const percentWidth =
                    maxCumulative > 0 ? (cumulative / maxCumulative) * 100 : 0;
                  const recentlyUpdated = isRecentlyUpdated(ask);
                  return (
                    <div
                      key={`ask-${ask.price}-${idx}`}
                      className={`orderbook-row ask-row ${
                        recentlyUpdated ? "recently-updated" : ""
                      }`}
                    >
                      <div className="bar-container">
                        <div
                          className="bar ask-bar"
                          style={{ width: `${percentWidth}%` }}
                        />
                      </div>
                      <div className="price ask-price">
                        {formatPrice(ask.price)}
                      </div>
                      <div className="size">{formatSize(ask.size)}</div>
                      <div className="total">{formatTotal(cumulative)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Spread Display (Middle) */}
          {showSpread && spread !== null && spreadPercent !== null && (
            <div className="spread-display">
              <span className="spread-label">Spread:</span>
              <span className="spread-value">{formatPrice(spread)}</span>
              <span className="spread-percent">
                ({formatSpreadPercent(spreadPercent)})
              </span>
            </div>
          )}

          {/* Bids Section (Bottom) */}
          <div className="orderbook-side bids-side">
            <div className="orderbook-header">
              <div>PRICE</div>
              <div>SIZE</div>
              <div>TOTAL</div>
            </div>
            <div className="orderbook-rows">
              {isEmpty ? (
                <div className="orderbook-empty">
                  Waiting for orderbook data…
                </div>
              ) : (
                bids.map((bid: OrderLevel, idx: number) => {
                  const cumulative = bidsCumulative[idx];
                  const percentWidth =
                    maxCumulative > 0 ? (cumulative / maxCumulative) * 100 : 0;
                  const recentlyUpdated = isRecentlyUpdated(bid);
                  return (
                    <div
                      key={`bid-${bid.price}-${idx}`}
                      className={`orderbook-row bid-row ${
                        recentlyUpdated ? "recently-updated" : ""
                      }`}
                    >
                      <div className="bar-container">
                        <div
                          className="bar bid-bar"
                          style={{ width: `${percentWidth}%` }}
                        />
                      </div>
                      <div className="price bid-price">
                        {formatPrice(bid.price)}
                      </div>
                      <div className="size">{formatSize(bid.size)}</div>
                      <div className="total">{formatTotal(cumulative)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
