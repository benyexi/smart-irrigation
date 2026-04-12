import { ApiOutlined, CloudOutlined, DisconnectOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import type { MqttStatusSnapshot } from '../../../stores/monitorStore';
import { formatDuration } from '../monitorViewShared';

interface MonitorTopbarProps {
  mqttStatus: MqttStatusSnapshot;
  broker: string;
  currentSiteName: string;
  currentSiteId: string;
  messageCount: number;
  nowTick: number;
  onBrokerChange: (value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

const MonitorTopbar = ({
  mqttStatus,
  broker,
  currentSiteName,
  currentSiteId,
  messageCount,
  nowTick,
  onBrokerChange,
  onConnect,
  onDisconnect,
}: MonitorTopbarProps) => (
  <div className="monitor-topbar">
    <div className="monitor-topbar-left">
      <span className={`monitor-status-dot is-${mqttStatus.state}`} />
      <div>
        <div className="monitor-topbar-title">MQTT 状态栏</div>
        <div className="monitor-topbar-subtitle">
          当前站点：{currentSiteName} / {currentSiteId}
        </div>
      </div>
    </div>

    <div className="monitor-topbar-center">
      <Input
        prefix={<ApiOutlined />}
        value={broker}
        onChange={(event) => onBrokerChange(event.target.value)}
        placeholder="请输入 Broker 地址"
      />
      {mqttStatus.state === 'connected' ? (
        <Button icon={<DisconnectOutlined />} onClick={onDisconnect}>
          断开
        </Button>
      ) : (
        <Button type="primary" icon={<CloudOutlined />} onClick={onConnect}>
          连接
        </Button>
      )}
    </div>

    <div className="monitor-topbar-metrics">
      <div className="monitor-metric-chip">
        <span>连接状态</span>
        <strong>
          {mqttStatus.state === 'connected'
            ? 'Connected'
            : mqttStatus.state === 'connecting'
              ? 'Connecting'
              : 'Disconnected'}
        </strong>
      </div>
      <div className="monitor-metric-chip">
        <span>已连接时长</span>
        <strong>
          {mqttStatus.state === 'connected'
            ? formatDuration(mqttStatus.connectedAt, nowTick)
            : '--'}
        </strong>
      </div>
      <div className="monitor-metric-chip">
        <span>消息总数</span>
        <strong>{messageCount}</strong>
      </div>
    </div>
  </div>
);

export default MonitorTopbar;
