import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Collapse,
  Input,
  InputNumber,
  message,
  Select,
  Slider,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import {
  ApiOutlined,
  ClearOutlined,
  CloudOutlined,
  DisconnectOutlined,
  DownloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PoweroffOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { Sensor, Site } from '../../types/site';
import {
  addMqttStatusListener,
  connectMqtt,
  disconnectMqtt,
  getMqttBrokerUrl,
  getMqttStatus,
  publishMqtt,
  subscribeMqtt,
  type MqttMessage,
  type MqttStatus,
} from '../../utils/mqttClient';
import { getCurrentSiteId, getSites } from '../../utils/siteStorage';
import './Monitor.css';

const { Title, Text } = Typography;

type CommandStatus = 'pending' | 'ack' | 'timeout' | 'failed';
type MqttConnectionState = MqttStatus | 'connecting';

type MqttStatusSnapshot = {
  state: MqttConnectionState;
  broker: string;
  connectedAt: number | null;
};

type SensorRuntime = {
  latestValue: number | string | null;
  unit: string;
  lastUpdatedAt: number | null;
  history: number[];
  flashing: boolean;
};

type LogEntry = {
  id: string;
  timestamp: number;
  topic: string;
  payload: string;
};

type CommandEntry = {
  id: string;
  msgId: string;
  timestamp: number;
  deviceId: string;
  command: string;
  status: CommandStatus;
  latencyMs?: number;
};

type DeviceCommandState = {
  status: CommandStatus | 'idle';
  lastAction: string;
  lastCommandAt: number | null;
  runtimeSince: number | null;
  frequencyHz?: number;
  valueLabel?: string;
};

type SimulatorState = {
  sensorId?: string;
  baseValue: number;
  rangeValue: number;
  intervalMs: number;
  running: boolean;
};

const DEFAULT_BROKER = 'wss://broker.emqx.io:8084/mqtt';
const FIVE_MINUTES = 5 * 60 * 1000;
const MAX_LOGS = 100;
const MAX_HISTORY = 50;
const MAX_POINTS = 20;
const SPARKLINE_HEIGHT = 60;

const sensorTypeLabelMap: Record<Sensor['type'], string> = {
  soil_moisture: '土壤水分',
  soil_potential: '土壤水势',
  weather_station: '气象站',
  sapflow: '液流计',
  stem_diameter: '茎径传感器',
  leaf_turgor: '叶片膨压',
  flow_meter: '流量计',
  valve: '电磁阀',
  pump: '水泵',
};

const sensorColorMap: Record<Sensor['type'], string> = {
  soil_moisture: '#5f9eff',
  soil_potential: '#5f9eff',
  weather_station: '#db7f2f',
  sapflow: '#0f9d80',
  stem_diameter: '#0f9d80',
  leaf_turgor: '#0f9d80',
  flow_meter: '#1366ff',
  valve: '#cf4453',
  pump: '#c7962f',
};

const sensorUnitMap: Partial<Record<Sensor['type'], string>> = {
  soil_moisture: '%',
  soil_potential: 'kPa',
  weather_station: '°C',
  sapflow: 'g/h',
  stem_diameter: 'mm',
  leaf_turgor: 'MPa',
  flow_meter: 'm³/h',
  valve: '',
  pump: 'Hz',
};

const sensorBaseMap: Record<Sensor['type'], number> = {
  soil_moisture: 26,
  soil_potential: -42,
  weather_station: 23,
  sapflow: 135,
  stem_diameter: 0.32,
  leaf_turgor: 0.68,
  flow_meter: 3.4,
  valve: 1,
  pump: 38,
};

const sensorRangeMap: Record<Sensor['type'], number> = {
  soil_moisture: 4,
  soil_potential: 8,
  weather_station: 3,
  sapflow: 20,
  stem_diameter: 0.08,
  leaf_turgor: 0.12,
  flow_meter: 1.2,
  valve: 1,
  pump: 6,
};

const getTimestamp = () => Date.now();

const createId = (prefix: string) => `${prefix}-${getTimestamp()}-${Math.random().toString(36).slice(2, 8)}`;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parsePacketBody = (packet: MqttMessage): Record<string, unknown> => {
  if (packet.payload && typeof packet.payload === 'object' && !Array.isArray(packet.payload)) {
    return packet.payload as Record<string, unknown>;
  }

  try {
    return JSON.parse(packet.payloadText) as Record<string, unknown>;
  } catch {
    return { value: packet.payloadText };
  }
};

const formatRelativeTime = (timestamp: number | null, now: number) => {
  if (!timestamp) {
    return '暂无数据';
  }

  const diff = Math.max(0, now - timestamp);
  if (diff < 1000) {
    return '刚刚';
  }
  if (diff < 60_000) {
    return `${Math.floor(diff / 1000)} 秒前`;
  }
  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)} 分钟前`;
  }
  return `${Math.floor(diff / 3_600_000)} 小时前`;
};

const formatDuration = (startedAt: number | null, now: number) => {
  if (!startedAt) {
    return '--';
  }

  const diff = Math.max(0, now - startedAt);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatValue = (value: number | string | null, sensorType: Sensor['type']) => {
  if (value === null || value === undefined) {
    return '--';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (sensorType === 'stem_diameter' || sensorType === 'leaf_turgor') {
    return value.toFixed(2);
  }
  if (sensorType === 'soil_potential') {
    return Math.round(value).toString();
  }
  return value.toFixed(value >= 10 ? 1 : 2);
};

const makeSparklineOption = (history: number[], color: string) => ({
  animation: false,
  grid: { top: 4, right: 2, bottom: 2, left: 2 },
  xAxis: { type: 'category', show: false, data: history.map((_, index) => index) },
  yAxis: { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
  series: [
    {
      type: 'line',
      data: history,
      smooth: true,
      symbol: 'none',
      lineStyle: { color, width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${color}66` },
            { offset: 1, color: `${color}00` },
          ],
        },
      },
    },
  ],
  tooltip: { show: false },
});

const resolveDeviceId = (sensor: Sensor) => sensor.deviceId.trim() || sensor.id.trim();
const getSensorTopic = (siteId: string, sensor: Sensor) => `siz/v1/${siteId}/sensor/${resolveDeviceId(sensor)}/data`;
const getAckTopic = (siteId: string, sensor: Sensor) => `siz/v1/${siteId}/control/${resolveDeviceId(sensor)}/ack`;
const getCmdTopic = (siteId: string, sensor: Sensor) => `siz/v1/${siteId}/control/${resolveDeviceId(sensor)}/cmd`;

const seedHistory = (sensor: Sensor) => {
  const base = sensorBaseMap[sensor.type];
  const range = sensorRangeMap[sensor.type];
  return Array.from({ length: MAX_POINTS }, (_, index) => {
    if (sensor.type === 'valve') {
      return index > MAX_POINTS - 6 ? 1 : 0;
    }
    if (sensor.type === 'pump') {
      return 38;
    }
    return Number((base + Math.sin(index / 3) * range * 0.35).toFixed(2));
  });
};

const buildInitialSensorState = (sensor: Sensor): SensorRuntime => ({
  latestValue: sensor.type === 'valve' ? '关闭' : sensor.type === 'pump' ? 38 : sensorBaseMap[sensor.type],
  unit: sensorUnitMap[sensor.type] ?? '',
  lastUpdatedAt: null,
  history: seedHistory(sensor),
  flashing: false,
});

const buildInitialDeviceState = (sensor: Sensor): DeviceCommandState => ({
  status: 'idle',
  lastAction: '尚未下发指令',
  lastCommandAt: null,
  runtimeSince: null,
  frequencyHz: sensor.type === 'pump' ? 38 : undefined,
  valueLabel: sensor.type === 'valve' ? '关闭' : '待机',
});

const sensorSortWeight = (type: Sensor['type']) => {
  if (type === 'valve') return 9;
  if (type === 'pump') return 10;
  return 1;
};

const Monitor: React.FC = () => {
  const currentSiteId = useMemo(() => getCurrentSiteId(), []);
  const sites = useMemo(() => getSites(), []);
  const currentSite = useMemo<Site | null>(
    () => sites.find((site) => site.id === currentSiteId) ?? sites[0] ?? null,
    [currentSiteId, sites],
  );
  const sensors = useMemo(
    () => (currentSite?.sensors ?? []).slice().sort((left, right) => sensorSortWeight(left.type) - sensorSortWeight(right.type)),
    [currentSite],
  );
  const controlSensors = useMemo(
    () => sensors.filter((sensor) => sensor.type === 'valve' || sensor.type === 'pump'),
    [sensors],
  );

  const [broker, setBroker] = useState(() => getMqttBrokerUrl() || DEFAULT_BROKER);
  const [mqttStatus, setMqttStatus] = useState<MqttStatusSnapshot>({
    state: getMqttStatus(),
    broker: getMqttBrokerUrl() || DEFAULT_BROKER,
    connectedAt: getMqttStatus() === 'connected' ? getTimestamp() : null,
  });
  const [nowTick, setNowTick] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsPaused, setLogsPaused] = useState(false);
  const [sensorStateMap, setSensorStateMap] = useState<Record<string, SensorRuntime>>(() => {
    const next: Record<string, SensorRuntime> = {};
    sensors.forEach((sensor) => {
      next[sensor.id] = buildInitialSensorState(sensor);
    });
    return next;
  });
  const [simulator, setSimulator] = useState<SimulatorState>({
    sensorId: undefined,
    baseValue: 26,
    rangeValue: 3,
    intervalMs: 2000,
    running: false,
  });
  const [selectedHistoryStatus, setSelectedHistoryStatus] = useState<'all' | CommandStatus>('all');
  const [commandHistory, setCommandHistory] = useState<CommandEntry[]>([]);
  const [deviceCommandState, setDeviceCommandState] = useState<Record<string, DeviceCommandState>>(() => {
    const next: Record<string, DeviceCommandState> = {};
    controlSensors.forEach((sensor) => {
      next[sensor.id] = buildInitialDeviceState(sensor);
    });
    return next;
  });

  const ackWaitersRef = useRef(
    new Map<string, { startedAt: number; deviceId: string; command: string; sensorId: string; timeoutId: number }>(),
  );
  const timerOpenMinutesRef = useRef<Record<string, number>>({});
  const simulatorTimerRef = useRef<number | null>(null);
  const logsPausedRef = useRef(false);
  const brokerRef = useRef(getMqttBrokerUrl() || DEFAULT_BROKER);

  const updateMqttStatus = (nextState: MqttConnectionState, brokerUrl: string) => {
    setMqttStatus((previous) => ({
      state: nextState,
      broker: brokerUrl,
      connectedAt: nextState === 'connected'
        ? previous.connectedAt ?? getTimestamp()
        : nextState === 'connecting'
          ? previous.connectedAt
          : null,
    }));
  };

  const appendCommandHistory = (entry: Omit<CommandEntry, 'id'>) => {
    const nextEntry: CommandEntry = { id: createId('cmd-history'), ...entry };
    setCommandHistory((previous) => [nextEntry, ...previous].slice(0, MAX_HISTORY));
  };

  useEffect(() => {
    const tick = window.setInterval(() => setNowTick(getTimestamp()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    logsPausedRef.current = logsPaused;
  }, [logsPaused]);

  useEffect(() => {
    let disposed = false;
    let unsubscribeSensor: (() => void) | undefined;
    let unsubscribeAck: (() => void) | undefined;

    const appendLog = (packet: MqttMessage) => {
      setMessageCount((count) => count + 1);
      if (logsPausedRef.current) {
        return;
      }

      const entry: LogEntry = {
        id: createId('log'),
        timestamp: packet.timestamp,
        topic: packet.topic,
        payload: packet.payloadText,
      };
      setLogs((previous) => [entry, ...previous].slice(0, MAX_LOGS));
    };

    const handleSensorMessage = (packet: MqttMessage) => {
      appendLog(packet);

      const body = parsePacketBody(packet);
      const deviceId = String(body.deviceId ?? packet.topic.split('/')[4] ?? '');
      const sensor = sensors.find((item) => resolveDeviceId(item) === deviceId);
      if (!sensor) {
        return;
      }

      const rawValue = body.value;
      const numericValue = typeof rawValue === 'number'
        ? rawValue
        : typeof rawValue === 'string' && rawValue.trim()
          ? Number(rawValue)
          : null;
      const resolvedValue = sensor.type === 'valve'
        ? String(body.state ?? body.value ?? '关闭')
        : sensor.type === 'pump'
          ? Number(body.frequencyHz ?? body.value ?? 38)
          : numericValue;
      const unit = typeof body.unit === 'string' ? body.unit : sensorUnitMap[sensor.type] ?? '';
      const timestamp = typeof body.ts === 'number' ? body.ts : packet.timestamp;

      setSensorStateMap((previous) => {
        const base = previous[sensor.id] ?? buildInitialSensorState(sensor);
        const nextHistoryValue = typeof resolvedValue === 'number'
          ? resolvedValue
          : base.history[base.history.length - 1] ?? sensorBaseMap[sensor.type];
        return {
          ...previous,
          [sensor.id]: {
            latestValue: resolvedValue,
            unit,
            lastUpdatedAt: timestamp,
            history: [...base.history.slice(-(MAX_POINTS - 1)), nextHistoryValue],
            flashing: true,
          },
        };
      });

      if (sensor.type === 'valve' || sensor.type === 'pump') {
        const runningFlag = typeof body.running === 'boolean'
          ? body.running
          : sensor.type === 'pump'
            ? Number(body.frequencyHz ?? body.value ?? 0) > 0
            : undefined;

        setDeviceCommandState((previous) => ({
          ...previous,
          [sensor.id]: {
            ...(previous[sensor.id] ?? buildInitialDeviceState(sensor)),
            valueLabel: sensor.type === 'valve'
              ? String(body.state ?? resolvedValue)
              : `${Number(body.frequencyHz ?? resolvedValue ?? 38).toFixed(1)} Hz`,
            runtimeSince: sensor.type === 'pump'
              ? runningFlag
                ? previous[sensor.id]?.runtimeSince ?? timestamp
                : null
              : previous[sensor.id]?.runtimeSince ?? null,
            frequencyHz: sensor.type === 'pump'
              ? Number(body.frequencyHz ?? resolvedValue ?? previous[sensor.id]?.frequencyHz ?? 38)
              : undefined,
          },
        }));
      }

      window.setTimeout(() => {
        setSensorStateMap((previous) => ({
          ...previous,
          [sensor.id]: {
            ...(previous[sensor.id] ?? buildInitialSensorState(sensor)),
            flashing: false,
          },
        }));
      }, 1000);
    };

    const handleAckMessage = (packet: MqttMessage) => {
      appendLog(packet);

      const body = parsePacketBody(packet);
      const msgId = String(body.msgId ?? '');
      const waiter = ackWaitersRef.current.get(msgId);
      if (!waiter) {
        return;
      }

      ackWaitersRef.current.delete(msgId);
      window.clearTimeout(waiter.timeoutId);

      const timestamp = packet.timestamp;
      const latencyMs = timestamp - waiter.startedAt;
      const status: CommandStatus = String(body.status ?? 'ack') === 'ack' ? 'ack' : 'failed';
      const sensor = controlSensors.find((item) => resolveDeviceId(item) === waiter.deviceId);

      appendCommandHistory({
        msgId,
        timestamp,
        deviceId: waiter.deviceId,
        command: waiter.command,
        status,
        latencyMs,
      });

      if (sensor) {
        setDeviceCommandState((previous) => ({
          ...previous,
          [sensor.id]: {
            ...(previous[sensor.id] ?? buildInitialDeviceState(sensor)),
            status,
            lastAction: status === 'ack' ? `${waiter.command} 已确认` : `${waiter.command} 失败`,
            lastCommandAt: timestamp,
            runtimeSince: waiter.command.includes('启动') || waiter.command.includes('开启')
              ? previous[sensor.id]?.runtimeSince ?? timestamp
              : waiter.command.includes('停止') || waiter.command.includes('关闭')
                ? null
                : previous[sensor.id]?.runtimeSince ?? null,
          },
        }));
      }

      if (status === 'ack') {
        message.success(`${waiter.deviceId} 指令已确认`);
      } else {
        message.error(`${waiter.deviceId} 指令失败`);
      }
    };

    const unsubscribeStatus = addMqttStatusListener((nextState) => {
      if (!disposed) {
        updateMqttStatus(nextState, brokerRef.current);
      }
    });

    const bootstrap = async () => {
      try {
        await connectMqtt(brokerRef.current);
      } catch {
        if (!disposed) {
          updateMqttStatus('disconnected', brokerRef.current);
          message.error('MQTT 自动连接失败');
        }
        return;
      }

      if (disposed) {
        return;
      }

      unsubscribeSensor = subscribeMqtt(`siz/v1/${currentSiteId}/sensor/+/data`, handleSensorMessage);
      unsubscribeAck = subscribeMqtt(`siz/v1/${currentSiteId}/control/+/ack`, handleAckMessage);

      const now = getTimestamp();
      sensors.forEach((sensor) => {
        const payload = sensor.type === 'valve'
          ? {
              siteId: currentSiteId,
              deviceId: resolveDeviceId(sensor),
              value: '关闭',
              state: '关闭',
              unit: '',
              ts: now,
            }
          : sensor.type === 'pump'
            ? {
                siteId: currentSiteId,
                deviceId: resolveDeviceId(sensor),
                value: 38,
                frequencyHz: 38,
                running: false,
                unit: 'Hz',
                ts: now,
              }
            : {
                siteId: currentSiteId,
                deviceId: resolveDeviceId(sensor),
                value: sensorBaseMap[sensor.type],
                unit: sensorUnitMap[sensor.type],
                ts: now,
              };

        void publishMqtt(getSensorTopic(currentSiteId, sensor), payload);
      });
    };

    void bootstrap();

    return () => {
      disposed = true;
      unsubscribeSensor?.();
      unsubscribeAck?.();
      unsubscribeStatus?.();
    };
  }, [controlSensors, currentSiteId, sensors]);

  useEffect(() => () => {
    ackWaitersRef.current.forEach((waiter) => window.clearTimeout(waiter.timeoutId));
    ackWaitersRef.current.clear();
  }, []);

  useEffect(() => {
    if (!simulator.running || !simulator.sensorId) {
      if (simulatorTimerRef.current) {
        window.clearInterval(simulatorTimerRef.current);
        simulatorTimerRef.current = null;
      }
      return undefined;
    }

    const sensor = sensors.find((item) => item.id === simulator.sensorId);
    if (!sensor) {
      return undefined;
    }

    simulatorTimerRef.current = window.setInterval(() => {
      const center = Number.isFinite(simulator.baseValue) ? simulator.baseValue : sensorBaseMap[sensor.type];
      const wave = (Math.random() * 2 - 1) * simulator.rangeValue;
      const now = getTimestamp();

      if (sensor.type === 'valve') {
        const nextState = Math.random() > 0.5 ? '开启' : '关闭';
        void publishMqtt(getSensorTopic(currentSiteId, sensor), {
          siteId: currentSiteId,
          deviceId: resolveDeviceId(sensor),
          value: nextState,
          state: nextState,
          unit: '',
          ts: now,
        });
        return;
      }

      if (sensor.type === 'pump') {
        const nextFrequency = clamp(center + wave, 30, 50);
        void publishMqtt(getSensorTopic(currentSiteId, sensor), {
          siteId: currentSiteId,
          deviceId: resolveDeviceId(sensor),
          value: nextFrequency,
          frequencyHz: nextFrequency,
          running: nextFrequency > 0,
          unit: 'Hz',
          ts: now,
        });
        return;
      }

      void publishMqtt(getSensorTopic(currentSiteId, sensor), {
        siteId: currentSiteId,
        deviceId: resolveDeviceId(sensor),
        value: Number((center + wave).toFixed(2)),
        unit: sensorUnitMap[sensor.type],
        ts: now,
      });
    }, simulator.intervalMs);

    return () => {
      if (simulatorTimerRef.current) {
        window.clearInterval(simulatorTimerRef.current);
        simulatorTimerRef.current = null;
      }
    };
  }, [currentSiteId, sensors, simulator]);

  const connect = async () => {
    brokerRef.current = broker.trim() || DEFAULT_BROKER;
    updateMqttStatus('connecting', broker);
    try {
      await connectMqtt(brokerRef.current);
    } catch {
      updateMqttStatus('disconnected', broker);
      message.error('MQTT 连接失败');
    }
  };

  const disconnect = () => {
    disconnectMqtt();
    updateMqttStatus('disconnected', brokerRef.current);
  };

  const exportLogs = () => {
    const content = logs
      .slice()
      .reverse()
      .map((entry) => `${new Date(entry.timestamp).toLocaleString('zh-CN')} | ${entry.topic} | ${entry.payload}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `monitor-${currentSiteId}-${new Date().toISOString().slice(0, 19)}.log`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const sendCommand = async (sensor: Sensor, command: string, payloadExtra: Record<string, unknown> = {}) => {
    const msgId = createId('cmd');
    const startedAt = getTimestamp();
    const topic = getCmdTopic(currentSiteId, sensor);

    setDeviceCommandState((previous) => ({
      ...previous,
      [sensor.id]: {
        ...(previous[sensor.id] ?? buildInitialDeviceState(sensor)),
        status: 'pending',
        lastAction: `${command} 发送中`,
        lastCommandAt: startedAt,
      },
    }));

    const timeoutId = window.setTimeout(() => {
      ackWaitersRef.current.delete(msgId);
      setDeviceCommandState((previous) => ({
        ...previous,
        [sensor.id]: {
          ...(previous[sensor.id] ?? buildInitialDeviceState(sensor)),
          status: 'timeout',
          lastAction: `${command} 超时`,
          lastCommandAt: getTimestamp(),
        },
      }));
      appendCommandHistory({
        msgId,
        timestamp: getTimestamp(),
        deviceId: resolveDeviceId(sensor),
        command,
        status: 'timeout',
      });
      message.warning(`${resolveDeviceId(sensor)} 指令等待应答超时`);
    }, 10_000);

    ackWaitersRef.current.set(msgId, {
      startedAt,
      deviceId: resolveDeviceId(sensor),
      command,
      sensorId: sensor.id,
      timeoutId,
    });

    try {
      await publishMqtt(topic, {
        siteId: currentSiteId,
        deviceId: resolveDeviceId(sensor),
        command,
        msgId,
        ts: startedAt,
        ...payloadExtra,
      });

      window.setTimeout(() => {
        void publishMqtt(getAckTopic(currentSiteId, sensor), {
          siteId: currentSiteId,
          deviceId: resolveDeviceId(sensor),
          command,
          msgId,
          status: 'ack',
          ts: getTimestamp(),
        });
      }, 600);
    } catch {
      window.clearTimeout(timeoutId);
      ackWaitersRef.current.delete(msgId);
      setDeviceCommandState((previous) => ({
        ...previous,
        [sensor.id]: {
          ...(previous[sensor.id] ?? buildInitialDeviceState(sensor)),
          status: 'failed',
          lastAction: `${command} 发送失败`,
          lastCommandAt: getTimestamp(),
        },
      }));
      appendCommandHistory({
        msgId,
        timestamp: getTimestamp(),
        deviceId: resolveDeviceId(sensor),
        command,
        status: 'failed',
      });
      message.error(`${resolveDeviceId(sensor)} 指令发送失败`);
    }
  };

  const triggerValve = (sensor: Sensor, open: boolean) => {
    const now = getTimestamp();
    void sendCommand(sensor, open ? '开启阀门' : '关闭阀门', { open });
    void publishMqtt(getSensorTopic(currentSiteId, sensor), {
      siteId: currentSiteId,
      deviceId: resolveDeviceId(sensor),
      state: open ? '开启' : '关闭',
      value: open ? '开启' : '关闭',
      unit: '',
      ts: now,
    });
  };

  const triggerValveTimed = (sensor: Sensor) => {
    const minutes = timerOpenMinutesRef.current[sensor.id] ?? 10;
    const now = getTimestamp();

    void sendCommand(sensor, `定时开启 ${minutes} 分钟`, { open: true, durationMinutes: minutes });
    void publishMqtt(getSensorTopic(currentSiteId, sensor), {
      siteId: currentSiteId,
      deviceId: resolveDeviceId(sensor),
      state: '开启',
      value: '开启',
      durationMinutes: minutes,
      unit: '',
      ts: now,
    });

    window.setTimeout(() => {
      void publishMqtt(getSensorTopic(currentSiteId, sensor), {
        siteId: currentSiteId,
        deviceId: resolveDeviceId(sensor),
        state: '关闭',
        value: '关闭',
        unit: '',
        ts: getTimestamp(),
      });
    }, minutes * 60_000);
  };

  const triggerPump = (sensor: Sensor, running: boolean, frequencyHz?: number) => {
    const nextFrequency = frequencyHz ?? deviceCommandState[sensor.id]?.frequencyHz ?? 38;
    const now = getTimestamp();

    void sendCommand(sensor, running ? '启动水泵' : '停止水泵', {
      running,
      frequencyHz: nextFrequency,
    });
    void publishMqtt(getSensorTopic(currentSiteId, sensor), {
      siteId: currentSiteId,
      deviceId: resolveDeviceId(sensor),
      value: running ? nextFrequency : 0,
      frequencyHz: nextFrequency,
      running,
      unit: 'Hz',
      ts: now,
    });
  };

  const commandColumns: ColumnsType<CommandEntry> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (timestamp: number) => new Date(timestamp).toLocaleString('zh-CN'),
    },
    {
      title: '设备',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 120,
    },
    {
      title: '指令',
      dataIndex: 'command',
      key: 'command',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: CommandStatus) => {
        const color = status === 'ack' ? 'green' : status === 'pending' ? 'blue' : status === 'timeout' ? 'orange' : 'red';
        const label = status === 'ack' ? '已确认' : status === 'pending' ? '发送中' : status === 'timeout' ? '超时' : '失败';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '响应耗时',
      dataIndex: 'latencyMs',
      key: 'latencyMs',
      width: 120,
      render: (latencyMs?: number) => latencyMs ? `${latencyMs} ms` : '--',
    },
  ];

  const filteredCommandHistory = useMemo(
    () => (selectedHistoryStatus === 'all'
      ? commandHistory
      : commandHistory.filter((item) => item.status === selectedHistoryStatus)),
    [commandHistory, selectedHistoryStatus],
  );

  return (
    <div className="page-container monitor-page">
      <div className="monitor-topbar">
        <div className="monitor-topbar-left">
          <span className={`monitor-status-dot is-${mqttStatus.state}`} />
          <div>
            <div className="monitor-topbar-title">MQTT 状态栏</div>
            <div className="monitor-topbar-subtitle">
              当前站点：{currentSite?.name ?? '未找到站点'} / {currentSiteId}
            </div>
          </div>
        </div>

        <div className="monitor-topbar-center">
          <Input
            prefix={<ApiOutlined />}
            value={broker}
            onChange={(event) => {
              const nextBroker = event.target.value;
              brokerRef.current = nextBroker;
              setBroker(nextBroker);
            }}
            placeholder="请输入 Broker 地址"
          />
          {mqttStatus.state === 'connected' ? (
            <Button icon={<DisconnectOutlined />} onClick={disconnect}>
              断开
            </Button>
          ) : (
            <Button type="primary" icon={<CloudOutlined />} onClick={() => void connect()}>
              连接
            </Button>
          )}
        </div>

        <div className="monitor-topbar-metrics">
          <div className="monitor-metric-chip">
            <span>连接状态</span>
            <strong>{mqttStatus.state === 'connected' ? 'Connected' : mqttStatus.state === 'connecting' ? 'Connecting' : 'Disconnected'}</strong>
          </div>
          <div className="monitor-metric-chip">
            <span>已连接时长</span>
            <strong>{mqttStatus.state === 'connected' ? formatDuration(mqttStatus.connectedAt, nowTick) : '--'}</strong>
          </div>
          <div className="monitor-metric-chip">
            <span>消息总数</span>
            <strong>{messageCount}</strong>
          </div>
        </div>
      </div>

      <div className="monitor-layout">
        <main className="monitor-main">
          <section>
            <div className="monitor-section-head">
              <div>
                <Title level={4}>传感器实时卡片</Title>
                <Text>订阅 `siz/v1/{currentSiteId}/sensor/+/data`，最近 5 分钟有数据即判定在线。</Text>
              </div>
            </div>
            <div className="monitor-sensor-grid">
              {sensors.map((sensor) => {
                const runtime = sensorStateMap[sensor.id] ?? buildInitialSensorState(sensor);
                const online = runtime.lastUpdatedAt ? nowTick - runtime.lastUpdatedAt <= FIVE_MINUTES : false;
                return (
                  <Card
                    key={sensor.id}
                    className={`monitor-sensor-card ${runtime.flashing ? 'is-flashing' : ''}`}
                    bordered={false}
                  >
                    <div className="monitor-card-top">
                      <div>
                        <div className="monitor-card-device">{resolveDeviceId(sensor)}</div>
                        <Tag color="blue">{sensorTypeLabelMap[sensor.type]}</Tag>
                      </div>
                      <Tag color={online ? 'green' : 'default'}>{online ? '在线' : '离线'}</Tag>
                    </div>
                    <div className="monitor-card-value">
                      <span>{formatValue(runtime.latestValue, sensor.type)}</span>
                      <small>{runtime.unit}</small>
                    </div>
                    <div className="monitor-card-meta">
                      <span>{sensor.location || '未填写位置'}</span>
                      <span>{formatRelativeTime(runtime.lastUpdatedAt, nowTick)}</span>
                    </div>
                    <ReactECharts
                      option={makeSparklineOption(runtime.history, sensorColorMap[sensor.type])}
                      style={{ height: SPARKLINE_HEIGHT }}
                    />
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <Collapse
              defaultActiveKey={[]}
              items={[
                {
                  key: 'simulator',
                  label: '数据模拟器',
                  children: (
                    <div className="monitor-simulator-grid">
                      <Select
                        value={simulator.sensorId}
                        placeholder="选择传感器"
                        options={sensors.map((sensor) => ({
                          value: sensor.id,
                          label: `${resolveDeviceId(sensor)} · ${sensorTypeLabelMap[sensor.type]}`,
                        }))}
                        onChange={(value) => {
                          const sensor = sensors.find((item) => item.id === value);
                          setSimulator((previous) => ({
                            ...previous,
                            sensorId: value,
                            baseValue: sensor ? sensorBaseMap[sensor.type] : previous.baseValue,
                            rangeValue: sensor ? sensorRangeMap[sensor.type] : previous.rangeValue,
                          }));
                        }}
                      />
                      <InputNumber
                        value={simulator.baseValue}
                        onChange={(value) => setSimulator((previous) => ({ ...previous, baseValue: Number(value ?? previous.baseValue) }))}
                        addonBefore="基准值"
                      />
                      <InputNumber
                        value={simulator.rangeValue}
                        onChange={(value) => setSimulator((previous) => ({ ...previous, rangeValue: Number(value ?? previous.rangeValue) }))}
                        addonBefore="波动范围"
                      />
                      <InputNumber
                        value={simulator.intervalMs}
                        min={500}
                        step={500}
                        onChange={(value) => setSimulator((previous) => ({ ...previous, intervalMs: Number(value ?? previous.intervalMs) }))}
                        addonBefore="发送间隔"
                        addonAfter="ms"
                      />
                      {simulator.running ? (
                        <Button icon={<PauseCircleOutlined />} onClick={() => setSimulator((previous) => ({ ...previous, running: false }))}>
                          停止
                        </Button>
                      ) : (
                        <Button
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => {
                            if (!simulator.sensorId) {
                              message.warning('请选择一个传感器');
                              return;
                            }
                            setSimulator((previous) => ({ ...previous, running: true }));
                          }}
                        >
                          开始
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </section>

          <section>
            <div className="monitor-section-head">
              <div>
                <Title level={4}>控制面板</Title>
                <Text>发布到 `siz/v1/{currentSiteId}/control/{'{deviceId}'}/cmd`，最多等待 10 秒 ack。</Text>
              </div>
            </div>
            <div className="monitor-control-grid">
              {controlSensors.map((sensor) => {
                const state = deviceCommandState[sensor.id] ?? buildInitialDeviceState(sensor);
                const isPending = state.status === 'pending';
                const statusColor = state.status === 'ack'
                  ? 'green'
                  : state.status === 'pending'
                    ? 'blue'
                    : state.status === 'timeout'
                      ? 'orange'
                      : state.status === 'failed'
                        ? 'red'
                        : 'default';
                const statusLabel = state.status === 'ack'
                  ? '已确认'
                  : state.status === 'pending'
                    ? '发送中'
                    : state.status === 'timeout'
                      ? '超时'
                      : state.status === 'failed'
                        ? '失败'
                        : '空闲';

                return (
                  <Card key={sensor.id} className="monitor-control-card" bordered={false}>
                    <div className="monitor-control-head">
                      <div>
                        <div className="monitor-card-device">{resolveDeviceId(sensor)}</div>
                        <Tag color={sensor.type === 'valve' ? 'red' : 'gold'}>{sensorTypeLabelMap[sensor.type]}</Tag>
                      </div>
                      <Tag color={statusColor}>{statusLabel}</Tag>
                    </div>
                    <div className="monitor-control-state">{state.valueLabel ?? '--'}</div>
                    <div className="monitor-control-subline">最后操作：{state.lastAction}</div>
                    <div className="monitor-control-subline">
                      {sensor.type === 'pump'
                        ? `运行计时：${state.runtimeSince ? formatDuration(state.runtimeSince, nowTick) : '--'}`
                        : `最后下发：${formatRelativeTime(state.lastCommandAt, nowTick)}`}
                    </div>

                    {sensor.type === 'valve' ? (
                      <>
                        <div className="monitor-action-row">
                          <Button type="primary" icon={<ThunderboltOutlined />} loading={isPending} onClick={() => triggerValve(sensor, true)}>
                            开启
                          </Button>
                          <Button icon={<PoweroffOutlined />} loading={isPending} onClick={() => triggerValve(sensor, false)}>
                            停止
                          </Button>
                        </div>
                        <div className="monitor-timed-row">
                          <InputNumber
                            min={1}
                            max={240}
                            defaultValue={10}
                            addonAfter="分钟"
                            onChange={(value) => {
                              timerOpenMinutesRef.current[sensor.id] = Number(value ?? 10);
                            }}
                          />
                          <Button icon={<SendOutlined />} loading={isPending} onClick={() => triggerValveTimed(sensor)}>
                            定时开启
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="monitor-action-row">
                          <Button type="primary" icon={<PlayCircleOutlined />} loading={isPending} onClick={() => triggerPump(sensor, true, state.frequencyHz)}>
                            启动
                          </Button>
                          <Button icon={<PoweroffOutlined />} loading={isPending} onClick={() => triggerPump(sensor, false, state.frequencyHz)}>
                            停止
                          </Button>
                        </div>
                        <div className="monitor-frequency-block">
                          <div className="monitor-frequency-head">
                            <span>频率设定</span>
                            <strong>{(state.frequencyHz ?? 38).toFixed(1)} Hz</strong>
                          </div>
                          <Slider
                            min={30}
                            max={50}
                            step={0.5}
                            value={state.frequencyHz ?? 38}
                            onChange={(value) => {
                              const nextFrequency = Number(value);
                              setDeviceCommandState((previous) => ({
                                ...previous,
                                [sensor.id]: {
                                  ...(previous[sensor.id] ?? buildInitialDeviceState(sensor)),
                                  frequencyHz: nextFrequency,
                                  valueLabel: `${nextFrequency.toFixed(1)} Hz`,
                                },
                              }));
                            }}
                          />
                        </div>
                      </>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <div className="monitor-section-head">
              <div>
                <Title level={4}>指令历史</Title>
                <Text>最近 50 条控制结果，支持按状态筛选。</Text>
              </div>
              <Select
                value={selectedHistoryStatus}
                style={{ width: 140 }}
                options={[
                  { value: 'all', label: '全部状态' },
                  { value: 'pending', label: '发送中' },
                  { value: 'ack', label: '已确认' },
                  { value: 'timeout', label: '超时' },
                  { value: 'failed', label: '失败' },
                ]}
                onChange={(value) => setSelectedHistoryStatus(value as 'all' | CommandStatus)}
              />
            </div>
            <Card bordered={false} className="monitor-history-card">
              <Table
                size="small"
                rowKey="id"
                columns={commandColumns}
                dataSource={filteredCommandHistory}
                pagination={{ pageSize: 6, hideOnSinglePage: true }}
              />
            </Card>
          </section>
        </main>

        <aside className="monitor-log-panel">
          <div className="monitor-log-head">
            <div>
              <Title level={5}>原始消息日志</Title>
              <Text>最近 100 条 MQTT 原始消息</Text>
            </div>
            <Space wrap>
              <Button size="small" icon={<ClearOutlined />} onClick={() => setLogs([])}>
                清空
              </Button>
              <Button
                size="small"
                icon={logsPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                onClick={() => setLogsPaused((value) => !value)}
              >
                {logsPaused ? '恢复' : '暂停'}
              </Button>
              <Button size="small" icon={<DownloadOutlined />} onClick={exportLogs}>
                导出.log
              </Button>
            </Space>
          </div>
          <div className="monitor-log-list">
            {logs.map((entry) => (
              <article key={entry.id} className="monitor-log-entry">
                <div className="monitor-log-time">{new Date(entry.timestamp).toLocaleTimeString('zh-CN')}</div>
                <div className="monitor-log-topic">{entry.topic}</div>
                <pre className="monitor-log-payload">{entry.payload}</pre>
              </article>
            ))}
            {logs.length === 0 ? <div className="monitor-log-empty">暂无消息</div> : null}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Monitor;
