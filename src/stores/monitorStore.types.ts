import type { MqttStatus } from '../utils/mqttClient';

export type CommandStatus = 'pending' | 'ack' | 'timeout' | 'failed';
export type MqttConnectionState = MqttStatus | 'connecting';

export type MqttStatusSnapshot = {
  state: MqttConnectionState;
  broker: string;
  connectedAt: number | null;
};

export type SensorRuntime = {
  latestValue: number | string | null;
  unit: string;
  lastUpdatedAt: number | null;
  history: number[];
  flashing: boolean;
};

export type LogEntry = {
  id: string;
  timestamp: number;
  topic: string;
  payload: string;
};

export type CommandEntry = {
  id: string;
  msgId: string;
  timestamp: number;
  deviceId: string;
  command: string;
  status: CommandStatus;
  latencyMs?: number;
};

export type DeviceCommandState = {
  status: CommandStatus | 'idle';
  lastAction: string;
  lastCommandAt: number | null;
  runtimeSince: number | null;
  frequencyHz?: number;
  valueLabel?: string;
};

export type SimulatorState = {
  sensorId?: string;
  baseValue: number;
  rangeValue: number;
  intervalMs: number;
  running: boolean;
};

export type SelectedHistoryStatus = 'all' | CommandStatus;

export const DEFAULT_BROKER = 'wss://broker.emqx.io:8084/mqtt';
export const FIVE_MINUTES = 5 * 60 * 1000;
export const MAX_LOGS = 100;
export const MAX_HISTORY = 50;
export const MAX_POINTS = 20;
export const SPARKLINE_HEIGHT = 60;

export const sensorUnitMap: Partial<Record<import('../types/site').Sensor['type'], string>> = {
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

export const sensorBaseMap: Record<import('../types/site').Sensor['type'], number> = {
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

export const sensorRangeMap: Record<import('../types/site').Sensor['type'], number> = {
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

export const createDefaultSimulatorState = (): SimulatorState => ({
  sensorId: undefined,
  baseValue: 26,
  rangeValue: 3,
  intervalMs: 2000,
  running: false,
});
