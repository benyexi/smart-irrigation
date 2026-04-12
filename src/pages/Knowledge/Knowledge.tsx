import React, { Suspense, lazy, useMemo, useState } from 'react';
import {
  Card,
  Descriptions,
  Drawer,
  Input,
  Skeleton,
  Space,
  Tabs,
  Typography,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import LiteSelect from '../../components/Inputs/LiteSelect';
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

const { Title } = Typography;
const KnowledgePlantTable = lazy(() => import('./components/KnowledgePlantTable'));
const KnowledgeSoilTable = lazy(() => import('./components/KnowledgeSoilTable'));
const KnowledgeDecisionTables = lazy(() => import('./components/KnowledgeDecisionTables'));

type TabKey = 'plants' | 'soils' | 'decision';

type DrawerState =
  | { open: false; type: null; record: null }
  | { open: true; type: 'plant'; record: PlantKnowledgeRecord }
  | { open: true; type: 'soil'; record: SoilKnowledgeRecord };

const includesKeyword = (text: string, keyword: string) => text.toLowerCase().includes(keyword);

const Knowledge: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('plants');
  const [keyword, setKeyword] = useState('');
  const [plantCategory, setPlantCategory] = useState<'all' | PlantCategory>('all');
  const [drawerState, setDrawerState] = useState<DrawerState>({ open: false, type: null, record: null });

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
            <LiteSelect
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
              children: activeTab === 'plants' ? (
                <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} title={false} />}>
                  <KnowledgePlantTable
                    dataSource={filteredPlants}
                    onOpenDetail={(record) => setDrawerState({ open: true, type: 'plant', record })}
                  />
                </Suspense>
              ) : null,
            },
            {
              key: 'soils',
              label: '土壤物理性质',
              children: activeTab === 'soils' ? (
                <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} title={false} />}>
                  <KnowledgeSoilTable
                    dataSource={filteredSoils}
                    onOpenDetail={(record) => setDrawerState({ open: true, type: 'soil', record })}
                  />
                </Suspense>
              ) : null,
            },
            {
              key: 'decision',
              label: '决策参考',
              children: activeTab === 'decision' ? (
                <Suspense fallback={<Skeleton active paragraph={{ rows: 10 }} title={false} />}>
                  <KnowledgeDecisionTables
                    decisionData={filteredDecisionModes}
                    alarmData={filteredAlarmThresholds}
                  />
                </Suspense>
              ) : null,
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
