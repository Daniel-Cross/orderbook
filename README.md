# Kraken Orderbook Visualizer

A production-ready React + TypeScript application for visualizing real-time orderbook data from the Kraken cryptocurrency exchange.

## Quick Start

```bash
npm install
npm start
```

The application will open at `http://localhost:3000`.

## Features

- **Real-time Orderbook**: Live updates via Kraken WebSocket API v2
- **Multiple Trading Pairs**: Switch between different cryptocurrency pairs
- **Configurable Depth**: Adjust orderbook depth (10, 25, 100, 500, 1000)
- **Time Travel**: Navigate through historical snapshots with a slider
- **Visual Depth Bars**: CSS-based depth visualization
- **Spread Display**: Real-time bid-ask spread calculation

## Documentation

For detailed documentation, see:
- [Full README](./src/docs/README.md) - Complete guide and architecture
- [API Documentation](./src/docs/API.md) - API reference

## Project Structure

```
src/
  core/              # Pure TypeScript logic (headless)
  components/        # React UI components
  examples/          # Example usage
  styles/            # CSS styles
  docs/              # Documentation
```

## Available Scripts

- `npm start` - Run development server
- `npm test` - Run tests
- `npm run build` - Build for production

## Technology Stack

- React 19
- TypeScript
- Zustand (state management)
- WebSocket API
- Plain CSS (no Tailwind)

## License

MIT
# orderbook
