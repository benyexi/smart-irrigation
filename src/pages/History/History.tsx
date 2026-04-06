// History data page — multi-metric ECharts line chart + data table + CSV export
import React, { useState, useMemo } from 'react';
import {
  Row, Col, Card, Select, Button, Table, Typography, DatePicker,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import {
  mockSites, mockHistoryTimestamps, mockHistorySeries, metricLabels,
} from '../../mock';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const allMetrics = Object.keys(mockHistorySeries) as Array<keyof typeof mockHistorySeries>;
const metricColors: Record<string, string> = {
  soil_moisture_40cm: '#52c41a',
  soil_moisture_60cm: '#1890ff',
  soil_potential_40cm: '#722ed1',
  sap_flow_rate: '#fa8c16',
  stem_diameter_variation: '#eb2f96',
  temperature: '#ff4d4f',
  rainfall: '#13c2c2',
};

const History: React.FC = () => {
  const [siteId, setSiteId] = useState('site001');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'soil_moisture_40cm', 'sap_flow_rate', 'temperature',
  ]);

  // Use last 72 data points for display performance
  const displayCount = 72;
  const timestamps = useMemo(() => mockHistoryTimestamps.slice(-displayCount), []);

  const chartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      confine: true,
    },
    legend: {
      data: selectedMetrics.map((m) => metricLabels[m]),
      bottom: 0,
      type: 'scroll',
    },
    grid: { left: 60, right: 20, top: 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: timestamps,
      axisLabel: {
        fontSize: 10,
        formatter: (v: string) => v.slice(5, 16),
        rotate: 30,
      },
    },
    yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', start: 0, end: 100, height: 20, bottom: 35 },
    ],
    series: selectedMetrics.map((m) => ({
      name: metricLabels[m],
      type: 'line',
      data: mockHistorySeries[m as keyof typeof mockHistorySeries].slice(-displayCount),
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color: metricColors[m] ?? '#52c41a' },
    })),
  }), [selectedMetrics, timestamps]);

  // Table columns — timestamp + selected metrics
  const tableColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      fixed: 'left' as const,
    },
    ...selectedMetrics.map((m) => ({
      title: metricLabels[m],
      dataIndex: m,
      key: m,
      width: 140,
    })),
  ];

  // Table data — last 100 rows
  const tableData = useMemo(() =>
    timestamps.slice(-100).map((ts, i) => {
      const row: Record<string, string | number> = { key: ts, timestamp: ts };
      selectedMetrics.forEach((m) => {
        const arr = mockHistorySeries[m as keyof typeof mockHistorySeries];
        row[m] = arr[arr.length - 100 + i] ?? '-';
      });
      return row;
    }),
    [selectedMetrics, timestamps]
  );

  // CSV export
  const exportCSV = () => {
    const header = ['时间', ...selectedMetrics.map((m) => metricLabels[m])].join(',');
    const rows = tableData.map((r) =>
      [r.timestamp, ...selectedMetrics.map((m) => r[m])].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `irrigation_history_${siteId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      <Title level={4} style={{ marginBottom: 16 }}>历史数据</Title>

      {/* ── Filters ── */}
      <Card size="small" style={{ borderRadius: 8, marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" wrap>
          <Col>
            <Select
              value={siteId}
              onChange={setSiteId}
              style={{ width: 220 }}
              options={mockSites.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Col>
          <Col>
            <RangePicker style={{ width: 260 }} />
          </Col>
          <Col flex="auto">
            <Select
              mode="multiple"
              value={selectedMetrics}
              onChange={setSelectedMetrics}
              style={{ width: '100%', minWidth: 300 }}
              placeholder="选择指标"
              options={allMetrics.map((m) => ({ value: m, label: metricLabels[m] }))}
              maxTagCount="responsive"
            />
          </Col>
          <Col>
            <Button icon={<DownloadOutlined />} onClick={exportCSV}>
              导出 CSV
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ── Chart ── */}
      <Card
        title="历史趋势图（近3天，每小时1点）"
        size="small"
        style={{ borderRadius: 8, marginBottom: 16 }}
      >
        <ReactECharts option={chartOption} style={{ height: 340 }} />
      </Card>

      {/* ── Table ── */}
      <Card title="数据明细（最近100条）" size="small" style={{ borderRadius: 8 }}>
        <Table
          columns={tableColumns}
          dataSource={tableData}
          rowKey="key"
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default History;
