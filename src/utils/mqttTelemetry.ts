import type { Sensor } from '../types/site';
import type { MqttMessage } from './mqttClient';

export const normalizeMqttId = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

export const parseMqttPayload = (
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

const getNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const getTelemetryNumericValue = (payload: unknown): number | null => {
  if (typeof payload === 'number' || typeof payload === 'string') {
    return getNumericValue(payload);
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const nestedData =
    data.data && typeof data.data === 'object'
      ? (data.data as Record<string, unknown>)
      : null;

  return (
    getNumericValue(data.value) ??
    getNumericValue(data.reading) ??
    getNumericValue(data.currentValue) ??
    (nestedData
      ? getNumericValue(nestedData.value) ?? getNumericValue(nestedData.reading)
      : null)
  );
};

export const getMqttTopicDeviceId = (topic: string): string | null => {
  const parts = topic.split('/');
  if (parts.length < 6) {
    return null;
  }

  return parts[4]?.trim() || null;
};

export const getMqttPacketDeviceId = (packet: MqttMessage): string => {
  const payload = parseMqttPayload(packet);

  return (
    normalizeMqttId(payload.deviceId) ||
    normalizeMqttId(payload.sensorId) ||
    normalizeMqttId(payload.id) ||
    getMqttTopicDeviceId(packet.topic) ||
    ''
  );
};

export const buildDeviceSensorMap = (
  sensors: Sensor[],
  predicate?: (sensor: Sensor) => boolean,
) => {
  const sensorMap = new Map<string, Sensor>();

  sensors.forEach((sensor) => {
    if (predicate && !predicate(sensor)) {
      return;
    }

    const deviceId = sensor.deviceId.trim() || sensor.id.trim();
    if (deviceId) {
      sensorMap.set(deviceId, sensor);
    }

    const fallbackId = sensor.id.trim();
    if (fallbackId) {
      sensorMap.set(fallbackId, sensor);
    }
  });

  return sensorMap;
};
