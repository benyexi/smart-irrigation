import { Card, Tag, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { Sensor } from '../../../types/site';
import {
  buildInitialSensorRuntime,
  type SensorRuntime,
} from '../../../stores/monitorStore';
import {
  FIVE_MINUTES,
  SPARKLINE_HEIGHT,
  formatRelativeTime,
  formatValue,
  makeSparklineOption,
  resolveDeviceId,
  sensorColorMap,
  sensorTypeLabelMap,
} from '../monitorViewShared';

const { Title, Text } = Typography;

interface MonitorSensorSectionProps {
  currentSiteId: string;
  sensors: Sensor[];
  sensorStateMap: Record<string, SensorRuntime>;
  nowTick: number;
}

const MonitorSensorSection = ({
  currentSiteId,
  sensors,
  sensorStateMap,
  nowTick,
}: MonitorSensorSectionProps) => (
  <section>
    <div className="monitor-section-head">
      <div>
        <Title level={4}>传感器实时卡片</Title>
        <Text>{`订阅 siz/v1/${currentSiteId}/sensor/+/data，最近 5 分钟有数据即判定在线。`}</Text>
      </div>
    </div>
    <div className="monitor-sensor-grid">
      {sensors.map((sensor) => {
        const runtime = sensorStateMap[sensor.id] ?? buildInitialSensorRuntime(sensor);
        const online = runtime.lastUpdatedAt
          ? nowTick - runtime.lastUpdatedAt <= FIVE_MINUTES
          : false;

        return (
          <Card
            key={sensor.id}
            className={`monitor-sensor-card ${runtime.flashing ? 'is-flashing' : ''}`}
            bordered={false}
          >
            <div className="monitor-card-top">
              <div>
                <div className="monitor-card-device">{resolveDeviceId(sensor)}</div>
                <Tag color="blue">{sensorTypeLabelMap[sensor.type]}</Tag>
              </div>
              <Tag color={online ? 'green' : 'default'}>{online ? '在线' : '离线'}</Tag>
            </div>
            <div className="monitor-card-value">
              <span>{formatValue(runtime.latestValue, sensor.type)}</span>
              <small>{runtime.unit}</small>
            </div>
            <div className="monitor-card-meta">
              <span>{sensor.location || '未填写位置'}</span>
              <span>{formatRelativeTime(runtime.lastUpdatedAt, nowTick)}</span>
            </div>
            <ReactECharts
              option={makeSparklineOption(runtime.history, sensorColorMap[sensor.type])}
              style={{ height: SPARKLINE_HEIGHT }}
            />
          </Card>
        );
      })}
    </div>
  </section>
);

export default MonitorSensorSection;
