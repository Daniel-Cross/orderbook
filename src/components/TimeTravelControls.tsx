import {
  useOrderbookStore,
  OrderbookState,
} from "../core/createOrderbookStore";
import { OrderbookMode } from "../core/orderbookTypes";

export const TimeTravelControls = () => {
  const history = useOrderbookStore((s: OrderbookState) => s.history);
  const mode = useOrderbookStore((s: OrderbookState) => s.mode);
  const index = useOrderbookStore((s: OrderbookState) => s.index);
  const connected = useOrderbookStore((s: OrderbookState) => s.connected);
  const setMode = useOrderbookStore((s: OrderbookState) => s.setMode);
  const setIndex = useOrderbookStore((s: OrderbookState) => s.setIndex);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value, 10);
    setIndex(newIndex);
  };

  const handleBackToLive = () => {
    setMode(OrderbookMode.LIVE);
  };

  const handleEnterTimeTravel = () => {
    setMode(OrderbookMode.TIME_TRAVEL);
  };

  const currentSnapshot = history[index];
  const timestamp = currentSnapshot
    ? new Date(currentSnapshot.timestamp).toLocaleTimeString()
    : "N/A";

  const hasHistory = history.length > 0;

  const getModeDisplay = () => {
    if (mode === OrderbookMode.TIME_TRAVEL) {
      return { text: "Time Travel", className: "mode-time-travel" };
    }
    if (connected) {
      return { text: "Live", className: "mode-live" };
    }
    return { text: "Disconnected", className: "mode-disconnected" };
  };

  const modeDisplay = getModeDisplay();

  return (
    <div className="time-travel-controls">
      <div className="time-travel-header">
        <span className="mode-indicator">
          Mode:
          <span className={modeDisplay.className}>{modeDisplay.text}</span>
        </span>
        {mode === OrderbookMode.LIVE ? (
          hasHistory && (
            <button
              onClick={handleEnterTimeTravel}
              className="enter-time-travel-btn"
            >
              Enter Time Travel
            </button>
          )
        ) : (
          <button onClick={handleBackToLive} className="back-to-live-btn">
            Back to Live
          </button>
        )}
      </div>
      {mode === OrderbookMode.TIME_TRAVEL && hasHistory && (
        <div className="time-travel-slider">
          <label htmlFor="history-slider">
            Snapshot {index + 1} of {history.length} (
            {Math.round((index / (history.length - 1)) * 100)}% through history)
          </label>
          <input
            id="history-slider"
            type="range"
            min="0"
            max={Math.max(0, history.length - 1)}
            value={index}
            onChange={handleSliderChange}
          />
          <div className="timestamp-display">Time: {timestamp}</div>
        </div>
      )}
      {mode === OrderbookMode.LIVE && !hasHistory && (
        <div className="time-travel-hint">
          Collecting history... Time travel will be available soon.
        </div>
      )}
    </div>
  );
};
