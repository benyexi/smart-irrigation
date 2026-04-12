import { Button, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SoilKnowledgeRecord } from '../../../mock/knowledge';

const { Paragraph, Text } = Typography;

const DATA_SOURCE_TEXT = '数据来源：FAO-56 / 植物水分生理学 / PWRlab实验数据';
const SOIL_TABLE_SCROLL_X = 1010;

interface KnowledgeSoilTableProps {
  dataSource: SoilKnowledgeRecord[];
  onOpenDetail: (record: SoilKnowledgeRecord) => void;
}

const KnowledgeSoilTable = ({ dataSource, onOpenDetail }: KnowledgeSoilTableProps) => {
  const columns: ColumnsType<SoilKnowledgeRecord> = [
    {
      title: '土壤类型',
      dataIndex: 'soilType',
      key: 'soilType',
      width: 120,
      sorter: (a, b) => a.soilType.localeCompare(b.soilType, 'zh-CN'),
    },
    {
      title: '田间持水量(%)',
      dataIndex: 'fieldCapacity',
      key: 'fieldCapacity',
      width: 130,
      sorter: (a, b) => a.fieldCapacity - b.fieldCapacity,
    },
    {
      title: '萎蔫含水率(%)',
      dataIndex: 'wiltingPoint',
      key: 'wiltingPoint',
      width: 130,
      sorter: (a, b) => a.wiltingPoint - b.wiltingPoint,
    },
    {
      title: '饱和含水率(%)',
      dataIndex: 'saturation',
      key: 'saturation',
      width: 130,
      sorter: (a, b) => a.saturation - b.saturation,
    },
    {
      title: '容重(g/cm³)',
      dataIndex: 'bulkDensity',
      key: 'bulkDensity',
      width: 120,
      sorter: (a, b) => a.bulkDensity - b.bulkDensity,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: '饱和导水率(mm/h)',
      dataIndex: 'saturatedHydraulicConductivity',
      key: 'saturatedHydraulicConductivity',
      width: 150,
      sorter: (a, b) => a.saturatedHydraulicConductivity - b.saturatedHydraulicConductivity,
    },
    {
      title: '有效持水量(mm/m)',
      dataIndex: 'availableWaterCapacity',
      key: 'availableWaterCapacity',
      width: 150,
      sorter: (a, b) => a.availableWaterCapacity - b.availableWaterCapacity,
    },
    {
      title: '详情',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => onOpenDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <>
      <Table
        className="knowledge-table"
        rowKey="id"
        size="small"
        tableLayout="fixed"
        pagination={{ pageSize: 8, showSizeChanger: false }}
        columns={columns}
        dataSource={dataSource}
        scroll={{ x: SOIL_TABLE_SCROLL_X }}
      />
      <Paragraph style={{ marginTop: 10, marginBottom: 0 }}>
        <Text type="secondary">{DATA_SOURCE_TEXT}</Text>
      </Paragraph>
    </>
  );
};

export default KnowledgeSoilTable;
