import { AVAILABLE_DEPTHS, Depth } from "../core/orderbookTypes";
import {
  useOrderbookStore,
  OrderbookState,
} from "../core/createOrderbookStore";

const selectDepthState = (s: OrderbookState) => ({
  depth: s.depth,
  setDepth: s.setDepth,
});

export const DepthSelector = () => {
  const { depth, setDepth } = useOrderbookStore(selectDepthState);

  return (
    <div className="depth-selector">
      <label htmlFor="depth-select">Depth:</label>
      <select
        id="depth-select"
        value={depth}
        onChange={(e) => setDepth(Number(e.target.value) as Depth)}
      >
        {AVAILABLE_DEPTHS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
};
