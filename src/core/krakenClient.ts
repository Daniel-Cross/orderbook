import {
  KrakenBookSnapshotMessage,
  KrakenBookUpdateMessage,
  KrakenSubscribeRequest,
  TradingPair,
  Depth,
  Channel,
  MessageType,
  SubscriptionStatus,
  Method,
  KRAKEN_WS_URL,
  ERROR_MESSAGES,
} from "./orderbookTypes";
import {
  ParsedWebSocketMessage,
  KrakenWebSocketMessage,
  isSystemStatus,
  isSubscriptionStatus,
  isBookMessage,
  isEventMessage,
} from "./krakenTypeGuards";
import { normalizeSymbolForApi } from "../utils/symbolNormalizer";

export interface KrakenClientCallbacks {
  onSnapshot: (message: KrakenBookSnapshotMessage) => void;
  onUpdate: (message: KrakenBookUpdateMessage) => void;
  onError: (error: Error) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export interface KrakenWebSocketClient {
  connect: (pair: TradingPair, depth: Depth) => void;
  disconnect: () => void;
  isConnected: () => boolean;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;
const UPDATE_THROTTLE_MS = 50; // Throttle updates to every 50ms

const handleMessage = (
  data: KrakenWebSocketMessage,
  callbacks: KrakenClientCallbacks
): void => {
  if (isSystemStatus(data) || isSubscriptionStatus(data)) {
    if (
      isSubscriptionStatus(data) &&
      data.status === SubscriptionStatus.ERROR
    ) {
      callbacks.onError(
        new Error(data.errorMessage || ERROR_MESSAGES.SUBSCRIPTION_FAILED)
      );
    }
    return;
  }

  if (isBookMessage(data)) {
    if (data.type === MessageType.SNAPSHOT) {
      callbacks.onSnapshot(data);
    } else if (data.type === MessageType.UPDATE) {
      callbacks.onUpdate(data);
    }
    return;
  }
};

const subscribe = (ws: WebSocket, pair: TradingPair, depth: Depth): void => {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }

  const normalizedPair = normalizeSymbolForApi(pair);

  const subscribeMessage: KrakenSubscribeRequest = {
    method: Method.SUBSCRIBE,
    params: {
      channel: Channel.BOOK,
      symbol: [normalizedPair],
      depth: depth,
      snapshot: true,
    },
  };

  ws.send(JSON.stringify(subscribeMessage));
};

export const createKrakenWebSocketClient = (
  callbacks: KrakenClientCallbacks
): KrakenWebSocketClient => {
  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastUpdateTime = 0;
  let pendingUpdate: KrakenBookUpdateMessage | null = null;
  let throttleTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const attemptReconnect = (pair: TradingPair, depth: Depth): void => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      // Exhausted all reconnection attempts
      callbacks.onError(new Error(ERROR_MESSAGES.MAX_RECONNECT_ATTEMPTS));
      return;
    }

    reconnectAttempts++;
    reconnectTimeoutId = setTimeout(() => {
      connect(pair, depth);
    }, RECONNECT_DELAY * reconnectAttempts);
  };

  const processThrottledUpdate = (): void => {
    if (pendingUpdate) {
      callbacks.onUpdate(pendingUpdate);
      pendingUpdate = null;
      lastUpdateTime = Date.now();
    }
    throttleTimeoutId = null;
  };

  const handleThrottledUpdate = (update: KrakenBookUpdateMessage): void => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;

    if (timeSinceLastUpdate >= UPDATE_THROTTLE_MS) {
      // Enough time has passed, process immediately
      callbacks.onUpdate(update);
      lastUpdateTime = now;
      pendingUpdate = null;

      if (throttleTimeoutId) {
        clearTimeout(throttleTimeoutId);
        throttleTimeoutId = null;
      }
    } else {
      // Store the latest update and schedule processing
      pendingUpdate = update;

      if (!throttleTimeoutId) {
        throttleTimeoutId = setTimeout(
          processThrottledUpdate,
          UPDATE_THROTTLE_MS - timeSinceLastUpdate
        );
      }
    }
  };

  const connect = (pair: TradingPair, depth: Depth): void => {
    if (ws?.readyState === WebSocket.OPEN) {
      disconnect();
    }

    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
    }

    try {
      ws = new WebSocket(KRAKEN_WS_URL);
      reconnectAttempts = 0;
      lastUpdateTime = 0;
      pendingUpdate = null;

      ws.onopen = () => {
        callbacks.onConnect();
        subscribe(ws!, pair, depth);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as ParsedWebSocketMessage;

          if (
            isSystemStatus(parsed) ||
            isSubscriptionStatus(parsed) ||
            isEventMessage(parsed)
          ) {
            handleMessage(parsed as KrakenWebSocketMessage, callbacks);
            return;
          }

          if (isBookMessage(parsed)) {
            if (parsed.type === MessageType.SNAPSHOT) {
              // Always process snapshots immediately
              callbacks.onSnapshot(parsed);
            } else if (parsed.type === MessageType.UPDATE) {
              // Throttle updates
              handleThrottledUpdate(parsed);
            }
          }
        } catch (error) {
          console.error(
            "Failed to parse WebSocket message:",
            error,
            event.data
          );
          callbacks.onError(
            error instanceof Error
              ? error
              : new Error(ERROR_MESSAGES.PARSE_MESSAGE_FAILED)
          );
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
      };

      ws.onclose = () => {
        callbacks.onDisconnect();
        attemptReconnect(pair, depth);
      };
    } catch (error) {
      callbacks.onError(
        error instanceof Error
          ? error
          : new Error(ERROR_MESSAGES.CONNECTION_FAILED)
      );
    }
  };

  const disconnect = (): void => {
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
    }

    if (throttleTimeoutId) {
      clearTimeout(throttleTimeoutId);
      throttleTimeoutId = null;
    }

    pendingUpdate = null;
    lastUpdateTime = 0;

    if (ws) {
      ws.onclose = null; // Prevent reconnection attempt
      ws.close();
      ws = null;
    }
    reconnectAttempts = 0;
  };

  const isConnected = (): boolean => {
    return ws?.readyState === WebSocket.OPEN;
  };

  return {
    connect,
    disconnect,
    isConnected,
  };
};
