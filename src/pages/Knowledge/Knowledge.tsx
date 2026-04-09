import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Grid,
  Input,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import {
  alarmThresholdReferenceTable,
  decisionModeComparisonTable,
  plantKnowledgeRecords,
  type PlantCategory,
  type PlantKnowledgeRecord,
  soilKnowledgeRecords,
  type SoilKnowledgeRecord,
} from '../../mock/knowledge';
import './Knowledge.css';

const { Title, Text, Paragraph } = Typography;

type TabKey = 'plants' | 'soils' | 'decision';

type DrawerState =
  | { open: false; type: null; record: null }
  | { open: true; type: 'plant'; record: PlantKnowledgeRecord }
  | { open: true; type: 'soil'; record: SoilKnowledgeRecord };

const DATA_SOURCE_TEXT = '数据来源：FAO-56 / 植物水分生理学 / PWRlab实验数据';
const PLANT_TABLE_SCROLL_X = 1742;
const SOIL_TABLE_SCROLL_X = 1010;
const DECISION_TABLE_SCROLL_X = 1180;
const ALARM_TABLE_SCROLL_X = 960;

const includesKeyword = (text: string, keyword: string) => text.toLowerCase().includes(keyword);

const Knowledge: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const [activeTab, setActiveTab] = useState<TabKey>('plants');
  const [keyword, setKeyword] = useState('');
  const [plantCategory, setPlantCategory] = useState<'all' | PlantCategory>('all');
  const [drawerState, setDrawerState] = useState<DrawerState>({ open: false, type: null, record: null });
  const useFixedKnowledgeColumns = Boolean(screens.lg);

  const normalizedKeyword = keyword.trim().toLowerCase();

  const filteredPlants = useMemo(() => (
    plantKnowledgeRecords.filter((item) => {
      if (plantCategory !== 'all' && item.category !== plantCategory) {
        return false;
      }
      if (!normalizedKeyword) {
        return true;
      }

      return includesKeyword(
        [
          item.name,
          item.category,
          item.irrigationSuggestion,
          item.note,
          item.detail,
          item.moistureMin,
          item.moistureMax,
          item.irrigationStartPotential,
          item.irrigationStopPotential,
          item.kcGrowth,
          item.kcMaturity,
          item.sapflowMin,
          item.sapflowMax,
          item.stemShrinkAlert,
        ].join(' '),
        normalizedKeyword,
      );
    })
  ), [normalizedKeyword, plantCategory]);

  const filteredSoils = useMemo(() => (
    soilKnowledgeRecords.filter((item) => {
      if (!normalizedKeyword) {
        return true;
      }

      return includesKeyword(
        [
          item.soilType,
          item.fieldCapacity,
          item.wiltingPoint,
          item.saturation,
          item.bulkDensity,
          item.saturatedHydraulicConductivity,
          item.availableWaterCapacity,
          item.detail,
        ].join(' '),
        normalizedKeyword,
      );
    })
  ), [normalizedKeyword]);

  const filteredDecisionModes = useMemo(() => (
    decisionModeComparisonTable.filter((item) => {
      if (!normalizedKeyword) {
        return true;
      }
      return includesKeyword(
        [item.mode, item.crops, item.sensors, item.advantages, item.limitations, item.recommendedScenarios].join(' '),
        normalizedKeyword,
      );
    })
  ), [normalizedKeyword]);

  const filteredAlarmThresholds = useMemo(() => (
    alarmThresholdReferenceTable.filter((item) => {
      if (!normalizedKeyword) {
        return true;
      }
      return includesKeyword(
        [item.alarmType, item.triggerCondition, item.severity, item.responseTime, item.handlingSuggestion].join(' '),
        normalizedKeyword,
      );
    })
  ), [normalizedKeyword]);

  const plantColumns: ColumnsType<PlantKnowledgeRecord> = [
    {
      title: '植物名称',
      dataIndex: 'name',
      key: 'name',
      width: 110,
      fixed: useFixedKnowledgeColumns ? 'left' : undefined,
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
      fixed: useFixedKnowledgeColumns ? 'right' : undefined,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => setDrawerState({ open: true, type: 'plant', record })}>
          详情
        </Button>
      ),
    },
  ];

  const soilColumns: ColumnsType<SoilKnowledgeRecord> = [
    {
      title: '土壤类型',
      dataIndex: 'soilType',
      key: 'soilType',
      width: 120,
      fixed: useFixedKnowledgeColumns ? 'left' : undefined,
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
      fixed: useFixedKnowledgeColumns ? 'right' : undefined,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => setDrawerState({ open: true, type: 'soil', record })}>
          详情
        </Button>
      ),
    },
  ];

  const decisionModeColumns: ColumnsType<(typeof decisionModeComparisonTable)[number]> = [
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

  const alarmColumns: ColumnsType<(typeof alarmThresholdReferenceTable)[number]> = [
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
      render: (value: string) => (
        <Tag color={value === '高' ? 'red' : value === '中' ? 'orange' : 'blue'}>{value}</Tag>
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

  const drawerTitle = drawerState.open
    ? drawerState.type === 'plant'
      ? `${drawerState.record.name} · 详细说明`
      : `${drawerState.record.soilType} · 详细说明`
    : '';

  return (
    <div className="page-container knowledge-page">
      <Title level={4} style={{ marginBottom: 16 }}>知识库</Title>

      <Card style={{ borderRadius: 12 }}>
        <Space wrap className="knowledge-toolbar" style={{ width: '100%', marginBottom: 14, justifyContent: 'space-between' }}>
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索植物、土壤、决策模式或报警阈值"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 360, maxWidth: '100%' }}
          />
          {activeTab === 'plants' ? (
            <Select
              value={plantCategory}
              style={{ width: 180 }}
              onChange={(value) => setPlantCategory(value as 'all' | PlantCategory)}
              options={[
                { value: 'all', label: '全部类型' },
                { value: '林木', label: '林木' },
                { value: '果树', label: '果树' },
                { value: '农作物', label: '农作物' },
              ]}
            />
          ) : null}
        </Space>

        <Tabs
          activeKey={activeTab}
          onChange={(value) => setActiveTab(value as TabKey)}
          items={[
            {
              key: 'plants',
              label: '植物信息',
              children: (
                <>
                  <Table
                    className="knowledge-table"
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    columns={plantColumns}
                    dataSource={filteredPlants}
                    scroll={{ x: PLANT_TABLE_SCROLL_X }}
                  />
                  <Paragraph style={{ marginTop: 10, marginBottom: 0 }}>
                    <Text type="secondary">{DATA_SOURCE_TEXT}</Text>
                  </Paragraph>
                </>
              ),
            },
            {
              key: 'soils',
              label: '土壤物理性质',
              children: (
                <>
                  <Table
                    className="knowledge-table"
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    columns={soilColumns}
                    dataSource={filteredSoils}
                    scroll={{ x: SOIL_TABLE_SCROLL_X }}
                  />
                  <Paragraph style={{ marginTop: 10, marginBottom: 0 }}>
                    <Text type="secondary">{DATA_SOURCE_TEXT}</Text>
                  </Paragraph>
                </>
              ),
            },
            {
              key: 'decision',
              label: '决策参考',
              children: (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <div>
                    <Title level={5} style={{ marginBottom: 8 }}>各决策模式适用场景对比</Title>
                    <Table
                      className="knowledge-table"
                      rowKey="id"
                      size="small"
                      pagination={false}
                      columns={decisionModeColumns}
                      dataSource={filteredDecisionModes}
                      scroll={{ x: DECISION_TABLE_SCROLL_X }}
                    />
                    <Paragraph style={{ marginTop: 10, marginBottom: 0 }}>
                      <Text type="secondary">{DATA_SOURCE_TEXT}</Text>
                    </Paragraph>
                  </div>

                  <div>
                    <Title level={5} style={{ marginBottom: 8 }}>常见报警阈值参考</Title>
                    <Table
                      className="knowledge-table"
                      rowKey="id"
                      size="small"
                      pagination={false}
                      columns={alarmColumns}
                      dataSource={filteredAlarmThresholds}
                      scroll={{ x: ALARM_TABLE_SCROLL_X }}
                    />
                    <Paragraph style={{ marginTop: 10, marginBottom: 0 }}>
                      <Text type="secondary">{DATA_SOURCE_TEXT}</Text>
                    </Paragraph>
                  </div>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        open={drawerState.open}
        onClose={() => setDrawerState({ open: false, type: null, record: null })}
        width={520}
        title={drawerTitle}
      >
        {drawerState.open && drawerState.type === 'plant' ? (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="植物名称">{drawerState.record.name}</Descriptions.Item>
            <Descriptions.Item label="类型">{drawerState.record.category}</Descriptions.Item>
            <Descriptions.Item label="含水率范围">{drawerState.record.moistureMin}% - {drawerState.record.moistureMax}%</Descriptions.Item>
            <Descriptions.Item label="灌溉起始水势">{drawerState.record.irrigationStartPotential} kPa</Descriptions.Item>
            <Descriptions.Item label="停灌水势">{drawerState.record.irrigationStopPotential} kPa</Descriptions.Item>
            <Descriptions.Item label="Kc（生长期/成熟期）">{drawerState.record.kcGrowth.toFixed(2)} / {drawerState.record.kcMaturity.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="液流速率正常范围">{drawerState.record.sapflowMin} - {drawerState.record.sapflowMax} g/h</Descriptions.Item>
            <Descriptions.Item label="茎径收缩报警阈值">{drawerState.record.stemShrinkAlert.toFixed(2)} mm</Descriptions.Item>
            <Descriptions.Item label="灌溉方式建议">{drawerState.record.irrigationSuggestion}</Descriptions.Item>
            <Descriptions.Item label="备注">{drawerState.record.note}</Descriptions.Item>
            <Descriptions.Item label="详细说明">{drawerState.record.detail}</Descriptions.Item>
          </Descriptions>
        ) : null}

        {drawerState.open && drawerState.type === 'soil' ? (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="土壤类型">{drawerState.record.soilType}</Descriptions.Item>
            <Descriptions.Item label="田间持水量">{drawerState.record.fieldCapacity}%</Descriptions.Item>
            <Descriptions.Item label="萎蔫含水率">{drawerState.record.wiltingPoint}%</Descriptions.Item>
            <Descriptions.Item label="饱和含水率">{drawerState.record.saturation}%</Descriptions.Item>
            <Descriptions.Item label="容重">{drawerState.record.bulkDensity.toFixed(2)} g/cm³</Descriptions.Item>
            <Descriptions.Item label="饱和导水率">{drawerState.record.saturatedHydraulicConductivity} mm/h</Descriptions.Item>
            <Descriptions.Item label="有效持水量">{drawerState.record.availableWaterCapacity} mm/m</Descriptions.Item>
            <Descriptions.Item label="详细说明">{drawerState.record.detail}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
};

export default Knowledge;
