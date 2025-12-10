import { AVAILABLE_PAIRS, TradingPair } from "../core/orderbookTypes";
import { useOrderbookStore, OrderbookState } from "../core/createOrderbookStore";

export const PairSelector = () => {
  const pair = useOrderbookStore((s: OrderbookState) => s.pair);
  const setPair = useOrderbookStore((s: OrderbookState) => s.setPair);

  return (
    <div className="pair-selector">
      <label htmlFor="pair-select">Trading Pair:</label>
      <select
        id="pair-select"
        value={pair}
        onChange={(e) => setPair(e.target.value as TradingPair)}
      >
        {AVAILABLE_PAIRS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
};

