import React from 'react';
import { Card, Col, Form, Input, InputNumber, Radio, Row, Select } from 'antd';
import type { Site } from '../../../types/site';

export interface SiteBasicInfoStepValue {
  siteName: string;
  province: string;
  city: string;
  lat: number | undefined;
  lng: number | undefined;
  plantType: string;
  soilType: string;
  climateZone: string;
  area: number | undefined;
  irrigationType: Site['irrigationType'];
}

interface PlantRecommendation {
  moistureRange: [number, number];
  startPotential: number;
  kc: number;
}

interface SiteBasicInfoStepProps {
  value: SiteBasicInfoStepValue;
  provinces: string[];
  plantOptions: string[];
  soilOptions: string[];
  climateOptions: string[];
  recommendation?: PlantRecommendation | null;
  onChange: (patch: Partial<SiteBasicInfoStepValue>) => void;
  onPlantTypeChange: (plantType: string) => void;
}

const SiteBasicInfoStep: React.FC<SiteBasicInfoStepProps> = ({
  value,
  provinces,
  plantOptions,
  soilOptions,
  climateOptions,
  recommendation,
  onChange,
  onPlantTypeChange,
}) => (
  <Form layout="horizontal" labelCol={{ span: 8 }}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="站点名称" required>
          <Input
            value={value.siteName}
            placeholder="如：陕西苹果示范园"
            onChange={(evt) => onChange({ siteName: evt.target.value })}
          />
        </Form.Item>
        <Form.Item label="省份">
          <Select
            value={value.province}
            options={provinces.map((item) => ({ value: item, label: item }))}
            onChange={(nextValue) => onChange({ province: nextValue })}
            showSearch
          />
        </Form.Item>
        <Form.Item label="城市">
          <Input
            value={value.city}
            onChange={(evt) => onChange({ city: evt.target.value })}
          />
        </Form.Item>
        <Form.Item label="纬度">
          <InputNumber
            value={value.lat}
            precision={4}
            style={{ width: '100%' }}
            placeholder="如：36.5900"
            onChange={(nextValue) => onChange({ lat: typeof nextValue === 'number' ? nextValue : undefined })}
          />
        </Form.Item>
        <Form.Item label="经度">
          <InputNumber
            value={value.lng}
            precision={4}
            style={{ width: '100%' }}
            placeholder="如：109.4900"
            onChange={(nextValue) => onChange({ lng: typeof nextValue === 'number' ? nextValue : undefined })}
          />
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item label="植物类型">
          <Select
            value={value.plantType}
            options={plantOptions.map((item) => ({ value: item, label: item }))}
            onChange={onPlantTypeChange}
          />
        </Form.Item>
        <Form.Item label="土壤类型">
          <Select
            value={value.soilType}
            options={soilOptions.map((item) => ({ value: item, label: item }))}
            onChange={(nextValue) => onChange({ soilType: nextValue })}
          />
        </Form.Item>
        <Form.Item label="气候分区">
          <Select
            value={value.climateZone}
            options={climateOptions.map((item) => ({ value: item, label: item }))}
            onChange={(nextValue) => onChange({ climateZone: nextValue })}
          />
        </Form.Item>
        <Form.Item label="面积">
          <InputNumber
            min={0.1}
            value={value.area}
            style={{ width: '100%' }}
            addonAfter="亩"
            onChange={(nextValue) => onChange({ area: typeof nextValue === 'number' ? nextValue : undefined })}
          />
        </Form.Item>
        <Form.Item label="灌溉方式">
          <Radio.Group
            value={value.irrigationType}
            onChange={(evt) => onChange({ irrigationType: evt.target.value as Site['irrigationType'] })}
          >
            <Radio value="drip">滴灌</Radio>
            <Radio value="spray">喷灌</Radio>
            <Radio value="flood">漫灌</Radio>
          </Radio.Group>
        </Form.Item>

        {recommendation ? (
          <Card className="site-plant-recommend" bordered={false}>
            <h4>推荐参数</h4>
            <p>适宜含水率范围：{recommendation.moistureRange[0]}% - {recommendation.moistureRange[1]}%</p>
            <p>灌溉起始水势：{recommendation.startPotential} kPa</p>
            <p>参考 Kc 值：{recommendation.kc}</p>
          </Card>
        ) : null}
      </Col>
    </Row>
  </Form>
);

export default SiteBasicInfoStep;
