import { useCallback, useMemo, useState } from 'react';
import { mockDashboard } from '../../mock';
import type { Site } from '../../types/site';
import type { MqttMessage } from '../../utils/mqttClient';
import {
  getCurrentSiteId,
  getSites,
  setCurrentSiteId,
} from '../../utils/siteStorage';
import { useMqttStatus } from '../../hooks/useMqttStatus';
import { useMqttSubscription } from '../../hooks/useMqttSubscription';
import {
  getTelemetryValue,
  getTopicDeviceId,
  liveMetricSensorTypes,
  normalizeId,
} from './dashboardShared';

export const useDashboardRuntime = () => {
  const [sites, setSites] = useState<Site[]>(() => getSites());
  const [selectedSite, setSelectedSite] = useState<string>(() => getCurrentSiteId());
  const [plantPhysiology, setPlantPhysiology] = useState(
    () => mockDashboard.plantPhysiology,
  );
  const mqttStatus = useMqttStatus();

  const site = useMemo(
    () => sites.find((item) => item.id === selectedSite) ?? sites[0],
    [sites, selectedSite],
  );
  const currentSiteId = site?.id ?? selectedSite;

  const monitoredSensors = useMemo(() => {
    const sensorMap = new Map<string, Site['sensors'][number]>();

    site?.sensors.forEach((sensor) => {
      if (!liveMetricSensorTypes.has(sensor.type)) {
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
  }, [site]);

  const handleSiteChange = useCallback((siteId: string) => {
    setSelectedSite(siteId);
    setCurrentSiteId(siteId);
    setPlantPhysiology(mockDashboard.plantPhysiology);
  }, []);

  const handleSiteSaved = useCallback((savedSite: Site) => {
    setSites(getSites());
    setSelectedSite(savedSite.id);
    setCurrentSiteId(savedSite.id);
    setPlantPhysiology(mockDashboard.plantPhysiology);
  }, []);

  const handleTelemetry = useCallback(
    (message: MqttMessage) => {
      const payload =
        message.payload && typeof message.payload === 'object'
          ? (message.payload as Record<string, unknown>)
          : {};

      const deviceId =
        normalizeId(payload.deviceId) ||
        normalizeId(payload.sensorId) ||
        normalizeId(payload.id) ||
        getTopicDeviceId(message.topic) ||
        '';

      const sensor = monitoredSensors.get(deviceId);
      if (!sensor) {
        return;
      }

      const nextValue = getTelemetryValue(message.payload);
      if (nextValue === null) {
        return;
      }

      setPlantPhysiology((previous) => {
        if (sensor.type === 'sapflow') {
          return { ...previous, sapFlowRate: nextValue };
        }

        if (sensor.type === 'stem_diameter') {
          return { ...previous, stemDiameterVariation: nextValue };
        }

        if (sensor.type === 'leaf_turgor') {
          return { ...previous, leafTurgorPressure: nextValue };
        }

        return previous;
      });
    },
    [monitoredSensors],
  );

  useMqttSubscription(
    currentSiteId ? `siz/v1/${currentSiteId}/sensor/+/data` : null,
    handleTelemetry,
    Boolean(currentSiteId),
  );

  return {
    sites,
    site,
    selectedSite,
    currentSiteId,
    mqttStatus,
    plantPhysiology,
    handleSiteChange,
    handleSiteSaved,
  };
};
