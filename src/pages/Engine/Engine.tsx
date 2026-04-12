import React, { Suspense, lazy, useState, useCallback } from 'react';
import { Row, Col, Card, Slider, Button, Progress, Typography, Divider, Skeleton } from 'antd';
import { PlayCircleOutlined, ThunderboltOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import LiteSelect from '../../components/Inputs/LiteSelect';
import type { DecisionLog } from './components/EngineLogTable';

const { Title, Text } = Typography;
const EngineLogTable = lazy(() => import('./components/EngineLogTable'));

// ── Decision engine logic ──────────────────────────────────────────────────
function runDecision(params: {
  mode: string;
  soilMoisture: number;
  sapFlowRate: number;
  leafTurgor: number;
  et0: number;
  rainfall: number;
  kc: number;
  fieldCapacity: number;
  wiltingPoint: number;
  area: number;
}) {
  const { mode, soilMoisture, sapFlowRate, leafTurgor, et0, rainfall, kc, fieldCapacity, wiltingPoint, area } = params;
  let shouldIrrigate = false;
  let reason = '';
  let volume = 0;
  let duration = 0;

  const mad = fieldCapacity - (fieldCapacity - wiltingPoint) * 0.5; // MAD threshold

  if (mode === 'soil') {
    shouldIrrigate = soilMoisture < mad;
    reason = shouldIrrigate
      ? `土壤含水率 ${soilMoisture}% < MAD阈值 ${mad.toFixed(1)}%，需要灌溉`
      : `土壤含水率 ${soilMoisture}% ≥ MAD阈值 ${mad.toFixed(1)}%，无需灌溉`;
    volume = shouldIrrigate ? +((fieldCapacity - soilMoisture) * 0.01 * 600 * area * 0.7).toFixed(1) : 0;
  } else if (mode === 'sapflow') {
    shouldIrrigate = sapFlowRate < 80;
    reason = shouldIrrigate
      ? `液流速率 ${sapFlowRate} g/h < 阈值 80 g/h，植物水分亏缺`
      : `液流速率 ${sapFlowRate} g/h 正常，无需灌溉`;
    volume = shouldIrrigate ? +(sapFlowRate < 50 ? area * 3.5 : area * 2.0).toFixed(1) : 0;
  } else if (mode === 'turgor') {
    shouldIrrigate = leafTurgor < 0.8;
    reason = shouldIrrigate
      ? `叶片膨压 ${leafTurgor} MPa < 阈值 0.8 MPa，水分胁迫`
      : `叶片膨压 ${leafTurgor} MPa 正常`;
    volume = shouldIrrigate ? +(area * 2.8).toFixed(1) : 0;
  } else if (mode === 'et') {
    const etc = et0 * kc;
    const netIrr = Math.max(0, etc - rainfall);
    shouldIrrigate = netIrr > 1.0;
    reason = `ET₀=${et0} × Kc=${kc} = ETc=${etc.toFixed(2)} mm/d，降雨=${rainfall}mm，净需水=${netIrr.toFixed(2)}mm`;
    volume = shouldIrrigate ? +(netIrr * 0.667 * area).toFixed(1) : 0;
  } else {
    // combined
    const soilOk = soilMoisture >= mad;
    const flowOk = sapFlowRate >= 80;
    const turgorOk = leafTurgor >= 0.8;
    const score = [soilOk, flowOk, turgorOk].filter(Boolean).length;
    shouldIrrigate = score < 2;
    reason = `综合评分 ${score}/3：土壤${soilOk?'✓':'✗'} 液流${flowOk?'✓':'✗'} 膨压${turgorOk?'✓':'✗'}`;
    volume = shouldIrrigate ? +(area * 2.5).toFixed(1) : 0;
  }

  duration = volume > 0 ? Math.round(volume / (area * 0.08)) : 0;
  return { shouldIrrigate, reason, volume, duration };
}

const modeOptions = [
  { value: 'soil',     label: '土壤水分阈值法' },
  { value: 'sapflow',  label: '液流速率指标法' },
  { value: 'turgor',   label: '叶片膨压指标法' },
  { value: 'et',       label: 'ET₀-Kc 系数法' },
  { value: 'combined', label: '综合指标法' },
];

const Engine: React.FC = () => {
  const [mode, setMode] = useState('combined');
  const [soilMoisture, setSoilMoisture] = useState(22);
  const [sapFlowRate, setSapFlowRate] = useState(75);
  const [leafTurgor, setLeafTurgor] = useState(0.72);
  const [et0, setEt0] = useState(4.2);
  const [rainfall, setRainfall] = useState(0.5);
  const [kc, setKc] = useState(0.85);
  const [fieldCapacity, setFieldCapacity] = useState(32);
  const [wiltingPoint, setWiltingPoint] = useState(14);
  const [area, setArea] = useState(50);
  const [result, setResult] = useState<ReturnType<typeof runDecision> | null>(null);
  const [logs, setLogs] = useState<DecisionLog[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runEngine = useCallback(() => {
    setRunning(true);
    setProgress(0);
    const steps = [10, 30, 55, 75, 90, 100];
    steps.forEach((p, i) => {
      setTimeout(() => {
        setProgress(p);
        if (p === 100) {
          const res = runDecision({ mode, soilMoisture, sapFlowRate, leafTurgor, et0, rainfall, kc, fieldCapacity, wiltingPoint, area });
          setResult(res);
          setRunning(false);
          const newLog: DecisionLog = {
            key: Date.now(),
            time: new Date().toLocaleTimeString('zh-CN'),
            mode: modeOptions.find(m2 => m2.value === mode)?.label ?? mode,
            input: `水分${soilMoisture}% 液流${sapFlowRate}g/h`,
            result: res.shouldIrrigate ? '建议灌溉' : '无需灌溉',
            volume: res.volume,
            duration: res.duration,
            status: res.shouldIrrigate ? 'irrigate' : 'skip',
          };
          setLogs(prev => [newLog, ...prev].slice(0, 20));
        }
      }, i * 180);
    });
  }, [mode, soilMoisture, sapFlowRate, leafTurgor, et0, rainfall, kc, fieldCapacity, wiltingPoint, area]);

  return (
    <div className="page-container">
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>决策引擎</Title>
        <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>基于多指标融合的智能灌溉决策模拟</Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* Left: inputs */}
        <Col xs={24} lg={10}>
          <Card title="输入参数" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>决策模式</div>
              <LiteSelect value={mode} onChange={setMode} style={{ width: '100%' }} options={modeOptions} />
            </div>
            <Divider style={{ margin: '12px 0', borderColor: 'var(--border-base)' }} />
            {[
              { label: `土壤含水率 (${soilMoisture}%)`, min: 5, max: 45, step: 0.5, val: soilMoisture, set: setSoilMoisture, color: '#4f9cf9' },
              { label: `液流速率 (${sapFlowRate} g/h)`, min: 0, max: 300, step: 1, val: sapFlowRate, set: setSapFlowRate, color: '#00d4aa' },
              { label: `叶片膨压 (${leafTurgor} MPa)`, min: 0.3, max: 1.5, step: 0.01, val: leafTurgor, set: setLeafTurgor, color: '#ff6b35' },
              { label: `ET₀ (${et0} mm/d)`, min: 0, max: 12, step: 0.1, val: et0, set: setEt0, color: '#ffd32a' },
              { label: `降雨量 (${rainfall} mm)`, min: 0, max: 30, step: 0.5, val: rainfall, set: setRainfall, color: '#a55eea' },
              { label: `Kc 系数 (${kc})`, min: 0.3, max: 1.5, step: 0.01, val: kc, set: setKc, color: '#00d4aa' },
              { label: `田间持水量 (${fieldCapacity}%)`, min: 20, max: 50, step: 0.5, val: fieldCapacity, set: setFieldCapacity, color: '#4f9cf9' },
              { label: `凋萎系数 (${wiltingPoint}%)`, min: 5, max: 25, step: 0.5, val: wiltingPoint, set: setWiltingPoint, color: '#ff4757' },
              { label: `种植面积 (${area} 亩)`, min: 5, max: 500, step: 5, val: area, set: setArea, color: '#8892a4' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
                </div>
                <Slider min={item.min} max={item.max} step={item.step} value={item.val}
                  onChange={v => item.set(v as number)}
                  trackStyle={{ background: item.color }}
                  handleStyle={{ borderColor: item.color }}
                />
              </div>
            ))}
            <Button type="primary" icon={<PlayCircleOutlined />} block size="large" loading={running} onClick={runEngine} style={{ marginTop: 8 }}>
              运行决策引擎
            </Button>
          </Card>
        </Col>

        {/* Right: result */}
        <Col xs={24} lg={14}>
          <Card title="决策结果" style={{ marginBottom: 16 }}>
            {running && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>正在运行决策算法...</div>
                <Progress percent={progress} strokeColor={{ '0%': '#00d4aa', '100%': '#4f9cf9' }} trailColor="var(--border-base)" />
              </div>
            )}
            {result ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 20, background: result.shouldIrrigate ? 'rgba(0,212,170,0.08)' : 'rgba(79,156,249,0.08)', borderRadius: 'var(--radius-md)', border: `1px solid ${result.shouldIrrigate ? 'rgba(0,212,170,0.3)' : 'rgba(79,156,249,0.3)'}` }}>
                  {result.shouldIrrigate
                    ? <CheckCircleOutlined style={{ fontSize: 36, color: '#00d4aa' }} />
                    : <CloseCircleOutlined style={{ fontSize: 36, color: '#4f9cf9' }} />}
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: result.shouldIrrigate ? '#00d4aa' : '#4f9cf9' }}>
                      {result.shouldIrrigate ? '建议立即灌溉' : '暂无需灌溉'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{result.reason}</div>
                  </div>
                </div>
                {result.shouldIrrigate && (
                  <Row gutter={[12, 12]}>
                    {[
                      { label: '建议灌水量', value: `${result.volume} m³`, color: '#00d4aa' },
                      { label: '预计灌溉时长', value: `${result.duration} min`, color: '#4f9cf9' },
                      { label: '灌溉面积', value: `${area} 亩`, color: '#ff6b35' },
                      { label: '单位面积用水', value: `${(result.volume / area).toFixed(2)} m³/亩`, color: '#ffd32a' },
                    ].map(item => (
                      <Col span={12} key={item.label}>
                        <div style={{ padding: 16, background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-base)', textAlign: 'center' }}>
                          <div className="stat-number" style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <ThunderboltOutlined style={{ fontSize: 48, opacity: 0.3, marginBottom: 12, display: 'block' }} />
                调整左侧参数后点击"运行决策引擎"
              </div>
            )}
          </Card>

          <Suspense fallback={<Card title={`决策日志（${logs.length} 条）`}><Skeleton active paragraph={{ rows: 6 }} title={false} /></Card>}>
            <EngineLogTable logs={logs} />
          </Suspense>
        </Col>
      </Row>
    </div>
  );
};

export default Engine;
