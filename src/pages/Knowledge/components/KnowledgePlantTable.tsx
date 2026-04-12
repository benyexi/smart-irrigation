import { Button, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { PlantCategory, PlantKnowledgeRecord } from '../../../mock/knowledge';

const { Paragraph, Text } = Typography;

const DATA_SOURCE_TEXT = '数据来源：FAO-56 / 植物水分生理学 / PWRlab实验数据';
const PLANT_TABLE_SCROLL_X = 1742;

interface KnowledgePlantTableProps {
  dataSource: PlantKnowledgeRecord[];
  onOpenDetail: (record: PlantKnowledgeRecord) => void;
}

const KnowledgePlantTable = ({ dataSource, onOpenDetail }: KnowledgePlantTableProps) => {
  const columns: ColumnsType<PlantKnowledgeRecord> = [
    {
      title: '植物名称',
      dataIndex: 'name',
      key: 'name',
      width: 110,
      sorter: (a, b) => a.name.localeCompare(b.name, 'zh-CN'),
    },
    {
      title: '类型',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      sorter: (a, b) => a.category.localeCompare(b.category, 'zh-CN'),
      render: (value: PlantCategory) => <Tag>{value}</Tag>,
    },
    {
      title: '适宜含水率下限(%)',
      dataIndex: 'moistureMin',
      key: 'moistureMin',
      width: 146,
      sorter: (a, b) => a.moistureMin - b.moistureMin,
    },
    {
      title: '适宜含水率上限(%)',
      dataIndex: 'moistureMax',
      key: 'moistureMax',
      width: 146,
      sorter: (a, b) => a.moistureMax - b.moistureMax,
    },
    {
      title: '灌溉起始水势(kPa)',
      dataIndex: 'irrigationStartPotential',
      key: 'irrigationStartPotential',
      width: 152,
      sorter: (a, b) => a.irrigationStartPotential - b.irrigationStartPotential,
    },
    {
      title: '停灌水势(kPa)',
      dataIndex: 'irrigationStopPotential',
      key: 'irrigationStopPotential',
      width: 128,
      sorter: (a, b) => a.irrigationStopPotential - b.irrigationStopPotential,
    },
    {
      title: '参考Kc值（生长期/成熟期）',
      key: 'kc',
      width: 200,
      sorter: (a, b) => (a.kcGrowth + a.kcMaturity) - (b.kcGrowth + b.kcMaturity),
      render: (_, record) => `${record.kcGrowth.toFixed(2)} / ${record.kcMaturity.toFixed(2)}`,
    },
    {
      title: '液流速率正常范围(g/h)',
      key: 'sapflowRange',
      width: 176,
      sorter: (a, b) => (a.sapflowMax - a.sapflowMin) - (b.sapflowMax - b.sapflowMin),
      render: (_, record) => `${record.sapflowMin} - ${record.sapflowMax}`,
    },
    {
      title: '茎径收缩报警阈值(mm)',
      dataIndex: 'stemShrinkAlert',
      key: 'stemShrinkAlert',
      width: 164,
      sorter: (a, b) => a.stemShrinkAlert - b.stemShrinkAlert,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: '灌溉方式建议',
      dataIndex: 'irrigationSuggestion',
      key: 'irrigationSuggestion',
      width: 190,
      sorter: (a, b) => a.irrigationSuggestion.localeCompare(b.irrigationSuggestion, 'zh-CN'),
      ellipsis: true,
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      width: 150,
      sorter: (a, b) => a.note.localeCompare(b.note, 'zh-CN'),
      ellipsis: true,
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
        scroll={{ x: PLANT_TABLE_SCROLL_X }}
      />
      <Paragraph style={{ marginTop: 10, marginBottom: 0 }}>
        <Text type="secondary">{DATA_SOURCE_TEXT}</Text>
      </Paragraph>
    </>
  );
};

export default KnowledgePlantTable;
