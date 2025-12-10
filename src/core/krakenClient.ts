/**
 * Kraken WebSocket client - Modern functional approach
 */

import {
  KrakenBookMessage,
  KrakenBookSnapshotMessage,
  KrakenBookUpdateMessage,
  KrakenSubscribeRequest,
  KrakenEventMessage,
  KrakenSystemStatusMessage,
  KrakenSubscriptionStatusMessage,
  TradingPair,
  Depth,
  Channel,
  MessageType,
  EventType,
  SubscriptionStatus,
  Method,
  PAIR_PREFIX_XBT,
  PAIR_PREFIX_BTC,
  KRAKEN_WS_URL,
  ERROR_MESSAGES,
} from "./orderbookTypes";

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

// Type guards - validating against actual API structure from docs
type ParsedWebSocketMessage =
  | KrakenSystemStatusMessage
  | KrakenSubscriptionStatusMessage
  | KrakenBookMessage
  | KrakenEventMessage
  | Record<string, unknown>; // For initial parsing before validation

const isSystemStatus = (
  data: ParsedWebSocketMessage
): data is KrakenSystemStatusMessage => {
  return (
    typeof data === "object" &&
    data !== null &&
    "event" in data &&
    data.event === EventType.SYSTEM_STATUS &&
    "version" in data &&
    "status" in data &&
    "connectionID" in data &&
    typeof data.version === "string" &&
    typeof data.status === "string" &&
    typeof data.connectionID === "number"
  );
};

const isSubscriptionStatus = (
  data: ParsedWebSocketMessage
): data is KrakenSubscriptionStatusMessage => {
  return (
    typeof data === "object" &&
    data !== null &&
    "event" in data &&
    data.event === EventType.SUBSCRIPTION_STATUS &&
    "status" in data &&
    typeof data.status === "string"
  );
};

const isEventMessage = (
  data: ParsedWebSocketMessage
): data is KrakenEventMessage => {
  return (
    typeof data === "object" &&
    data !== null &&
    "method" in data &&
    (data.method === Method.SUBSCRIBE || data.method === Method.UNSUBSCRIBE) &&
    "result" in data &&
    typeof data.result === "object" &&
    data.result !== null
  );
};

const isKrakenBookLevel = (
  item: unknown
): item is import("./orderbookTypes").KrakenBookLevel => {
  return (
    typeof item === "object" &&
    item !== null &&
    "price" in item &&
    "qty" in item &&
    typeof (item as { price: number }).price === "number" &&
    typeof (item as { qty: number }).qty === "number"
  );
};

const isBookLevelArray = (
  data: unknown
): data is import("./orderbookTypes").KrakenBookLevel[] => {
  return Array.isArray(data) && data.every(isKrakenBookLevel);
};

const isKrakenBookData = (
  data: unknown
): data is import("./orderbookTypes").KrakenBookData => {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as {
    symbol?: unknown;
    bids?: unknown;
    asks?: unknown;
    checksum?: unknown;
    timestamp?: unknown;
  };

  return (
    typeof obj.symbol === "string" &&
    isBookLevelArray(obj.bids) &&
    isBookLevelArray(obj.asks) &&
    typeof obj.checksum === "number" &&
    (obj.timestamp === undefined || typeof obj.timestamp === "string")
  );
};

const isBookMessage = (
  data: ParsedWebSocketMessage
): data is KrakenBookMessage => {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as {
    channel?: unknown;
    type?: unknown;
    data?: unknown;
  };

  return (
    obj.channel === Channel.BOOK &&
    (obj.type === MessageType.SNAPSHOT || obj.type === MessageType.UPDATE) &&
    Array.isArray(obj.data) &&
    obj.data.length > 0 &&
    isKrakenBookData(obj.data[0])
  );
};

type KrakenWebSocketMessage =
  | KrakenSystemStatusMessage
  | KrakenSubscriptionStatusMessage
  | KrakenBookMessage
  | KrakenEventMessage;

const handleMessage = (
  data: KrakenWebSocketMessage,
  callbacks: KrakenClientCallbacks
): void => {
  // Handle system status and subscription status messages
  if (isSystemStatus(data) || isSubscriptionStatus(data)) {
    if (
      isSubscriptionStatus(data) &&
      data.status === SubscriptionStatus.ERROR
    ) {
      console.error("Subscription error:", data);
      callbacks.onError(
        new Error(data.errorMessage || ERROR_MESSAGES.SUBSCRIPTION_FAILED)
      );
    } else {
      console.log("Status message received:", data);
    }
    return;
  }

  // Handle book messages (snapshot or update)
  if (isBookMessage(data)) {
    if (data.type === MessageType.SNAPSHOT) {
      console.log("Snapshot received:", data);
      callbacks.onSnapshot(data);
    } else if (data.type === MessageType.UPDATE) {
      console.log("Update received:", data);
      callbacks.onUpdate(data);
    }
    return;
  }

  console.warn("Unhandled message format:", data);
};

const subscribe = (ws: WebSocket, pair: TradingPair, depth: Depth): void => {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }

  // Convert XBT to BTC for Kraken v2 API
  const normalizedPair = pair.replace(PAIR_PREFIX_XBT, PAIR_PREFIX_BTC);

  const subscribeMessage: KrakenSubscribeRequest = {
    method: Method.SUBSCRIBE,
    params: {
      channel: Channel.BOOK,
      symbol: [normalizedPair],
      depth: depth,
      snapshot: true,
    },
  };

  console.log("Sending subscription:", subscribeMessage);
  ws.send(JSON.stringify(subscribeMessage));
};

export const createKrakenWebSocketClient = (
  callbacks: KrakenClientCallbacks
): KrakenWebSocketClient => {
  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const attemptReconnect = (pair: TradingPair, depth: Depth): void => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      callbacks.onError(new Error(ERROR_MESSAGES.MAX_RECONNECT_ATTEMPTS));
      return;
    }

    reconnectAttempts++;
    reconnectTimeoutId = setTimeout(() => {
      connect(pair, depth);
    }, RECONNECT_DELAY * reconnectAttempts);
  };

  const connect = (pair: TradingPair, depth: Depth): void => {
    if (ws?.readyState === WebSocket.OPEN) {
      disconnect();
    }

    // Clear any pending reconnection
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
    }

    try {
      ws = new WebSocket(KRAKEN_WS_URL);
      reconnectAttempts = 0;

      ws.onopen = () => {
        callbacks.onConnect();
        subscribe(ws!, pair, depth);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as ParsedWebSocketMessage;
          console.log("WebSocket message received:", parsed);

          // Validate and narrow to proper type
          if (
            isSystemStatus(parsed) ||
            isSubscriptionStatus(parsed) ||
            isBookMessage(parsed) ||
            isEventMessage(parsed)
          ) {
            handleMessage(parsed as KrakenWebSocketMessage, callbacks);
          } else {
            console.warn("Unrecognized message format:", parsed);
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

      ws.onerror = () => {
        callbacks.onError(new Error(ERROR_MESSAGES.WEBSOCKET_ERROR));
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

    if (ws) {
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
