import React from 'react';
import {
  AlertOutlined,
  ApiOutlined,
  AreaChartOutlined,
  AppstoreOutlined,
  DeploymentUnitOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  RadarChartOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Row, Select, Space, Typography, message } from 'antd';
import './Landing.css';

const { Title, Paragraph, Text } = Typography;

const modeCards = [
  { icon: <DeploymentUnitOutlined />, name: '模式1 定时灌溉', desc: '按固定时段执行，适合规则化地块。' },
  { icon: <AreaChartOutlined />, name: '模式2 ET₀计算法', desc: '基于蒸散与作物系数动态估算需水。' },
  { icon: <ExperimentOutlined />, name: '模式3 含水率阈值', desc: '低于下限触发灌溉，直观易运维。' },
  { icon: <RadarChartOutlined />, name: '模式4 水势阈值', desc: '更接近植物可利用水状态。' },
  { icon: <ApiOutlined />, name: '模式5 植物亏缺指标', desc: '液流+茎径+膨压综合评分，最精准。' },
];

const featureCards = [
  {
    icon: <RadarChartOutlined />,
    title: '实时监控',
    desc1: '统一查看传感器、阀门和水泵状态。',
    desc2: '支持 MQTT 实时数据与控制回执闭环。',
  },
  {
    icon: <AppstoreOutlined />,
    title: '站点管理',
    desc1: '集中管理站点、作物、设备和告警策略。',
    desc2: '田块编辑器支持拖拽布点与管路绘制。',
  },
  {
    icon: <DeploymentUnitOutlined />,
    title: '决策引擎',
    desc1: '内置 5 种决策模式覆盖不同场景。',
    desc2: '支持植物水分生理指标驱动精准灌溉。',
  },
  {
    icon: <HistoryOutlined />,
    title: '历史数据',
    desc1: '多指标趋势回放与表格化追溯。',
    desc2: '支持导出 CSV 与报告。',
  },
  {
    icon: <AlertOutlined />,
    title: '报警系统',
    desc1: '覆盖设备异常与数据异常双通道。',
    desc2: '支持分级响应与处理闭环记录。',
  },
  {
    icon: <ApiOutlined />,
    title: 'IoT接入',
    desc1: '提供标准 Topic 与多语言接入示例。',
    desc2: '快速对接硬件与第三方系统。',
  },
];

const scenarioCards = [
  {
    icon: '🍎',
    title: '高端果园',
    crops: '苹果 / 梨 / 桃 / 葡萄 / 柑橘 / 枣',
    value: '提升品质稳定性与节水效率，降低人工经验误差。',
  },
  {
    icon: '🌲',
    title: '人工林场',
    crops: '毛白杨 / 欧美杨 / 小叶杨 / 胡杨等',
    value: '基于树体生理指标制定分区灌溉策略，提高成活率。',
  },
  {
    icon: '🌽',
    title: '经济作物农场',
    crops: '玉米 / 小麦 / 棉花 / 大豆 / 马铃薯',
    value: '在关键生育期精准供水，兼顾产量和用水成本。',
  },
];

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const Landing: React.FC = () => {
  const [form] = Form.useForm();

  const onSubmit = (values: {
    name: string;
    organization: string;
    phone: string;
    cropType: string;
  }) => {
    console.log('landing-demo-request', values);
    message.success('提交成功，我们会尽快联系您安排演示。');
    form.resetFields();
  };

  return (
    <div className="landing-page page-container">
      <section className="landing-hero" id="hero">
        <div className="landing-hero-copy">
          <Title className="landing-hero-title">智灌云 · 让植物告诉你何时灌水</Title>
          <Paragraph className="landing-hero-subtitle">
            基于植物水分生理指标的新一代智能灌溉决策平台
          </Paragraph>
          <Space size={12} wrap>
            <Button type="primary" size="large" onClick={() => scrollTo('contact')}>申请演示</Button>
            <Button size="large" onClick={() => scrollTo('features')}>查看功能</Button>
          </Space>
        </div>

        <div className="landing-hero-visual" aria-hidden="true">
          <svg viewBox="0 0 560 360">
            <rect x="12" y="12" width="536" height="336" rx="24" fill="var(--bg-card)" stroke="var(--border-base)" />
            <rect x="36" y="36" width="488" height="70" rx="14" fill="rgba(19, 102, 255, 0.09)" stroke="var(--border-base)" />
            <rect x="54" y="54" width="140" height="12" rx="6" fill="rgba(17, 24, 39, 0.2)" />
            <rect x="54" y="74" width="210" height="10" rx="5" fill="rgba(17, 24, 39, 0.12)" />
            <circle cx="486" cy="71" r="8" fill="#0f9d80" />

            <rect x="36" y="122" width="230" height="196" rx="14" fill="var(--bg-card-solid)" stroke="var(--border-base)" />
            <rect x="284" y="122" width="240" height="196" rx="14" fill="var(--bg-card-solid)" stroke="var(--border-base)" />

            <path d="M56 286 L90 250 L126 260 L160 222 L196 230 L232 184" fill="none" stroke="#1366ff" strokeWidth="3" strokeLinecap="round" />
            <path d="M56 298 L92 280 L128 288 L162 268 L198 276 L232 242" fill="none" stroke="#0f9d80" strokeWidth="2.4" strokeLinecap="round" />

            <circle cx="392" cy="214" r="64" fill="rgba(19, 102, 255, 0.08)" stroke="rgba(19, 102, 255, 0.2)" />
            <path d="M392 166 A48 48 0 1 1 352 245" fill="none" stroke="#1366ff" strokeWidth="12" strokeLinecap="round" />
            <path d="M392 166 A48 48 0 0 1 434 189" fill="none" stroke="#ff6b35" strokeWidth="12" strokeLinecap="round" />
            <text x="392" y="224" textAnchor="middle" fill="var(--text-primary)" fontSize="26" fontWeight="700">72</text>
            <text x="392" y="246" textAnchor="middle" fill="var(--text-muted)" fontSize="11">Decision Score</text>
          </svg>
        </div>
      </section>

      <section className="landing-section" id="pain">
        <Title level={2}>传统灌溉的问题</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card className="landing-card" bordered>
              <div className="landing-card-title">土壤干了才知道</div>
              <div className="landing-card-desc">土壤传感器只反映根区水分，不代表植物真实需水状态。</div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="landing-card" bordered>
              <div className="landing-card-title">凭经验靠天气</div>
              <div className="landing-card-desc">人工判断误差大，浪费水资源或造成水分亏缺减产。</div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="landing-card" bordered>
              <div className="landing-card-title">设备数据孤岛</div>
              <div className="landing-card-desc">多品牌传感器数据无法统一管理和分析。</div>
            </Card>
          </Col>
        </Row>
      </section>

      <section className="landing-section" id="solution">
        <Title level={2}>智灌云的做法</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card className="landing-compare-card" bordered>
              <Text className="landing-compare-title">竞品</Text>
              <div className="landing-flow">土壤含水率 → 阈值判断 → 开灌</div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className="landing-compare-card landing-compare-card-active" bordered>
              <Text className="landing-compare-title">智灌云</Text>
              <div className="landing-flow">液流速率 + 茎径变化 + 叶片膨压 + 土壤水势 → 综合评分 → 精准决策</div>
            </Card>
          </Col>
        </Row>

        <div className="landing-mode-row">
          {modeCards.map((mode) => (
            <Card key={mode.name} className="landing-mode-card" bordered>
              <div className="landing-mode-icon">{mode.icon}</div>
              <div className="landing-mode-name">{mode.name}</div>
              <div className="landing-mode-desc">{mode.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="landing-section" id="features">
        <Title level={2}>平台功能</Title>
        <Row gutter={[16, 16]}>
          {featureCards.map((item) => (
            <Col xs={24} md={12} lg={8} key={item.title}>
              <Card className="landing-card" bordered>
                <div className="landing-feature-head">
                  <span className="landing-feature-icon">{item.icon}</span>
                  <span className="landing-card-title">{item.title}</span>
                </div>
                <div className="landing-card-desc">{item.desc1}</div>
                <div className="landing-card-desc">{item.desc2}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="landing-section" id="scenarios">
        <Title level={2}>适用于</Title>
        <Row gutter={[16, 16]}>
          {scenarioCards.map((item) => (
            <Col xs={24} md={8} key={item.title}>
              <Card className="landing-card" bordered>
                <div className="landing-scene-icon">{item.icon}</div>
                <div className="landing-card-title">{item.title}</div>
                <div className="landing-scene-crops">{item.crops}</div>
                <div className="landing-card-desc">{item.value}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="landing-section" id="contact">
        <Title level={2}>申请产品演示</Title>
        <Card className="landing-contact-card" bordered>
          <Form form={form} layout="vertical" onFinish={onSubmit}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}> 
                  <Input placeholder="请输入姓名" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="单位" name="organization" rules={[{ required: true, message: '请输入单位' }]}> 
                  <Input placeholder="请输入单位" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="手机"
                  name="phone"
                  rules={[
                    { required: true, message: '请输入手机号' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的中国大陆手机号' },
                  ]}
                >
                  <Input placeholder="请输入手机号" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="种植类型" name="cropType" rules={[{ required: true, message: '请选择种植类型' }]}> 
                  <Select
                    options={[
                      { value: 'forest', label: '林木' },
                      { value: 'orchard', label: '果树' },
                      { value: 'field-crop', label: '农作物' },
                      { value: 'mixed', label: '混合种植' },
                    ]}
                    placeholder="请选择种植类型"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form>
          <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
            <Text type="secondary">合作方信息 — 北京林业大学PWRlab × 时域通</Text>
          </Paragraph>
        </Card>
      </section>

      <footer className="landing-footer">© 2026 智灌云</footer>
    </div>
  );
};

export default Landing;
