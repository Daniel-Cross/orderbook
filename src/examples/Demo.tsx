import { OrderbookVisualizer } from "../components/OrderbookVisualizer";
import { Theme } from "../core/orderbookTypes";
import "../styles/orderbook.css";

export const Demo = () => {
  return (
    <main className="demo-layout">
      <div className="chart-container">
        <div className="chart-placeholder">
          <h2>Live Chart</h2>
          <p>Chart visualization will go here</p>
        </div>
      </div>
      <div className="orderbook-container">
        <OrderbookVisualizer
          initialPair="XBT/USD"
          initialDepth={10}
          enableTimeTravel
          theme={Theme.DARK}
          showSpread
        />
      </div>
    </main>
  );
};

