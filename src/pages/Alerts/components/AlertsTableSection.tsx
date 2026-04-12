import { Table, Tag, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckOutlined } from '@ant-design/icons';
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
  const columns: ColumnsType<Alert> = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
    { title: '站点', dataIndex: 'site', key: 'site', width: 180, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (value: string) => <Tag color={typeColor[value] ?? 'default'}>{value}</Tag>,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (value: string) => <Tag color={levelColor[value]}>{levelText[value]}</Tag>,
    },
    { title: '报警内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (value: string) => <Tag color={value === '未处理' ? 'red' : 'green'}>{value}</Tag>,
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
    <Table
      columns={columns}
      dataSource={alerts}
      rowKey="id"
      size="small"
      pagination={{ pageSize: 10 }}
      scroll={{ x: 900 }}
      rowClassName={(record) => (record.level === 'error' ? 'ant-table-row-error' : '')}
    />
  );
};

export default AlertsTableSection;
