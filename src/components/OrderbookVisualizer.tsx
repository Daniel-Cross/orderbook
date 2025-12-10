import { useEffect } from "react";
import {
  TradingPair,
  Depth,
  Theme,
  AVAILABLE_PAIRS,
  AVAILABLE_DEPTHS,
} from "../core/orderbookTypes";
import {
  useOrderbookStore,
  OrderbookState,
} from "../core/createOrderbookStore";
import { PairSelector } from "./PairSelector";
import { DepthSelector } from "./DepthSelector";
import { TimeTravelControls } from "./TimeTravelControls";
import { OrderbookTable } from "./OrderbookTable";

export interface OrderbookVisualizerProps {
  initialPair: TradingPair;
  initialDepth?: Depth;
  enableTimeTravel?: boolean;
  theme?: Theme;
  showSpread?: boolean;
}

export const OrderbookVisualizer = ({
  initialPair,
  initialDepth = 10,
  enableTimeTravel = false,
  theme = Theme.DARK,
  showSpread = false,
}: OrderbookVisualizerProps) => {
  const pair = useOrderbookStore((s: OrderbookState) => s.pair);
  const depth = useOrderbookStore((s: OrderbookState) => s.depth);
  const connected = useOrderbookStore((s: OrderbookState) => s.connected);
  const error = useOrderbookStore((s: OrderbookState) => s.error);
  const connect = useOrderbookStore((s: OrderbookState) => s.connect);
  const disconnect = useOrderbookStore((s: OrderbookState) => s.disconnect);
  const setPair = useOrderbookStore((s: OrderbookState) => s.setPair);
  const setDepth = useOrderbookStore((s: OrderbookState) => s.setDepth);

  // Initialize on mount only
  useEffect(() => {
    // Set initial values only if store has defaults (first mount)
    const storeState = useOrderbookStore.getState();
    if (storeState.pair === AVAILABLE_PAIRS[0]) {
      setPair(initialPair);
    }
    if (storeState.depth === AVAILABLE_DEPTHS[0]) {
      setDepth(initialDepth);
    }

    // Connect after setting values
    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - store functions are stable

  return (
    <div className={`orderbook-visualizer theme-${theme.toLowerCase()}`}>
      <div className="orderbook-controls">
        <PairSelector />
        <DepthSelector />
        {enableTimeTravel && <TimeTravelControls />}
      </div>
      <div className="connection-status">
        <span
          className={`status-indicator ${
            connected ? "connected" : "disconnected"
          }`}
        >
          {connected ? "● Connected" : "○ Disconnected"}
        </span>
        {error && <span className="error-message">{error}</span>}
      </div>
      <OrderbookTable showSpread={showSpread} />
    </div>
  );
};
