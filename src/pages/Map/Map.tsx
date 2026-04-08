import React, { useEffect, useMemo, useState } from 'react';
import { Col, Row, Tag, Typography } from 'antd';
import type { Site } from '../../types/site';
import { getSites } from '../../utils/siteStorage';

const { Text } = Typography;

const statusConfig: Record<Site['status'], { color: string; label: string; tagColor: 'success' | 'default' | 'error' }> = {
  running: { color: '#00d4aa', label: '运行中', tagColor: 'success' },
  pending: { color: '#8892a4', label: '待配置', tagColor: 'default' },
  alarm: { color: '#ff4757', label: '报警', tagColor: 'error' },
};

type CoordSite = Site & { lat: number; lng: number };

const hasCoord = (site: Site): site is CoordSite => Number.isFinite(site.lat) && Number.isFinite(site.lng);

const MapPage: React.FC = () => {
  const [sites, setSites] = useState<Site[]>(() => getSites());
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  useEffect(() => {
    const sync = () => {
      const nextSites = getSites();
      setSites(nextSites);
      if (selectedSiteId && nextSites.some((site) => site.id === selectedSiteId)) {
        return;
      }
      setSelectedSiteId(nextSites[0]?.id ?? '');
    };

    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, [selectedSiteId]);

  const selectedSite = sites.find((site) => site.id === selectedSiteId) ?? sites[0] ?? null;

  const coordSites = useMemo(() => sites.filter(hasCoord), [sites]);

  const bounds = useMemo(() => {
    if (coordSites.length === 0) {
      return { minLng: 73, maxLng: 136, minLat: 18, maxLat: 54 };
    }
    const lngValues = coordSites.map((site) => site.lng);
    const latValues = coordSites.map((site) => site.lat);
    const minLng = Math.min(...lngValues);
    const maxLng = Math.max(...lngValues);
    const minLat = Math.min(...latValues);
    const maxLat = Math.max(...latValues);
    const lngPad = Math.max(0.8, (maxLng - minLng) * 0.15 || 0.8);
    const latPad = Math.max(0.8, (maxLat - minLat) * 0.15 || 0.8);

    return {
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad,
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
    };
  }, [coordSites]);

  const project = (site: Site, idx: number) => {
    const width = 700;
    const height = 420;
    const padX = 56;
    const padY = 44;

    if (hasCoord(site)) {
      const lngSpan = bounds.maxLng - bounds.minLng || 1;
      const latSpan = bounds.maxLat - bounds.minLat || 1;
      const xRatio = (site.lng - bounds.minLng) / lngSpan;
      const yRatio = (site.lat - bounds.minLat) / latSpan;
      const x = padX + xRatio * (width - padX * 2);
      const y = height - padY - yRatio * (height - padY * 2);
      return { x, y };
    }

    const col = idx % 4;
    const row = Math.floor(idx / 4);
    return { x: 100 + col * 140, y: 100 + row * 72 };
  };

  const summary = {
    total: sites.length,
    running: sites.filter((site) => site.status === 'running').length,
    pending: sites.filter((site) => site.status === 'pending').length,
    alarm: sites.filter((site) => site.status === 'alarm').length,
  };

  return (
    <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '10px 20px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-base)',
          display: 'flex',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <div style={{ color: 'var(--primary)', fontWeight: 700 }}>站点地图</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="stat-number" style={{ fontSize: 20, color: 'var(--text-primary)' }}>{summary.total}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>总站点</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="stat-number" style={{ fontSize: 20, color: '#00d4aa' }}>{summary.running}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>运行中</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="stat-number" style={{ fontSize: 20, color: '#8892a4' }}>{summary.pending}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>待配置</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="stat-number" style={{ fontSize: 20, color: '#ff4757' }}>{summary.alarm}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>报警</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div
          style={{
            width: 300,
            background: 'var(--bg-sidebar)',
            borderRight: '1px solid var(--border-base)',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-base)', fontSize: 12, color: '#8892a4' }}>
            站点列表 ({sites.length})
          </div>

          {sites.map((site) => {
            const selected = selectedSite?.id === site.id;
            const cfg = statusConfig[site.status];
            const coordText = hasCoord(site) ? `${site.lat.toFixed(3)}, ${site.lng.toFixed(3)}` : '未配置坐标';
            return (
              <div
                key={site.id}
                onClick={() => setSelectedSiteId(site.id)}
                style={{
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-base)',
                  background: selected ? 'var(--primary-dim)' : 'transparent',
                  borderLeft: selected ? '3px solid var(--primary)' : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{site.name}</Text>
                  <Tag color={cfg.tagColor} style={{ margin: 0 }}>{cfg.label}</Tag>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{site.plantType} · {site.area} 亩</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>坐标：{coordText}</div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, position: 'relative', background: 'radial-gradient(ellipse at 50% 60%, #1a2035 0%, #0f1117 100%)' }}>
          <svg width="100%" height="100%" viewBox="0 0 700 420" preserveAspectRatio="xMidYMid meet">
            <rect x="0" y="0" width="700" height="420" fill="transparent" />
            <path d="M30,210 Q120,140 220,175 Q300,205 390,160 Q490,110 660,142" stroke="#2a2d3e" strokeWidth="2" fill="none" />
            <path d="M20,300 Q150,250 280,280 Q410,305 540,262 Q610,240 680,252" stroke="#2a2d3e" strokeWidth="1.6" fill="none" />

            {sites.map((site, index) => {
              const p = project(site, index);
              const cfg = statusConfig[site.status];
              const selected = selectedSite?.id === site.id;
              return (
                <g key={site.id} onClick={() => setSelectedSiteId(site.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={p.x} cy={p.y} r={selected ? 18 : 14} fill={cfg.color} opacity={selected ? 0.2 : 0.12} />
                  <circle cx={p.x} cy={p.y} r={selected ? 8 : 6} fill={cfg.color} opacity={0.95} />
                  <text x={p.x + 12} y={p.y + 4} fill="#8892a4" fontSize="11">{site.name.slice(0, 8)}</text>
                </g>
              );
            })}
          </svg>

          {selectedSite ? (
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(26,29,46,0.95)',
                border: '1px solid var(--border-base)',
                borderRadius: 12,
                padding: 16,
                minWidth: 240,
              }}
            >
              <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{selectedSite.name}</div>
              <Row gutter={[6, 6]}>
                <Col span={12}><Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>植物：{selectedSite.plantType}</Text></Col>
                <Col span={12}><Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>面积：{selectedSite.area} 亩</Text></Col>
                <Col span={24}><Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>灌溉方式：{selectedSite.irrigationType}</Text></Col>
                <Col span={24}><Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>坐标：{selectedSite.lat.toFixed(3)}, {selectedSite.lng.toFixed(3)}</Text></Col>
              </Row>
              <Tag color={statusConfig[selectedSite.status].tagColor} style={{ marginTop: 10 }}>
                {statusConfig[selectedSite.status].label}
              </Tag>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
