import React, { useMemo, useState } from 'react';
import { Row, Col, Card, Select, Tag, Typography, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, AlertOutlined, ThunderboltOutlined, DropboxOutlined, DashboardOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { mockDashboard, mockHistoryData, mockHistoryTimestamps } from '../../mock';
import { getCurrentSiteId, getSites, setCurrentSiteId } from '../../utils/siteStorage';
import type { MqttMessage } from '../../utils/mqttClient';
import type { Site } from '../../types/site';
import { useMqttStatus } from '../../hooks/useMqttStatus';
import { useMqttSubscription } from '../../hooks/useMqttSubscription';
import SiteModal from '../Sites/SiteModal';

const { Text } = Typography;

const statCards = [
  { label: '今日灌溉量', value: '142.6', unit: 'm³', trend: '+8%', up: true, cls: 'gradient-card-green', icon: <DropboxOutlined style={{ fontSize: 22, color: '#00d4aa' }} /> },
  { label: '当前液流速率', value: '138.5', unit: 'g/h', trend: '+12%', up: true, cls: 'gradient-card-blue', icon: <ThunderboltOutlined style={{ fontSize: 22, color: '#4f9cf9' }} /> },
  { label: '土壤平均含水率', value: '28.4', unit: '%', trend: '-3%', up: false, cls: 'gradient-card-orange', icon: <DashboardOutlined style={{ fontSize: 22, color: '#ff6b35' }} /> },
  { label: '活跃报警数', value: '3', unit: '条', trend: '+1', up: true, cls: 'gradient-card-red', icon: <AlertOutlined style={{ fontSize: 22, color: '#ff4757' }} /> },
];

const soilChartOption = {
  backgroundColor: 'transparent',
  grid: { top: 32, right: 16, bottom: 40, left: 48 },
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(20,23,32,0.95)', borderColor: '#2a2d3e', textStyle: { color: '#e8eaf0' } },
  legend: { data: ['20cm', '40cm', '60cm', '80cm', '100cm'], textStyle: { color: '#8892a4' }, bottom: 0 },
  xAxis: { type: 'category', data: mockHistoryTimestamps.slice(-24).map((t: string) => t.slice(11, 16)), axisLine: { lineStyle: { color: '#2a2d3e' } }, axisTick: { show: false }, axisLabel: { color: '#8892a4', fontSize: 11 }, splitLine: { show: false } },
  yAxis: { type: 'value', name: '含水率(%)', nameTextStyle: { color: '#8892a4', fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#8892a4', fontSize: 11 }, splitLine: { lineStyle: { color: '#2a2d3e', type: 'dashed' } } },
  series: [
    { name: '20cm', type: 'line', smooth: true, data: mockHistoryData.soil_moisture_20cm.slice(-24), lineStyle: { color: '#00d4aa', width: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0,212,170,0.25)' }, { offset: 1, color: 'rgba(0,212,170,0.02)' }] } }, symbol: 'none' },
    { name: '40cm', type: 'line', smooth: true, data: mockHistoryData.soil_moisture_40cm.slice(-24), lineStyle: { color: '#4f9cf9', width: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(79,156,249,0.2)' }, { offset: 1, color: 'rgba(79,156,249,0.02)' }] } }, symbol: 'none' },
    { name: '60cm', type: 'line', smooth: true, data: mockHistoryData.soil_moisture_60cm.slice(-24), lineStyle: { color: '#ff6b35', width: 2 }, symbol: 'none' },
    { name: '80cm', type: 'line', smooth: true, data: mockHistoryData.soil_moisture_80cm.slice(-24), lineStyle: { color: '#ffd32a', width: 2 }, symbol: 'none' },
    { name: '100cm', type: 'line', smooth: true, data: mockHistoryData.soil_moisture_100cm.slice(-24), lineStyle: { color: '#a55eea', width: 2 }, symbol: 'none' },
  ],
};

const makeGauge = (value: number, max: number, name: string, color: string) => ({
  backgroundColor: 'transparent',
  series: [{ type: 'gauge', startAngle: 200, endAngle: -20, min: 0, max, radius: '90%', pointer: { show: true, length: '60%', width: 4, itemStyle: { color } }, axisLine: { lineStyle: { width: 10, color: [[value / max, color], [1, '#2a2d3e']] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, detail: { valueAnimation: true, formatter: '{value}', color, fontSize: 20, fontWeight: 700, offsetCenter: [0, '30%'] }, title: { offsetCenter: [0, '60%'], color: '#8892a4', fontSize: 12 }, data: [{ value, name }] }],
});

const barChartOption = {
  backgroundColor: 'transparent',
  grid: { top: 24, right: 16, bottom: 40, left: 48 },
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(20,23,32,0.95)', borderColor: '#2a2d3e', textStyle: { color: '#e8eaf0' } },
  legend: { data: ['计划灌水量', '实际灌水量'], textStyle: { color: '#8892a4' }, bottom: 0 },
  xAxis: { type: 'category', data: ['03-31', '04-01', '04-02', '04-03', '04-04', '04-05', '04-06'], axisLine: { lineStyle: { color: '#2a2d3e' } }, axisTick: { show: false }, axisLabel: { color: '#8892a4', fontSize: 11 } },
  yAxis: { type: 'value', name: '水量(m³)', nameTextStyle: { color: '#8892a4', fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#8892a4', fontSize: 11 }, splitLine: { lineStyle: { color: '#2a2d3e', type: 'dashed' } } },
  series: [
    { name: '计划灌水量', type: 'bar', data: [45, 50, 38, 52, 0, 55, 48], barMaxWidth: 20, itemStyle: { color: 'rgba(79,156,249,0.7)', borderRadius: [4, 4, 0, 0] } },
    { name: '实际灌水量', type: 'bar', data: [42, 48, 40, 50, 0, 53, 46], barMaxWidth: 20, itemStyle: { color: 'rgba(0,212,170,0.8)', borderRadius: [4, 4, 0, 0] } },
  ],
};

const liveMetricSensorTypes = new Set(['sapflow', 'stem_diameter', 'leaf_turgor']);

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

const getTelemetryValue = (payload: unknown): number | null => {
  if (typeof payload === 'number' || typeof payload === 'string') {
    return getNumericValue(payload);
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const nestedData = data.data && typeof data.data === 'object' ? data.data as Record<string, unknown> : null;

  return getNumericValue(data.value)
    ?? getNumericValue(data.reading)
    ?? getNumericValue(data.currentValue)
    ?? (nestedData ? getNumericValue(nestedData.value) ?? getNumericValue(nestedData.reading) : null);
};

const getTopicDeviceId = (topic: string): string | null => {
  const parts = topic.split('/');
  if (parts.length < 6) {
    return null;
  }

  return parts[4]?.trim() || null;
};

const normalizeId = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const Dashboard: React.FC = () => {
  const [sites, setSites] = useState<Site[]>(() => getSites());
  const [selectedSite, setSelectedSite] = useState<string>(() => getCurrentSiteId());
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const mqttStatus = useMqttStatus();
  const [plantPhysiology, setPlantPhysiology] = useState(() => mockDashboard.plantPhysiology);

  const dash = mockDashboard;
  const site = useMemo(() => sites.find((s) => s.id === selectedSite) ?? sites[0], [sites, selectedSite]);
  const currentSiteId = site?.id ?? selectedSite;

  const monitoredSensors = useMemo(() => {
    const map = new Map<string, Site['sensors'][number]>();

    site?.sensors.forEach((sensor) => {
      if (!liveMetricSensorTypes.has(sensor.type)) {
        return;
      }

      const deviceId = sensor.deviceId.trim() || sensor.id.trim();
      if (deviceId) {
        map.set(deviceId, sensor);
      }

      const fallbackId = sensor.id.trim();
      if (fallbackId) {
        map.set(fallbackId, sensor);
      }
    });

    return map;
  }, [site]);

  const handleSiteChange = (siteId: string) => {
    setSelectedSite(siteId);
    setCurrentSiteId(siteId);
    setPlantPhysiology(mockDashboard.plantPhysiology);
  };

  const openSiteModal = () => {
    if (site === undefined) {
      return;
    }
    setSiteModalOpen(true);
  };

  const handleTelemetry = (message: MqttMessage) => {
    const payload = message.payload && typeof message.payload === 'object'
      ? message.payload as Record<string, unknown>
      : {};

    const deviceId = normalizeId(payload.deviceId)
      || normalizeId(payload.sensorId)
      || normalizeId(payload.id)
      || getTopicDeviceId(message.topic)
      || '';

    const sensor = monitoredSensors.get(deviceId);
    if (!sensor) {
      return;
    }

    const nextValue = getTelemetryValue(message.payload);
    if (nextValue === null) {
      return;
    }

    setPlantPhysiology((prev) => {
      if (sensor.type === 'sapflow') {
        return { ...prev, sapFlowRate: nextValue };
      }

      if (sensor.type === 'stem_diameter') {
        return { ...prev, stemDiameterVariation: nextValue };
      }

      if (sensor.type === 'leaf_turgor') {
        return { ...prev, leafTurgorPressure: nextValue };
      }

      return prev;
    });
  };

  useMqttSubscription(
    currentSiteId ? `siz/v1/${currentSiteId}/sensor/+/data` : null,
    handleTelemetry,
    Boolean(currentSiteId),
  );

  return (
    <div className="page-container">
      <style>{`
        @keyframes mqttPulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 212, 170, 0.65); }
          70% { box-shadow: 0 0 0 8px rgba(0, 212, 170, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 212, 170, 0); }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>主控看板</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>实时数据 · 最后更新 {new Date().toLocaleTimeString('zh-CN')}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, border: '1px solid var(--border-base)', background: 'rgba(255,255,255,0.03)' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: mqttStatus === 'connected' ? '#00d4aa' : '#7b8494',
                animation: mqttStatus === 'connected' ? 'mqttPulse 1.6s ease-in-out infinite' : 'none',
              }}
            />
            <span style={{ fontSize: 12, color: mqttStatus === 'connected' ? '#00d4aa' : 'var(--text-muted)', fontWeight: 600 }}>
              {mqttStatus === 'connected' ? '实时' : '离线'}
            </span>
          </div>
          <Select
            value={site ? site.id : undefined}
            onChange={handleSiteChange}
            style={{ width: 220 }}
            options={sites.map((s) => ({ value: s.id, label: s.name }))}
          />
          <Button size="small" type="default" ghost onClick={openSiteModal} disabled={!site}>
            ⚙️ 配置此站点
          </Button>
          <Tag color="error" icon={<AlertOutlined />}>未处理报警 3</Tag>
        </div>
      </div>

      <Card style={{ marginBottom: 16, background: 'linear-gradient(135deg, #1a1d2e, #1e2235)', borderColor: '#2a2d3e' }}>
        <Row gutter={24} align="middle">
          {[
            { label: '温度', value: `${dash.weather.temperature}°C`, color: '#ff6b35' },
            { label: '湿度', value: `${dash.weather.humidity}%`, color: '#4f9cf9' },
            { label: '风速', value: `${dash.weather.windSpeed} m/s`, color: '#00d4aa' },
            { label: '辐射', value: `${dash.weather.radiation} W/m²`, color: '#ffd32a' },
            { label: '降雨量', value: `${dash.weather.rainfall} mm`, color: '#a55eea' },
            { label: 'ET₀', value: `${dash.weather.et0} mm/d`, color: '#00d4aa' },
          ].map((item) => (
            <Col key={item.label} flex="auto" style={{ textAlign: 'center', padding: '4px 0' }}>
              <div className="stat-number" style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</div>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {statCards.map((card) => (
          <Col xs={12} lg={6} key={card.label}>
            <Card className={card.cls} style={{ height: 110 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>{card.label}</div>
                  <div className="stat-number" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {card.value}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4, color: 'var(--text-secondary)' }}>{card.unit}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {card.icon}
                  <Tag color={card.up ? 'error' : 'success'} style={{ margin: 0, fontSize: 11 }}>
                    {card.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {card.trend}
                  </Tag>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={15}>
          <Card title="土壤含水率实时曲线（多深度）" style={{ height: 320 }}>
            <ReactECharts option={soilChartOption} style={{ height: 240 }} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title="植物生理指标" style={{ height: 320 }}>
            <Row>
              <Col span={8}><ReactECharts option={makeGauge(plantPhysiology.sapFlowRate, 300, '液流 g/h', '#00d4aa')} style={{ height: 150 }} /><div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>液流速率</div></Col>
              <Col span={8}><ReactECharts option={makeGauge(Math.round(Math.abs(plantPhysiology.stemDiameterVariation) * 100), 100, '茎径', '#4f9cf9')} style={{ height: 150 }} /><div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>茎径变化</div></Col>
              <Col span={8}><ReactECharts option={makeGauge(Math.round(plantPhysiology.leafTurgorPressure * 100), 200, '膨压', '#ff6b35')} style={{ height: 150 }} /><div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>叶片膨压</div></Col>
            </Row>
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(0,212,170,0.06)', borderRadius: 6, border: '1px solid rgba(0,212,170,0.2)' }}>
              <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>决策模式：<span style={{ color: 'var(--primary)' }}>植物水分亏缺指标</span>&nbsp;·&nbsp;当前状态：<span style={{ color: '#00d4aa' }}>无需灌溉</span></Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title={`今日灌溉计划 vs 实际执行（近7天）— ${site?.name ?? '未选择站点'}`}>
        <ReactECharts option={barChartOption} style={{ height: 220 }} />
      </Card>

      <SiteModal
        open={siteModalOpen}
        initialSite={site ?? null}
        onCancel={() => setSiteModalOpen(false)}
        onSaved={(savedSite: Site) => {
          setSiteModalOpen(false);
          setSites(getSites());
          setSelectedSite(savedSite.id);
          setCurrentSiteId(savedSite.id);
          setPlantPhysiology(mockDashboard.plantPhysiology);
        }}
      />
    </div>
  );
};

export default Dashboard;
