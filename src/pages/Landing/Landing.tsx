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
import { Button, Card, Col, Form, Input, Row, Select, Typography, message } from 'antd';
import './Landing.css';

const { Title, Paragraph, Text } = Typography;

const heroSignals = [
  { label: '实时接入', value: '12 类设备' },
  { label: '决策模式', value: '5 种策略' },
  { label: '场景覆盖', value: '果园 / 林场 / 农场' },
];

const heroStats = [
  { value: '72', label: '综合决策分值' },
  { value: '18%', label: '预估节水空间' },
  { value: '24h', label: '站点状态连续监控' },
];

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
          <Text className="landing-eyebrow">Smart Irrigation Decision Platform</Text>
          <Title className="landing-hero-title">
            智灌云
            <span>让植物状态直接参与灌溉决策</span>
          </Title>
          <Paragraph className="landing-hero-subtitle">
            基于液流、茎径、膨压和土壤水势等多源信号，统一完成站点监控、阀控执行、告警闭环和精准灌溉策略下发。
          </Paragraph>
          <div className="landing-hero-points">
            {heroSignals.map((item) => (
              <div key={item.label} className="landing-hero-point">
                <Text className="landing-hero-point-label">{item.label}</Text>
                <Text className="landing-hero-point-value">{item.value}</Text>
              </div>
            ))}
          </div>
          <div className="landing-hero-actions">
            <Button type="primary" size="large" onClick={() => scrollTo('contact')}>申请演示</Button>
            <Button size="large" onClick={() => scrollTo('features')}>查看功能</Button>
          </div>
          <div className="landing-hero-stats">
            {heroStats.map((item) => (
              <div key={item.label} className="landing-hero-stat">
                <div className="landing-hero-stat-value">{item.value}</div>
                <div className="landing-hero-stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-hero-visual" aria-hidden="true">
          <svg viewBox="0 0 560 360">
            <rect x="12" y="12" width="536" height="336" rx="24" fill="var(--bg-card)" stroke="var(--border-base)" />
            <rect x="36" y="36" width="488" height="84" rx="18" fill="rgba(19, 102, 255, 0.09)" stroke="var(--border-base)" />
            <text x="56" y="61" fill="var(--text-muted)" fontSize="11" fontWeight="600">今日灌溉决策总览</text>
            <text x="56" y="84" fill="var(--text-primary)" fontSize="22" fontWeight="700">北林试验站 A-03</text>
            <text x="56" y="102" fill="var(--text-secondary)" fontSize="11">植物生理信号正常，推荐 18:30 启动第 2 区轮灌</text>

            <rect x="332" y="54" width="58" height="48" rx="12" fill="var(--bg-card-solid)" stroke="var(--border-base)" />
            <rect x="400" y="54" width="58" height="48" rx="12" fill="var(--bg-card-solid)" stroke="var(--border-base)" />
            <rect x="468" y="54" width="36" height="48" rx="12" fill="var(--bg-card-solid)" stroke="var(--border-base)" />
            <text x="346" y="72" fill="var(--text-muted)" fontSize="10">在线</text>
            <text x="346" y="92" fill="var(--text-primary)" fontSize="16" fontWeight="700">24</text>
            <text x="414" y="72" fill="var(--text-muted)" fontSize="10">阀组</text>
            <text x="414" y="92" fill="var(--text-primary)" fontSize="16" fontWeight="700">08</text>
            <circle cx="486" cy="78" r="8" fill="#0f9d80" />
            <text x="478" y="97" fill="var(--text-muted)" fontSize="9">正常</text>

            <rect x="36" y="122" width="230" height="196" rx="14" fill="var(--bg-card-solid)" stroke="var(--border-base)" />
            <rect x="284" y="122" width="240" height="196" rx="14" fill="var(--bg-card-solid)" stroke="var(--border-base)" />
            <text x="56" y="148" fill="var(--text-muted)" fontSize="11" fontWeight="600">多源信号趋势</text>
            <text x="304" y="148" fill="var(--text-muted)" fontSize="11" fontWeight="600">决策评分与执行建议</text>

            <line x1="56" y1="286" x2="236" y2="286" stroke="rgba(15, 23, 42, 0.1)" />
            <line x1="56" y1="246" x2="236" y2="246" stroke="rgba(15, 23, 42, 0.08)" />
            <line x1="56" y1="206" x2="236" y2="206" stroke="rgba(15, 23, 42, 0.08)" />

            <path d="M56 286 L90 250 L126 260 L160 222 L196 230 L232 184" fill="none" stroke="#1366ff" strokeWidth="3" strokeLinecap="round" />
            <path d="M56 298 L92 280 L128 288 L162 268 L198 276 L232 242" fill="none" stroke="#0f9d80" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="232" cy="184" r="4.5" fill="#1366ff" />
            <circle cx="232" cy="242" r="4.5" fill="#0f9d80" />
            <text x="56" y="304" fill="var(--text-muted)" fontSize="10">08:00</text>
            <text x="132" y="304" fill="var(--text-muted)" fontSize="10">12:00</text>
            <text x="208" y="304" fill="var(--text-muted)" fontSize="10">16:00</text>
            <text x="56" y="170" fill="#1366ff" fontSize="10">液流速率</text>
            <text x="116" y="170" fill="#0f9d80" fontSize="10">茎径变化</text>

            <circle cx="392" cy="214" r="64" fill="rgba(19, 102, 255, 0.08)" stroke="rgba(19, 102, 255, 0.2)" />
            <path d="M392 166 A48 48 0 1 1 352 245" fill="none" stroke="#1366ff" strokeWidth="12" strokeLinecap="round" />
            <path d="M392 166 A48 48 0 0 1 434 189" fill="none" stroke="#db7f2f" strokeWidth="12" strokeLinecap="round" />
            <text x="392" y="224" textAnchor="middle" fill="var(--text-primary)" fontSize="26" fontWeight="700">72</text>
            <text x="392" y="246" textAnchor="middle" fill="var(--text-muted)" fontSize="11">Decision Score</text>

            <rect x="452" y="176" width="52" height="18" rx="9" fill="rgba(15, 157, 128, 0.12)" />
            <text x="463" y="188" fill="#0f9d80" fontSize="10" fontWeight="700">推荐执行</text>
            <text x="304" y="286" fill="var(--text-secondary)" fontSize="11">建议模式</text>
            <text x="304" y="304" fill="var(--text-primary)" fontSize="14" fontWeight="700">模式 5 植物亏缺指标</text>
            <text x="430" y="286" fill="var(--text-secondary)" fontSize="11">灌溉窗口</text>
            <text x="430" y="304" fill="var(--text-primary)" fontSize="14" fontWeight="700">18:30 - 19:10</text>
          </svg>
        </div>
      </section>

      <section className="landing-section" id="pain">
        <div className="landing-section-head">
          <Text className="landing-eyebrow">Why old irrigation underperforms</Text>
          <Title level={2}>传统灌溉的问题</Title>
          <Paragraph>判断滞后、经验依赖和系统割裂，通常不是单点故障，而是整套决策链条缺少可量化依据。</Paragraph>
        </div>
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
        <div className="landing-section-head">
          <Text className="landing-eyebrow">How the platform decides</Text>
          <Title level={2}>智灌云的做法</Title>
          <Paragraph>把“植物是否缺水”放在算法中心，并将决策逻辑、设备执行和回执追踪统一到一个闭环里。</Paragraph>
        </div>
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
        <div className="landing-section-head">
          <Text className="landing-eyebrow">Platform capabilities</Text>
          <Title level={2}>平台功能</Title>
          <Paragraph>既能服务科研试验站，也能支撑大规模商业部署，重点是把监测、决策、执行和追溯放在同一工作流中。</Paragraph>
        </div>
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
        <div className="landing-section-head">
          <Text className="landing-eyebrow">Deployment scenarios</Text>
          <Title level={2}>适用于</Title>
          <Paragraph>不同作物、不同地块与不同管理强度下，平台都可以用统一的数据结构和决策逻辑组织灌溉策略。</Paragraph>
        </div>
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
        <div className="landing-section-head">
          <Text className="landing-eyebrow">Book a tailored walkthrough</Text>
          <Title level={2}>申请产品演示</Title>
          <Paragraph>留下作物类型和组织信息，我们会按您的试验或生产场景准备演示内容，而不是只给通用页面展示。</Paragraph>
        </div>
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
