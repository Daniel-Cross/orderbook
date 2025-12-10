# Kraken Orderbook Visualizer

A production-ready React + TypeScript application for visualizing real-time orderbook data from the Kraken cryptocurrency exchange using WebSocket API v2.

## Features

- **Real-time Orderbook**: Live updates via Kraken WebSocket API v2
- **Multiple Trading Pairs**: Switch between different cryptocurrency pairs
- **Configurable Depth**: Adjust orderbook depth (10, 25, 100, 500, 1000)
- **Time Travel**: Navigate through historical snapshots with a slider
- **Visual Depth Bars**: CSS-based depth visualization (no chart libraries)
- **Spread Display**: Real-time bid-ask spread calculation
- **Clean Architecture**: Separation of concerns with headless state management

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Running the Application

```bash
npm start
```

The application will open at `http://localhost:3000`.

## Usage

### Switching Trading Pairs

Use the "Trading Pair" dropdown in the top controls to switch between available pairs:
- XBT/USD
- ETH/USD
- SOL/EUR
- ADA/USD
- DOT/USD
- MATIC/USD

The WebSocket connection will automatically reconnect when you change pairs.

### Adjusting Depth

Use the "Depth" dropdown to control how many price levels are displayed:
- 10 (default)
- 25
- 100
- 500
- 1000

Changing depth will reconnect the WebSocket with the new depth parameter.

### Time Travel Mode

When `enableTimeTravel` is enabled:

1. **Enter Time Travel**: Click the history slider or use the time travel controls
2. **Navigate History**: Use the slider to move through historical snapshots
3. **View Timestamp**: The current snapshot's timestamp is displayed
4. **Back to Live**: Click "Back to Live" to return to real-time updates

The system automatically captures snapshots every 250ms when in live mode, storing up to 800 snapshots.

### Spread Display

When `showSpread` is enabled, the application displays:
- Absolute spread (best ask - best bid)
- Percentage spread relative to the best bid

## Architecture

### Core Logic (`src/core/`)

- **`orderbookTypes.ts`**: TypeScript type definitions
- **`orderbookEngine.ts`**: Pure functions for applying snapshots/deltas, sorting, and depth limiting
- **`createOrderbookStore.ts`**: Zustand store managing global state
- **`krakenClient.ts`**: WebSocket client with automatic reconnection

### Components (`src/components/`)

- **`OrderbookVisualizer.tsx`**: Main component orchestrating the orderbook display
- **`OrderbookTable.tsx`**: Two-column layout for bids and asks
- **`TimeTravelControls.tsx`**: Slider and controls for history navigation
- **`PairSelector.tsx`**: Trading pair dropdown
- **`DepthSelector.tsx`**: Depth selection dropdown

### State Management

The application uses Zustand for global state management. The store is "headless" - it manages:
- WebSocket connection lifecycle
- Snapshot and delta application
- Sorted bids/asks arrays
- Snapshot history for time travel
- Connection status and errors

Components access state via Zustand selectors, ensuring efficient re-renders.

## How It Works

### WebSocket Connection

1. Connect to `wss://ws.kraken.com`
2. Subscribe to the "book" channel with selected pair and depth
3. Receive snapshot messages (initial state)
4. Receive update messages (delta changes)
5. Apply updates to internal orderbook maps
6. Convert maps to sorted arrays and limit to depth
7. Update UI reactively

### Orderbook Processing

- **Internal State**: Uses `Map<string, string>` to preserve precision
- **Snapshot Application**: Replaces entire orderbook state
- **Delta Application**: Updates/adds/removes individual price levels
- **Sorting**: Bids descending, asks ascending
- **Depth Limiting**: Manual truncation after sorting

### History Capture

- Snapshots captured every 250ms in live mode
- Maximum 800 snapshots stored (configurable)
- Oldest snapshots automatically removed when limit reached
- History paused during time travel mode

## Future Improvements

### Multi-Pair Dashboards
- Display multiple orderbooks side-by-side
- Compare spreads across pairs
- Aggregate volume metrics

### Tick Replay
- Step through individual updates (not just snapshots)
- Replay at different speeds
- Export replay data

### Persistent History
- Save history to localStorage or IndexedDB
- Load previous sessions
- Export/import history data

### Checksum Validation
- Implement Kraken's checksum validation
- Detect data integrity issues
- Automatic reconnection on checksum failure

### Performance Optimizations
- Virtual scrolling for large depths
- Web Workers for orderbook processing
- Debounced history capture

### Additional Features
- Orderbook depth heatmaps
- Volume-weighted average price (VWAP)
- Market depth charts
- Trade history integration
- Customizable themes

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

### Code Style

- Modern ES2025+ JavaScript/TypeScript
- Functional components with hooks
- No React import needed (React 17+)
- Prefer constants/enums over magic strings
- Keep files under 200-300 lines

## License

MIT

