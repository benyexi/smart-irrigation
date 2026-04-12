import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, InputNumber, Modal, Select, Space, Steps, message } from 'antd';
import type { LiteTableColumn } from '../../components/Tables/LiteTable';
import { plantRecommendations } from '../../mock/knowledge';
import { useSiteStore } from '../../stores/siteStore';
import type { AlarmRule, ModeParams, Pipeline, Sensor, Site } from '../../types/site';
import SiteAlarmRulesStep from './components/SiteAlarmRulesStep';
import SiteBasicInfoStep, { type SiteBasicInfoStepValue } from './components/SiteBasicInfoStep';
import SiteDecisionModeStep from './components/SiteDecisionModeStep';
import SiteFieldEditorStep from './components/SiteFieldEditorStep';
import {
  clamp,
  clampPercent,
  climateOptions,
  defaultAlarmRules,
  defaultModeParams,
  getStoredPlantLayout,
  mergeAlarmRules,
  plantOptions,
  provinces,
  sensorTypeOptions,
  soilOptions,
  type DragTarget,
  type DrawMode,
  type QuickAddSensorType,
  withPlantLayout,
} from './components/siteModalShared';
import {
  generatePlantPositions,
  getDefaultPlantLayout,
  isWoodyPlant,
  type PlantLayoutSettings,
} from './fieldTemplates';

interface SiteModalProps {
  open: boolean;
  initialSite: Site | null;
  onCancel: () => void;
  onSaved: (site: Site) => void;
}

type BasicState = SiteBasicInfoStepValue;

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const defaultBasicState = (): BasicState => ({
  siteName: '',
  province: '',
  city: '',
  lat: undefined,
  lng: undefined,
  plantType: '苹果',
  soilType: '壤土',
  climateZone: '暖温带半湿润',
  area: undefined,
  irrigationType: 'drip',
});

const createSensor = (
  x = 50,
  y = 50,
  type: Sensor['type'] = 'soil_moisture',
): Sensor => ({
  id: makeId('sensor'),
  type,
  deviceId: '',
  location: '',
  topic: '',
  x,
  y,
});

const createSiteId = () => {
  const cryptoAny = globalThis.crypto as Crypto | undefined;
  if (cryptoAny && typeof cryptoAny.randomUUID === 'function') {
    return cryptoAny.randomUUID();
  }
  return makeId('site');
};

const getCoordsFromEvent = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
  const rect = evt.currentTarget.getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * 100;
  const y = ((evt.clientY - rect.top) / rect.height) * 100;
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
};

const SiteModal: React.FC<SiteModalProps> = ({
  open,
  initialSite,
  onCancel,
  onSaved,
}) => {
  const persistSite = useSiteStore((state) => state.saveSite);
  const [step, setStep] = useState(0);
  const [basic, setBasic] = useState<BasicState>(defaultBasicState);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [decisionMode, setDecisionMode] = useState<Site['decisionMode']>(null);
  const [modeParams, setModeParams] = useState<ModeParams>(defaultModeParams);
  const [alarmRules, setAlarmRules] = useState<AlarmRule[]>(defaultAlarmRules);
  const [plantLayout, setPlantLayout] = useState<PlantLayoutSettings>(
    getDefaultPlantLayout('苹果'),
  );

  const [drawMode, setDrawMode] = useState<DrawMode>('none');
  const [pipeStart, setPipeStart] = useState<{ x: number; y: number } | null>(null);
  const [pipeHover, setPipeHover] = useState<{ x: number; y: number } | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [addSensorAt, setAddSensorAt] = useState<{ x: number; y: number } | null>(null);
  const [quickAddType, setQuickAddType] = useState<QuickAddSensorType>();
  const dragFrameRef = useRef<number | null>(null);
  const pendingCanvasCoordsRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    queueMicrotask(() => {
      setStep(0);
      setDrawMode('none');
      setPipeStart(null);
      setPipeHover(null);
      setDragTarget(null);
      setAddSensorAt(null);
      setQuickAddType(undefined);

      if (initialSite) {
        setBasic({
          siteName: initialSite.name,
          province: initialSite.province,
          city: initialSite.city,
          lat: initialSite.lat,
          lng: initialSite.lng,
          plantType: initialSite.plantType,
          soilType: initialSite.soilType,
          climateZone: initialSite.climateZone,
          area: initialSite.area,
          irrigationType: initialSite.irrigationType,
        });
        setSensors(initialSite.sensors.map((sensor) => ({
          ...sensor,
          x: clamp(sensor.x, 0, 100),
          y: clamp(sensor.y, 0, 100),
        })));
        setPipelines(initialSite.pipelines.map((pipeline) => ({
          ...pipeline,
          x1: clampPercent(pipeline.x1) ?? undefined,
          y1: clampPercent(pipeline.y1) ?? undefined,
          x2: clampPercent(pipeline.x2) ?? undefined,
          y2: clampPercent(pipeline.y2) ?? undefined,
          x: clampPercent(pipeline.x) ?? undefined,
          y: clampPercent(pipeline.y) ?? undefined,
        })));
        setDecisionMode(initialSite.decisionMode);
        setModeParams({ ...defaultModeParams(), ...initialSite.modeParams });
        setPlantLayout(
          getStoredPlantLayout(
            initialSite.modeParams,
            initialSite.plantType,
            getDefaultPlantLayout,
          ) ?? getDefaultPlantLayout(initialSite.plantType),
        );
        setAlarmRules(mergeAlarmRules(initialSite.alarmRules));
        return;
      }

      const nextBasic = defaultBasicState();
      setBasic(nextBasic);
      setSensors([]);
      setPipelines([]);
      setDecisionMode(null);
      setModeParams(defaultModeParams());
      setPlantLayout(getDefaultPlantLayout(nextBasic.plantType));
      setAlarmRules(defaultAlarmRules());
    });
  }, [initialSite, open]);

  useEffect(() => () => {
    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
    }
  }, []);

  const recommendation = useMemo(
    () => plantRecommendations[basic.plantType],
    [basic.plantType],
  );
  const isWoody = useMemo(() => isWoodyPlant(basic.plantType), [basic.plantType]);
  const plantPositions = useMemo(
    () => (
      plantLayout.showPlants
        ? generatePlantPositions({
          areaMu: basic.area ?? 0,
          rowSpacing: plantLayout.rowSpacing,
          plantSpacing: plantLayout.plantSpacing,
          orientation: plantLayout.orientation,
        })
        : []
    ),
    [basic.area, plantLayout],
  );
  const plantLayoutSummary = useMemo(() => {
    const directionLabel =
      plantLayout.orientation === 'horizontal' ? '横向排布' : '纵向排布';
    const areaLabel =
      typeof basic.area === 'number' && basic.area > 0
        ? `${basic.area} 亩`
        : '未设置面积';
    return `${basic.plantType} · 行距 ${plantLayout.rowSpacing}m × 株距 ${plantLayout.plantSpacing}m · ${directionLabel} · 点位 ${plantPositions.length} 个 · ${areaLabel}`;
  }, [
    basic.area,
    basic.plantType,
    plantLayout.orientation,
    plantLayout.plantSpacing,
    plantLayout.rowSpacing,
    plantPositions.length,
  ]);
  const sensorTypeStats = useMemo(() => {
    const counts = new Map<Sensor['type'], number>();
    sensors.forEach((sensor) => {
      counts.set(sensor.type, (counts.get(sensor.type) ?? 0) + 1);
    });
    return sensorTypeOptions
      .map((item) => ({
        type: item.value,
        label: item.label,
        count: counts.get(item.value) ?? 0,
      }))
      .filter((item) => item.count > 0);
  }, [sensors]);
  const alarmRuleMap = useMemo(() => {
    const ruleMap = new Map<string, AlarmRule>();
    alarmRules.forEach((rule) => ruleMap.set(rule.key, rule));
    return ruleMap;
  }, [alarmRules]);

  const updateSensor = (id: string, patch: Partial<Sensor>) => {
    setSensors((prev) =>
      prev.map((sensor) => (sensor.id === id ? { ...sensor, ...patch } : sensor)),
    );
  };

  const updateModeParams = (patch: Partial<ModeParams>) => {
    setModeParams((prev) => ({ ...prev, ...patch }));
  };

  const updateAlarmRule = (key: string, patch: Partial<AlarmRule>) => {
    setAlarmRules((prev) =>
      prev.map((rule) => (rule.key === key ? { ...rule, ...patch } : rule)),
    );
  };

  const generateTopic = (sensor: Sensor) => {
    const siteName = basic.siteName.trim() || 'site';
    const deviceId = sensor.deviceId.trim() || sensor.id;
    updateSensor(sensor.id, {
      topic: `site/${siteName}/${sensor.type}/${deviceId}`,
    });
  };

  const onAddSensor = (type: Sensor['type'] = 'soil_moisture', x?: number, y?: number) => {
    const nextX = typeof x === 'number' ? clamp(x, 0, 100) : 50;
    const nextY = typeof y === 'number' ? clamp(y, 0, 100) : 50;
    setSensors((prev) => [...prev, createSensor(nextX, nextY, type)]);
    setAddSensorAt(null);
  };

  const onDeleteSensor = (id: string) => {
    setSensors((prev) => prev.filter((sensor) => sensor.id !== id));
  };

  const onDeletePipeline = (id: string) => {
    setPipelines((prev) => prev.filter((pipeline) => pipeline.id !== id));
  };

  const flushCanvasDrag = () => {
    dragFrameRef.current = null;
    const coords = pendingCanvasCoordsRef.current;
    if (!coords) {
      return;
    }

    if (drawMode === 'pipe' && pipeStart) {
      setPipeHover(coords);
    }

    if (!dragTarget) {
      return;
    }

    if (dragTarget.kind === 'sensor') {
      setSensors((prev) =>
        prev.map((sensor) => (
          sensor.id === dragTarget.id ? { ...sensor, x: coords.x, y: coords.y } : sensor
        )),
      );
      return;
    }

    setPipelines((prev) =>
      prev.map((pipeline) => {
        if (pipeline.id !== dragTarget.id) {
          return pipeline;
        }
        if (dragTarget.kind === 'sprinkler') {
          return { ...pipeline, x: coords.x, y: coords.y };
        }
        if (dragTarget.kind === 'pipe-start') {
          return { ...pipeline, x1: coords.x, y1: coords.y };
        }
        return { ...pipeline, x2: coords.x, y2: coords.y };
      }),
    );
  };

  const scheduleCanvasDrag = (coords: { x: number; y: number }) => {
    pendingCanvasCoordsRef.current = coords;
    if (dragFrameRef.current !== null) {
      return;
    }
    dragFrameRef.current = window.requestAnimationFrame(flushCanvasDrag);
  };

  const flushPendingCanvasDrag = () => {
    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
    flushCanvasDrag();
  };

  const onSvgMouseMove = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const coords = getCoordsFromEvent(evt);
    if (!dragTarget && !(drawMode === 'pipe' && pipeStart)) {
      return;
    }
    scheduleCanvasDrag(coords);
  };

  const onSvgMouseUp = () => {
    flushPendingCanvasDrag();
    setDragTarget(null);
  };

  const onSvgClick = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const coords = getCoordsFromEvent(evt);

    if (drawMode === 'pipe') {
      if (pipeStart) {
        setPipelines((prev) => [
          ...prev,
          {
            id: makeId('pipe'),
            type: 'pipe',
            x1: pipeStart.x,
            y1: pipeStart.y,
            x2: coords.x,
            y2: coords.y,
          },
        ]);
        setPipeStart(null);
        setPipeHover(null);
      } else {
        setPipeStart(coords);
        setPipeHover(coords);
      }
      return;
    }

    if (drawMode === 'sprinkler') {
      setPipelines((prev) => [
        ...prev,
        { id: makeId('sprinkler'), type: 'sprinkler', x: coords.x, y: coords.y },
      ]);
      setAddSensorAt(null);
      return;
    }

    if (quickAddType) {
      onAddSensor(quickAddType, coords.x, coords.y);
      return;
    }

    setAddSensorAt(coords);
  };

  const onSetDrawMode = (mode: DrawMode) => {
    setDrawMode(mode);
    setPipeStart(null);
    setPipeHover(null);
    setAddSensorAt(null);
  };

  const onClearPipelines = () => {
    setPipelines([]);
    setPipeStart(null);
    setPipeHover(null);
  };

  const onModeSelect = (modeId: 1 | 2 | 3 | 4 | 5) => {
    setDecisionMode(modeId);
    if (modeId === 3 && recommendation) {
      updateModeParams({
        lowerLimit: recommendation.moistureRange[0],
        upperLimit: recommendation.moistureRange[1],
      });
    }
    if (modeId === 5) {
      updateModeParams({
        weights: modeParams.weights ?? { sapflow: 40, stem: 35, turgor: 25 },
      });
    }
  };

  const onWeightChange = (
    key: 'sapflow' | 'stem' | 'turgor',
    value: number,
  ) => {
    const current = modeParams.weights ?? { sapflow: 40, stem: 35, turgor: 25 };
    const next = { ...current, [key]: clamp(Math.round(value), 0, 100) };
    const otherKeys: Array<'sapflow' | 'stem' | 'turgor'> = ['sapflow', 'stem', 'turgor']
      .filter((item): item is 'sapflow' | 'stem' | 'turgor' => item !== key);
    const left = 100 - next[key];
    const baseSum = current[otherKeys[0]] + current[otherKeys[1]];

    if (baseSum > 0) {
      const first = Math.round((current[otherKeys[0]] / baseSum) * left);
      next[otherKeys[0]] = first;
      next[otherKeys[1]] = left - first;
    } else {
      next[otherKeys[0]] = Math.round(left / 2);
      next[otherKeys[1]] = left - next[otherKeys[0]];
    }

    updateModeParams({ weights: next });
  };

  const sensorColumns: LiteTableColumn<Sensor>[] = [
    {
      key: 'type',
      title: '类型',
      dataIndex: 'type',
      width: 140,
      render: (_, sensor) => (
        <Select
          value={sensor.type}
          style={{ width: 124 }}
          options={sensorTypeOptions}
          onChange={(value) => updateSensor(sensor.id, { type: value })}
        />
      ),
    },
    {
      key: 'deviceId',
      title: '设备ID',
      dataIndex: 'deviceId',
      width: 100,
      render: (_, sensor) => (
        <Input
          value={sensor.deviceId}
          style={{ width: 90 }}
          onChange={(evt) => updateSensor(sensor.id, { deviceId: evt.target.value })}
        />
      ),
    },
    {
      key: 'location',
      title: '安装位置',
      dataIndex: 'location',
      width: 150,
      render: (_, sensor) => (
        <Input
          value={sensor.location}
          style={{ width: 128 }}
          onChange={(evt) => updateSensor(sensor.id, { location: evt.target.value })}
        />
      ),
    },
    {
      key: 'topic',
      title: 'Topic',
      dataIndex: 'topic',
      width: 220,
      render: (_, sensor) => (
        <Space size={4}>
          <Input
            value={sensor.topic}
            style={{ width: 146 }}
            onChange={(evt) => updateSensor(sensor.id, { topic: evt.target.value })}
          />
          <Button size="small" onClick={() => generateTopic(sensor)}>
            生成
          </Button>
        </Space>
      ),
    },
    {
      key: 'x',
      title: 'X',
      dataIndex: 'x',
      width: 72,
      render: (_, sensor) => (
        <InputNumber
          min={0}
          max={100}
          value={sensor.x}
          style={{ width: 60 }}
          onChange={(value) =>
            updateSensor(sensor.id, {
              x: typeof value === 'number' ? clamp(value, 0, 100) : sensor.x,
            })
          }
        />
      ),
    },
    {
      key: 'y',
      title: 'Y',
      dataIndex: 'y',
      width: 72,
      render: (_, sensor) => (
        <InputNumber
          min={0}
          max={100}
          value={sensor.y}
          style={{ width: 60 }}
          onChange={(value) =>
            updateSensor(sensor.id, {
              y: typeof value === 'number' ? clamp(value, 0, 100) : sensor.y,
            })
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 72,
      render: (_, sensor) => (
        <Button danger size="small" onClick={() => onDeleteSensor(sensor.id)}>
          删除
        </Button>
      ),
    },
  ];

  const canNext = () => {
    if (step === 0) {
      return basic.siteName.trim().length > 0;
    }
    return true;
  };

  const saveCurrentSite = () => {
    if (basic.siteName.trim().length === 0) {
      message.warning('请先填写站点名称');
      setStep(0);
      return;
    }

    const now = new Date().toISOString();
    const nextSite: Site = {
      id: initialSite ? initialSite.id : createSiteId(),
      name: basic.siteName.trim(),
      province: basic.province,
      city: basic.city,
      lat: typeof basic.lat === 'number' ? basic.lat : 0,
      lng: typeof basic.lng === 'number' ? basic.lng : 0,
      plantType: basic.plantType,
      soilType: basic.soilType,
      climateZone: basic.climateZone,
      area: typeof basic.area === 'number' ? basic.area : 0,
      irrigationType: basic.irrigationType,
      sensors,
      pipelines,
      decisionMode,
      modeParams: withPlantLayout(modeParams, plantLayout),
      alarmRules,
      status: initialSite
        ? initialSite.status
        : decisionMode === null
          ? 'pending'
          : 'running',
      createdAt: initialSite ? initialSite.createdAt : now,
      updatedAt: now,
    };

    persistSite(nextSite);
    message.success('站点保存成功！');
    onSaved(nextSite);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width="96vw"
      style={{ top: 12 }}
      destroyOnClose
      className="site-modal"
      title={null}
    >
      <div className="site-modal-header">
        <Space direction="vertical" size={2}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {initialSite ? '编辑站点配置' : '新建站点'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            站点管理 · Site Management
          </div>
        </Space>
      </div>

      <div className="site-modal-body">
        <Steps
          current={step}
          items={[
            { title: '基本信息' },
            { title: '传感器与平面图' },
            { title: '决策模式' },
            { title: '报警规则' },
          ]}
        />

        <div className="site-step-panel">
          {step === 0 && (
            <SiteBasicInfoStep
              value={basic}
              provinces={provinces}
              plantOptions={plantOptions}
              soilOptions={soilOptions}
              climateOptions={climateOptions}
              recommendation={recommendation}
              onChange={(patch) => setBasic((prev) => ({ ...prev, ...patch }))}
              onPlantTypeChange={(value) => {
                setBasic((prev) => ({ ...prev, plantType: value }));
                setPlantLayout((prev) => ({
                  ...getDefaultPlantLayout(value),
                  showPlants: prev.showPlants,
                }));
              }}
            />
          )}

          {step === 1 && (
            <SiteFieldEditorStep
              sensors={sensors}
              pipelines={pipelines}
              sensorColumns={sensorColumns}
              sensorTypeStats={sensorTypeStats}
              drawMode={drawMode}
              pipeStart={pipeStart}
              pipeHover={pipeHover}
              addSensorAt={addSensorAt}
              quickAddType={quickAddType}
              plantLayout={plantLayout}
              plantLayoutSummary={plantLayoutSummary}
              plantPositions={plantPositions}
              isWoody={isWoody}
              onAddSensor={onAddSensor}
              onDeleteSensor={onDeleteSensor}
              onDeletePipeline={onDeletePipeline}
              onSvgMouseMove={onSvgMouseMove}
              onSvgMouseUp={onSvgMouseUp}
              onSvgClick={onSvgClick}
              onSetDrawMode={onSetDrawMode}
              onClearPipelines={onClearPipelines}
              onQuickAddTypeChange={setQuickAddType}
              onPlantLayoutChange={setPlantLayout}
              onDragTargetChange={setDragTarget}
              onAddSensorAtChange={setAddSensorAt}
            />
          )}

          {step === 2 && (
            <SiteDecisionModeStep
              decisionMode={decisionMode}
              modeParams={modeParams}
              onModeSelect={onModeSelect}
              onUpdateModeParams={updateModeParams}
              onWeightChange={onWeightChange}
            />
          )}

          {step === 3 && (
            <SiteAlarmRulesStep
              alarmRuleMap={alarmRuleMap}
              onAlarmRuleChange={updateAlarmRule}
            />
          )}
        </div>
      </div>

      <div className="site-modal-actions">
        <Button onClick={() => setStep((prev) => (prev > 0 ? prev - 1 : prev))} disabled={step === 0}>
          上一步
        </Button>

        <Space>
          {step < 3 ? (
            <Button
              type="primary"
              onClick={() => {
                if (canNext()) {
                  setStep((prev) => (prev < 3 ? prev + 1 : prev));
                } else {
                  message.warning('请先完善当前步骤必填项');
                }
              }}
            >
              下一步
            </Button>
          ) : (
            <Button type="primary" onClick={saveCurrentSite}>
              保存
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default SiteModal;
