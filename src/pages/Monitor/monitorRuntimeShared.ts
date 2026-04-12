import type { Sensor } from '../../types/site';
import { parseMqttPayload } from '../../utils/mqttTelemetry';
import { resolveDeviceId } from './monitorViewShared';

export const getTimestamp = () => Date.now();

export const createId = (prefix: string) =>
  `${prefix}-${getTimestamp()}-${Math.random().toString(36).slice(2, 8)}`;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const parsePacketBody = parseMqttPayload;

export const getSensorTopic = (siteId: string, sensor: Sensor) =>
  `siz/v1/${siteId}/sensor/${resolveDeviceId(sensor)}/data`;

export const getAckTopic = (siteId: string, sensor: Sensor) =>
  `siz/v1/${siteId}/control/${resolveDeviceId(sensor)}/ack`;

export const getCmdTopic = (siteId: string, sensor: Sensor) =>
  `siz/v1/${siteId}/control/${resolveDeviceId(sensor)}/cmd`;
