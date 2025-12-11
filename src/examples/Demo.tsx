import { OrderbookVisualizer } from "../components/OrderbookVisualizer";
import { PriceChart } from "../components/PriceChart";
import "../styles/orderbook.css";

export const Demo = () => {
  return (
    <main className="demo-layout">
      <div className="chart-container">
        <PriceChart />
      </div>
      <div className="orderbook-container">
        <OrderbookVisualizer
          initialPair="XBT/USD"
          initialDepth={10}
          enableTimeTravel
          showSpread
        />
      </div>
    </main>
  );
};
