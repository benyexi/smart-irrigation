import { Card, Tag } from 'antd';
import LiteTable, { type LiteTableColumn } from '../../../components/Tables/LiteTable';

interface DecisionLog {
  key: number;
  time: string;
  mode: string;
  input: string;
  result: string;
  volume: number;
  duration: number;
  status: 'irrigate' | 'skip';
}

interface EngineLogTableProps {
  logs: DecisionLog[];
}

const EngineLogTable = ({ logs }: EngineLogTableProps) => {
  const logColumns: LiteTableColumn<DecisionLog>[] = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 100 },
    { title: '决策模式', dataIndex: 'mode', key: 'mode', width: 140 },
    { title: '输入摘要', dataIndex: 'input', key: 'input' },
    {
      title: '结论',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (value, record) => (
        <Tag color={record.status === 'irrigate' ? 'success' : 'default'}>{String(value ?? '--')}</Tag>
      ),
    },
    { title: '灌水量(m³)', dataIndex: 'volume', key: 'volume', width: 110 },
    { title: '时长(min)', dataIndex: 'duration', key: 'duration', width: 90 },
  ];

  return (
    <Card title={`决策日志（${logs.length} 条）`}>
      <LiteTable
        columns={logColumns}
        dataSource={logs}
        rowKey="key"
        pageSize={8}
        emptyText="暂无决策记录"
      />
    </Card>
  );
};

export type { DecisionLog };
export default EngineLogTable;
