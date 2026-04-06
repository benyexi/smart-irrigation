import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Tag } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { mockMapSites, mockHistoryData, mockHistoryTimestamps } from '../../mock';

// ── Particle canvas ────────────────────────────────────────────────────────
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.4, a: Math.random() * 0.35 + 0.08,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,170,${p.a})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 90) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(0,212,170,${0.07 * (1 - d / 90)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

const jitter = (v: number, p = 0.03) => +(v * (1 + (Math.random() - 0.5) * p)).toFixed(2);

const statusConfig: Record<string, { color: string; label: string }> = {
  irrigating: { color: '#00d4aa', label: '灌溉中' },
  standby:    { color: '#ffd32a', label: '待机' },
  alarm:      { color: '#ff4757', label: '报警' },
  offline:    { color: '#4a5568', label: '离线' },
};

const Screen: React.FC = () => {
  const [fullscreen, setFullscreen] = useState(false);
  const [tick, setTick] = useState(0);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const iv = setInterval(() => {
      setCountdown(c => { if (c <= 1) { setTick(t => t + 1); return 5; } return c - 1; });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.(); setFullscreen(true); }
    else { document.exitFullscreen?.(); setFullscreen(false); }
  }, []);

  const soilOpt = {
    backgroundColor: 'transparent',
    grid: { top: 28, right: 8, bottom: 28, left: 46 },
    tooltip: { trigger: 'axis', backgroundColor: '#1a1d2e', borderColor: '#2a2d3e', textStyle: { color: '#e8eaf0' } },
    legend: { data: ['20cm', '40cm', '60cm'], textStyle: { color: '#8892a4', fontSize: 10 }, top: 0, right: 0 },
    xAxis: { type: 'category', data: mockHistoryTimestamps.slice(-12).map((t: string) => t.slice(11, 16)), axisLine: { lineStyle: { color: '#2a2d3e' } }, axisTick: { show: false }, axisLabel: { color: '#8892a4', fontSize: 9 }, splitLine: { show: false } },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#8892a4', fontSize: 9 }, splitLine: { lineStyle: { color: '#2a2d3e', type: 'dashed' } } },
    series: [
      { name: '20cm', type: 'line', smooth: true, data: mockHistoryData.soil_moisture_20cm.slice(-12).map((v: number) => jitter(v)), lineStyle: { color: '#00d4aa', width: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0,212,170,0.3)' }, { offset: 1, color: 'rgba(0,212,170,0.02)' }] } }, symbol: 'none' },
      { name: '40cm', type: 'line', smooth: true, data: mockHistoryData.soil_moisture_40cm.slice(-12).map((v: number) => jitter(v)), lineStyle: { color: '#4f9cf9', width: 2 }, symbol: 'none' },
      { name: '60cm', type: 'line', smooth: true, data: mockHistoryData.soil_moisture_60cm.slice(-12).map((v: number) => jitter(v)), lineStyle: { color: '#ff6b35', width: 2 }, symbol: 'none' },
    ],
  };

  const flowOpt = {
    backgroundColor: 'transparent',
    grid: { top: 16, right: 8, bottom: 28, left: 46 },
    tooltip: { trigger: 'axis', backgroundColor: '#1a1d2e', borderColor: '#2a2d3e', textStyle: { color: '#e8eaf0' } },
    xAxis: { type: 'category', data: mockHistoryTimestamps.slice(-12).map((t: string) => t.slice(11, 16)), axisLine: { lineStyle: { color: '#2a2d3e' } }, axisTick: { show: false }, axisLabel: { color: '#8892a4', fontSize: 9 }, splitLine: { show: false } },
    yAxis: { type: 'value', name: 'g/h', nameTextStyle: { color: '#8892a4', fontSize: 9 }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#8892a4', fontSize: 9 }, splitLine: { lineStyle: { color: '#2a2d3e', type: 'dashed' } } },
    series: [{ type: 'line', smooth: true, data: mockHistoryData.sap_flow_rate.slice(-12).map((v: number) => jitter(v)), lineStyle: { color: '#00d4aa', width: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0,212,170,0.35)' }, { offset: 1, color: 'rgba(0,212,170,0.02)' }] } }, symbol: 'none' }],
  };

  const radarOpt = {
    backgroundColor: 'transparent',
    radar: {
      indicator: mockMapSites.map((s: any) => ({ name: s.name.slice(0, 5), max: 45 })),
      axisLine: { lineStyle: { color: '#2a2d3e' } }, splitLine: { lineStyle: { color: '#2a2d3e' } },
      splitArea: { areaStyle: { color: ['rgba(0,212,170,0.03)', 'rgba(0,212,170,0.01)'] } },
      name: { textStyle: { color: '#8892a4', fontSize: 9 } },
    },
    series: [{ type: 'radar', data: [{ value: mockMapSites.map((s: any) => jitter(s.soilMoisture)), name: '含水率', areaStyle: { color: 'rgba(0,212,170,0.2)' }, lineStyle: { color: '#00d4aa' }, itemStyle: { color: '#00d4aa' } }] }],
  };

  const pieOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: '#1a1d2e', borderColor: '#2a2d3e', textStyle: { color: '#e8eaf0' } },
    legend: { orient: 'vertical', right: 0, top: 'center', textStyle: { color: '#8892a4', fontSize: 10 } },
    series: [{ type: 'pie', radius: ['45%', '70%'], center: ['40%', '50%'], label: { show: false }, emphasis: { label: { show: true, color: '#e8eaf0', fontSize: 11 } }, data: [{ value: 3, name: '严重', itemStyle: { color: '#ff4757' } }, { value: 7, name: '警告', itemStyle: { color: '#ff6b35' } }, { value: 12, name: '提示', itemStyle: { color: '#ffd32a' } }, { value: 28, name: '已处理', itemStyle: { color: '#2a2d3e' } }] }],
  };

  const topStats = [
    { label: '今日灌溉量', value: `${jitter(142.6, 0.05)} m³`, color: '#00d4aa' },
    { label: '活跃站点', value: `${mockMapSites.filter((s: any) => s.status !== 'offline').length}/${mockMapSites.length}`, color: '#4f9cf9' },
    { label: '平均液流速率', value: `${jitter(112.4, 0.04)} g/h`, color: '#ff6b35' },
    { label: '平均土壤含水率', value: `${jitter(27.8, 0.03)}%`, color: '#ffd32a' },
    { label: '未处理报警', value: '3 条', color: '#ff4757' },
    { label: '节水率', value: `${jitter(18.5, 0.02)}%`, color: '#a55eea' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#050810', color: '#e8eaf0', position: 'relative', overflow: 'hidden' }}>
      <ParticleCanvas />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, padding: '14px 24px', borderBottom: '1px solid rgba(0,212,170,0.15)', background: 'rgba(5,8,16,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: '#8892a4' }}>{new Date().toLocaleString('zh-CN')}</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(90deg,#00d4aa,#4f9cf9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 4 }}>智灌云 · 数据大屏</div>
          <div style={{ fontSize: 10, color: '#8892a4', letterSpacing: 2 }}>SMART IRRIGATION DATA DASHBOARD</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#8892a4' }}><ReloadOutlined spin={countdown <= 1} style={{ marginRight: 4 }} />{countdown}s 刷新</span>
          <span onClick={toggleFS} style={{ cursor: 'pointer', color: '#8892a4', fontSize: 18 }}>{fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ position: 'relative', zIndex: 1, padding: '10px 16px 0' }}>
        <Row gutter={10}>
          {topStats.map(s => (
            <Col key={s.label} flex="auto">
              <div style={{ textAlign: 'center', padding: '8px 6px', background: 'rgba(26,29,46,0.7)', border: `1px solid ${s.color}33`, borderRadius: 8, backdropFilter: 'blur(4px)' }}>
                <div className="stat-number" style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#8892a4', marginTop: 2 }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Charts */}
      <div style={{ position: 'relative', zIndex: 1, padding: '10px 16px 0' }}>
        <Row gutter={10}>
          <Col xs={24} lg={8}>
            <div style={{ background: 'rgba(26,29,46,0.7)', border: '1px solid #2a2d3e', borderRadius: 8, padding: '10px 10px 6px', marginBottom: 10, backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 11, color: '#8892a4', marginBottom: 4, fontWeight: 600 }}>土壤含水率 · 实时滚动</div>
              <ReactECharts key={tick} option={soilOpt} style={{ height: 170 }} />
            </div>
            <div style={{ background: 'rgba(26,29,46,0.7)', border: '1px solid #2a2d3e', borderRadius: 8, padding: '10px 10px 6px', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 11, color: '#8892a4', marginBottom: 4, fontWeight: 600 }}>液流速率 · 实时滚动</div>
              <ReactECharts key={tick + 100} option={flowOpt} style={{ height: 150 }} />
            </div>
          </Col>

          <Col xs={24} lg={8}>
            <div style={{ background: 'rgba(26,29,46,0.7)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 8, padding: 14, backdropFilter: 'blur(4px)', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 11, color: '#8892a4', marginBottom: 8, fontWeight: 600 }}>站点分布 · 实时状态</div>
              <svg viewBox="0 0 400 280" style={{ flex: 1, width: '100%' }}>
                {[60, 120, 180, 240, 300, 360].map(x => <line key={x} x1={x} y1={0} x2={x} y2={280} stroke="#1e2235" strokeWidth="0.8" />)}
                {[56, 112, 168, 224].map(y => <line key={y} x1={0} y1={y} x2={400} y2={y} stroke="#1e2235" strokeWidth="0.8" />)}
                {mockMapSites.map((site: any) => {
                  const x = 40 + (site.lng - 111) * 14;
                  const y = 260 - (site.lat - 35) * 18;
                  const cfg = statusConfig[site.status];
                  return (
                    <g key={site.id}>
                      <circle cx={x} cy={y} r="16" fill={cfg.color} opacity="0.07" />
                      <circle cx={x} cy={y} r="8" fill={cfg.color} opacity="0.85" />
                      <circle cx={x} cy={y} r="4" fill={cfg.color} />
                      <text x={x + 12} y={y - 4} fill="#8892a4" fontSize="8">{site.name.slice(0, 7)}</text>
                      <text x={x + 12} y={y + 7} fill={cfg.color} fontSize="8">{cfg.label} {jitter(site.soilMoisture, 0.03)}%</text>
                    </g>
                  );
                })}
              </svg>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 6 }}>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: v.color }} />
                    <span style={{ fontSize: 9, color: '#8892a4' }}>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Col>

          <Col xs={24} lg={8}>
            <div style={{ background: 'rgba(26,29,46,0.7)', border: '1px solid #2a2d3e', borderRadius: 8, padding: '10px 10px 6px', marginBottom: 10, backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 11, color: '#8892a4', marginBottom: 4, fontWeight: 600 }}>各站点土壤含水率（雷达图）</div>
              <ReactECharts key={tick + 200} option={radarOpt} style={{ height: 170 }} />
            </div>
            <div style={{ background: 'rgba(26,29,46,0.7)', border: '1px solid #2a2d3e', borderRadius: 8, padding: '10px 10px 6px', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 11, color: '#8892a4', marginBottom: 4, fontWeight: 600 }}>报警统计分布</div>
              <ReactECharts key={tick + 300} option={pieOpt} style={{ height: 150 }} />
            </div>
          </Col>
        </Row>

        {/* Bottom site grid */}
        <div style={{ marginTop: 10, background: 'rgba(26,29,46,0.7)', border: '1px solid #2a2d3e', borderRadius: 8, padding: '10px 14px', backdropFilter: 'blur(4px)' }}>
          <div style={{ fontSize: 11, color: '#8892a4', marginBottom: 8, fontWeight: 600 }}>站点实时数据汇总</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {mockMapSites.map((site: any) => {
              const cfg = statusConfig[site.status];
              return (
                <div key={site.id} style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 6, border: `1px solid ${cfg.color}33` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#e8eaf0', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.name}</div>
                  <div style={{ fontSize: 9, color: '#8892a4' }}>液流 <span style={{ color: '#00d4aa' }}>{jitter(site.sapFlowRate, 0.04)} g/h</span></div>
                  <div style={{ fontSize: 9, color: '#8892a4' }}>水分 <span style={{ color: '#4f9cf9' }}>{jitter(site.soilMoisture, 0.03)}%</span></div>
                  <Tag color={site.status === 'irrigating' ? 'success' : site.status === 'alarm' ? 'error' : site.status === 'offline' ? 'default' : 'warning'} style={{ fontSize: 9, marginTop: 3, padding: '0 4px', lineHeight: '16px' }}>{cfg.label}</Tag>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Screen;
