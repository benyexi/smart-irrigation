import {
  AlertOutlined,
  DashboardOutlined,
  DropboxOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { mockHistoryData, mockHistoryTimestamps } from '../../mock';

export const statCards = [
  {
    label: '今日灌溉量',
    value: '142.6',
    unit: 'm³',
    trend: '+8%',
    up: true,
    cls: 'gradient-card-green',
    icon: <DropboxOutlined style={{ fontSize: 22, color: '#00d4aa' }} />,
  },
  {
    label: '当前液流速率',
    value: '138.5',
    unit: 'g/h',
    trend: '+12%',
    up: true,
    cls: 'gradient-card-blue',
    icon: <ThunderboltOutlined style={{ fontSize: 22, color: '#4f9cf9' }} />,
  },
  {
    label: '土壤平均含水率',
    value: '28.4',
    unit: '%',
    trend: '-3%',
    up: false,
    cls: 'gradient-card-orange',
    icon: <DashboardOutlined style={{ fontSize: 22, color: '#ff6b35' }} />,
  },
  {
    label: '活跃报警数',
    value: '3',
    unit: '条',
    trend: '+1',
    up: true,
    cls: 'gradient-card-red',
    icon: <AlertOutlined style={{ fontSize: 22, color: '#ff4757' }} />,
  },
];

export const soilChartOption = {
  backgroundColor: 'transparent',
  grid: { top: 32, right: 16, bottom: 40, left: 48 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(20,23,32,0.95)',
    borderColor: '#2a2d3e',
    textStyle: { color: '#e8eaf0' },
  },
  legend: {
    data: ['20cm', '40cm', '60cm', '80cm', '100cm'],
    textStyle: { color: '#8892a4' },
    bottom: 0,
  },
  xAxis: {
    type: 'category',
    data: mockHistoryTimestamps.slice(-24).map((t: string) => t.slice(11, 16)),
    axisLine: { lineStyle: { color: '#2a2d3e' } },
    axisTick: { show: false },
    axisLabel: { color: '#8892a4', fontSize: 11 },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    name: '含水率(%)',
    nameTextStyle: { color: '#8892a4', fontSize: 11 },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#8892a4', fontSize: 11 },
    splitLine: { lineStyle: { color: '#2a2d3e', type: 'dashed' } },
  },
  series: [
    {
      name: '20cm',
      type: 'line',
      smooth: true,
      data: mockHistoryData.soil_moisture_20cm.slice(-24),
      lineStyle: { color: '#00d4aa', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0,212,170,0.25)' },
            { offset: 1, color: 'rgba(0,212,170,0.02)' },
          ],
        },
      },
      symbol: 'none',
    },
    {
      name: '40cm',
      type: 'line',
      smooth: true,
      data: mockHistoryData.soil_moisture_40cm.slice(-24),
      lineStyle: { color: '#4f9cf9', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(79,156,249,0.2)' },
            { offset: 1, color: 'rgba(79,156,249,0.02)' },
          ],
        },
      },
      symbol: 'none',
    },
    {
      name: '60cm',
      type: 'line',
      smooth: true,
      data: mockHistoryData.soil_moisture_60cm.slice(-24),
      lineStyle: { color: '#ff6b35', width: 2 },
      symbol: 'none',
    },
    {
      name: '80cm',
      type: 'line',
      smooth: true,
      data: mockHistoryData.soil_moisture_80cm.slice(-24),
      lineStyle: { color: '#ffd32a', width: 2 },
      symbol: 'none',
    },
    {
      name: '100cm',
      type: 'line',
      smooth: true,
      data: mockHistoryData.soil_moisture_100cm.slice(-24),
      lineStyle: { color: '#a55eea', width: 2 },
      symbol: 'none',
    },
  ],
};

export const makeGauge = (
  value: number,
  max: number,
  name: string,
  color: string,
) => ({
  backgroundColor: 'transparent',
  series: [
    {
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max,
      radius: '90%',
      pointer: {
        show: true,
        length: '60%',
        width: 4,
        itemStyle: { color },
      },
      axisLine: {
        lineStyle: { width: 10, color: [[value / max, color], [1, '#2a2d3e']] },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        formatter: '{value}',
        color,
        fontSize: 20,
        fontWeight: 700,
        offsetCenter: [0, '30%'],
      },
      title: {
        offsetCenter: [0, '60%'],
        color: '#8892a4',
        fontSize: 12,
      },
      data: [{ value, name }],
    },
  ],
});

export const barChartOption = {
  backgroundColor: 'transparent',
  grid: { top: 24, right: 16, bottom: 40, left: 48 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(20,23,32,0.95)',
    borderColor: '#2a2d3e',
    textStyle: { color: '#e8eaf0' },
  },
  legend: {
    data: ['计划灌水量', '实际灌水量'],
    textStyle: { color: '#8892a4' },
    bottom: 0,
  },
  xAxis: {
    type: 'category',
    data: ['03-31', '04-01', '04-02', '04-03', '04-04', '04-05', '04-06'],
    axisLine: { lineStyle: { color: '#2a2d3e' } },
    axisTick: { show: false },
    axisLabel: { color: '#8892a4', fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    name: '水量(m³)',
    nameTextStyle: { color: '#8892a4', fontSize: 11 },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#8892a4', fontSize: 11 },
    splitLine: { lineStyle: { color: '#2a2d3e', type: 'dashed' } },
  },
  series: [
    {
      name: '计划灌水量',
      type: 'bar',
      data: [45, 50, 38, 52, 0, 55, 48],
      barMaxWidth: 20,
      itemStyle: {
        color: 'rgba(79,156,249,0.7)',
        borderRadius: [4, 4, 0, 0],
      },
    },
    {
      name: '实际灌水量',
      type: 'bar',
      data: [42, 48, 40, 50, 0, 53, 46],
      barMaxWidth: 20,
      itemStyle: {
        color: 'rgba(0,212,170,0.8)',
        borderRadius: [4, 4, 0, 0],
      },
    },
  ],
};

export const liveMetricSensorTypes = new Set([
  'sapflow',
  'stem_diameter',
  'leaf_turgor',
]);

const getNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const getTelemetryValue = (payload: unknown): number | null => {
  if (typeof payload === 'number' || typeof payload === 'string') {
    return getNumericValue(payload);
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const nestedData =
    data.data && typeof data.data === 'object'
      ? (data.data as Record<string, unknown>)
      : null;

  return (
    getNumericValue(data.value) ??
    getNumericValue(data.reading) ??
    getNumericValue(data.currentValue) ??
    (nestedData
      ? getNumericValue(nestedData.value) ?? getNumericValue(nestedData.reading)
      : null)
  );
};

export const getTopicDeviceId = (topic: string): string | null => {
  const parts = topic.split('/');
  if (parts.length < 6) {
    return null;
  }

  return parts[4]?.trim() || null;
};

export const normalizeId = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};
