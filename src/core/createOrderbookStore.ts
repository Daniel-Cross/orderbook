import { create } from "zustand";
import {
  OrderLevel,
  OrderbookSnapshot,
  KrakenBookMessage,
  KrakenBookSnapshotMessage,
  KrakenBookUpdateMessage,
  OrderbookMode,
  TradingPair,
  Depth,
  AVAILABLE_PAIRS,
  AVAILABLE_DEPTHS,
  MessageType,
  PAIR_PREFIX_XBT,
  PAIR_PREFIX_BTC,
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
const HISTORY_LIMIT = 800;
const CAPTURE_INTERVAL_MS = 250;

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
          if (get().mode === OrderbookMode.LIVE) {
            get().applyDelta(message);
          }
        },
        onError: (error) => {
          set({ error: error.message });
        },
        onConnect: () => {
          set({ connected: true, error: null });
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

      // Actions
      setPair: (pair: TradingPair) => {
        // Purge all data when changing pairs
        set({
          pair,
          maps: { bids: new Map(), asks: new Map() }, // Reset maps when changing pair
          bids: [],
          asks: [],
          history: [], // Clear history when changing pairs
          index: 0, // Reset history index
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
        const previousDepth = state.depth;

        // Set loading state immediately when depth changes
        set({ depth, loading: true });

        // If in time travel mode, update immediately (no reconnection needed)
        if (
          state.mode === OrderbookMode.TIME_TRAVEL &&
          state.history.length > 0
        ) {
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
              loading: false,
            });
          } else {
            set({ loading: false });
          }
          return;
        }

        // For live mode: clear existing data and show loading while reconnecting
        // Don't show trimmed data - show loading state instead
        if (state.client && state.mode === OrderbookMode.LIVE) {
          // Clear the data to show loading state
          set({
            bids: [],
            asks: [],
            maps: { bids: new Map(), asks: new Map() },
          });
          reconnect();
        } else {
          // No client or not in live mode - just update depth
          if (state.bids.length > 0 || state.asks.length > 0) {
            const trimmedBids = state.bids.slice(0, depth);
            const trimmedAsks = state.asks.slice(0, depth);
            set({
              bids: trimmedBids,
              asks: trimmedAsks,
              loading: false,
            });
          } else {
            set({ loading: false });
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
        const bookData = message.data[0]; // First element contains the book data

        // Validate that this message is for the current pair
        // API returns symbols in BTC format for XBT pairs (e.g., "BTC/USD"), we store in XBT format (e.g., "XBT/USD")
        // For other pairs, symbols match directly (e.g., "ETH/USD")
        const normalizedMessageSymbol = bookData.symbol.startsWith(
          PAIR_PREFIX_BTC
        )
          ? bookData.symbol.replace(PAIR_PREFIX_BTC, PAIR_PREFIX_XBT)
          : bookData.symbol;

        // Only process if the symbol matches the current pair
        if (normalizedMessageSymbol !== state.pair) {
          console.warn(
            `Ignoring snapshot for ${bookData.symbol} (normalized: ${normalizedMessageSymbol}), current pair is ${state.pair}`
          );
          return;
        }

        console.log("applySnapshot called with:", message);

        // Create fresh maps for snapshot (don't use existing maps)
        const emptyMaps: OrderbookMaps = { bids: new Map(), asks: new Map() };
        const newMaps = applySnapshot(emptyMaps, bookData);
        const snapshot = mapsToSnapshot(newMaps, state.depth, {
          bids: state.bids,
          asks: state.asks,
        });

        console.log(
          "Snapshot processed, bids:",
          snapshot.bids.length,
          "asks:",
          snapshot.asks.length
        );

        set({
          maps: newMaps,
          bids: snapshot.bids,
          asks: snapshot.asks,
          loading: false,
        });

        // Capture to history if in live mode
        if (state.mode === OrderbookMode.LIVE) {
          get().captureHistory();
        }
      },

      applyDelta: (message: KrakenBookUpdateMessage) => {
        if (message.type !== MessageType.UPDATE || message.data.length === 0)
          return;

        const state = get();
        if (state.mode !== OrderbookMode.LIVE) return;

        const bookData = message.data[0]; // First element contains the book data

        // Validate that this message is for the current pair
        // API returns symbols in BTC format for XBT pairs (e.g., "BTC/USD"), we store in XBT format (e.g., "XBT/USD")
        // For other pairs, symbols match directly (e.g., "ETH/USD")
        const normalizedMessageSymbol = bookData.symbol.startsWith(
          PAIR_PREFIX_BTC
        )
          ? bookData.symbol.replace(PAIR_PREFIX_BTC, PAIR_PREFIX_XBT)
          : bookData.symbol;

        // Only process if the symbol matches the current pair
        if (normalizedMessageSymbol !== state.pair) {
          console.warn(
            `Ignoring update for ${bookData.symbol} (normalized: ${normalizedMessageSymbol}), current pair is ${state.pair}`
          );
          return;
        }

        const newMaps = applyDelta(state.maps, bookData);

        // Track which prices were updated in this delta
        const updatedPrices = new Set<number>();
        bookData.bids.forEach((level) => updatedPrices.add(level.price));
        bookData.asks.forEach((level) => updatedPrices.add(level.price));

        const snapshot = mapsToSnapshot(newMaps, state.depth, {
          bids: state.bids,
          asks: state.asks,
        });

        // Mark updated prices with current timestamp
        const now = Date.now();
        snapshot.bids.forEach((level) => {
          if (updatedPrices.has(level.price)) {
            level.lastUpdated = now;
          }
        });
        snapshot.asks.forEach((level) => {
          if (updatedPrices.has(level.price)) {
            level.lastUpdated = now;
          }
        });

        set({
          maps: newMaps,
          bids: snapshot.bids,
          asks: snapshot.asks,
        });
      },

      captureHistory: () => {
        const state = get();
        if (
          state.mode !== OrderbookMode.LIVE ||
          state.bids.length === 0 ||
          state.asks.length === 0
        ) {
          return;
        }

        const snapshot: OrderbookSnapshot = {
          timestamp: Date.now(),
          bids: [...state.bids],
          asks: [...state.asks],
        };

        set((prev: OrderbookState) => {
          const newHistory = [...prev.history, snapshot];
          // Limit history length
          const trimmedHistory =
            newHistory.length > prev.historyLimit
              ? newHistory.slice(-prev.historyLimit)
              : newHistory;

          return {
            history: trimmedHistory,
            index: trimmedHistory.length - 1,
          };
        });
      },

      setMode: (mode: OrderbookMode) => {
        const state = get();
        if (mode === OrderbookMode.LIVE) {
          // Return to latest snapshot
          const latestIndex = state.history.length - 1;
          if (latestIndex >= 0 && state.history[latestIndex]) {
            const latest = state.history[latestIndex];
            set({
              mode: OrderbookMode.LIVE,
              index: latestIndex,
              bids: latest.bids,
              asks: latest.asks,
            });
          } else {
            set({ mode: OrderbookMode.LIVE });
          }
          startHistoryCapture();
        } else {
          // Enter time travel mode
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
          stopHistoryCapture();
        }
      },

      setIndex: (index: number) => {
        const state = get();
        if (state.mode !== OrderbookMode.TIME_TRAVEL) {
          set({ mode: OrderbookMode.TIME_TRAVEL });
          stopHistoryCapture();
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
