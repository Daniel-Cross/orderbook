/**
 * Core type definitions for the orderbook system
 */

export enum OrderbookMode {
  LIVE = "live",
  TIME_TRAVEL = "timeTravel",
}

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

export enum MessageType {
  SNAPSHOT = "snapshot",
  UPDATE = "update",
}

export enum Channel {
  BOOK = "book",
}

export enum EventType {
  SYSTEM_STATUS = "systemStatus",
  SUBSCRIPTION_STATUS = "subscriptionStatus",
}

export enum SubscriptionStatus {
  SUBSCRIBED = "subscribed",
  ERROR = "error",
}

export enum SystemStatus {
  ONLINE = "online",
  MAINTENANCE = "maintenance",
}

export enum Method {
  SUBSCRIBE = "subscribe",
  UNSUBSCRIBE = "unsubscribe",
}

// Pair normalization constants
export const PAIR_PREFIX_XBT = "XBT/";
export const PAIR_PREFIX_BTC = "BTC/";

// WebSocket URL
export const KRAKEN_WS_URL = "wss://ws.kraken.com/v2";

// Error messages
export const ERROR_MESSAGES = {
  SUBSCRIPTION_FAILED: "Subscription failed",
  MAX_RECONNECT_ATTEMPTS: "Max reconnection attempts reached",
  PARSE_MESSAGE_FAILED: "Failed to parse WebSocket message",
  WEBSOCKET_ERROR: "WebSocket error occurred",
  CONNECTION_FAILED: "Failed to create WebSocket connection",
} as const;

export interface OrderLevel {
  price: number;
  size: number;
  lastUpdated?: number; // Timestamp when this level was last updated
}

export interface OrderbookSnapshot {
  timestamp: number;
  bids: OrderLevel[];
  asks: OrderLevel[];
}

// Kraken WebSocket API v2 Types (from https://docs.kraken.com/api/docs/websocket-v2/book)

export interface KrakenBookLevel {
  price: number;
  qty: number;
}

export interface KrakenBookData {
  symbol: string;
  bids: KrakenBookLevel[];
  asks: KrakenBookLevel[];
  checksum: number;
  timestamp?: string; // Present in updates, not in snapshots
}

export interface KrakenBookSnapshotMessage {
  channel: Channel.BOOK;
  type: MessageType.SNAPSHOT;
  data: KrakenBookData[];
}

export interface KrakenBookUpdateMessage {
  channel: Channel.BOOK;
  type: MessageType.UPDATE;
  data: KrakenBookData[];
}

export type KrakenBookMessage =
  | KrakenBookSnapshotMessage
  | KrakenBookUpdateMessage;

export interface KrakenSubscribeRequest {
  method: Method.SUBSCRIBE;
  params: {
    channel: Channel.BOOK;
    symbol: string[];
    depth?: number;
    snapshot?: boolean;
    req_id?: number;
  };
}

export interface KrakenSubscribeAck {
  method: Method.SUBSCRIBE;
  result: {
    channel: Channel.BOOK;
    symbol: string;
    depth: number;
    snapshot: boolean;
    warnings?: string[];
  };
  success: boolean;
  error?: string;
  time_in: string;
  time_out: string;
  req_id?: number;
}

export interface KrakenUnsubscribeRequest {
  method: Method.UNSUBSCRIBE;
  params: {
    channel: Channel.BOOK;
    symbol: string[];
    depth?: number;
    req_id?: number;
  };
}

export interface KrakenUnsubscribeAck {
  method: Method.UNSUBSCRIBE;
  result: {
    channel: Channel.BOOK;
    symbol: string;
    depth: number;
  };
  success: boolean;
  error?: string;
  time_in: string;
  time_out: string;
  req_id?: number;
}

export interface KrakenSystemStatusMessage {
  event: EventType.SYSTEM_STATUS;
  version: string;
  status: SystemStatus;
  connectionID: number;
}

export interface KrakenSubscriptionStatusMessage {
  event: EventType.SUBSCRIPTION_STATUS;
  status: SubscriptionStatus;
  errorMessage?: string;
}

export type KrakenEventMessage = KrakenSubscribeAck | KrakenUnsubscribeAck;

export const AVAILABLE_PAIRS = [
  "XBT/USD",
  "ETH/USD",
  "SOL/EUR",
  "ADA/USD",
  "DOT/USD",
  "MATIC/USD",
] as const;

export const AVAILABLE_DEPTHS = [10, 25, 100, 500, 1000] as const;

export type TradingPair = (typeof AVAILABLE_PAIRS)[number];
export type Depth = (typeof AVAILABLE_DEPTHS)[number];
