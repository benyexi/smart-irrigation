import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Collapse, InputNumber, Select } from 'antd';
import type { Sensor } from '../../../types/site';
import type { SimulatorState } from '../../../stores/monitorStore';
import {
  resolveDeviceId,
  sensorTypeLabelMap,
} from '../monitorViewShared';

interface MonitorSimulatorSectionProps {
  sensors: Sensor[];
  simulator: SimulatorState;
  onUpdateSimulator: (
    updater: SimulatorState | ((previous: SimulatorState) => SimulatorState),
  ) => void;
  onMissingSensor: () => void;
  getBaseValue: (sensor: Sensor) => number;
  getRangeValue: (sensor: Sensor) => number;
}

const MonitorSimulatorSection = ({
  sensors,
  simulator,
  onUpdateSimulator,
  onMissingSensor,
  getBaseValue,
  getRangeValue,
}: MonitorSimulatorSectionProps) => (
  <section>
    <Collapse
      defaultActiveKey={[]}
      items={[
        {
          key: 'simulator',
          label: '数据模拟器',
          children: (
            <div className="monitor-simulator-grid">
              <Select
                value={simulator.sensorId}
                placeholder="选择传感器"
                options={sensors.map((sensor) => ({
                  value: sensor.id,
                  label: `${resolveDeviceId(sensor)} · ${sensorTypeLabelMap[sensor.type]}`,
                }))}
                onChange={(value) => {
                  const sensor = sensors.find((item) => item.id === value);
                  onUpdateSimulator((previous) => ({
                    ...previous,
                    sensorId: value,
                    baseValue: sensor ? getBaseValue(sensor) : previous.baseValue,
                    rangeValue: sensor ? getRangeValue(sensor) : previous.rangeValue,
                  }));
                }}
              />
              <InputNumber
                value={simulator.baseValue}
                onChange={(value) =>
                  onUpdateSimulator((previous) => ({
                    ...previous,
                    baseValue: Number(value ?? previous.baseValue),
                  }))
                }
                addonBefore="基准值"
              />
              <InputNumber
                value={simulator.rangeValue}
                onChange={(value) =>
                  onUpdateSimulator((previous) => ({
                    ...previous,
                    rangeValue: Number(value ?? previous.rangeValue),
                  }))
                }
                addonBefore="波动范围"
              />
              <InputNumber
                value={simulator.intervalMs}
                min={500}
                step={500}
                onChange={(value) =>
                  onUpdateSimulator((previous) => ({
                    ...previous,
                    intervalMs: Number(value ?? previous.intervalMs),
                  }))
                }
                addonBefore="发送间隔"
                addonAfter="ms"
              />
              {simulator.running ? (
                <Button
                  icon={<PauseCircleOutlined />}
                  onClick={() =>
                    onUpdateSimulator((previous) => ({
                      ...previous,
                      running: false,
                    }))
                  }
                >
                  停止
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => {
                    if (!simulator.sensorId) {
                      onMissingSensor();
                      return;
                    }
                    onUpdateSimulator((previous) => ({
                      ...previous,
                      running: true,
                    }));
                  }}
                >
                  开始
                </Button>
              )}
            </div>
          ),
        },
      ]}
    />
  </section>
);

export default MonitorSimulatorSection;
