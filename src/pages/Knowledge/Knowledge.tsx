// Knowledge base page — plant info table + soil properties table
import React from 'react';
import { Card, Table, Tabs, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { mockPlants, mockSoils, type PlantInfo, type SoilInfo } from '../../mock';

const { Title } = Typography;

const plantColumns: ColumnsType<PlantInfo> = [
  { title: '植物名称', dataIndex: 'name', key: 'name', width: 100, fixed: 'left' },
  { title: '适宜含水率下限 (%)', dataIndex: 'moistureMin', key: 'moistureMin', width: 160 },
  { title: '适宜含水率上限 (%)', dataIndex: 'moistureMax', key: 'moistureMax', width: 160 },
  {
    title: '灌溉起始水势 (kPa)',
    dataIndex: 'irrigationPotential',
    key: 'irrigationPotential',
    width: 160,
    render: (v: number) => v,
  },
  { title: '参考 Kc 值', dataIndex: 'kcReference', key: 'kcReference', width: 110 },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
];

const soilColumns: ColumnsType<SoilInfo> = [
  { title: '土壤类型', dataIndex: 'type', key: 'type', width: 100, fixed: 'left' },
  { title: '田间持水量 (%)', dataIndex: 'fieldCapacity', key: 'fieldCapacity', width: 140 },
  { title: '萎蔫含水率 (%)', dataIndex: 'wiltingPoint', key: 'wiltingPoint', width: 140 },
  { title: '饱和含水率 (%)', dataIndex: 'saturation', key: 'saturation', width: 140 },
  { title: '容重 (g/cm³)', dataIndex: 'bulkDensity', key: 'bulkDensity', width: 130 },
];

const Knowledge: React.FC = () => (
  <div className="page-container">
    <Title level={4} style={{ marginBottom: 16 }}>知识库</Title>
    <Card style={{ borderRadius: 8 }}>
      <Tabs
        items={[
          {
            key: 'plants',
            label: '🌿 植物信息表',
            children: (
              <Table
                columns={plantColumns}
                dataSource={mockPlants}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 800 }}
              />
            ),
          },
          {
            key: 'soils',
            label: '🪨 土壤物理性质表',
            children: (
              <Table
                columns={soilColumns}
                dataSource={mockSoils}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 700 }}
              />
            ),
          },
        ]}
      />
    </Card>
  </div>
);

export default Knowledge;
