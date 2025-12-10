import {
  KrakenSystemStatusMessage,
  KrakenSubscriptionStatusMessage,
  KrakenBookMessage,
  KrakenEventMessage,
  KrakenBookLevel,
  KrakenBookData,
  EventType,
  Method,
  Channel,
  MessageType,
} from "./orderbookTypes";

export interface UnvalidatedObject {
  [key: string]: unknown;
}

export type ParsedWebSocketMessage =
  | KrakenSystemStatusMessage
  | KrakenSubscriptionStatusMessage
  | KrakenBookMessage
  | KrakenEventMessage
  | UnvalidatedObject;

export type KrakenWebSocketMessage =
  | KrakenSystemStatusMessage
  | KrakenSubscriptionStatusMessage
  | KrakenBookMessage
  | KrakenEventMessage;

export const isSystemStatus = (
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

export const isSubscriptionStatus = (
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

export const isEventMessage = (
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

export const isKrakenBookLevel = (item: unknown): item is KrakenBookLevel => {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const level = item as UnvalidatedObject;
  return (
    "price" in level &&
    "qty" in level &&
    typeof level.price === "number" &&
    typeof level.qty === "number"
  );
};

export const isBookLevelArray = (data: unknown): data is KrakenBookLevel[] => {
  return Array.isArray(data) && data.every(isKrakenBookLevel);
};

export const isKrakenBookData = (data: unknown): data is KrakenBookData => {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as UnvalidatedObject;
  return (
    "symbol" in obj &&
    "bids" in obj &&
    "asks" in obj &&
    "checksum" in obj &&
    typeof obj.symbol === "string" &&
    isBookLevelArray(obj.bids) &&
    isBookLevelArray(obj.asks) &&
    typeof obj.checksum === "number" &&
    (obj.timestamp === undefined || typeof obj.timestamp === "string")
  );
};

export const isBookMessage = (
  data: ParsedWebSocketMessage
): data is KrakenBookMessage => {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as UnvalidatedObject;
  return (
    "channel" in obj &&
    "type" in obj &&
    "data" in obj &&
    obj.channel === Channel.BOOK &&
    (obj.type === MessageType.SNAPSHOT || obj.type === MessageType.UPDATE) &&
    Array.isArray(obj.data) &&
    obj.data.length > 0 &&
    isKrakenBookData(obj.data[0])
  );
};
