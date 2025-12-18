import { AVAILABLE_PAIRS, TradingPair } from "../core/orderbookTypes";
import {
  useOrderbookStore,
  OrderbookState,
} from "../core/createOrderbookStore";

const selectPairState = (s: OrderbookState) => ({
  pair: s.pair,
  setPair: s.setPair,
});

export const PairSelector = () => {
  const { pair, setPair } = useOrderbookStore(selectPairState);

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
