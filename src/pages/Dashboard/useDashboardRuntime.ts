import { useCallback, useMemo, useState } from 'react';
import { mockDashboard } from '../../mock';
import type { Site } from '../../types/site';
import type { MqttMessage } from '../../utils/mqttClient';
import {
  buildDeviceSensorMap,
  getMqttPacketDeviceId,
  getTelemetryNumericValue,
} from '../../utils/mqttTelemetry';
import {
  getCurrentSiteId,
  getSites,
  setCurrentSiteId,
} from '../../utils/siteStorage';
import { useMqttStatus } from '../../hooks/useMqttStatus';
import { useMqttSubscription } from '../../hooks/useMqttSubscription';
import { liveMetricSensorTypes } from './dashboardShared';

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
    return buildDeviceSensorMap(
      site?.sensors ?? [],
      (sensor) => liveMetricSensorTypes.has(sensor.type),
    );
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
      const deviceId = getMqttPacketDeviceId(message);
      const sensor = monitoredSensors.get(deviceId);
      if (!sensor) {
        return;
      }

      const nextValue = getTelemetryNumericValue(message.payload);
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
