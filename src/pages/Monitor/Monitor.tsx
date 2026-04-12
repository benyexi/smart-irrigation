import React, { Suspense, lazy, useMemo } from 'react';
import { message } from 'antd';
import type { Site } from '../../types/site';
import { sensorBaseMap, sensorRangeMap } from '../../stores/monitorStore';
import { useSiteStore, useSyncSiteStore } from '../../stores/siteStore';
import MonitorControlSection from './components/MonitorControlSection';
import MonitorLogPanel from './components/MonitorLogPanel';
import MonitorSensorSection from './components/MonitorSensorSection';
import MonitorSimulatorSection from './components/MonitorSimulatorSection';
import MonitorTopbar from './components/MonitorTopbar';
import { sensorSortWeight } from './monitorViewShared';
import { useMonitorRuntime } from './useMonitorRuntime';
import './Monitor.css';

const MonitorCommandHistorySection = lazy(
  () => import('./components/MonitorCommandHistorySection'),
);

const Monitor: React.FC = () => {
  useSyncSiteStore();
  const currentSiteId = useSiteStore((state) => state.currentSiteId);
  const sites = useSiteStore((state) => state.sites);
  const currentSite = useMemo<Site | null>(
    () => sites.find((site) => site.id === currentSiteId) ?? sites[0] ?? null,
    [currentSiteId, sites],
  );
  const currentSiteName = currentSite?.name ?? '未找到站点';
  const sensors = useMemo(
    () =>
      (currentSite?.sensors ?? [])
        .slice()
        .sort(
          (left, right) =>
            sensorSortWeight(left.type) - sensorSortWeight(right.type),
        ),
    [currentSite],
  );
  const controlSensors = useMemo(
    () =>
      sensors.filter(
        (sensor) => sensor.type === 'valve' || sensor.type === 'pump',
      ),
    [sensors],
  );

  const runtime = useMonitorRuntime({
    currentSiteId,
    sensors,
    controlSensors,
  });

  return (
    <div className="page-container monitor-page">
      <MonitorTopbar
        mqttStatus={runtime.mqttStatus}
        broker={runtime.broker}
        currentSiteName={currentSiteName}
        currentSiteId={currentSiteId}
        messageCount={runtime.messageCount}
        nowTick={runtime.nowTick}
        onBrokerChange={runtime.setBroker}
        onConnect={() => void runtime.connect()}
        onDisconnect={runtime.disconnect}
      />

      <div className="monitor-layout">
        <main className="monitor-main">
          <MonitorSensorSection
            currentSiteId={currentSiteId}
            sensors={sensors}
            sensorStateMap={runtime.sensorStateMap}
            nowTick={runtime.nowTick}
          />

          <MonitorSimulatorSection
            sensors={sensors}
            simulator={runtime.simulator}
            onUpdateSimulator={runtime.updateSimulator}
            onMissingSensor={() => message.warning('请选择一个传感器')}
            getBaseValue={(sensor) => sensorBaseMap[sensor.type]}
            getRangeValue={(sensor) => sensorRangeMap[sensor.type]}
          />

          <MonitorControlSection
            currentSiteId={currentSiteId}
            controlSensors={controlSensors}
            deviceCommandState={runtime.deviceCommandState}
            nowTick={runtime.nowTick}
            timerOpenMinutesRef={runtime.timerOpenMinutesRef}
            onTriggerValve={runtime.triggerValve}
            onTriggerValveTimed={runtime.triggerValveTimed}
            onTriggerPump={runtime.triggerPump}
            onUpdatePumpFrequency={runtime.updatePumpFrequency}
          />

          <Suspense fallback={null}>
            <MonitorCommandHistorySection
              filteredCommandHistory={runtime.filteredCommandHistory}
              selectedHistoryStatus={runtime.selectedHistoryStatus}
              onStatusChange={runtime.setSelectedHistoryStatus}
            />
          </Suspense>
        </main>

        <MonitorLogPanel
          logs={runtime.logs}
          logsPaused={runtime.logsPaused}
          onClear={runtime.clearLogs}
          onTogglePause={() => runtime.setLogsPaused(!runtime.logsPaused)}
          onExport={runtime.exportLogs}
        />
      </div>
    </div>
  );
};

export default Monitor;
