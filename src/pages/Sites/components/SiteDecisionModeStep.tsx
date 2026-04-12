import React from 'react';
import { Alert, Col, Form, InputNumber, Radio, Row, Slider, Tag, Tooltip } from 'antd';
import LiteSelect, { LiteMultiSelect } from '../../../components/Inputs/LiteSelect';
import type { ModeParams, Site } from '../../../types/site';

type DecisionModeId = 1 | 2 | 3 | 4 | 5;

interface SiteDecisionModeStepProps {
  decisionMode: Site['decisionMode'];
  modeParams: ModeParams;
  onModeSelect: (modeId: DecisionModeId) => void;
  onUpdateModeParams: (patch: Partial<ModeParams>) => void;
  onWeightChange: (key: 'sapflow' | 'stem' | 'turgor', value: number) => void;
}

const decisionModes: Array<{ id: DecisionModeId; name: string; desc: string }> = [
  { id: 1, name: '定时灌溉', desc: '按时段和目标水量执行灌溉。' },
  { id: 2, name: 'ET₀计算法 FAO-56', desc: '按参考蒸散量和作物系数计算需水。' },
  { id: 3, name: '土壤含水率阈值', desc: '低于下限开灌，高于上限停灌。' },
  { id: 4, name: '土壤水势阈值', desc: '按水势阈值控制灌溉启停。' },
  { id: 5, name: '植物水分亏缺指标（推荐）', desc: '融合液流、茎径、膨压综合评分。' },
];

const referenceDepthOptions = ['20cm', '40cm', '60cm', '80cm'];

const timeInputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 32,
  borderRadius: 10,
  border: '1px solid var(--border-base)',
  background: 'rgba(255, 255, 255, 0.86)',
  color: 'var(--text-primary)',
  padding: '0 12px',
};

const SiteDecisionModeStep: React.FC<SiteDecisionModeStepProps> = ({
  decisionMode,
  modeParams,
  onModeSelect,
  onUpdateModeParams,
  onWeightChange,
}) => {
  const weights = modeParams.weights ?? { sapflow: 40, stem: 35, turgor: 25 };

  return (
    <>
      <div className="site-mode-grid">
        {decisionModes.map((mode) => (
          <div
            key={mode.id}
            className={`site-mode-card ${decisionMode === mode.id ? 'active' : ''}`}
            onClick={() => onModeSelect(mode.id)}
          >
            <Tag color="#1366ff" className="site-mode-tag">模式 {mode.id}</Tag>
            <div className="site-mode-title">{mode.name}</div>
            <div className="site-mode-desc">{mode.desc}</div>
            {decisionMode === mode.id ? (
              <Tag color="#1366ff" className="site-mode-selected">已选</Tag>
            ) : null}
          </div>
        ))}
      </div>

      {decisionMode ? (
        <div className="site-mode-form">
          {decisionMode === 1 ? (
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item label="开始时间">
                  <input
                    type="time"
                    value={modeParams.startTime ?? ''}
                    style={timeInputStyle}
                    onChange={(event) => onUpdateModeParams({ startTime: event.target.value || undefined })}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="结束时间">
                  <input
                    type="time"
                    value={modeParams.endTime ?? ''}
                    style={timeInputStyle}
                    onChange={(event) => onUpdateModeParams({ endTime: event.target.value || undefined })}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="灌溉水量">
                  <InputNumber
                    style={{ width: '100%' }}
                    value={modeParams.waterAmount}
                    addonAfter="m³/亩"
                    onChange={(value) => onUpdateModeParams({ waterAmount: typeof value === 'number' ? value : undefined })}
                  />
                </Form.Item>
              </Col>
            </Row>
          ) : null}

          {decisionMode === 2 ? (
            <>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label="Kc 值">
                    <InputNumber
                      min={0.1}
                      max={1.5}
                      step={0.01}
                      style={{ width: '100%' }}
                      value={modeParams.kc}
                      onChange={(value) => onUpdateModeParams({ kc: typeof value === 'number' ? value : undefined })}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="ET₀来源">
                    <Radio.Group
                      value={modeParams.et0Source}
                      onChange={(evt) => onUpdateModeParams({ et0Source: evt.target.value as 'auto' | 'manual' })}
                    >
                      <Radio value="auto">自动获取</Radio>
                      <Radio value="manual">手动输入</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="降雨折扣系数">
                    <InputNumber
                      style={{ width: '100%' }}
                      value={modeParams.rainDiscount}
                      onChange={(value) => onUpdateModeParams({ rainDiscount: typeof value === 'number' ? value : undefined })}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Alert type="info" message="ETc - rainDiscount×降雨量 > 0时触发灌溉" showIcon />
            </>
          ) : null}

          {decisionMode === 3 ? (
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item label="下限">
                  <InputNumber
                    style={{ width: '100%' }}
                    value={modeParams.lowerLimit}
                    addonAfter="%"
                    onChange={(value) => onUpdateModeParams({ lowerLimit: typeof value === 'number' ? value : undefined })}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="上限">
                  <InputNumber
                    style={{ width: '100%' }}
                    value={modeParams.upperLimit}
                    addonAfter="%"
                    onChange={(value) => onUpdateModeParams({ upperLimit: typeof value === 'number' ? value : undefined })}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="参考深度">
                  <LiteMultiSelect
                    value={modeParams.referenceDepths ?? []}
                    options={referenceDepthOptions.map((item) => ({ value: item, label: item }))}
                    onChange={(value) => onUpdateModeParams({ referenceDepths: value })}
                    placeholder="选择参考深度"
                  />
                </Form.Item>
              </Col>
            </Row>
          ) : null}

          {decisionMode === 4 ? (
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item label="起始水势">
                  <InputNumber
                    style={{ width: '100%' }}
                    value={modeParams.startPressure}
                    addonAfter="kPa"
                    onChange={(value) => onUpdateModeParams({ startPressure: typeof value === 'number' ? value : undefined })}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="停止水势">
                  <InputNumber
                    style={{ width: '100%' }}
                    value={modeParams.stopPressure}
                    addonAfter="kPa"
                    onChange={(value) => onUpdateModeParams({ stopPressure: typeof value === 'number' ? value : undefined })}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="参考深度">
                  <LiteSelect
                    value={modeParams.referenceDepths ? modeParams.referenceDepths[0] : undefined}
                    options={referenceDepthOptions.map((item) => ({ value: item, label: item }))}
                    onChange={(value) => onUpdateModeParams({ referenceDepths: [value] })}
                  />
                </Form.Item>
              </Col>
            </Row>
          ) : null}

          {decisionMode === 5 ? (
            <>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label="液流下限">
                    <Tooltip title="低于此值触发灌溉">
                      <InputNumber
                        style={{ width: '100%' }}
                        value={modeParams.sapflowMin}
                        addonAfter="g/h"
                        onChange={(value) => onUpdateModeParams({ sapflowMin: typeof value === 'number' ? value : undefined })}
                      />
                    </Tooltip>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="茎径阈值">
                    <Tooltip title="日收缩量超过此值触发">
                      <InputNumber
                        style={{ width: '100%' }}
                        value={modeParams.stemDiameterThreshold}
                        addonAfter="mm"
                        onChange={(value) => onUpdateModeParams({ stemDiameterThreshold: typeof value === 'number' ? value : undefined })}
                      />
                    </Tooltip>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="膨压下限">
                    <InputNumber
                      style={{ width: '100%' }}
                      value={modeParams.turgorMin}
                      addonAfter="MPa"
                      onChange={(value) => onUpdateModeParams({ turgorMin: typeof value === 'number' ? value : undefined })}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12} align="middle" style={{ marginBottom: 8 }}>
                <Col span={6}>液流权重</Col>
                <Col span={14}>
                  <Slider value={weights.sapflow} onChange={(value) => onWeightChange('sapflow', Number(value))} />
                </Col>
                <Col span={4}>{weights.sapflow}%</Col>
              </Row>

              <Row gutter={12} align="middle" style={{ marginBottom: 8 }}>
                <Col span={6}>茎径权重</Col>
                <Col span={14}>
                  <Slider value={weights.stem} onChange={(value) => onWeightChange('stem', Number(value))} />
                </Col>
                <Col span={4}>{weights.stem}%</Col>
              </Row>

              <Row gutter={12} align="middle" style={{ marginBottom: 10 }}>
                <Col span={6}>膨压权重</Col>
                <Col span={14}>
                  <Slider value={weights.turgor} onChange={(value) => onWeightChange('turgor', Number(value))} />
                </Col>
                <Col span={4}>{weights.turgor}%</Col>
              </Row>

              <Alert type="info" showIcon message="加权综合评分 < 60分时触发灌溉" />
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
};

export default SiteDecisionModeStep;
