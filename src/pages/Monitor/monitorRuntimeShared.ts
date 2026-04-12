import type { Sensor } from '../../types/site';
import type { MqttMessage } from '../../utils/mqttClient';
import { resolveDeviceId } from './monitorViewShared';

export const getTimestamp = () => Date.now();

export const createId = (prefix: string) =>
  `${prefix}-${getTimestamp()}-${Math.random().toString(36).slice(2, 8)}`;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const parsePacketBody = (
  packet: MqttMessage,
): Record<string, unknown> => {
  if (
    packet.payload &&
    typeof packet.payload === 'object' &&
    !Array.isArray(packet.payload)
  ) {
    return packet.payload as Record<string, unknown>;
  }

  try {
    return JSON.parse(packet.payloadText) as Record<string, unknown>;
  } catch {
    return { value: packet.payloadText };
  }
};

export const getSensorTopic = (siteId: string, sensor: Sensor) =>
  `siz/v1/${siteId}/sensor/${resolveDeviceId(sensor)}/data`;

export const getAckTopic = (siteId: string, sensor: Sensor) =>
  `siz/v1/${siteId}/control/${resolveDeviceId(sensor)}/ack`;

export const getCmdTopic = (siteId: string, sensor: Sensor) =>
  `siz/v1/${siteId}/control/${resolveDeviceId(sensor)}/cmd`;
