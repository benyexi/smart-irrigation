import { useCallback, useMemo, useState } from 'react';
import { mockDashboard } from '../../mock';
import type { Site } from '../../types/site';
import type { MqttMessage } from '../../utils/mqttClient';
import {
  buildDeviceSensorMap,
  getMqttPacketDeviceId,
  getTelemetryNumericValue,
} from '../../utils/mqttTelemetry';
import { useMqttStatus } from '../../hooks/useMqttStatus';
import { useMqttSubscription } from '../../hooks/useMqttSubscription';
import { useSiteStore, useSyncSiteStore } from '../../stores/siteStore';
import { liveMetricSensorTypes } from './dashboardShared';

export const useDashboardRuntime = () => {
  const [plantPhysiology, setPlantPhysiology] = useState(
    () => mockDashboard.plantPhysiology,
  );
  useSyncSiteStore();
  const sites = useSiteStore((state) => state.sites);
  const selectedSite = useSiteStore((state) => state.currentSiteId);
  const setCurrentSite = useSiteStore((state) => state.setCurrentSite);
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
    setCurrentSite(siteId);
    setPlantPhysiology(mockDashboard.plantPhysiology);
  }, [setCurrentSite]);

  const handleSiteSaved = useCallback((savedSite: Site) => {
    setCurrentSite(savedSite.id);
    setPlantPhysiology(mockDashboard.plantPhysiology);
  }, [setCurrentSite]);

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
    { autoConnect: false },
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
