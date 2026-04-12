import { Card, Select, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type {
  CommandEntry,
  CommandStatus,
  SelectedHistoryStatus,
} from '../../../stores/monitorStore';

const { Title, Text } = Typography;

const commandColumns: ColumnsType<CommandEntry> = [
  {
    title: '时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 170,
    render: (timestamp: number) => new Date(timestamp).toLocaleString('zh-CN'),
  },
  {
    title: '设备',
    dataIndex: 'deviceId',
    key: 'deviceId',
    width: 120,
  },
  {
    title: '指令',
    dataIndex: 'command',
    key: 'command',
    width: 160,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 110,
    render: (status: CommandStatus) => {
      const color =
        status === 'ack'
          ? 'green'
          : status === 'pending'
            ? 'blue'
            : status === 'timeout'
              ? 'orange'
              : 'red';
      const label =
        status === 'ack'
          ? '已确认'
          : status === 'pending'
            ? '发送中'
            : status === 'timeout'
              ? '超时'
              : '失败';
      return <Tag color={color}>{label}</Tag>;
    },
  },
  {
    title: '响应耗时',
    dataIndex: 'latencyMs',
    key: 'latencyMs',
    width: 120,
    render: (latencyMs?: number) => (latencyMs ? `${latencyMs} ms` : '--'),
  },
];

interface MonitorCommandHistorySectionProps {
  filteredCommandHistory: CommandEntry[];
  selectedHistoryStatus: SelectedHistoryStatus;
  onStatusChange: (value: SelectedHistoryStatus) => void;
}

const MonitorCommandHistorySection = ({
  filteredCommandHistory,
  selectedHistoryStatus,
  onStatusChange,
}: MonitorCommandHistorySectionProps) => (
  <section>
    <div className="monitor-section-head">
      <div>
        <Title level={4}>指令历史</Title>
        <Text>最近 50 条控制结果，支持按状态筛选。</Text>
      </div>
      <Select
        value={selectedHistoryStatus}
        style={{ width: 140 }}
        options={[
          { value: 'all', label: '全部状态' },
          { value: 'pending', label: '发送中' },
          { value: 'ack', label: '已确认' },
          { value: 'timeout', label: '超时' },
          { value: 'failed', label: '失败' },
        ]}
        onChange={(value) => onStatusChange(value as SelectedHistoryStatus)}
      />
    </div>
    <Card bordered={false} className="monitor-history-card">
      <Table
        size="small"
        rowKey="id"
        columns={commandColumns}
        dataSource={filteredCommandHistory}
        pagination={{ pageSize: 6, hideOnSinglePage: true }}
      />
    </Card>
  </section>
);

export default MonitorCommandHistorySection;
