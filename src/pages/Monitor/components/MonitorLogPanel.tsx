import { ClearOutlined, DownloadOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import type { LogEntry } from '../../../stores/monitorStore';

const { Title, Text } = Typography;

interface MonitorLogPanelProps {
  logs: LogEntry[];
  logsPaused: boolean;
  onClear: () => void;
  onTogglePause: () => void;
  onExport: () => void;
}

const MonitorLogPanel = ({
  logs,
  logsPaused,
  onClear,
  onTogglePause,
  onExport,
}: MonitorLogPanelProps) => (
  <aside className="monitor-log-panel">
    <div className="monitor-log-head">
      <div>
        <Title level={5}>原始消息日志</Title>
        <Text>最近 100 条 MQTT 原始消息</Text>
      </div>
      <Space wrap>
        <Button size="small" icon={<ClearOutlined />} onClick={onClear}>
          清空
        </Button>
        <Button
          size="small"
          icon={logsPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
          onClick={onTogglePause}
        >
          {logsPaused ? '恢复' : '暂停'}
        </Button>
        <Button size="small" icon={<DownloadOutlined />} onClick={onExport}>
          导出.log
        </Button>
      </Space>
    </div>
    <div className="monitor-log-list">
      {logs.map((entry) => (
        <article key={entry.id} className="monitor-log-entry">
          <div className="monitor-log-time">
            {new Date(entry.timestamp).toLocaleTimeString('zh-CN')}
          </div>
          <div className="monitor-log-topic">{entry.topic}</div>
          <pre className="monitor-log-payload">{entry.payload}</pre>
        </article>
      ))}
      {logs.length === 0 ? <div className="monitor-log-empty">暂无消息</div> : null}
    </div>
  </aside>
);

export default MonitorLogPanel;
