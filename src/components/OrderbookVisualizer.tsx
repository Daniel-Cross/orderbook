import { useEffect } from "react";
import {
  TradingPair,
  Depth,
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
  showSpread?: boolean;
}

export const OrderbookVisualizer = ({
  initialPair,
  initialDepth = 10,
  enableTimeTravel = false,
  showSpread = false,
}: OrderbookVisualizerProps) => {
  const connect = useOrderbookStore((s: OrderbookState) => s.connect);
  const disconnect = useOrderbookStore((s: OrderbookState) => s.disconnect);
  const setPair = useOrderbookStore((s: OrderbookState) => s.setPair);
  const setDepth = useOrderbookStore((s: OrderbookState) => s.setDepth);

  useEffect(() => {
    const storeState = useOrderbookStore.getState();
    if (storeState.pair === AVAILABLE_PAIRS[0]) {
      setPair(initialPair);
    }
    if (storeState.depth === AVAILABLE_DEPTHS[0]) {
      setDepth(initialDepth);
    }

    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`orderbook-visualizer`}>
      <div className="orderbook-controls">
        <PairSelector />
        <DepthSelector />
        {enableTimeTravel && <TimeTravelControls />}
      </div>
      <OrderbookTable showSpread={showSpread} />
    </div>
  );
};
