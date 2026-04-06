// Dashboard page — site overview with weather, physiology, soil moisture chart, irrigation comparison
import React, { useState } from 'react';
import {
  Row, Col, Card, Select, Statistic, Tag, Typography, Space, Badge,
} from 'antd';
import {
  ThunderboltOutlined, CloudOutlined, DashboardOutlined,
  DropboxOutlined, ExperimentOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import {
  mockSites, mockWeather, mockPhysiology,
  mockSoilMoisture, mockIrrigationComparison,
} from '../../mock';

const { Title, Text } = Typography;

// Color palette for soil depth lines
const depthColors = ['#52c41a', '#1890ff', '#fa8c16', '#722ed1', '#eb2f96'];

const Dashboard: React.FC = () => {
  const [siteId, setSiteId] = useState('site001');

  // ── Soil moisture ECharts option ──
  const soilOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: mockSoilMoisture.series.map((s) => s.name), bottom: 0 },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: mockSoilMoisture.xAxis,
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '含水率 (%)',
      min: 15,
      max: 40,
      axisLabel: { fontSize: 11 },
    },
    series: mockSoilMoisture.series.map((s, i) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color: depthColors[i] },
      areaStyle: { color: depthColors[i], opacity: 0.06 },
    })),
  };

  // ── Irrigation comparison ECharts option ──
  const irrigationOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['计划灌水量', '实际灌水量'], bottom: 0 },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: mockIrrigationComparison.xAxis },
    yAxis: { type: 'value', name: '灌水量 (m³)' },
    series: [
      {
        name: '计划灌水量',
        type: 'bar',
        data: mockIrrigationComparison.plan,
        itemStyle: { color: '#91d5ff' },
        barGap: '10%',
      },
      {
        name: '实际灌水量',
        type: 'bar',
        data: mockIrrigationComparison.actual,
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  return (
    <div className="page-container">
      {/* ── Top bar ── */}
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>主控看板</Title>
        </Col>
        <Col>
          <Select
            value={siteId}
            onChange={setSiteId}
            style={{ width: 220 }}
            options={mockSites.map((s) => ({ value: s.id, label: s.name }))}
          />
        </Col>
        <Col flex="auto" />
        <Col>
          <Badge count={3} offset={[4, 0]}>
            <Tag color="red" style={{ cursor: 'pointer', fontSize: 13 }}>
              ⚠ 未处理报警
            </Tag>
          </Badge>
        </Col>
      </Row>

      {/* ── Weather cards ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { label: '温度', value: `${mockWeather.temperature} °C`, icon: <ThunderboltOutlined />, color: '#ff7a45' },
          { label: '湿度', value: `${mockWeather.humidity} %`, icon: <CloudOutlined />, color: '#1890ff' },
          { label: '风速', value: `${mockWeather.windSpeed} m/s`, icon: <DashboardOutlined />, color: '#722ed1' },
          { label: '辐射', value: `${mockWeather.radiation} W/m²`, icon: <ExperimentOutlined />, color: '#faad14' },
          { label: '降雨量', value: `${mockWeather.rainfall} mm`, icon: <DropboxOutlined />, color: '#13c2c2' },
        ].map((item) => (
          <Col xs={12} sm={8} md={4} lg={4} key={item.label} style={{ flex: '1 1 0' }}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 22, color: item.color }}>{item.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{item.value}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{item.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Middle row: soil chart + physiology ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="土壤含水率实时曲线（多深度）" size="small" style={{ borderRadius: 8 }}>
            <ReactECharts option={soilOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="植物生理指标" size="small" style={{ borderRadius: 8, height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Card
                size="small"
                style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}
              >
                <Statistic
                  title={<Text style={{ fontSize: 12 }}>🌿 树液流速率</Text>}
                  value={mockPhysiology.sapFlowRate}
                  suffix="g/h"
                  valueStyle={{ color: '#52c41a', fontSize: 22 }}
                />
              </Card>
              <Card
                size="small"
                style={{ background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 6 }}
              >
                <Statistic
                  title={<Text style={{ fontSize: 12 }}>📏 茎干直径变化量</Text>}
                  value={mockPhysiology.stemDiameterVariation}
                  suffix="mm"
                  precision={3}
                  valueStyle={{ color: '#1890ff', fontSize: 22 }}
                />
              </Card>
              <Card
                size="small"
                style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6 }}
              >
                <Statistic
                  title={<Text style={{ fontSize: 12 }}>🍃 叶片膨压</Text>}
                  value={mockPhysiology.leafTurgorPressure}
                  suffix="MPa"
                  precision={2}
                  valueStyle={{ color: '#fa8c16', fontSize: 22 }}
                />
              </Card>
              <Text type="secondary" style={{ fontSize: 11 }}>
                更新时间：{mockPhysiology.updatedAt}
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* ── Bottom: irrigation comparison ── */}
      <Row>
        <Col span={24}>
          <Card title="今日灌溉计划 vs 实际执行（近7天）" size="small" style={{ borderRadius: 8 }}>
            <ReactECharts option={irrigationOption} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
