import { Space, Tag, Typography } from 'antd';
import LiteTable, { type LiteTableColumn } from '../../../components/Tables/LiteTable';
import {
  type AlarmThresholdReferenceRecord,
  type DecisionModeReferenceRecord,
} from '../../../mock/knowledge';

const { Title, Paragraph, Text } = Typography;

const DATA_SOURCE_TEXT = '数据来源：FAO-56 / 植物水分生理学 / PWRlab实验数据';
const DECISION_TABLE_SCROLL_X = 1180;
const ALARM_TABLE_SCROLL_X = 960;

interface KnowledgeDecisionTablesProps {
  decisionData: DecisionModeReferenceRecord[];
  alarmData: AlarmThresholdReferenceRecord[];
}

const KnowledgeDecisionTables = ({
  decisionData,
  alarmData,
}: KnowledgeDecisionTablesProps) => {
  const decisionModeColumns: LiteTableColumn<DecisionModeReferenceRecord>[] = [
    {
      title: '决策模式',
      dataIndex: 'mode',
      key: 'mode',
      width: 150,
      sorter: (a, b) => a.mode.localeCompare(b.mode, 'zh-CN'),
    },
    {
      title: '适用作物',
      dataIndex: 'crops',
      key: 'crops',
      width: 200,
      sorter: (a, b) => a.crops.localeCompare(b.crops, 'zh-CN'),
    },
    {
      title: '所需传感器',
      dataIndex: 'sensors',
      key: 'sensors',
      width: 220,
      sorter: (a, b) => a.sensors.localeCompare(b.sensors, 'zh-CN'),
    },
    {
      title: '优点',
      dataIndex: 'advantages',
      key: 'advantages',
      width: 200,
      sorter: (a, b) => a.advantages.localeCompare(b.advantages, 'zh-CN'),
    },
    {
      title: '局限性',
      dataIndex: 'limitations',
      key: 'limitations',
      width: 200,
      sorter: (a, b) => a.limitations.localeCompare(b.limitations, 'zh-CN'),
    },
    {
      title: '推荐场景',
      dataIndex: 'recommendedScenarios',
      key: 'recommendedScenarios',
      width: 210,
      sorter: (a, b) => a.recommendedScenarios.localeCompare(b.recommendedScenarios, 'zh-CN'),
    },
  ];

  const alarmColumns: LiteTableColumn<AlarmThresholdReferenceRecord>[] = [
    {
      title: '报警类型',
      dataIndex: 'alarmType',
      key: 'alarmType',
      width: 150,
      sorter: (a, b) => a.alarmType.localeCompare(b.alarmType, 'zh-CN'),
    },
    {
      title: '触发条件',
      dataIndex: 'triggerCondition',
      key: 'triggerCondition',
      width: 260,
      sorter: (a, b) => a.triggerCondition.localeCompare(b.triggerCondition, 'zh-CN'),
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 110,
      sorter: (a, b) => a.severity.localeCompare(b.severity, 'zh-CN'),
      render: (value) => (
        <Tag color={value === '高' ? 'red' : value === '中' ? 'orange' : 'blue'}>{String(value ?? '--')}</Tag>
      ),
    },
    {
      title: '建议响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 140,
      sorter: (a, b) => a.responseTime.localeCompare(b.responseTime, 'zh-CN'),
    },
    {
      title: '处理建议',
      dataIndex: 'handlingSuggestion',
      key: 'handlingSuggestion',
      width: 300,
      sorter: (a, b) => a.handlingSuggestion.localeCompare(b.handlingSuggestion, 'zh-CN'),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Title level={5} style={{ marginBottom: 8 }}>各决策模式适用场景对比</Title>
        <LiteTable
          className="knowledge-table"
          rowKey="id"
          columns={decisionModeColumns}
          dataSource={decisionData}
          scrollX={DECISION_TABLE_SCROLL_X}
        />
        <Paragraph style={{ marginTop: 10, marginBottom: 0 }}>
          <Text type="secondary">{DATA_SOURCE_TEXT}</Text>
        </Paragraph>
      </div>

      <div>
        <Title level={5} style={{ marginBottom: 8 }}>常见报警阈值参考</Title>
        <LiteTable
          className="knowledge-table"
          rowKey="id"
          columns={alarmColumns}
          dataSource={alarmData}
          scrollX={ALARM_TABLE_SCROLL_X}
        />
        <Paragraph style={{ marginTop: 10, marginBottom: 0 }}>
          <Text type="secondary">{DATA_SOURCE_TEXT}</Text>
        </Paragraph>
      </div>
    </Space>
  );
};

export default KnowledgeDecisionTables;
