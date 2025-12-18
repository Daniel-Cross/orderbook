import { useEffect, useRef, useMemo } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  Time,
  LineSeries,
  LineWidth,
} from "lightweight-charts";
import {
  useOrderbookStore,
  OrderbookState,
} from "../core/createOrderbookStore";
import { OrderbookMode } from "../core/orderbookTypes";
import "../styles/chart.css";

const selectChartState = (s: OrderbookState) => ({
  history: s.history,
  mode: s.mode,
  index: s.index,
  pair: s.pair,
  connected: s.connected,
});

const CHART_OPTIONS = {
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
      width: 1 as LineWidth,
      style: 2,
      labelBackgroundColor: "#50be78",
    },
    horzLine: {
      color: "#666",
      width: 1 as LineWidth,
      style: 2,
      labelBackgroundColor: "#50be78",
    },
  },
  rightPriceScale: { borderColor: "#333" },
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
};

const LINE_SERIES_OPTIONS = {
  color: "#50be78",
  lineWidth: 2 as LineWidth,
  crosshairMarkerVisible: true,
  crosshairMarkerRadius: 4,
  crosshairMarkerBorderColor: "#50be78",
  crosshairMarkerBackgroundColor: "#1a1a1a",
  lastValueVisible: true,
  priceLineVisible: true,
};

export const PriceChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const { history, mode, index, pair, connected } =
    useOrderbookStore(selectChartState);

  const isEmpty = history.length === 0;

  useEffect(() => {
    if (isEmpty) return;
    if (!chartContainerRef.current) return;
    if (chartRef.current) return;

    const { clientWidth, clientHeight } = chartContainerRef.current;
    const chart = createChart(chartContainerRef.current, {
      ...CHART_OPTIONS,
      width: clientWidth,
      height: clientHeight,
    });

    const lineSeries = chart.addSeries(LineSeries, LINE_SERIES_OPTIONS);
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
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      lineSeriesRef.current = null;
    };
  }, [isEmpty]);

  const chartData = useMemo(() => {
    if (history.length === 0) return [];

    const dataToShow =
      mode === OrderbookMode.TIME_TRAVEL
        ? history.slice(0, index + 1)
        : history;

    return dataToShow
      .filter(
        (snapshot) =>
          snapshot.bids.length > 0 &&
          snapshot.asks.length > 0 &&
          snapshot.bids[0] &&
          snapshot.asks[0]
      )
      .map((snapshot) => {
        const midPrice = (snapshot.bids[0].price + snapshot.asks[0].price) / 2;
        return {
          time: (snapshot.timestamp / 1000) as Time,
          value: midPrice,
        };
      });
  }, [history, mode, index]);

  useEffect(() => {
    if (!lineSeriesRef.current) return;

    lineSeriesRef.current.setData(chartData);

    if (
      mode === OrderbookMode.TIME_TRAVEL &&
      chartRef.current &&
      chartData.length > 0
    ) {
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData, mode]);

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
      {isEmpty ? (
        <div className="chart-empty">
          <p>
            {connected ? "Collecting data..." : "Waiting for connection..."}
          </p>
          <p className="chart-empty-hint">
            Chart will appear once orderbook data is available (takes a few
            seconds)
          </p>
        </div>
      ) : (
        <div ref={chartContainerRef} className="chart-canvas" />
      )}
    </div>
  );
};
