import type { Sensor } from '../../types/site';

export const FIVE_MINUTES = 5 * 60 * 1000;
export const SPARKLINE_HEIGHT = 60;

export const sensorTypeLabelMap: Record<Sensor['type'], string> = {
  soil_moisture: '土壤水分',
  soil_potential: '土壤水势',
  weather_station: '气象站',
  sapflow: '液流计',
  stem_diameter: '茎径传感器',
  leaf_turgor: '叶片膨压',
  flow_meter: '流量计',
  valve: '电磁阀',
  pump: '水泵',
};

export const sensorColorMap: Record<Sensor['type'], string> = {
  soil_moisture: '#5f9eff',
  soil_potential: '#5f9eff',
  weather_station: '#db7f2f',
  sapflow: '#0f9d80',
  stem_diameter: '#0f9d80',
  leaf_turgor: '#0f9d80',
  flow_meter: '#1366ff',
  valve: '#cf4453',
  pump: '#c7962f',
};

export const formatRelativeTime = (timestamp: number | null, now: number) => {
  if (!timestamp) {
    return '暂无数据';
  }

  const diff = Math.max(0, now - timestamp);
  if (diff < 1000) {
    return '刚刚';
  }
  if (diff < 60_000) {
    return `${Math.floor(diff / 1000)} 秒前`;
  }
  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)} 分钟前`;
  }
  return `${Math.floor(diff / 3_600_000)} 小时前`;
};

export const formatDuration = (startedAt: number | null, now: number) => {
  if (!startedAt) {
    return '--';
  }

  const diff = Math.max(0, now - startedAt);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const formatValue = (
  value: number | string | null,
  sensorType: Sensor['type'],
) => {
  if (value === null || value === undefined) {
    return '--';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (sensorType === 'stem_diameter' || sensorType === 'leaf_turgor') {
    return value.toFixed(2);
  }
  if (sensorType === 'soil_potential') {
    return Math.round(value).toString();
  }
  return value.toFixed(value >= 10 ? 1 : 2);
};

export const makeSparklineOption = (history: number[], color: string) => ({
  animation: false,
  grid: { top: 4, right: 2, bottom: 2, left: 2 },
  xAxis: {
    type: 'category',
    show: false,
    data: history.map((_, index) => index),
  },
  yAxis: { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
  series: [
    {
      type: 'line',
      data: history,
      smooth: true,
      symbol: 'none',
      lineStyle: { color, width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${color}66` },
            { offset: 1, color: `${color}00` },
          ],
        },
      },
    },
  ],
  tooltip: { show: false },
});

export const resolveDeviceId = (sensor: Sensor) =>
  sensor.deviceId.trim() || sensor.id.trim();

export const sensorSortWeight = (type: Sensor['type']) => {
  if (type === 'valve') return 9;
  if (type === 'pump') return 10;
  return 1;
};
