import React from 'react';
import { Badge, Button, InputNumber, Select, Space, Switch } from 'antd';
import LiteTable, { type LiteTableColumn } from '../../../components/Tables/LiteTable';
import type { Pipeline, Sensor } from '../../../types/site';
import type { PlantLayoutSettings } from '../fieldTemplates';
import type { DrawMode, PlantPosition, QuickAddSensorType } from './siteModalShared';
import { clampPercent, quickAddOptions, sensorColor, sensorTypeLabel } from './siteModalShared';

interface SiteFieldEditorStepProps {
  sensors: Sensor[];
  pipelines: Pipeline[];
  sensorColumns: LiteTableColumn<Sensor>[];
  sensorTypeStats: Array<{ type: Sensor['type']; label: string; count: number }>;
  drawMode: DrawMode;
  pipeStart: { x: number; y: number } | null;
  pipeHover: { x: number; y: number } | null;
  addSensorAt: { x: number; y: number } | null;
  quickAddType: QuickAddSensorType;
  plantLayout: PlantLayoutSettings;
  plantLayoutSummary: string;
  plantPositions: PlantPosition[];
  isWoody: boolean;
  onAddSensor: (type?: Sensor['type'], x?: number, y?: number) => void;
  onDeleteSensor: (id: string) => void;
  onDeletePipeline: (id: string) => void;
  onSvgMouseMove: (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
  onSvgMouseUp: () => void;
  onSvgClick: (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
  onSetDrawMode: (mode: DrawMode) => void;
  onClearPipelines: () => void;
  onQuickAddTypeChange: (value: QuickAddSensorType) => void;
  onPlantLayoutChange: (updater: (prev: PlantLayoutSettings) => PlantLayoutSettings) => void;
  onDragTargetChange: (target: { kind: 'sensor' | 'sprinkler' | 'pipe-start' | 'pipe-end'; id: string } | null) => void;
  onAddSensorAtChange: (coords: { x: number; y: number } | null) => void;
}

const renderSensorIcon = (sensor: Sensor) => {
  const fill = sensorColor(sensor.type);
  const commonStyle = { cursor: 'grab' };

  if (sensor.type === 'soil_moisture' || sensor.type === 'soil_potential') {
    return (
      <g>
        <circle cx={sensor.x} cy={sensor.y} r={1.9} fill={fill} style={commonStyle} />
        <line x1={sensor.x} y1={sensor.y + 1.9} x2={sensor.x} y2={sensor.y + 5.1} stroke={fill} strokeWidth={0.9} />
        <line x1={sensor.x - 1.2} y1={sensor.y + 4.2} x2={sensor.x} y2={sensor.y + 5.2} stroke={fill} strokeWidth={0.85} />
        <line x1={sensor.x + 1.2} y1={sensor.y + 4.2} x2={sensor.x} y2={sensor.y + 5.2} stroke={fill} strokeWidth={0.85} />
      </g>
    );
  }

  if (sensor.type === 'weather_station') {
    return (
      <g>
        <line x1={sensor.x} y1={sensor.y - 2.8} x2={sensor.x} y2={sensor.y + 3.6} stroke={fill} strokeWidth={0.7} />
        <polygon
          points={`${sensor.x},${sensor.y - 3.4} ${sensor.x - 2.6},${sensor.y - 0.4} ${sensor.x + 2.6},${sensor.y - 0.4}`}
          fill={fill}
          style={commonStyle}
        />
      </g>
    );
  }

  if (sensor.type === 'sapflow' || sensor.type === 'stem_diameter' || sensor.type === 'leaf_turgor') {
    return (
      <g>
        <circle cx={sensor.x} cy={sensor.y} r={2.1} fill="none" stroke={fill} strokeWidth={0.9} style={commonStyle} />
        <line x1={sensor.x - 1.3} y1={sensor.y} x2={sensor.x + 1.3} y2={sensor.y} stroke={fill} strokeWidth={0.9} />
        <line x1={sensor.x} y1={sensor.y - 1.3} x2={sensor.x} y2={sensor.y + 1.3} stroke={fill} strokeWidth={0.9} />
      </g>
    );
  }

  if (sensor.type === 'valve') {
    return <rect x={sensor.x - 1.8} y={sensor.y - 1.8} width={3.6} height={3.6} rx={0.7} fill={fill} style={commonStyle} />;
  }

  if (sensor.type === 'pump') {
    const points = Array.from({ length: 6 }).map((_, index) => {
      const angle = (Math.PI / 3) * index;
      return `${sensor.x + Math.cos(angle) * 2.2},${sensor.y + Math.sin(angle) * 2.2}`;
    });
    return <polygon points={points.join(' ')} fill={fill} style={commonStyle} />;
  }

  return (
    <polygon
      points={`${sensor.x},${sensor.y - 2.4} ${sensor.x - 2.4},${sensor.y} ${sensor.x},${sensor.y + 2.4} ${sensor.x + 2.4},${sensor.y}`}
      fill={fill}
      style={commonStyle}
    />
  );
};

const renderTreeSymbol = (position: PlantPosition) => (
  <g key={`tree-${position.id}`} opacity={0.82}>
    <circle cx={position.x} cy={position.y - 0.6} r={1.25} fill="#5f9eff" />
    <circle cx={position.x - 0.7} cy={position.y} r={1.05} fill="#0f9d80" />
    <circle cx={position.x + 0.75} cy={position.y} r={1.05} fill="#0f9d80" />
    <rect x={position.x - 0.24} y={position.y + 0.8} width={0.48} height={1.4} rx={0.24} fill="#c7962f" />
  </g>
);

const renderLeafSymbol = (position: PlantPosition) => (
  <g key={`leaf-${position.id}`} opacity={0.88}>
    <ellipse cx={position.x - 0.55} cy={position.y} rx={0.82} ry={1.45} transform={`rotate(-28 ${position.x - 0.55} ${position.y})`} fill="#0f9d80" />
    <ellipse cx={position.x + 0.55} cy={position.y} rx={0.82} ry={1.45} transform={`rotate(28 ${position.x + 0.55} ${position.y})`} fill="#5f9eff" />
    <line x1={position.x} y1={position.y + 0.25} x2={position.x} y2={position.y + 1.7} stroke="#c7962f" strokeWidth={0.28} />
  </g>
);

const SiteFieldEditorStep = ({
  sensors,
  pipelines,
  sensorColumns,
  sensorTypeStats,
  drawMode,
  pipeStart,
  pipeHover,
  addSensorAt,
  quickAddType,
  plantLayout,
  plantLayoutSummary,
  plantPositions,
  isWoody,
  onAddSensor,
  onDeleteSensor,
  onDeletePipeline,
  onSvgMouseMove,
  onSvgMouseUp,
  onSvgClick,
  onSetDrawMode,
  onClearPipelines,
  onQuickAddTypeChange,
  onPlantLayoutChange,
  onDragTargetChange,
  onAddSensorAtChange,
}: SiteFieldEditorStepProps) => (
  <div style={{ width: '100%', overflowX: 'auto' }}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(560px, 0.95fr) minmax(760px, 1.45fr)',
        gap: 18,
        alignItems: 'start',
        minHeight: 780,
        minWidth: 1360,
      }}
    >
      <div style={{ display: 'grid', gap: 14, minWidth: 0, overflow: 'hidden' }}>
        <div
          style={{
            border: '1px solid var(--border-base)',
            borderRadius: 18,
            background: 'var(--bg-card)',
            padding: 14,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
          }}
        >
          {sensorTypeStats.length > 0 ? sensorTypeStats.map((item) => (
            <Badge key={item.type} count={item.count} style={{ backgroundColor: sensorColor(item.type) }} title={item.label} />
          )) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>暂无已布设传感器</span>}
        </div>

        <LiteTable<Sensor>
          className="site-sensor-table"
          rowKey="id"
          columns={sensorColumns}
          dataSource={sensors}
          scrollX={900}
          maxHeight={520}
        />

        <Button type="dashed" style={{ width: '100%' }} onClick={() => onAddSensor(quickAddType ?? 'soil_moisture')}>
          ＋ 添加传感器
        </Button>
      </div>

      <div style={{ display: 'grid', gap: 14, minWidth: 0, position: 'relative' }}>
        <div
          style={{
            display: 'grid',
            gap: 12,
            padding: 16,
            borderRadius: 22,
            border: '1px solid var(--border-base)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>田块编辑器</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>超大画布、设备拖拽、右键删除、植物点阵预览</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button type={drawMode === 'pipe' ? 'primary' : 'default'} onClick={() => onSetDrawMode(drawMode === 'pipe' ? 'none' : 'pipe')}>
                {drawMode === 'pipe' ? '结束画管道' : '画管道'}
              </Button>
              <Button type={drawMode === 'sprinkler' ? 'primary' : 'default'} onClick={() => onSetDrawMode(drawMode === 'sprinkler' ? 'none' : 'sprinkler')}>
                {drawMode === 'sprinkler' ? '结束画喷头' : '画喷头'}
              </Button>
              <Button onClick={onClearPipelines}>清除管道/喷头</Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(160px, 220px)', gap: 12 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>快速添加设备类型</span>
              <Select
                allowClear
                placeholder="点击空白处时直接落点添加"
                value={quickAddType}
                options={quickAddOptions}
                onChange={(value) => onQuickAddTypeChange(value)}
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'end',
                color: 'var(--text-muted)',
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              右键设备/管道/喷头可删除。未选择快速类型时，点击空白区会弹出“在此处添加传感器”。
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 140px 140px 140px',
              gap: 12,
              alignItems: 'end',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>显示植物层</span>
              <Switch checked={plantLayout.showPlants} onChange={(checked) => onPlantLayoutChange((prev) => ({ ...prev, showPlants: checked }))} />
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>株距 (m)</span>
              <InputNumber min={0.1} max={20} step={0.1} value={plantLayout.plantSpacing} onChange={(value) => onPlantLayoutChange((prev) => ({ ...prev, plantSpacing: typeof value === 'number' ? value : prev.plantSpacing }))} />
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>行距 (m)</span>
              <InputNumber min={0.1} max={20} step={0.1} value={plantLayout.rowSpacing} onChange={(value) => onPlantLayoutChange((prev) => ({ ...prev, rowSpacing: typeof value === 'number' ? value : prev.rowSpacing }))} />
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>方向</span>
              <Select
                value={plantLayout.orientation}
                options={[
                  { value: 'horizontal', label: '横向' },
                  { value: 'vertical', label: '纵向' },
                ]}
                onChange={(value) => onPlantLayoutChange((prev) => ({ ...prev, orientation: value as 'horizontal' | 'vertical' }))}
              />
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px dashed color-mix(in srgb, var(--primary) 38%, var(--border-base))',
              background: 'color-mix(in srgb, var(--bg-card) 86%, transparent)',
            }}
          >
            {plantLayoutSummary}
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            borderRadius: 28,
            border: '1px solid var(--border-base)',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)',
            boxShadow: 'var(--shadow-elevated)',
            minHeight: 720,
          }}
        >
          {addSensorAt ? (
            <div
              style={{
                position: 'absolute',
                left: `${addSensorAt.x}%`,
                top: `${addSensorAt.y}%`,
                transform: 'translate(-50%, calc(-100% - 14px))',
                zIndex: 4,
                padding: '10px 12px',
                borderRadius: 14,
                border: '1px solid rgba(19, 102, 255, 0.22)',
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 12px 26px rgba(15, 23, 42, 0.14)',
                display: 'grid',
                gap: 8,
                minWidth: 210,
              }}
            >
              <div style={{ color: 'var(--text-primary)', fontSize: 12 }}>在此处添加传感器</div>
              <Space wrap>
                <Button size="small" type="primary" onClick={() => onAddSensor('soil_moisture', addSensorAt.x, addSensorAt.y)}>
                  直接添加
                </Button>
                <Button size="small" onClick={() => onAddSensorAtChange(null)}>取消</Button>
              </Space>
            </div>
          ) : null}

          <svg
            viewBox="0 0 100 100"
            style={{ width: '100%', height: 720, display: 'block', cursor: drawMode === 'none' ? 'crosshair' : 'cell' }}
            onMouseMove={onSvgMouseMove}
            onMouseUp={onSvgMouseUp}
            onMouseLeave={onSvgMouseUp}
            onClick={onSvgClick}
            onContextMenu={(evt) => {
              evt.preventDefault();
              onAddSensorAtChange(null);
            }}
          >
            <defs>
              <pattern id="field-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(51, 65, 85, 0.12)" strokeWidth="0.28" />
              </pattern>
              <linearGradient id="field-surface" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(19, 102, 255, 0.10)" />
                <stop offset="100%" stopColor="rgba(15, 157, 128, 0.04)" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width="100" height="100" fill="#f7fbff" />
            <rect x="4" y="4" width="92" height="92" rx="8" fill="url(#field-surface)" stroke="rgba(19, 102, 255, 0.42)" strokeWidth="0.45" />
            <rect x="4" y="4" width="92" height="92" rx="8" fill="url(#field-grid)" opacity="0.9" />

            {Array.from({ length: 9 }).map((_, idx) => {
              const pos = 10 + idx * 10;
              return (
                <g key={`grid-${pos}`}>
                  <line x1={pos} y1={4} x2={pos} y2={96} stroke="rgba(51, 65, 85, 0.12)" strokeWidth={0.2} />
                  <line x1={4} y1={pos} x2={96} y2={pos} stroke="rgba(51, 65, 85, 0.12)" strokeWidth={0.2} />
                </g>
              );
            })}

            {plantLayout.showPlants ? plantPositions.map((position) => (
              isWoody ? renderTreeSymbol(position) : renderLeafSymbol(position)
            )) : null}

            {pipelines.map((pipeline) => {
              if (pipeline.type === 'pipe') {
                const x1 = clampPercent(pipeline.x1);
                const y1 = clampPercent(pipeline.y1);
                const x2 = clampPercent(pipeline.x2);
                const y2 = clampPercent(pipeline.y2);
                if (x1 === null || y1 === null || x2 === null || y2 === null) {
                  return null;
                }

                return (
                  <g key={pipeline.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#5f9eff"
                      strokeWidth={1.15}
                      strokeLinecap="round"
                      onMouseDown={(evt) => evt.stopPropagation()}
                      onContextMenu={(evt) => {
                        evt.preventDefault();
                        evt.stopPropagation();
                        onDeletePipeline(pipeline.id);
                      }}
                    />
                    <circle
                      cx={x1}
                      cy={y1}
                      r={1.35}
                      fill="#ffffff"
                      stroke="#5f9eff"
                      strokeWidth={0.4}
                      style={{ cursor: 'move' }}
                      onMouseDown={(evt) => {
                        evt.stopPropagation();
                        onDragTargetChange({ kind: 'pipe-start', id: pipeline.id });
                      }}
                      onContextMenu={(evt) => {
                        evt.preventDefault();
                        evt.stopPropagation();
                        onDeletePipeline(pipeline.id);
                      }}
                    />
                    <circle
                      cx={x2}
                      cy={y2}
                      r={1.35}
                      fill="#ffffff"
                      stroke="#5f9eff"
                      strokeWidth={0.4}
                      style={{ cursor: 'move' }}
                      onMouseDown={(evt) => {
                        evt.stopPropagation();
                        onDragTargetChange({ kind: 'pipe-end', id: pipeline.id });
                      }}
                      onContextMenu={(evt) => {
                        evt.preventDefault();
                        evt.stopPropagation();
                        onDeletePipeline(pipeline.id);
                      }}
                    />
                  </g>
                );
              }

              const x = clampPercent(pipeline.x);
              const y = clampPercent(pipeline.y);
              if (x === null || y === null) {
                return null;
              }

              return (
                <g
                  key={pipeline.id}
                  style={{ cursor: 'move' }}
                  onMouseDown={(evt) => {
                    evt.stopPropagation();
                    onDragTargetChange({ kind: 'sprinkler', id: pipeline.id });
                  }}
                  onContextMenu={(evt) => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    onDeletePipeline(pipeline.id);
                  }}
                >
                  <circle cx={x} cy={y} r={3.2} fill="rgba(95, 158, 255, 0.12)" stroke="#5f9eff" strokeWidth={0.4} />
                  <circle cx={x} cy={y} r={1.2} fill="none" stroke="#5f9eff" strokeWidth={0.7} />
                  {Array.from({ length: 8 }).map((__, rayIdx) => {
                    const angle = (Math.PI * 2 * rayIdx) / 8;
                    const rayX = x + Math.cos(angle) * 2.5;
                    const rayY = y + Math.sin(angle) * 2.5;
                    return <line key={`${pipeline.id}-${rayIdx}`} x1={x} y1={y} x2={rayX} y2={rayY} stroke="#5f9eff" strokeWidth={0.55} />;
                  })}
                </g>
              );
            })}

            {pipeStart && pipeHover ? (
              <line
                x1={pipeStart.x}
                y1={pipeStart.y}
                x2={pipeHover.x}
                y2={pipeHover.y}
                stroke="#5f9eff"
                strokeWidth={0.9}
                strokeDasharray="1.5 1.2"
              />
            ) : null}

            {sensors.map((sensor, index) => {
              const label = sensor.deviceId.trim() || `S${index + 1}`;
              return (
                <g
                  key={sensor.id}
                  onMouseDown={(evt) => {
                    evt.stopPropagation();
                    onDragTargetChange({ kind: 'sensor', id: sensor.id });
                  }}
                  onClick={(evt) => evt.stopPropagation()}
                  onContextMenu={(evt) => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    onDeleteSensor(sensor.id);
                  }}
                >
                  <title>{`${sensorTypeLabel(sensor.type)} / ${sensor.deviceId || '未填'} / ${sensor.location || '未填位置'}`}</title>
                  {renderSensorIcon(sensor)}
                  <rect
                    x={sensor.x - 3.1}
                    y={sensor.y + 4.1}
                    width={6.2}
                    height={2.9}
                    rx={1}
                    fill="rgba(255,255,255,0.88)"
                    stroke="rgba(71,85,105,0.36)"
                    strokeWidth={0.15}
                  />
                  <text x={sensor.x} y={sensor.y + 6.05} fill="#1e293b" fontSize={1.9} textAnchor="middle">
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 16,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              padding: '12px 14px',
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.80)',
              border: '1px solid rgba(15, 23, 42, 0.14)',
              color: '#1e293b',
              fontSize: 12,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0f9d80', display: 'inline-block' }} />植物</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#cf4453', display: 'inline-block' }} />灌溉设备</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4f9cf9', display: 'inline-block' }} />土壤监测</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0f9d80', display: 'inline-block' }} />植物监测</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#db7f2f', display: 'inline-block' }} />大气监测</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SiteFieldEditorStep;
