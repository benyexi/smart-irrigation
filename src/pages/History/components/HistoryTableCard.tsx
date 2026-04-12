import { Card, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type HistoryTableRow = Record<string, string | number>;

interface HistoryTableCardProps {
  columns: ColumnsType<HistoryTableRow>;
  dataSource: HistoryTableRow[];
}

const HistoryTableCard = ({ columns, dataSource }: HistoryTableCardProps) => (
  <Card>
    <Table
      columns={columns}
      dataSource={dataSource}
      size="small"
      pagination={{ pageSize: 20 }}
      scroll={{ x: 800 }}
    />
  </Card>
);

export default HistoryTableCard;
