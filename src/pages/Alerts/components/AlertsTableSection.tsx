import { Tag, Button } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import LiteTable, { type LiteTableColumn } from '../../../components/Tables/LiteTable';
import type { Alert } from '../../../mock';

const levelColor: Record<string, string> = {
  error: 'red',
  warning: 'orange',
  info: 'blue',
};

const levelText: Record<string, string> = {
  error: '严重',
  warning: '警告',
  info: '提示',
};

const typeColor: Record<string, string> = {
  土壤水分: 'green',
  植物水分: 'lime',
  土壤水势: 'cyan',
  传感器: 'blue',
  设备: 'orange',
};

interface AlertsTableSectionProps {
  alerts: Alert[];
  onMarkHandled: (id: string) => void;
}

const AlertsTableSection = ({ alerts, onMarkHandled }: AlertsTableSectionProps) => {
  const columns: LiteTableColumn<Alert>[] = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
    { title: '站点', dataIndex: 'site', key: 'site', width: 180, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (value) => {
        const text = String(value ?? '--');
        return <Tag color={typeColor[text] ?? 'default'}>{text}</Tag>;
      },
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (value) => {
        const text = String(value ?? '');
        return <Tag color={levelColor[text]}>{levelText[text]}</Tag>;
      },
    },
    { title: '报警内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (value) => {
        const text = String(value ?? '--');
        return <Tag color={text === '未处理' ? 'red' : 'green'}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) =>
        record.status === '未处理' ? (
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => onMarkHandled(record.id)}
          >
            标记处理
          </Button>
        ) : (
          <Tag color="green">已完成</Tag>
        ),
    },
  ];

  return (
    <LiteTable
      columns={columns}
      dataSource={alerts}
      rowKey="id"
      pageSize={10}
      scrollX={900}
    />
  );
};

export default AlertsTableSection;
