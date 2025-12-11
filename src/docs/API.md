# API Documentation

## Core Types

### `OrderLevel`

Represents a single price level in the orderbook.

```typescript
interface OrderLevel {
  price: number;
  size: number;
}
```

### `OrderbookSnapshot`

A complete snapshot of the orderbook at a point in time.

```typescript
interface OrderbookSnapshot {
  timestamp: number;
  bids: OrderLevel[];
  asks: OrderLevel[];
}
```

### `OrderbookMode`

The current mode of the orderbook visualizer.

```typescript
type OrderbookMode = "live" | "timeTravel";
```

### `TradingPair`

Available trading pairs.

```typescript
type TradingPair =
  | "XBT/USD"
  | "ETH/USD"
  | "SOL/EUR"
  | "ADA/USD"
  | "DOT/USD"
  | "MATIC/USD";
```

### `Depth`

Available depth options.

```typescript
type Depth = 10 | 25 | 100 | 500 | 1000;
```

## Zustand Store API

### `useOrderbookStore`

The main Zustand store hook for accessing orderbook state.

#### State Selectors

```typescript
// Get current pair
const pair = useOrderbookStore((s) => s.pair);

// Get current depth
const depth = useOrderbookStore((s) => s.depth);

// Get bids array
const bids = useOrderbookStore((s) => s.bids);

// Get asks array
const asks = useOrderbookStore((s) => s.asks);

// Get history array
const history = useOrderbookStore((s) => s.history);

// Get current mode
const mode = useOrderbookStore((s) => s.mode);

// Get current history index
const index = useOrderbookStore((s) => s.index);

// Get connection status
const connected = useOrderbookStore((s) => s.connected);

// Get error message
const error = useOrderbookStore((s) => s.error);
```

#### Actions

```typescript
// Change trading pair (triggers reconnection)
const setPair = useOrderbookStore((s) => s.setPair);
setPair("ETH/USD");

// Change depth (triggers reconnection)
const setDepth = useOrderbookStore((s) => s.setDepth);
setDepth(25);

// Connect WebSocket
const connect = useOrderbookStore((s) => s.connect);
connect();

// Disconnect WebSocket
const disconnect = useOrderbookStore((s) => s.disconnect);
disconnect();

// Set mode
const setMode = useOrderbookStore((s) => s.setMode);
setMode("timeTravel");

// Set history index
const setIndex = useOrderbookStore((s) => s.setIndex);
setIndex(100);

// Clear error
const clearError = useOrderbookStore((s) => s.clearError);
clearError();
```

## Component API

### `<OrderbookVisualizer />`

Main component for displaying the orderbook.

#### Props

```typescript
interface OrderbookVisualizerProps {
  initialPair: TradingPair; // Required: Initial trading pair
  initialDepth?: Depth; // Optional: Initial depth (default: 10)
  enableTimeTravel?: boolean; // Optional: Enable time travel (default: false)
  showSpread?: boolean; // Optional: Show spread (default: false)
}
```

#### Example

```typescript
<OrderbookVisualizer
  initialPair="XBT/USD"
  initialDepth={10}
  enableTimeTravel
  showSpread
/>
```

### `<OrderbookTable />`

Displays the orderbook in a two-column layout.

#### Props

```typescript
interface OrderbookTableProps {
  showSpread?: boolean; // Optional: Show spread display (default: false)
}
```

### `<TimeTravelControls />`

Controls for navigating orderbook history.

No props required. Automatically reads from Zustand store.

### `<PairSelector />`

Dropdown for selecting trading pairs.

No props required. Automatically reads from and updates Zustand store.

### `<DepthSelector />`

Dropdown for selecting orderbook depth.

No props required. Automatically reads from and updates Zustand store.

## Engine Functions

### `applySnapshot(maps, snapshot)`

Apply a snapshot to orderbook maps.

```typescript
function applySnapshot(
  maps: OrderbookMaps,
  snapshot: { bids: Array<[string, string]>; asks: Array<[string, string]> }
): OrderbookMaps;
```

### `applyDelta(maps, delta)`

Apply a delta update to orderbook maps.

```typescript
function applyDelta(
  maps: OrderbookMaps,
  delta: { bids: Array<[string, string]>; asks: Array<[string, string]> }
): OrderbookMaps;
```

### `mapsToSnapshot(maps, depth)`

Convert orderbook maps to a sorted snapshot.

```typescript
function mapsToSnapshot(maps: OrderbookMaps, depth: number): OrderbookSnapshot;
```

### `calculateCumulative(levels)`

Calculate cumulative sizes for visualization.

```typescript
function calculateCumulative(levels: OrderLevel[]): number[];
```

### `calculateSpread(bids, asks)`

Calculate the spread between best bid and ask.

```typescript
function calculateSpread(bids: OrderLevel[], asks: OrderLevel[]): number | null;
```

## WebSocket Client

### `KrakenWebSocketClient`

Class for managing Kraken WebSocket connections.

#### Constructor

```typescript
new KrakenWebSocketClient(callbacks: KrakenClientCallbacks)
```

#### Methods

```typescript
// Connect to WebSocket and subscribe
connect(pair: TradingPair, depth: Depth): void

// Disconnect from WebSocket
disconnect(): void

// Check if connected
isConnected(): boolean
```

#### Callbacks

```typescript
interface KrakenClientCallbacks {
  onSnapshot: (message: KrakenBookMessage) => void;
  onUpdate: (message: KrakenBookMessage) => void;
  onError: (error: Error) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}
```

## Constants

### `AVAILABLE_PAIRS`

Array of available trading pairs.

```typescript
const AVAILABLE_PAIRS = [
  "XBT/USD",
  "ETH/USD",
  "SOL/EUR",
  "ADA/USD",
  "DOT/USD",
  "MATIC/USD",
] as const;
```

### `AVAILABLE_DEPTHS`

Array of available depth options.

```typescript
const AVAILABLE_DEPTHS = [10, 25, 100, 500, 1000] as const;
```

## Kraken WebSocket Protocol

### Connection

- **URL**: `wss://ws.kraken.com`
- **Protocol**: WebSocket

### Subscribe Message

```json
{
  "method": "subscribe",
  "params": {
    "channel": "book",
    "symbol": ["XBT/USD"],
    "depth": 10
  }
}
```

### Snapshot Message

```json
{
  "type": "snapshot",
  "data": {
    "bids": [["50000.00", "1.5"], ...],
    "asks": [["50001.00", "2.0"], ...]
  }
}
```

### Update Message

```json
{
  "type": "update",
  "data": {
    "bids": [["50000.00", "1.8"], ...],
    "asks": [["50001.00", "0"], ...]
  }
}
```

Note: Size of `"0"` in updates means remove that price level.
