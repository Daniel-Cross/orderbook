import { create } from "zustand";
import {
  OrderLevel,
  OrderbookSnapshot,
  KrakenBookSnapshotMessage,
  KrakenBookUpdateMessage,
  OrderbookMode,
  TradingPair,
  Depth,
  AVAILABLE_PAIRS,
  AVAILABLE_DEPTHS,
  MessageType,
} from "./orderbookTypes";
import {
  applySnapshot,
  applyDelta,
  mapsToSnapshot,
  OrderbookMaps,
} from "./orderbookEngine";
import {
  createKrakenWebSocketClient,
  KrakenWebSocketClient,
} from "./krakenClient";
import { normalizeSymbolFromMessage } from "../utils/symbolNormalizer";
import { markUpdatedPrices } from "../utils/timestampMarker";

export interface OrderbookState {
  // State
  pair: TradingPair;
  depth: Depth;
  bids: OrderLevel[];
  asks: OrderLevel[];
  history: OrderbookSnapshot[];
  mode: OrderbookMode;
  index: number;
  connected: boolean;
  loading: boolean;
  error: string | null;

  // Internal state
  maps: OrderbookMaps;
  client: KrakenWebSocketClient | null;
  historyLimit: number;
  hasConnectedOnce: boolean;

  // Actions
  setPair: (pair: TradingPair) => void;
  setDepth: (depth: Depth) => void;
  connect: () => void;
  disconnect: () => void;
  applySnapshot: (snapshot: KrakenBookSnapshotMessage) => void;
  applyDelta: (delta: KrakenBookUpdateMessage) => void;
  captureHistory: () => void;
  setMode: (mode: OrderbookMode) => void;
  setIndex: (index: number) => void;
  clearError: () => void;
}

const DEFAULT_PAIR: TradingPair = AVAILABLE_PAIRS[0];
const DEFAULT_DEPTH: Depth = AVAILABLE_DEPTHS[0];
const HISTORY_LIMIT = 1800; // ~1 hour at 2s intervals (adjust as needed)
const CAPTURE_INTERVAL_MS = 2000; // Capture snapshot every 2 seconds

export const useOrderbookStore = create<OrderbookState>(
  (
    set: (
      partial:
        | Partial<OrderbookState>
        | ((state: OrderbookState) => Partial<OrderbookState>)
    ) => void,
    get: () => OrderbookState
  ) => {
    let captureIntervalId: ReturnType<typeof setInterval> | null = null;
    let lastCaptureAt = 0;

    const startHistoryCapture = () => {
      if (captureIntervalId) {
        clearInterval(captureIntervalId);
      }
      captureIntervalId = setInterval(() => {
        get().captureHistory();
      }, CAPTURE_INTERVAL_MS);
    };

    const stopHistoryCapture = () => {
      if (captureIntervalId) {
        clearInterval(captureIntervalId);
        captureIntervalId = null;
      }
    };

    const createClient = (): KrakenWebSocketClient => {
      return createKrakenWebSocketClient({
        onSnapshot: (message: KrakenBookSnapshotMessage) => {
          get().applySnapshot(message);
        },
        onUpdate: (message: KrakenBookUpdateMessage) => {
          get().applyDelta(message);
        },
        onError: (error) => {
          const state = get();
          if (state.hasConnectedOnce) {
            set({ error: error.message });
          }
        },
        onConnect: () => {
          set({ connected: true, error: null, hasConnectedOnce: true });
          startHistoryCapture();
        },
        onDisconnect: () => {
          set({ connected: false });
          stopHistoryCapture();
        },
      });
    };

    const reconnect = () => {
      const state = get();
      if (state.client) {
        state.client.disconnect();
      }
      const newClient = createClient();
      set({ client: newClient });
      newClient.connect(state.pair, state.depth);
    };

    return {
      // Initial state
      pair: DEFAULT_PAIR,
      depth: DEFAULT_DEPTH,
      bids: [],
      asks: [],
      history: [],
      mode: OrderbookMode.LIVE,
      index: 0,
      connected: false,
      loading: false,
      error: null,
      maps: { bids: new Map(), asks: new Map() },
      client: null,
      historyLimit: HISTORY_LIMIT,
      hasConnectedOnce: false,

      // Actions
      setPair: (pair: TradingPair) => {
        set({
          pair,
          maps: { bids: new Map(), asks: new Map() },
          bids: [],
          asks: [],
          history: [],
          index: 0,
          loading: true,
        });
        const state = get();
        if (state.client) {
          reconnect();
        } else {
          set({ loading: false });
        }
      },

      setDepth: (depth: Depth) => {
        const state = get();

        if (
          state.mode === OrderbookMode.TIME_TRAVEL &&
          state.history.length > 0
        ) {
          set({ depth });
          const currentSnapshot = state.history[state.index];
          if (currentSnapshot) {
            const trimmedSnapshot = {
              ...currentSnapshot,
              bids: currentSnapshot.bids.slice(0, depth),
              asks: currentSnapshot.asks.slice(0, depth),
            };
            const updatedHistory = [...state.history];
            updatedHistory[state.index] = trimmedSnapshot;
            set({
              history: updatedHistory,
              bids: trimmedSnapshot.bids,
              asks: trimmedSnapshot.asks,
            });
          }
          return;
        }

        if (state.client && state.mode === OrderbookMode.LIVE) {
          // Disconnect immediately to stop incoming data
          if (state.client) {
            state.client.disconnect();
          }

          // Set loading state and clear data
          set({
            depth,
            loading: true,
            bids: [],
            asks: [],
            maps: { bids: new Map(), asks: new Map() },
          });

          // Reconnect with new depth
          reconnect();
        } else {
          if (state.bids.length > 0 || state.asks.length > 0) {
            const trimmedBids = state.bids.slice(0, depth);
            const trimmedAsks = state.asks.slice(0, depth);
            set({
              bids: trimmedBids,
              asks: trimmedAsks,
            });
          }
        }
      },

      connect: () => {
        const state = get();
        if (state.client) {
          state.client.disconnect();
        }
        set({ loading: true });
        const newClient = createClient();
        set({ client: newClient });
        newClient.connect(state.pair, state.depth);
      },

      disconnect: () => {
        const state = get();
        if (state.client) {
          state.client.disconnect();
        }
        stopHistoryCapture();
        set({ connected: false });
      },

      applySnapshot: (message: KrakenBookSnapshotMessage) => {
        if (message.type !== MessageType.SNAPSHOT || message.data.length === 0)
          return;

        const state = get();
        const bookData = message.data[0];
        const normalizedMessageSymbol = normalizeSymbolFromMessage(
          bookData.symbol
        );

        if (normalizedMessageSymbol !== state.pair) {
          return;
        }

        const emptyMaps: OrderbookMaps = { bids: new Map(), asks: new Map() };
        const newMaps = applySnapshot(emptyMaps, bookData);
        const snapshot = mapsToSnapshot(newMaps, state.depth, {
          bids: state.bids,
          asks: state.asks,
        });

        set({
          maps: newMaps,
          bids: snapshot.bids,
          asks: snapshot.asks,
          loading: false,
        });

        if (state.mode === OrderbookMode.LIVE) {
          get().captureHistory();
        }
      },

      applyDelta: (message: KrakenBookUpdateMessage) => {
        if (message.type !== MessageType.UPDATE || message.data.length === 0)
          return;

        const state = get();
        const bookData = message.data[0];
        const normalizedMessageSymbol = normalizeSymbolFromMessage(
          bookData.symbol
        );

        if (normalizedMessageSymbol !== state.pair) {
          return;
        }

        const newMaps = applyDelta(state.maps, bookData);

        const updatedPrices = new Set<number>();
        bookData.bids.forEach((level) => updatedPrices.add(level.price));
        bookData.asks.forEach((level) => updatedPrices.add(level.price));

        const snapshot = mapsToSnapshot(newMaps, state.depth, {
          bids: state.bids,
          asks: state.asks,
        });

        const now = Date.now();
        markUpdatedPrices(snapshot.bids, updatedPrices, now);
        markUpdatedPrices(snapshot.asks, updatedPrices, now);

        if (state.mode === OrderbookMode.LIVE) {
          set({
            maps: newMaps,
            bids: snapshot.bids,
            asks: snapshot.asks,
          });
        } else {
          set({
            maps: newMaps,
          });
        }
      },

      captureHistory: () => {
        const state = get();

        // Don't capture history when in time travel mode
        if (state.mode === OrderbookMode.TIME_TRAVEL) {
          return;
        }

        if (state.maps.bids.size === 0 || state.maps.asks.size === 0) {
          return;
        }

        const now = Date.now();
        if (now - lastCaptureAt < CAPTURE_INTERVAL_MS) {
          return;
        }
        lastCaptureAt = now;

        const liveSnapshot = mapsToSnapshot(state.maps, state.depth, {
          bids: state.bids,
          asks: state.asks,
        });

        // Ensure timestamp is always increasing to prevent chart ordering errors
        let timestamp = Date.now();
        if (state.history.length > 0) {
          const lastTimestamp =
            state.history[state.history.length - 1].timestamp;
          timestamp = Math.max(timestamp, lastTimestamp + 1);
        }

        const snapshot: OrderbookSnapshot = {
          timestamp,
          bids: [...liveSnapshot.bids],
          asks: [...liveSnapshot.asks],
        };

        set((prev: OrderbookState) => {
          const newHistory = [...prev.history, snapshot];
          const trimmedHistory =
            newHistory.length > prev.historyLimit
              ? newHistory.slice(-prev.historyLimit)
              : newHistory;

          return {
            history: trimmedHistory,
            index:
              prev.mode === OrderbookMode.LIVE
                ? trimmedHistory.length - 1
                : prev.index,
          };
        });
      },

      setMode: (mode: OrderbookMode) => {
        const state = get();
        if (mode === OrderbookMode.LIVE) {
          const currentSnapshot = mapsToSnapshot(state.maps, state.depth, {
            bids: state.bids,
            asks: state.asks,
          });

          set({
            mode: OrderbookMode.LIVE,
            index: state.history.length - 1,
            bids: currentSnapshot.bids,
            asks: currentSnapshot.asks,
          });
        } else {
          const latestIndex = state.history.length - 1;
          if (latestIndex >= 0 && state.history[latestIndex]) {
            const snapshot = state.history[latestIndex];
            set({
              mode: OrderbookMode.TIME_TRAVEL,
              index: latestIndex,
              bids: snapshot.bids,
              asks: snapshot.asks,
            });
          } else {
            set({ mode: OrderbookMode.TIME_TRAVEL });
          }
        }
      },

      setIndex: (index: number) => {
        const state = get();
        if (state.mode !== OrderbookMode.TIME_TRAVEL) {
          set({ mode: OrderbookMode.TIME_TRAVEL });
        }

        const clampedIndex = Math.max(
          0,
          Math.min(index, state.history.length - 1)
        );
        const snapshot = state.history[clampedIndex];

        if (snapshot) {
          set({
            index: clampedIndex,
            bids: snapshot.bids,
            asks: snapshot.asks,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    };
  }
);
