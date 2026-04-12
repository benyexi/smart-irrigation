import React, { Suspense, lazy, useMemo, useState } from 'react';
import { Row, Col, Card, Select, Button, Typography, Space, Skeleton, message } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import DeferredEChart from '../../components/ECharts/DeferredEChart';
import LiteDateRange from '../../components/Inputs/LiteDateRange';
import type { ColumnsType } from 'antd/es/table';
import { mockHistoryData, mockHistoryTimestamps, metricLabels, mockSites } from '../../mock';

const { Title } = Typography;
const HistoryTableCard = lazy(() => import('./components/HistoryTableCard'));
const HistoryReportModal = lazy(() => import('./components/HistoryReportModal'));

const metrics = Object.keys(metricLabels);
const colorMap: Record<string, string> = {
  soil_moisture_20cm: '#00d4aa', soil_moisture_40cm: '#4f9cf9', soil_moisture_60cm: '#ff6b35',
  soil_moisture_80cm: '#ffd32a', soil_moisture_100cm: '#a55eea',
  soil_potential_40cm: '#ff4757', sap_flow_rate: '#00d4aa', stem_diameter_variation: '#4f9cf9',
  temperature: '#ff6b35', rainfall: '#4f9cf9',
};

const History: React.FC = () => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['soil_moisture_40cm', 'sap_flow_rate']);
  const [reportModal, setReportModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  const chartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { top: 40, right: 16, bottom: 60, left: 60 },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(20,23,32,0.95)', borderColor: '#2a2d3e', textStyle: { color: '#e8eaf0' } },
    legend: { data: selectedMetrics.map(m => metricLabels[m] ?? m), textStyle: { color: '#8892a4' }, bottom: 0, type: 'scroll' },
    xAxis: { type: 'category', data: mockHistoryTimestamps.map((t: string) => t.slice(5,16)), axisLine: { lineStyle: { color: '#2a2d3e' } }, axisTick: { show: false }, axisLabel: { color: '#8892a4', fontSize: 10, rotate: 30, interval: 11 }, splitLine: { show: false } },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#8892a4', fontSize: 11 }, splitLine: { lineStyle: { color: '#2a2d3e', type: 'dashed' } } },
    series: selectedMetrics.map(m => ({
      name: metricLabels[m] ?? m,
      type: 'line',
      smooth: true,
      data: (mockHistoryData as Record<string, number[]>)[m] ?? [],
      lineStyle: { color: colorMap[m] ?? '#00d4aa', width: 2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: (colorMap[m] ?? '#00d4aa') + '33' }, { offset: 1, color: (colorMap[m] ?? '#00d4aa') + '05' }] } },
      symbol: 'none',
    })),
  }), [selectedMetrics]);

  const tableData = mockHistoryTimestamps.slice(-48).map((ts: string, i: number) => {
    const row: Record<string, string | number> = { key: i, time: ts };
    selectedMetrics.forEach(m => { row[m] = +((mockHistoryData as Record<string, number[]>)[m]?.[mockHistoryTimestamps.length - 48 + i] ?? 0).toFixed(2); });
    return row;
  });

  const columns: ColumnsType<Record<string, string | number>> = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 160, fixed: 'left' },
    ...selectedMetrics.map(m => ({ title: metricLabels[m] ?? m, dataIndex: m, key: m, width: 140 })),
  ];

  const exportCSV = () => {
    const header = ['时间', ...selectedMetrics.map(m => metricLabels[m] ?? m)].join(',');
    const rows = tableData.map(r => [r.time, ...selectedMetrics.map(m => r[m])].join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'irrigation_history.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const generateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>智灌云 - 灌溉数据报告</title>
<style>body{font-family:sans-serif;background:#fff;color:#333;padding:40px}h1{color:#00a87e}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.cover{text-align:center;padding:60px 0;border-bottom:2px solid #00a87e;margin-bottom:40px}</style></head>
<body><div class="cover"><h1>智灌云 · 灌溉数据报告</h1><p>生成时间：${new Date().toLocaleString('zh-CN')}</p><p>站点：北京大兴苹果园 A区</p></div>
<h2>数据摘要</h2><p>报告周期：最近48小时 &nbsp;|&nbsp; 指标数量：${selectedMetrics.length}</p>
<h2>数据明细</h2><table><tr><th>时间</th>${selectedMetrics.map(m=>`<th>${metricLabels[m]??m}</th>`).join('')}</tr>
${tableData.slice(0,20).map(r=>`<tr><td>${r.time}</td>${selectedMetrics.map(m=>`<td>${r[m]}</td>`).join('')}</tr>`).join('')}
</table></body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'irrigation_report.html'; a.click();
      URL.revokeObjectURL(url);
      setGenerating(false);
      setReportModal(false);
      message.success('报告已生成并下载');
    }, 1200);
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>历史数据</Title>
        <Space>
          <Button icon={<FileTextOutlined />} onClick={() => setReportModal(true)}>生成报告</Button>
          <Button icon={<DownloadOutlined />} onClick={exportCSV}>导出 CSV</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={12} align="middle">
          <Col><LiteDateRange compact width={260} /></Col>
          <Col flex="auto">
            <Select mode="multiple" value={selectedMetrics} onChange={setSelectedMetrics} style={{ width: '100%' }}
              options={metrics.map(m => ({ value: m, label: metricLabels[m] ?? m }))} maxTagCount={3} />
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <DeferredEChart option={chartOption} style={{ height: 300 }} />
      </Card>

      <Suspense fallback={<Card><Skeleton active paragraph={{ rows: 6 }} title={false} /></Card>}>
        <HistoryTableCard columns={columns} dataSource={tableData} />
      </Suspense>

      {reportModal ? (
        <Suspense fallback={null}>
          <HistoryReportModal
            open={reportModal}
            generating={generating}
            siteOptions={mockSites.map((site) => ({ value: site.id, label: site.name }))}
            onCancel={() => setReportModal(false)}
            onGenerate={generateReport}
          />
        </Suspense>
      ) : null}
    </div>
  );
};

export default History;
