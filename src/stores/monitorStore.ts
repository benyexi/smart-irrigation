import { create } from 'zustand';
import type { Sensor } from '../types/site';
import { getMqttBrokerUrl, getMqttStatus, type MqttMessage } from '../utils/mqttClient';
import {
  DEFAULT_BROKER,
  MAX_HISTORY,
  MAX_LOGS,
  MAX_POINTS,
  createDefaultSimulatorState,
  sensorBaseMap,
  sensorRangeMap,
  sensorUnitMap,
  type CommandEntry,
  type DeviceCommandState,
  type LogEntry,
  type MqttStatusSnapshot,
  type SensorRuntime,
  type SelectedHistoryStatus,
  type SimulatorState,
  type MqttConnectionState,
} from './monitorStore.types';

export {
  DEFAULT_BROKER,
  MAX_HISTORY,
  MAX_LOGS,
  MAX_POINTS,
  createDefaultSimulatorState,
  sensorBaseMap,
  sensorRangeMap,
  sensorUnitMap,
} from './monitorStore.types';

export type {
  CommandEntry,
  CommandStatus,
  DeviceCommandState,
  LogEntry,
  MqttStatusSnapshot,
  SensorRuntime,
  SelectedHistoryStatus,
  SimulatorState,
} from './monitorStore.types';

type Updater<T> = T | ((prev: T) => T);

const resolveUpdater = <T,>(updater: Updater<T>, previous: T): T => (
  typeof updater === 'function'
    ? (updater as (prev: T) => T)(previous)
    : updater
);

const getTimestamp = () => Date.now();
const createId = (prefix: string) => `${prefix}-${getTimestamp()}-${Math.random().toString(36).slice(2, 8)}`;

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

export const buildInitialSensorRuntime = (sensor: Sensor): SensorRuntime => ({
  latestValue: sensor.type === 'valve' ? '关闭' : sensor.type === 'pump' ? 38 : sensorBaseMap[sensor.type],
  unit: sensorUnitMap[sensor.type] ?? '',
  lastUpdatedAt: null,
  history: seedHistory(sensor),
  flashing: false,
});

export const buildInitialDeviceCommandState = (sensor: Sensor): DeviceCommandState => ({
  status: 'idle',
  lastAction: '尚未下发指令',
  lastCommandAt: null,
  runtimeSince: null,
  frequencyHz: sensor.type === 'pump' ? 38 : undefined,
  valueLabel: sensor.type === 'valve' ? '关闭' : '待机',
});

const buildSensorStateMap = (sensors: Sensor[]) => sensors.reduce<Record<string, SensorRuntime>>((accumulator, sensor) => {
  accumulator[sensor.id] = buildInitialSensorRuntime(sensor);
  return accumulator;
}, {});

const buildDeviceStateMap = (sensors: Sensor[]) => sensors.reduce<Record<string, DeviceCommandState>>((accumulator, sensor) => {
  if (sensor.type === 'valve' || sensor.type === 'pump') {
    accumulator[sensor.id] = buildInitialDeviceCommandState(sensor);
  }
  return accumulator;
}, {});

const initialBroker = getMqttBrokerUrl() || DEFAULT_BROKER;

type MonitorStore = {
  broker: string;
  mqttStatus: MqttStatusSnapshot;
  messageCount: number;
  logs: LogEntry[];
  logsPaused: boolean;
  sensorStateMap: Record<string, SensorRuntime>;
  simulator: SimulatorState;
  selectedHistoryStatus: SelectedHistoryStatus;
  commandHistory: CommandEntry[];
  deviceCommandState: Record<string, DeviceCommandState>;
  setBroker: (broker: string) => void;
  setMqttStatus: (state: MqttConnectionState) => void;
  setMessageCount: (updater: Updater<number>) => void;
  incrementMessageCount: (by?: number) => void;
  setLogs: (updater: Updater<LogEntry[]>) => void;
  clearLogs: () => void;
  appendLog: (entry: MqttMessage) => void;
  setLogsPaused: (updater: Updater<boolean>) => void;
  setSensorStateMap: (updater: Updater<Record<string, SensorRuntime>>) => void;
  resetSensorStateMap: (sensors: Sensor[]) => void;
  upsertSensorRuntime: (sensor: Sensor, updater: (previous: SensorRuntime) => SensorRuntime) => void;
  setSimulator: (updater: Updater<SimulatorState>) => void;
  updateSimulator: (updater: Updater<SimulatorState>) => void;
  patchSimulator: (patch: Partial<SimulatorState>) => void;
  resetSimulator: () => void;
  setSelectedHistoryStatus: (status: SelectedHistoryStatus) => void;
  setCommandHistory: (updater: Updater<CommandEntry[]>) => void;
  appendCommandHistory: (entry: Omit<CommandEntry, 'id'> & { id?: string }) => void;
  clearCommandHistory: () => void;
  setDeviceCommandState: (updater: Updater<Record<string, DeviceCommandState>>) => void;
  setDeviceCommandStateMap: (updater: Updater<Record<string, DeviceCommandState>>) => void;
  resetDeviceCommandStateMap: (sensors: Sensor[]) => void;
  upsertDeviceCommandState: (sensor: Sensor, updater: (previous: DeviceCommandState) => DeviceCommandState) => void;
  hydrateSite: (payload: {
    sensorStateMap: Record<string, SensorRuntime>;
    deviceCommandState: Record<string, DeviceCommandState>;
  }) => void;
  resetRuntime: (sensors: Sensor[], controlSensors: Sensor[]) => void;
  hydrateFromSensors: (sensors: Sensor[], controlSensors: Sensor[]) => void;
};

export const useMonitorStore = create<MonitorStore>((set) => ({
  broker: initialBroker,
  mqttStatus: {
    state: getMqttStatus(),
    broker: initialBroker,
    connectedAt: getMqttStatus() === 'connected' ? getTimestamp() : null,
  },
  messageCount: 0,
  logs: [],
  logsPaused: false,
  sensorStateMap: {},
  simulator: createDefaultSimulatorState(),
  selectedHistoryStatus: 'all',
  commandHistory: [],
  deviceCommandState: {},

  setBroker: (broker) => {
    const nextBroker = broker.trim() || DEFAULT_BROKER;
    set((state) => ({
      broker: nextBroker,
      mqttStatus: {
        ...state.mqttStatus,
        broker: nextBroker,
      },
    }));
  },

  setMqttStatus: (stateValue) => set((state) => ({
    mqttStatus: {
      state: stateValue,
      broker: state.broker,
      connectedAt: stateValue === 'connected'
        ? state.mqttStatus.connectedAt ?? getTimestamp()
        : stateValue === 'connecting'
          ? state.mqttStatus.connectedAt
          : null,
    },
  })),

  setMessageCount: (updater) => set((state) => ({
    messageCount: resolveUpdater(updater, state.messageCount),
  })),

  incrementMessageCount: (by = 1) => set((state) => ({
    messageCount: state.messageCount + by,
  })),

  setLogs: (updater) => set((state) => ({
    logs: resolveUpdater(updater, state.logs),
  })),

  clearLogs: () => set({ logs: [] }),

  appendLog: (entry) => set((state) => ({
    messageCount: state.messageCount + 1,
    logs: state.logsPaused ? state.logs : [
      {
        id: createId('log'),
        timestamp: entry.timestamp,
        topic: entry.topic,
        payload: entry.payloadText,
      },
      ...state.logs,
    ].slice(0, MAX_LOGS),
  })),

  setLogsPaused: (updater) => set((state) => ({
    logsPaused: resolveUpdater(updater, state.logsPaused),
  })),

  setSensorStateMap: (updater) => set((state) => ({
    sensorStateMap: resolveUpdater(updater, state.sensorStateMap),
  })),

  resetSensorStateMap: (sensors) => set({
    sensorStateMap: buildSensorStateMap(sensors),
  }),

  upsertSensorRuntime: (sensor, updater) => set((state) => {
    const previous = state.sensorStateMap[sensor.id] ?? buildInitialSensorRuntime(sensor);
    return {
      sensorStateMap: {
        ...state.sensorStateMap,
        [sensor.id]: updater(previous),
      },
    };
  }),

  setSimulator: (updater) => set((state) => ({
    simulator: resolveUpdater(updater, state.simulator),
  })),

  updateSimulator: (updater) => set((state) => ({
    simulator: resolveUpdater(updater, state.simulator),
  })),

  patchSimulator: (patch) => set((state) => ({
    simulator: {
      ...state.simulator,
      ...patch,
    },
  })),

  resetSimulator: () => set({ simulator: createDefaultSimulatorState() }),

  setSelectedHistoryStatus: (selectedHistoryStatus) => set({ selectedHistoryStatus }),

  setCommandHistory: (updater) => set((state) => ({
    commandHistory: resolveUpdater(updater, state.commandHistory),
  })),

  appendCommandHistory: (entry) => set((state) => ({
    commandHistory: [
      {
        id: entry.id ?? createId('cmd-history'),
        ...entry,
      },
      ...state.commandHistory,
    ].slice(0, MAX_HISTORY),
  })),

  clearCommandHistory: () => set({ commandHistory: [] }),

  setDeviceCommandState: (updater) => set((state) => ({
    deviceCommandState: resolveUpdater(updater, state.deviceCommandState),
  })),

  setDeviceCommandStateMap: (updater) => set((state) => ({
    deviceCommandState: resolveUpdater(updater, state.deviceCommandState),
  })),

  resetDeviceCommandStateMap: (sensors) => set({
    deviceCommandState: buildDeviceStateMap(sensors),
  }),

  upsertDeviceCommandState: (sensor, updater) => set((state) => {
    const previous = state.deviceCommandState[sensor.id] ?? buildInitialDeviceCommandState(sensor);
    return {
      deviceCommandState: {
        ...state.deviceCommandState,
        [sensor.id]: updater(previous),
      },
    };
  }),

  hydrateSite: ({ sensorStateMap, deviceCommandState }) => set({
    messageCount: 0,
    logs: [],
    sensorStateMap,
    simulator: createDefaultSimulatorState(),
    selectedHistoryStatus: 'all',
    commandHistory: [],
    deviceCommandState,
  }),

  resetRuntime: (sensors, controlSensors) => set({
    messageCount: 0,
    logs: [],
    logsPaused: false,
    sensorStateMap: buildSensorStateMap(sensors),
    simulator: createDefaultSimulatorState(),
    selectedHistoryStatus: 'all',
    commandHistory: [],
    deviceCommandState: buildDeviceStateMap(controlSensors),
  }),

  hydrateFromSensors: (sensors, controlSensors) => set({
    sensorStateMap: buildSensorStateMap(sensors),
    deviceCommandState: buildDeviceStateMap(controlSensors),
  }),
}));
