import { useMemo } from "react";
import {
  useOrderbookStore,
  OrderbookState,
} from "../core/createOrderbookStore";
import { OrderbookMode } from "../core/orderbookTypes";

const selectTimeTravelState = (s: OrderbookState) => ({
  history: s.history,
  mode: s.mode,
  index: s.index,
  connected: s.connected,
  setMode: s.setMode,
  setIndex: s.setIndex,
});

export const TimeTravelControls = () => {
  const { history, mode, index, connected, setMode, setIndex } =
    useOrderbookStore(selectTimeTravelState);

  const hasHistory = history.length > 0;
  const historyLength = history.length;
  const maxIndex = Math.max(0, historyLength - 1);

  const timestamp = useMemo(() => {
    const snapshot = history[index];
    return snapshot ? new Date(snapshot.timestamp).toLocaleTimeString() : "N/A";
  }, [history, index]);

  const modeDisplay = useMemo(() => {
    if (mode === OrderbookMode.TIME_TRAVEL) {
      return { text: "Time Travel", className: "mode-time-travel" };
    }
    if (connected) {
      return { text: "Live", className: "mode-live" };
    }
    return { text: "Disconnected", className: "mode-disconnected" };
  }, [mode, connected]);

  const progressPercent = useMemo(
    () =>
      historyLength > 1 ? Math.round((index / (historyLength - 1)) * 100) : 0,
    [index, historyLength]
  );

  const isLiveMode = mode === OrderbookMode.LIVE;
  const isTimeTravelMode = mode === OrderbookMode.TIME_TRAVEL;

  return (
    <div className="time-travel-controls">
      <div className="time-travel-header">
        <span className="mode-indicator">
          Mode:
          <span className={modeDisplay.className}>{modeDisplay.text}</span>
        </span>

        {isLiveMode && hasHistory && (
          <button
            onClick={() => setMode(OrderbookMode.TIME_TRAVEL)}
            className="enter-time-travel-btn"
          >
            Enter Time Travel
          </button>
        )}

        {isTimeTravelMode && (
          <button
            onClick={() => setMode(OrderbookMode.LIVE)}
            className="back-to-live-btn"
          >
            Back to Live
          </button>
        )}
      </div>

      {isTimeTravelMode && hasHistory && (
        <div className="time-travel-slider">
          <label htmlFor="history-slider">
            Snapshot {index + 1} of {historyLength} ({progressPercent}% through
            history)
          </label>
          <input
            id="history-slider"
            type="range"
            min="0"
            max={maxIndex}
            value={index}
            onChange={(e) => setIndex(parseInt(e.target.value, 10))}
          />
          <div className="timestamp-display">Time: {timestamp}</div>
        </div>
      )}

      {isLiveMode && !hasHistory && (
        <div className="time-travel-hint">
          Collecting history... Time travel will be available soon.
        </div>
      )}
    </div>
  );
};
