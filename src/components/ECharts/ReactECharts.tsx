import { useEffect, useRef } from 'react';

type EChartsInstance = {
  setOption: (option: unknown, notMerge?: boolean, lazyUpdate?: boolean) => void;
  resize: () => void;
  dispose: () => void;
};

type EChartsGlobal = {
  init: (dom: HTMLDivElement) => EChartsInstance;
};

export interface ReactEChartsProps {
  option: unknown;
  style?: React.CSSProperties;
  className?: string;
  notMerge?: boolean;
  lazyUpdate?: boolean;
}

let echartsRuntimePromise: Promise<EChartsGlobal> | null = null;

const getEChartsGlobal = (): EChartsGlobal | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const runtime = (window as Window & { echarts?: EChartsGlobal }).echarts;
  return runtime && typeof runtime.init === 'function' ? runtime : null;
};

const loadEChartsRuntime = async (): Promise<EChartsGlobal> => {
  const existing = getEChartsGlobal();
  if (existing) {
    return existing;
  }

  if (typeof document === 'undefined') {
    throw new Error('ECharts runtime is only available in the browser.');
  }

  const scriptId = 'siz-echarts-runtime';
  const current = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (current) {
    await new Promise<void>((resolve, reject) => {
      if (getEChartsGlobal()) {
        resolve();
        return;
      }

      current.addEventListener('load', () => resolve(), { once: true });
      current.addEventListener('error', () => reject(new Error('Failed to load ECharts runtime.')), {
        once: true,
      });
    });
    const loaded = getEChartsGlobal();
    if (loaded) {
      return loaded;
    }
    throw new Error('ECharts runtime did not initialize correctly.');
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `${import.meta.env.BASE_URL}echarts.min.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load ECharts runtime.'));
    document.head.appendChild(script);
  });

  const loaded = getEChartsGlobal();
  if (!loaded) {
    throw new Error('ECharts runtime did not initialize correctly.');
  }

  return loaded;
};

const ensureEChartsRuntime = () => {
  if (!echartsRuntimePromise) {
    echartsRuntimePromise = loadEChartsRuntime();
  }
  return echartsRuntimePromise;
};

const ReactECharts = ({
  option,
  style,
  className,
  notMerge = false,
  lazyUpdate = true,
}: ReactEChartsProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const optionRef = useRef(option);
  const notMergeRef = useRef(notMerge);
  const lazyUpdateRef = useRef(lazyUpdate);

  useEffect(() => {
    optionRef.current = option;
    notMergeRef.current = notMerge;
    lazyUpdateRef.current = lazyUpdate;
  }, [lazyUpdate, notMerge, option]);

  useEffect(() => {
    let active = true;
    let resizeObserver: ResizeObserver | null = null;
    let resizeHandler: (() => void) | null = null;

    void ensureEChartsRuntime().then((echarts) => {
      if (!active || !hostRef.current) {
        return;
      }

      const chart = echarts.init(hostRef.current);
      chartRef.current = chart;
      chart.setOption(optionRef.current, notMergeRef.current, lazyUpdateRef.current);

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          chart.resize();
        });
        resizeObserver.observe(hostRef.current);
      } else {
        resizeHandler = () => chart.resize();
        window.addEventListener('resize', resizeHandler);
      }
    }).catch(() => {
      chartRef.current = null;
    });

    return () => {
      active = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    chartRef.current.setOption(option, notMerge, lazyUpdate);
    chartRef.current.resize();
  }, [lazyUpdate, notMerge, option]);

  return <div ref={hostRef} className={className} style={{ width: '100%', ...style }} />;
};

export default ReactECharts;
