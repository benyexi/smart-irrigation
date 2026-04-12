import { Card } from 'antd';
import LiteTable, { type LiteTableColumn } from '../../../components/Tables/LiteTable';

type HistoryTableRow = Record<string, string | number>;

interface HistoryTableCardProps {
  columns: LiteTableColumn<HistoryTableRow>[];
  dataSource: HistoryTableRow[];
}

const HistoryTableCard = ({ columns, dataSource }: HistoryTableCardProps) => (
  <Card>
    <LiteTable
      columns={columns}
      dataSource={dataSource}
      rowKey="key"
      pageSize={20}
      scrollX={800}
    />
  </Card>
);

export default HistoryTableCard;
