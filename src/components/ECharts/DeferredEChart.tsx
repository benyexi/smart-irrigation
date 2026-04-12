import { Spin } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type BaseReactECharts from './ReactECharts';

type DeferredEChartProps = React.ComponentProps<typeof BaseReactECharts> & {
  eager?: boolean;
  minHeight?: number;
  rootMargin?: string;
};

const DeferredEChart = ({
  eager = false,
  minHeight = 180,
  rootMargin = '160px',
  style,
  ...chartProps
}: DeferredEChartProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const [ChartComponent, setChartComponent] = useState<typeof BaseReactECharts | null>(null);

  const resolvedMinHeight = useMemo(() => {
    const height = style?.height;
    if (typeof height === 'number') {
      return height;
    }
    return minHeight;
  }, [minHeight, style?.height]);

  useEffect(() => {
    if (shouldLoad || eager) {
      setShouldLoad(true);
      return;
    }

    const target = hostRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [eager, rootMargin, shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || ChartComponent) {
      return;
    }

    let active = true;
    void import('./ReactECharts').then((module) => {
      if (active) {
        setChartComponent(() => module.default);
      }
    });

    return () => {
      active = false;
    };
  }, [ChartComponent, shouldLoad]);

  return (
    <div
      ref={hostRef}
      style={{
        minHeight: resolvedMinHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {ChartComponent ? (
        <ChartComponent {...chartProps} style={style} />
      ) : (
        <div
          style={{
            width: '100%',
            minHeight: resolvedMinHeight,
            borderRadius: 16,
            border: '1px solid rgba(15, 23, 42, 0.06)',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.68), rgba(238,244,252,0.72))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin size="small" />
        </div>
      )}
    </div>
  );
};

export default DeferredEChart;
