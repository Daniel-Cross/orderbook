# Kraken Orderbook Visualizer

A production-ready React + TypeScript application for visualizing the real-time Kraken orderbook (WebSocket API v2) with time-travel history and a live mid-price chart.

## Features

- Real-time orderbook via Kraken WebSocket API v2 (`book` channel)
- Pair selector (XBT/USD, ETH/USD, SOL/EUR, ADA/USD, DOT/USD, MATIC/USD)
- Depth selector (10, 25, 100, 500, 1000) with clean reconnects and loading state
- Time travel slider over captured snapshots; “Back to Live” button
- Visual depth bars (CSS only), optional spread display, green/red highlights on updated levels
- Live mid-price chart (lightweight-charts) fed by snapshot history
- Headless state logic (Zustand) separated from presentational UI

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Install

```bash
npm install
```

### Run (dev)

```bash
npm start
```

Open `http://localhost:3000`.

### Hosted Demo

- Live demo (no local setup): https://orderbook-ochre.vercel.app/

### Build (prod)

```bash
npm run build
```

## Usage

- **Switch pairs**: Use the pair dropdown. We purge prior data, reconnect, and only process messages for the selected pair.
- **Adjust depth**: Use the depth dropdown. We clear current rows, reconnect with the new depth, and show a loading state until the first snapshot arrives.
- **Time travel**: Enter via the controls, drag the slider through captured snapshots, and click “Back to Live” to resume realtime. History capture pauses while in time travel.
- **History & chart cadence**: Snapshots are captured every ~2s in live mode, up to 1800 snapshots (~1 hour). The mid-price chart is fed from this history; give it a few seconds on startup or after pair/depth changes to populate.
- **Spread & highlights**: Optional spread display (absolute + %) and recent-update highlights (green/red) to show where the action is.

## Reusability / Embedding

- **Drop-in component**: Use `OrderbookVisualizer` in any React app; the chart is optional (omit `PriceChart` if you only need the book).
- **Headless core**: Consume the store/engine directly to build custom UIs while keeping Kraken connectivity:
  - `createOrderbookStore` for connection, state, history, modes
  - `orderbookEngine` for snapshot/delta application and sorting
  - `krakenClient` for WebSocket lifecycle
- **Example (component)**:

  ```tsx
  import { OrderbookVisualizer } from "./components/OrderbookVisualizer";

  export const App = () => (
    <OrderbookVisualizer
      initialPair="XBT/USD"
      initialDepth={25}
      enableTimeTravel
      showSpread
    />
  );
  ```

- **Example (headless state)**:

  ```ts
  import { useOrderbookStore } from "./core/createOrderbookStore";

  const bids = useOrderbookStore((s) => s.bids);
  const asks = useOrderbookStore((s) => s.asks);
  // Render your own UI; the store manages Kraken updates.
  ```

- **Packaging**: The code is structured to be publishable as a small npm package (core + components). Add an entry-point that re-exports the pieces you want to expose and run a build before publishing. Until then, you can consume it via a path or git dependency.

## Architecture

### Core Logic (`src/core/`)

- `orderbookTypes.ts`: types/enums/constants
- `orderbookEngine.ts`: pure orderbook math (apply snapshot/delta, sort, depth limit)
- `createOrderbookStore.ts`: headless Zustand store (WS lifecycle, history, modes, loading)
- `krakenClient.ts`: functional WS client (subscribe, parse, reconnect)

### Components (`src/components/`)

- `OrderbookVisualizer.tsx`: top-level container
- `OrderbookTable.tsx`: asks/spread/bids with depth bars and highlights
- `TimeTravelControls.tsx`: slider + live toggle
- `PairSelector.tsx`, `DepthSelector.tsx`
- `PriceChart.tsx`: mid-price chart (lightweight-charts)

### State Management

- Headless store tracks connection, maps, sorted bids/asks, history, loading, errors, modes.
- UI reads via selectors to avoid unnecessary re-renders.

## How It Works

### WebSocket Connection

1. Connect to `wss://ws.kraken.com/v2`.
2. Subscribe to `book` with current pair/depth (BTC format for API, normalized internally to XBT).
3. Snapshot: build maps → sorted arrays → UI.
4. Update: apply deltas → resort → UI.
5. Ignore messages for other pairs.
6. Reconnect on pair/depth change or disconnect.

### Orderbook Processing

- Internal state uses `Map<string, string>` to preserve precision.
- Snapshots replace the book; deltas add/update/remove levels.
- Bids sorted descending, asks ascending; truncated to selected depth.

### History Capture

- Snapshots every ~2s in live mode.
- Max 1800 snapshots (oldest dropped).

## Development

### Project Structure

```
src/
  core/              # Pure TypeScript logic
  components/        # React components
  examples/          # Example usage
  styles/            # CSS styles
  docs/              # Documentation
```

## License

MIT
