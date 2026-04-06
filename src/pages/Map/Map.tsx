import React, { useEffect, useRef, useState } from 'react';
import { Tag, Typography, Row, Col } from 'antd';
import { mockMapSites, type MapSite } from '../../mock';

const { Text } = Typography;

const statusConfig: Record<string, { color: string; label: string; tagColor: string }> = {
  irrigating: { color: '#00d4aa', label: '灌溉中', tagColor: 'success' },
  standby:    { color: '#ffd32a', label: '待机',   tagColor: 'warning' },
  alarm:      { color: '#ff4757', label: '报警',   tagColor: 'error' },
  offline:    { color: '#4a5568', label: '离线',   tagColor: 'default' },
};

const statBar = [
  { label: '总站点', value: mockMapSites.length, color: 'var(--text-primary)' },
  { label: '灌溉中', value: mockMapSites.filter((s: MapSite) => s.status === 'irrigating').length, color: '#00d4aa' },
  { label: '报警', value: mockMapSites.filter((s: MapSite) => s.status === 'alarm').length, color: '#ff4757' },
  { label: '离线', value: mockMapSites.filter((s: MapSite) => s.status === 'offline').length, color: '#4a5568' },
];

declare global { interface Window { AMap: any; _amapLoaded?: boolean; } }

const MapPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [selectedSite, setSelectedSite] = useState<MapSite | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (window.AMap) { initMap(); return; }
    const script = document.createElement('script');
    script.src = 'https://webapi.amap.com/maps?v=2.0&key=DEMO&callback=_amapCb';
    script.async = true;
    (window as any)._amapCb = () => { initMap(); };
    document.head.appendChild(script);
    return () => { delete (window as any)._amapCb; };
  }, []);

  const initMap = () => {
    if (!mapRef.current || !window.AMap) return;
    const map = new window.AMap.Map(mapRef.current, { zoom: 7, center: [116.0, 38.5], mapStyle: 'amap://styles/dark' });
    mapInstance.current = map;
    mockMapSites.forEach((site: MapSite) => {
      const cfg = statusConfig[site.status];
      const marker = new window.AMap.Marker({ position: [site.lng, site.lat], content: `<div style="width:12px;height:12px;border-radius:50%;background:${cfg.color};box-shadow:0 0 8px ${cfg.color}"></div>`, offset: new window.AMap.Pixel(-6,-6) });
      marker.on('click', () => setSelectedSite(site));
      map.add(marker);
    });
    setMapLoaded(true);
  };

  const flyTo = (site: MapSite) => {
    setSelectedSite(site);
    if (mapInstance.current) { mapInstance.current.setCenter([site.lng, site.lat]); mapInstance.current.setZoom(12); }
  };

  return (
    <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-base)', display: 'flex', gap: 32, alignItems: 'center' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 700 }}>站点地图</div>
        {statBar.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="stat-number" style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 280, background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-base)', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-base)', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>站点列表 ({mockMapSites.length})</div>
          {mockMapSites.map((site: MapSite) => {
            const cfg = statusConfig[site.status];
            const isSel = selectedSite?.id === site.id;
            return (
              <div key={site.id} onClick={() => flyTo(site)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-base)', background: isSel ? 'var(--primary-dim)' : 'transparent', borderLeft: isSel ? '3px solid var(--primary)' : '3px solid transparent', transition: 'var(--transition)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{site.name}</Text>
                  <Tag color={cfg.tagColor} style={{ fontSize: 10, margin: 0 }}>{cfg.label}</Tag>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{site.plantType} · {site.area}亩</div>
                <Row gutter={8} style={{ marginTop: 6 }}>
                  <Col span={12}><div style={{ fontSize: 11, color: '#00d4aa' }}>液流 {site.sapFlowRate} g/h</div></Col>
                  <Col span={12}><div style={{ fontSize: 11, color: '#4f9cf9' }}>水分 {site.soilMoisture}%</div></Col>
                </Row>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          {!mapLoaded && (
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, #1a2035 0%, #0f1117 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <svg width="580" height="360" viewBox="0 0 580 360">
                <rect width="580" height="360" fill="#12152a" rx="12"/>
                <path d="M30,200 Q120,140 200,170 Q280,200 360,155 Q440,110 540,130" stroke="#2a2d3e" strokeWidth="2" fill="none"/>
                <path d="M30,260 Q130,230 230,250 Q330,270 430,240 Q500,220 560,235" stroke="#2a2d3e" strokeWidth="1.5" fill="none"/>
                {mockMapSites.map((site: MapSite) => {
                  const x = 60 + (site.lng - 111) * 16;
                  const y = 320 - (site.lat - 35) * 20;
                  const cfg = statusConfig[site.status];
                  return (
                    <g key={site.id}>
                      <circle cx={x} cy={y} r="16" fill={cfg.color} opacity="0.08"/>
                      <circle cx={x} cy={y} r="7" fill={cfg.color} opacity="0.9"/>
                      <text x={x+12} y={y+4} fill="#8892a4" fontSize="10">{site.name.slice(0,6)}</text>
                    </g>
                  );
                })}
              </svg>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>站点分布示意图</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>配置高德地图 API Key 后可显示真实地图</div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  {Object.entries(statusConfig).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: v.color }}/>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {selectedSite && (
            <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(26,29,46,0.96)', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-md)', padding: 16, minWidth: 220, backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>{selectedSite.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>植物类型：{selectedSite.plantType}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>种植面积：{selectedSite.area} 亩</div>
              <div style={{ fontSize: 12, color: '#00d4aa', marginBottom: 4 }}>液流速率：{selectedSite.sapFlowRate} g/h</div>
              <div style={{ fontSize: 12, color: '#4f9cf9', marginBottom: 8 }}>土壤含水率：{selectedSite.soilMoisture}%</div>
              <Tag color={statusConfig[selectedSite.status].tagColor}>{statusConfig[selectedSite.status].label}</Tag>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
