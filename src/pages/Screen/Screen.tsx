import React, { useCallback, useEffect, useState } from 'react';
import { Tag } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { mockMapSites, mockHistoryData, mockHistoryTimestamps, type MapSite } from '../../mock';
import './Screen.css';

const jitter = (v: number, p = 0.03) => +(v * (1 + (Math.random() - 0.5) * p)).toFixed(2);

const statusConfig: Record<MapSite['status'], { color: string; zh: string; en: string; tagColor: 'success' | 'warning' | 'error' | 'default' }> = {
  irrigating: { color: '#1366ff', zh: '灌溉中', en: 'Irrigating', tagColor: 'success' },
  standby: { color: '#5f84c8', zh: '待机', en: 'Standby', tagColor: 'warning' },
  alarm: { color: '#cf4453', zh: '报警', en: 'Alarm', tagColor: 'error' },
  offline: { color: '#94a3b8', zh: '离线', en: 'Offline', tagColor: 'default' },
};

const Screen: React.FC = () => {
  const [fullscreen, setFullscreen] = useState(false);
  const [tick, setTick] = useState(0);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setTick((t) => t + 1);
          return 5;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const refreshNow = useCallback(() => {
    setTick((t) => t + 1);
    setCountdown(5);
  }, []);

  const soilOpt = {
    backgroundColor: 'transparent',
    grid: { top: 32, right: 10, bottom: 36, left: 50 },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.96)', borderColor: 'rgba(255,255,255,0.14)', textStyle: { color: '#f4f8ff' } },
    legend: { data: ['20cm', '40cm', '60cm'], top: 0, textStyle: { color: '#64748b', fontSize: 11 } },
    xAxis: {
      type: 'category',
      data: mockHistoryTimestamps.slice(-12).map((t: string) => t.slice(11, 16)),
      axisLine: { lineStyle: { color: 'rgba(100,116,139,0.26)' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '%',
      nameTextStyle: { color: '#64748b', fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(100,116,139,0.2)', type: 'dashed' } },
    },
    series: [
      { name: '20cm', type: 'line', smooth: true, data: mockHistoryData.soil_moisture_20cm.slice(-12).map((v: number) => jitter(v)), lineStyle: { color: '#1366ff', width: 2 }, symbol: 'none' },
      { name: '40cm', type: 'line', smooth: true, data: mockHistoryData.soil_moisture_40cm.slice(-12).map((v: number) => jitter(v)), lineStyle: { color: '#3d7dff', width: 2 }, symbol: 'none' },
      { name: '60cm', type: 'line', smooth: true, data: mockHistoryData.soil_moisture_60cm.slice(-12).map((v: number) => jitter(v)), lineStyle: { color: '#8fb3ea', width: 2 }, symbol: 'none' },
    ],
  };

  const flowOpt = {
    backgroundColor: 'transparent',
    grid: { top: 24, right: 10, bottom: 32, left: 50 },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.96)', borderColor: 'rgba(255,255,255,0.14)', textStyle: { color: '#f4f8ff' } },
    xAxis: {
      type: 'category',
      data: mockHistoryTimestamps.slice(-12).map((t: string) => t.slice(11, 16)),
      axisLine: { lineStyle: { color: 'rgba(100,116,139,0.26)' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'g/h',
      nameTextStyle: { color: '#64748b', fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(100,116,139,0.2)', type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: mockHistoryData.sap_flow_rate.slice(-12).map((v: number) => jitter(v)),
        lineStyle: { color: '#1366ff', width: 2.4 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(19,102,255,0.18)' },
              { offset: 1, color: 'rgba(19,102,255,0.02)' },
            ],
          },
        },
        symbol: 'none',
      },
    ],
  };

  const radarOpt = {
    backgroundColor: 'transparent',
    radar: {
      indicator: mockMapSites.map((_, i: number) => ({ name: `S${i + 1}`, max: 45 })),
      splitNumber: 4,
      axisLine: { lineStyle: { color: 'rgba(100,116,139,0.2)' } },
      splitLine: { lineStyle: { color: 'rgba(100,116,139,0.2)' } },
      splitArea: { areaStyle: { color: ['rgba(19,102,255,0.03)', 'rgba(19,102,255,0.01)'] } },
      axisName: { color: '#64748b', fontSize: 10 },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: mockMapSites.map((s: MapSite) => jitter(s.soilMoisture)),
            name: 'Soil Moisture',
            areaStyle: { color: 'rgba(19,102,255,0.15)' },
            lineStyle: { color: '#1366ff' },
            itemStyle: { color: '#1366ff' },
          },
        ],
      },
    ],
  };

  const pieOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: 'rgba(15,23,42,0.96)', borderColor: 'rgba(255,255,255,0.14)', textStyle: { color: '#f4f8ff' } },
    legend: { orient: 'vertical', right: 0, top: 'center', textStyle: { color: '#64748b', fontSize: 10 } },
    series: [
      {
        type: 'pie',
        radius: ['46%', '72%'],
        center: ['37%', '50%'],
        label: { show: false },
        data: [
          { value: 3, name: '严重 / Critical', itemStyle: { color: '#cf4453' } },
          { value: 7, name: '警告 / Warning', itemStyle: { color: '#db7f2f' } },
          { value: 12, name: '提示 / Notice', itemStyle: { color: '#c7962f' } },
          { value: 28, name: '已处理 / Resolved', itemStyle: { color: '#94a3b8' } },
        ],
      },
    ],
  };

  const topStats = [
    { zh: '今日灌溉量', en: 'Today Irrigation', value: `${jitter(142.6, 0.05)} m³`, color: '#1366ff' },
    { zh: '活跃站点', en: 'Active Sites', value: `${mockMapSites.filter((s: MapSite) => s.status !== 'offline').length}/${mockMapSites.length}`, color: '#2f74ec' },
    { zh: '平均液流速率', en: 'Avg Sap Flow', value: `${jitter(112.4, 0.04)} g/h`, color: '#4d84d6' },
    { zh: '平均土壤含水率', en: 'Avg Moisture', value: `${jitter(27.8, 0.03)}%`, color: '#5f84c8' },
    { zh: '未处理报警', en: 'Open Alerts', value: '3', color: '#cf4453' },
    { zh: '节水率', en: 'Water Saving', value: `${jitter(18.5, 0.02)}%`, color: '#475569' },
  ];

  return (
    <div className="screen-page">
      <div className="screen-atmosphere" />

      <header className="screen-header">
        <div className="screen-time">{new Date().toLocaleString('zh-CN')}</div>
        <div className="screen-title-wrap">
          <h1 className="screen-title-zh">智慧灌溉数据大屏</h1>
          <p className="screen-title-en">SMART IRRIGATION COMMAND WALL</p>
        </div>
        <div className="screen-actions">
          <button type="button" className="screen-action-btn" onClick={refreshNow}>
            <ReloadOutlined spin={countdown <= 1} />
            <span className="screen-action-label-zh">刷新</span>
            <span className="screen-action-label-en">Refresh {countdown}s</span>
          </button>
          <button type="button" className="screen-action-icon" onClick={toggleFS}>
            {fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          </button>
        </div>
      </header>

      <section className="screen-stats-grid">
        {topStats.map((s) => (
          <article key={s.zh} className="screen-stat-panel">
            <div className="screen-stat-value stat-number" style={{ color: s.color }}>{s.value}</div>
            <div className="screen-stat-zh">{s.zh}</div>
            <div className="screen-stat-en">{s.en}</div>
          </article>
        ))}
      </section>

      <section className="screen-main-grid">
        <div className="screen-column">
          <article className="screen-panel">
            <h3 className="screen-panel-title">
              <span>土壤含水率</span>
              <small>Soil Moisture</small>
            </h3>
            <ReactECharts key={tick} option={soilOpt} style={{ height: 220 }} />
          </article>

          <article className="screen-panel">
            <h3 className="screen-panel-title">
              <span>液流速率</span>
              <small>Sap Flow</small>
            </h3>
            <ReactECharts key={tick + 100} option={flowOpt} style={{ height: 198 }} />
          </article>
        </div>

        <article className="screen-panel screen-map-panel">
          <h3 className="screen-panel-title">
            <span>站点分布</span>
            <small>Site Distribution</small>
          </h3>
          <svg viewBox="0 0 400 250" className="screen-map-plot">
            {[50, 100, 150, 200, 250, 300, 350].map((x) => (
              <line key={x} x1={x} y1={0} x2={x} y2={250} stroke="rgba(100,116,139,0.18)" strokeWidth="0.8" />
            ))}
            {[50, 100, 150, 200].map((y) => (
              <line key={y} x1={0} y1={y} x2={400} y2={y} stroke="rgba(100,116,139,0.18)" strokeWidth="0.8" />
            ))}
            {mockMapSites.map((site: MapSite, i: number) => {
              const x = 40 + (site.lng - 111) * 14;
              const y = 230 - (site.lat - 35) * 16;
              const cfg = statusConfig[site.status];
              return (
                <g key={site.id}>
                  <circle cx={x} cy={y} r="12" fill={cfg.color} opacity="0.12" />
                  <circle cx={x} cy={y} r="5" fill={cfg.color} />
                  <text x={x + 10} y={y + 3} fill="#64748b" fontSize="9">S{i + 1}</text>
                </g>
              );
            })}
          </svg>

          <div className="screen-site-grid">
            {mockMapSites.map((site: MapSite, i: number) => {
              const cfg = statusConfig[site.status];
              return (
                <div key={site.id} className="screen-site-card">
                  <div className="screen-site-name">站点 S{i + 1} <span>Site S{i + 1}</span></div>
                  <div className="screen-site-plant">{site.plantType}</div>
                  <Tag color={cfg.tagColor} style={{ marginTop: 6, marginRight: 0 }}>{cfg.zh} / {cfg.en}</Tag>
                </div>
              );
            })}
          </div>
        </article>

        <div className="screen-column">
          <article className="screen-panel">
            <h3 className="screen-panel-title">
              <span>含水率雷达</span>
              <small>Moisture Radar</small>
            </h3>
            <ReactECharts key={tick + 200} option={radarOpt} style={{ height: 220 }} />
          </article>

          <article className="screen-panel">
            <h3 className="screen-panel-title">
              <span>报警分布</span>
              <small>Alert Distribution</small>
            </h3>
            <ReactECharts key={tick + 300} option={pieOpt} style={{ height: 198 }} />
          </article>
        </div>
      </section>

      <section className="screen-panel screen-summary-panel">
        <h3 className="screen-panel-title">
          <span>站点实时摘要</span>
          <small>Real-time Site Summary</small>
        </h3>
        <div className="screen-summary-grid">
          {mockMapSites.map((site: MapSite, i: number) => {
            const cfg = statusConfig[site.status];
            return (
              <div key={site.id} className="screen-summary-item" style={{ borderColor: `${cfg.color}55` }}>
                <div className="screen-summary-name">站点 S{i + 1} <span>Site S{i + 1}</span></div>
                <div className="screen-summary-line">液流 / Flow <strong>{jitter(site.sapFlowRate, 0.04)} g/h</strong></div>
                <div className="screen-summary-line">水分 / Moisture <strong>{jitter(site.soilMoisture, 0.03)}%</strong></div>
                <Tag color={cfg.tagColor} style={{ fontSize: 10, marginTop: 6, marginRight: 0 }}>{cfg.en}</Tag>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Screen;
