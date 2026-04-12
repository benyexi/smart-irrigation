import { useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import type { Sensor } from '../../types/site';
import { useMqttStatusListener } from '../../hooks/useMqttStatus';
import { useMqttSubscription } from '../../hooks/useMqttSubscription';
import {
  connectMqtt,
  disconnectMqtt,
  publishMqtt,
  type MqttMessage,
} from '../../utils/mqttClient';
import {
  buildDeviceSensorMap,
  getMqttPacketDeviceId,
} from '../../utils/mqttTelemetry';
import {
  DEFAULT_BROKER,
  MAX_POINTS,
  sensorBaseMap,
  sensorUnitMap,
  type CommandStatus,
  useMonitorStore,
} from '../../stores/monitorStore';
import { resolveDeviceId } from './monitorViewShared';
import {
  clamp,
  createId,
  getAckTopic,
  getCmdTopic,
  getSensorTopic,
  getTimestamp,
  parsePacketBody,
} from './monitorRuntimeShared';

type AckWaiter = {
  startedAt: number;
  deviceId: string;
  command: string;
  sensorId: string;
  timeoutId: number;
};

interface UseMonitorRuntimeArgs {
  currentSiteId: string;
  sensors: Sensor[];
  controlSensors: Sensor[];
}

export const useMonitorRuntime = ({
  currentSiteId,
  sensors,
  controlSensors,
}: UseMonitorRuntimeArgs) => {
  const broker = useMonitorStore((state) => state.broker);
  const mqttStatus = useMonitorStore((state) => state.mqttStatus);
  const messageCount = useMonitorStore((state) => state.messageCount);
  const logs = useMonitorStore((state) => state.logs);
  const logsPaused = useMonitorStore((state) => state.logsPaused);
  const sensorStateMap = useMonitorStore((state) => state.sensorStateMap);
  const simulator = useMonitorStore((state) => state.simulator);
  const commandHistory = useMonitorStore((state) => state.commandHistory);
  const deviceCommandState = useMonitorStore((state) => state.deviceCommandState);
  const selectedHistoryStatus = useMonitorStore(
    (state) => state.selectedHistoryStatus,
  );
  const resetRuntime = useMonitorStore((state) => state.resetRuntime);
  const setBroker = useMonitorStore((state) => state.setBroker);
  const setMqttStatus = useMonitorStore((state) => state.setMqttStatus);
  const appendLog = useMonitorStore((state) => state.appendLog);
  const clearLogs = useMonitorStore((state) => state.clearLogs);
  const setLogsPaused = useMonitorStore((state) => state.setLogsPaused);
  const upsertSensorRuntime = useMonitorStore(
    (state) => state.upsertSensorRuntime,
  );
  const upsertDeviceCommandState = useMonitorStore(
    (state) => state.upsertDeviceCommandState,
  );
  const updateSimulator = useMonitorStore((state) => state.updateSimulator);
  const appendCommandHistory = useMonitorStore(
    (state) => state.appendCommandHistory,
  );
  const setSelectedHistoryStatus = useMonitorStore(
    (state) => state.setSelectedHistoryStatus,
  );

  const ackWaitersRef = useRef(new Map<string, AckWaiter>());
  const timerOpenMinutesRef = useRef<Record<string, number>>({});
  const simulatorTimerRef = useRef<number | null>(null);
  const [nowTick, setNowTick] = useState(0);

  const sensorByDeviceId = useMemo(
    () => buildDeviceSensorMap(sensors),
    [sensors],
  );
  const controlSensorByDeviceId = useMemo(
    () => buildDeviceSensorMap(controlSensors),
    [controlSensors],
  );

  useEffect(() => {
    resetRuntime(sensors, controlSensors);
  }, [controlSensors, resetRuntime, sensors]);

  const handleSensorMessage = (packet: MqttMessage) => {
    appendLog(packet);

    const body = parsePacketBody(packet);
    const deviceId = getMqttPacketDeviceId(packet);
    const sensor = sensorByDeviceId.get(deviceId);
    if (!sensor) {
      return;
    }

    const rawValue = body.value;
    const numericValue =
      typeof rawValue === 'number'
        ? rawValue
        : typeof rawValue === 'string' && rawValue.trim()
          ? Number(rawValue)
          : null;
    const resolvedValue =
      sensor.type === 'valve'
        ? String(body.state ?? body.value ?? '关闭')
        : sensor.type === 'pump'
          ? Number(body.frequencyHz ?? body.value ?? 38)
          : numericValue;
    const unit =
      typeof body.unit === 'string' ? body.unit : sensorUnitMap[sensor.type] ?? '';
    const timestamp = typeof body.ts === 'number' ? body.ts : packet.timestamp;

    upsertSensorRuntime(sensor, (previous) => {
      const nextHistoryValue =
        typeof resolvedValue === 'number'
          ? resolvedValue
          : previous.history[previous.history.length - 1] ??
            sensorBaseMap[sensor.type];
      return {
        ...previous,
        latestValue: resolvedValue,
        unit,
        lastUpdatedAt: timestamp,
        history: [
          ...previous.history.slice(-(MAX_POINTS - 1)),
          nextHistoryValue,
        ],
        flashing: true,
      };
    });

    if (sensor.type === 'valve' || sensor.type === 'pump') {
      const runningFlag =
        typeof body.running === 'boolean'
          ? body.running
          : sensor.type === 'pump'
            ? Number(body.frequencyHz ?? body.value ?? 0) > 0
            : undefined;

      upsertDeviceCommandState(sensor, (previous) => ({
        ...previous,
        valueLabel:
          sensor.type === 'valve'
            ? String(body.state ?? resolvedValue)
            : `${Number(body.frequencyHz ?? resolvedValue ?? 38).toFixed(1)} Hz`,
        runtimeSince:
          sensor.type === 'pump'
            ? runningFlag
              ? previous.runtimeSince ?? timestamp
              : null
            : previous.runtimeSince ?? null,
        frequencyHz:
          sensor.type === 'pump'
            ? Number(body.frequencyHz ?? resolvedValue ?? previous.frequencyHz ?? 38)
            : undefined,
      }));
    }

    window.setTimeout(() => {
      upsertSensorRuntime(sensor, (previous) => ({
        ...previous,
        flashing: false,
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
    const status: CommandStatus =
      String(body.status ?? 'ack') === 'ack' ? 'ack' : 'failed';
    const sensor = controlSensorByDeviceId.get(waiter.deviceId);

    appendCommandHistory({
      msgId,
      timestamp,
      deviceId: waiter.deviceId,
      command: waiter.command,
      status,
      latencyMs,
    });

    if (sensor) {
      upsertDeviceCommandState(sensor, (previous) => ({
        ...previous,
        status,
        lastAction:
          status === 'ack' ? `${waiter.command} 已确认` : `${waiter.command} 失败`,
        lastCommandAt: timestamp,
        runtimeSince:
          waiter.command.includes('启动') || waiter.command.includes('开启')
            ? previous.runtimeSince ?? timestamp
            : waiter.command.includes('停止') || waiter.command.includes('关闭')
              ? null
              : previous.runtimeSince ?? null,
      }));
    }

    if (status === 'ack') {
      message.success(`${waiter.deviceId} 指令已确认`);
    } else {
      message.error(`${waiter.deviceId} 指令失败`);
    }
  };

  useEffect(() => {
    const tick = window.setInterval(() => setNowTick(getTimestamp()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useMqttStatusListener((nextState) => {
    setMqttStatus(nextState);
  });

  useMqttSubscription(
    currentSiteId ? `siz/v1/${currentSiteId}/sensor/+/data` : null,
    handleSensorMessage,
    Boolean(currentSiteId),
  );

  useMqttSubscription(
    currentSiteId ? `siz/v1/${currentSiteId}/control/+/ack` : null,
    handleAckMessage,
    Boolean(currentSiteId),
  );

  useEffect(() => {
    let disposed = false;

    const bootstrap = async () => {
      const activeBroker = useMonitorStore.getState().broker;
      try {
        await connectMqtt(activeBroker);
      } catch {
        if (!disposed) {
          setMqttStatus('disconnected');
          message.error('MQTT 自动连接失败');
        }
        return;
      }

      if (disposed) {
        return;
      }

      const now = getTimestamp();
      sensors.forEach((sensor) => {
        const payload =
          sensor.type === 'valve'
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
    };
  }, [currentSiteId, sensors, setMqttStatus]);

  useEffect(
    () => () => {
      ackWaitersRef.current.forEach((waiter) =>
        window.clearTimeout(waiter.timeoutId),
      );
      ackWaitersRef.current.clear();
    },
    [],
  );

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
      const center = Number.isFinite(simulator.baseValue)
        ? simulator.baseValue
        : sensorBaseMap[sensor.type];
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
    const nextBroker = broker.trim() || DEFAULT_BROKER;
    setBroker(nextBroker);
    setMqttStatus('connecting');
    try {
      await connectMqtt(nextBroker);
    } catch {
      setMqttStatus('disconnected');
      message.error('MQTT 连接失败');
    }
  };

  const disconnect = () => {
    disconnectMqtt();
    setMqttStatus('disconnected');
  };

  const exportLogs = () => {
    const content = logs
      .slice()
      .reverse()
      .map(
        (entry) =>
          `${new Date(entry.timestamp).toLocaleString('zh-CN')} | ${entry.topic} | ${entry.payload}`,
      )
      .join('\n');
    const blob = new Blob([content], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `monitor-${currentSiteId}-${new Date()
      .toISOString()
      .slice(0, 19)}.log`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const sendCommand = async (
    sensor: Sensor,
    command: string,
    payloadExtra: Record<string, unknown> = {},
  ) => {
    const msgId = createId('cmd');
    const startedAt = getTimestamp();
    const topic = getCmdTopic(currentSiteId, sensor);

    upsertDeviceCommandState(sensor, (previous) => ({
      ...previous,
      status: 'pending',
      lastAction: `${command} 发送中`,
      lastCommandAt: startedAt,
    }));

    const timeoutId = window.setTimeout(() => {
      ackWaitersRef.current.delete(msgId);
      upsertDeviceCommandState(sensor, (previous) => ({
        ...previous,
        status: 'timeout',
        lastAction: `${command} 超时`,
        lastCommandAt: getTimestamp(),
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
      upsertDeviceCommandState(sensor, (previous) => ({
        ...previous,
        status: 'failed',
        lastAction: `${command} 发送失败`,
        lastCommandAt: getTimestamp(),
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

    void sendCommand(sensor, `定时开启 ${minutes} 分钟`, {
      open: true,
      durationMinutes: minutes,
    });
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

  const triggerPump = (
    sensor: Sensor,
    running: boolean,
    frequencyHz?: number,
  ) => {
    const nextFrequency =
      frequencyHz ?? deviceCommandState[sensor.id]?.frequencyHz ?? 38;
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

  const updatePumpFrequency = (sensor: Sensor, nextFrequency: number) => {
    upsertDeviceCommandState(sensor, (previous) => ({
      ...previous,
      frequencyHz: nextFrequency,
      valueLabel: `${nextFrequency.toFixed(1)} Hz`,
    }));
  };

  const filteredCommandHistory = useMemo(
    () =>
      selectedHistoryStatus === 'all'
        ? commandHistory
        : commandHistory.filter(
            (item) => item.status === selectedHistoryStatus,
          ),
    [commandHistory, selectedHistoryStatus],
  );

  return {
    broker,
    mqttStatus,
    messageCount,
    logs,
    logsPaused,
    sensorStateMap,
    simulator,
    deviceCommandState,
    selectedHistoryStatus,
    nowTick,
    timerOpenMinutesRef,
    filteredCommandHistory,
    setBroker,
    clearLogs,
    setLogsPaused,
    updateSimulator,
    setSelectedHistoryStatus,
    connect,
    disconnect,
    exportLogs,
    triggerValve,
    triggerValveTimed,
    triggerPump,
    updatePumpFrequency,
  };
};
