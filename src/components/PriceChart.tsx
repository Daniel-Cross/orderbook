import { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  Time,
  LineSeries,
} from "lightweight-charts";
import { useOrderbookStore } from "../core/createOrderbookStore";
import { OrderbookMode } from "../core/orderbookTypes";
import "../styles/chart.css";

export const PriceChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const history = useOrderbookStore((state) => state.history);
  const mode = useOrderbookStore((state) => state.mode);
  const index = useOrderbookStore((state) => state.index);
  const pair = useOrderbookStore((state) => state.pair);
  const connected = useOrderbookStore((state) => state.connected);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const containerWidth = chartContainerRef.current.clientWidth;
    const containerHeight = chartContainerRef.current.clientHeight;

    const chart = createChart(chartContainerRef.current, {
      width: containerWidth,
      height: containerHeight,
      layout: {
        background: { color: "#1a1a1a" },
        textColor: "#b0b0b0",
      },
      grid: {
        vertLines: { color: "#2a2a2a" },
        horzLines: { color: "#2a2a2a" },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "#666",
          width: 1,
          style: 2,
          labelBackgroundColor: "#50be78",
        },
        horzLine: {
          color: "#666",
          width: 1,
          style: 2,
          labelBackgroundColor: "#50be78",
        },
      },
      rightPriceScale: {
        borderColor: "#333",
      },
      timeScale: {
        borderColor: "#333",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#50be78",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: "#50be78",
      crosshairMarkerBackgroundColor: "#1a1a1a",
      lastValueVisible: true,
      priceLineVisible: true,
    });

    chartRef.current = chart;
    lineSeriesRef.current = lineSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!lineSeriesRef.current || history.length === 0) return;

    const dataToShow =
      mode === OrderbookMode.TIME_TRAVEL
        ? history.slice(0, index + 1)
        : history;

    const chartData: LineData[] = dataToShow
      .filter((snapshot) => {
        return (
          snapshot.bids.length > 0 &&
          snapshot.asks.length > 0 &&
          snapshot.bids[0] &&
          snapshot.asks[0]
        );
      })
      .map((snapshot) => {
        const bestBid = snapshot.bids[0].price;
        const bestAsk = snapshot.asks[0].price;
        const midPrice = (bestBid + bestAsk) / 2;

        return {
          time: (snapshot.timestamp / 1000) as Time,
          value: midPrice,
        };
      });

    if (chartData.length > 0) {
      lineSeriesRef.current.setData(chartData);

      if (mode === OrderbookMode.TIME_TRAVEL && chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [history, mode, index]);

  if (history.length === 0) {
    return (
      <div className="price-chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Price Chart - {pair}</h3>
          <div className="chart-subtitle">Mid-Price Over Time</div>
        </div>
        <div className="chart-empty">
          <p>
            {connected ? "Collecting data..." : "Waiting for connection..."}
          </p>
          <p className="chart-empty-hint">
            Chart will appear once orderbook data is available (takes a few
            seconds)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="price-chart-container">
      <div className="chart-header">
        <h3 className="chart-title">Price Chart - {pair}</h3>
        <div className="chart-subtitle">
          Mid-Price Over Time
          {mode === OrderbookMode.TIME_TRAVEL && (
            <span className="chart-mode-indicator"> (Time Travel Mode)</span>
          )}
        </div>
      </div>
      <div ref={chartContainerRef} className="chart-canvas" />
    </div>
  );
};
