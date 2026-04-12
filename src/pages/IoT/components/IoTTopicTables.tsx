import { Card } from 'antd';
import LiteTable, { type LiteTableColumn } from '../../../components/Tables/LiteTable';

const topicColumns: LiteTableColumn<(typeof topicRows)[number]>[] = [
  { title: 'Topic', dataIndex: 'topic', key: 'topic', width: 380 },
  { title: '方向', dataIndex: 'direction', key: 'direction', width: 88 },
  { title: 'QoS', dataIndex: 'qos', key: 'qos', width: 80 },
  { title: '说明', dataIndex: 'note', key: 'note' },
];

const topicRows = [
  { key: 'sensorData', topic: 'siz/v1/{siteId}/sensor/{deviceId}/data', direction: '设备→平台', qos: '0/1', note: '传感器实时上报' },
  { key: 'controlCmd', topic: 'siz/v1/{siteId}/control/{deviceId}/cmd', direction: '平台→设备', qos: '1', note: '控制指令下发' },
  { key: 'controlAck', topic: 'siz/v1/{siteId}/control/{deviceId}/ack', direction: '设备→平台', qos: '1', note: '指令执行回执' },
  { key: 'status', topic: 'siz/v1/{siteId}/status', direction: '设备→平台', qos: '0/1', note: '设备心跳与在线状态' },
];

const sensorTypeColumns: LiteTableColumn<(typeof sensorTypeRows)[number]>[] = [
  { title: '枚举值', dataIndex: 'value', key: 'value', width: 180 },
  { title: '中文含义', dataIndex: 'label', key: 'label', width: 180 },
  { title: '建议上报字段', dataIndex: 'field', key: 'field' },
];

const sensorTypeRows = [
  { key: 'soil_moisture', value: 'soil_moisture', label: '土壤水分', field: '建议单位：%' },
  { key: 'soil_potential', value: 'soil_potential', label: '土壤水势', field: '建议单位：kPa' },
  { key: 'weather_station', value: 'weather_station', label: '气象站', field: '建议单位：°C / % / mm' },
  { key: 'sapflow', value: 'sapflow', label: '液流计', field: '建议单位：g/h' },
  { key: 'stem_diameter', value: 'stem_diameter', label: '茎径传感器', field: '建议单位：mm' },
  { key: 'leaf_turgor', value: 'leaf_turgor', label: '叶片膨压', field: '建议单位：MPa' },
  { key: 'flow_meter', value: 'flow_meter', label: '流量计', field: '建议单位：m³/h' },
  { key: 'valve', value: 'valve', label: '电磁阀', field: '建议单位：状态(open/close)' },
  { key: 'pump', value: 'pump', label: '水泵', field: '建议单位：Hz / 状态' },
];

const IoTTopicTables = () => (
  <div className="iot-tab-stack">
    <Card className="iot-section-card" bordered>
      <div className="iot-table-head">
        <div>
          <div className="iot-table-title">Topic 列表</div>
          <div className="iot-table-subtitle">推荐按站点维度组织主题，便于分区、授权和设备联动。</div>
        </div>
      </div>
      <LiteTable
        className="iot-table"
        columns={topicColumns}
        dataSource={topicRows}
        rowKey="key"
        scrollX={720}
      />
    </Card>

    <Card className="iot-section-card" bordered>
      <div className="iot-table-head">
        <div>
          <div className="iot-table-title">传感器 type 枚举</div>
          <div className="iot-table-subtitle">`type` 建议作为统一归类字段，便于平台侧映射指标卡片与规则引擎。</div>
        </div>
      </div>
      <LiteTable
        className="iot-table"
        columns={sensorTypeColumns}
        dataSource={sensorTypeRows}
        rowKey="key"
        scrollX={720}
      />
    </Card>
  </div>
);

export default IoTTopicTables;
