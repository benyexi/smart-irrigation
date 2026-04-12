import type { MutableRefObject } from 'react';
import { PlayCircleOutlined, PoweroffOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Card, InputNumber, Slider, Tag, Typography } from 'antd';
import type { Sensor } from '../../../types/site';
import {
  buildInitialDeviceCommandState,
  type DeviceCommandState,
} from '../../../stores/monitorStore';
import {
  formatDuration,
  formatRelativeTime,
  resolveDeviceId,
  sensorTypeLabelMap,
} from '../monitorViewShared';

const { Title, Text } = Typography;

interface MonitorControlSectionProps {
  currentSiteId: string;
  controlSensors: Sensor[];
  deviceCommandState: Record<string, DeviceCommandState>;
  nowTick: number;
  timerOpenMinutesRef: MutableRefObject<Record<string, number>>;
  onTriggerValve: (sensor: Sensor, open: boolean) => void;
  onTriggerValveTimed: (sensor: Sensor) => void;
  onTriggerPump: (sensor: Sensor, running: boolean, frequencyHz?: number) => void;
  onUpdatePumpFrequency: (sensor: Sensor, nextFrequency: number) => void;
}

const MonitorControlSection = ({
  currentSiteId,
  controlSensors,
  deviceCommandState,
  nowTick,
  timerOpenMinutesRef,
  onTriggerValve,
  onTriggerValveTimed,
  onTriggerPump,
  onUpdatePumpFrequency,
}: MonitorControlSectionProps) => (
  <section>
    <div className="monitor-section-head">
      <div>
        <Title level={4}>控制面板</Title>
        <Text>{`发布到 siz/v1/${currentSiteId}/control/{deviceId}/cmd，最多等待 10 秒 ack。`}</Text>
      </div>
    </div>
    <div className="monitor-control-grid">
      {controlSensors.map((sensor) => {
        const state =
          deviceCommandState[sensor.id] ?? buildInitialDeviceCommandState(sensor);
        const isPending = state.status === 'pending';
        const statusColor =
          state.status === 'ack'
            ? 'green'
            : state.status === 'pending'
              ? 'blue'
              : state.status === 'timeout'
                ? 'orange'
                : state.status === 'failed'
                  ? 'red'
                  : 'default';
        const statusLabel =
          state.status === 'ack'
            ? '已确认'
            : state.status === 'pending'
              ? '发送中'
              : state.status === 'timeout'
                ? '超时'
                : state.status === 'failed'
                  ? '失败'
                  : '空闲';

        return (
          <Card key={sensor.id} className="monitor-control-card" bordered={false}>
            <div className="monitor-control-head">
              <div>
                <div className="monitor-card-device">{resolveDeviceId(sensor)}</div>
                <Tag color={sensor.type === 'valve' ? 'red' : 'gold'}>
                  {sensorTypeLabelMap[sensor.type]}
                </Tag>
              </div>
              <Tag color={statusColor}>{statusLabel}</Tag>
            </div>
            <div className="monitor-control-state">{state.valueLabel ?? '--'}</div>
            <div className="monitor-control-subline">最后操作：{state.lastAction}</div>
            <div className="monitor-control-subline">
              {sensor.type === 'pump'
                ? `运行计时：${
                    state.runtimeSince
                      ? formatDuration(state.runtimeSince, nowTick)
                      : '--'
                  }`
                : `最后下发：${formatRelativeTime(state.lastCommandAt, nowTick)}`}
            </div>

            {sensor.type === 'valve' ? (
              <>
                <div className="monitor-action-row">
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    loading={isPending}
                    onClick={() => onTriggerValve(sensor, true)}
                  >
                    开启
                  </Button>
                  <Button
                    icon={<PoweroffOutlined />}
                    loading={isPending}
                    onClick={() => onTriggerValve(sensor, false)}
                  >
                    停止
                  </Button>
                </div>
                <div className="monitor-timed-row">
                  <InputNumber
                    min={1}
                    max={240}
                    defaultValue={10}
                    addonAfter="分钟"
                    onChange={(value) => {
                      timerOpenMinutesRef.current[sensor.id] = Number(value ?? 10);
                    }}
                  />
                  <Button
                    icon={<SendOutlined />}
                    loading={isPending}
                    onClick={() => onTriggerValveTimed(sensor)}
                  >
                    定时开启
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="monitor-action-row">
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    loading={isPending}
                    onClick={() => onTriggerPump(sensor, true, state.frequencyHz)}
                  >
                    启动
                  </Button>
                  <Button
                    icon={<PoweroffOutlined />}
                    loading={isPending}
                    onClick={() => onTriggerPump(sensor, false, state.frequencyHz)}
                  >
                    停止
                  </Button>
                </div>
                <div className="monitor-frequency-block">
                  <div className="monitor-frequency-head">
                    <span>频率设定</span>
                    <strong>{(state.frequencyHz ?? 38).toFixed(1)} Hz</strong>
                  </div>
                  <Slider
                    min={30}
                    max={50}
                    step={0.5}
                    value={state.frequencyHz ?? 38}
                    onChange={(value) =>
                      onUpdatePumpFrequency(sensor, Number(value))
                    }
                  />
                </div>
              </>
            )}
          </Card>
        );
      })}
    </div>
  </section>
);

export default MonitorControlSection;
