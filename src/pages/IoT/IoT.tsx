import React, { Suspense, lazy, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  message,
  Row,
  Space,
  Steps,
  Tabs,
  Tag,
  Typography,
  Skeleton,
} from 'antd';
import {
  CopyOutlined,
  ApiOutlined,
  CloudServerOutlined,
  ClusterOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useSiteStore, useSyncSiteStore } from '../../stores/siteStore';
import './IoT.css';

const { Title, Paragraph, Text } = Typography;
const IoTTopicTables = lazy(() => import('./components/IoTTopicTables'));

type CodeBlockProps = {
  title: string;
  language: string;
  code: string;
};

const copyText = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

const CodeBlock: React.FC<CodeBlockProps> = ({ title, language, code }) => {
  const handleCopy = async () => {
    try {
      await copyText(code);
      message.success('代码已复制');
    } catch {
      message.error('复制失败，请手动选择代码');
    }
  };

  return (
    <Card className="iot-code-card" bordered>
      <div className="iot-code-head">
        <div>
          <div className="iot-code-title">{title}</div>
          <div className="iot-code-lang">{language}</div>
        </div>
        <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
          复制代码
        </Button>
      </div>
      <pre className="iot-code-block">
        <code>{code}</code>
      </pre>
    </Card>
  );
};

const quickSteps = [
  {
    title: '获取站点ID',
    description: '从站点管理或看板复制当前站点 ID，作为所有 Topic 的根路径。',
    icon: <ClusterOutlined />,
  },
  {
    title: '选连接方式',
    description: '根据设备能力选择 MQTT、HTTP 或边缘网关接入路径。',
    icon: <CloudServerOutlined />,
  },
  {
    title: '配置设备',
    description: '配置 broker、认证信息、Topic 规范和上报字段。',
    icon: <ApiOutlined />,
  },
  {
    title: '验证数据',
    description: '发送首包 telemetry，并检查平台是否成功入库和展示。',
    icon: <ThunderboltOutlined />,
  },
];

const brokerInfo = [
  { label: 'Broker', value: 'wss://broker.emqx.io:8084/mqtt' },
  { label: 'Port', value: '8084 (WebSocket TLS)' },
  { label: 'Keepalive', value: '60s' },
  { label: 'QoS', value: '0 或 1' },
  { label: '根 Topic', value: 'siz/v1/{siteId}' },
  { label: '鉴权', value: '演示可匿名，生产建议用户名/证书' },
];

const brokerDescriptionItems = brokerInfo.map((item) => ({
  key: item.label,
  label: item.label,
  children: item.value,
}));

const reportExamples = {
  python: `import json
import time
import paho.mqtt.client as mqtt

SITE_ID = "site-001"
DEVICE_ID = "SM-001"
BROKER = "broker.emqx.io"
PORT = 8084
TOPIC = f"siz/v1/{SITE_ID}/sensor/{DEVICE_ID}/data"

client = mqtt.Client(client_id=f"{SITE_ID}-{DEVICE_ID}", transport="websockets")
client.tls_set()  # wss
client.connect(BROKER, PORT, keepalive=60)

payload = {
    "siteId": SITE_ID,
    "deviceId": DEVICE_ID,
    "ts": int(time.time() * 1000),
    "type": "soil_moisture",  # 枚举值见文档
    "value": 28.6,
    "unit": "%"
}

client.loop_start()
client.publish(TOPIC, json.dumps(payload), qos=1)
client.loop_stop()`,
  cpp: `#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "wifi-name";
const char* password = "wifi-pass";
const char* broker = "broker.emqx.io";
const int port = 1883;
const char* siteId = "site-001";
const char* deviceId = "FM-001";

WiFiClient wifiClient;
PubSubClient client(wifiClient);

void publishTelemetry(float flow) {
  char topic[128];
  snprintf(topic, sizeof(topic), "siz/v1/%s/sensor/%s/data", siteId, deviceId);

  char payload[256];
  snprintf(payload, sizeof(payload),
           R"({"siteId":"%s","deviceId":"%s","type":"flow_meter","value":%.2f,"unit":"m3/h"})",
           siteId, deviceId, flow);

  client.publish(topic, payload, false);
}`,
  node: `import mqtt from 'mqtt';

const SITE_ID = 'site-001';
const DEVICE_ID = 'SF-001';
const topic = 'siz/v1/' + SITE_ID + '/sensor/' + DEVICE_ID + '/data';

const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
  clientId: SITE_ID + '-' + DEVICE_ID,
});

client.on('connect', () => {
  client.publish(topic, JSON.stringify({
    siteId: SITE_ID,
    deviceId: DEVICE_ID,
    ts: Date.now(),
    type: 'sapflow',
    value: 134.8,
    unit: 'g/h',
  }), { qos: 0 });
});`,
};

const controlCode = `import json
import time
import paho.mqtt.client as mqtt

SITE_ID = "site-001"
BROKER = "broker.emqx.io"
PORT = 8084
CMD_TOPIC = f"siz/v1/{SITE_ID}/control/+/cmd"

def execute_command(payload: dict) -> tuple[str, dict]:
    command = payload.get("command")
    device_id = payload.get("deviceId", "unknown-device")
    msg_id = payload.get("msgId", "")

    if command == "valve.open":
        result = {"status": "ack", "result": "opened"}
    elif command == "valve.close":
        result = {"status": "ack", "result": "closed"}
    else:
        result = {"status": "error", "reason": "unsupported_command"}

    ack_payload = {
        "siteId": SITE_ID,
        "deviceId": device_id,
        "msgId": msg_id,
        "ts": int(time.time() * 1000),
        **result,
    }
    ack_topic = f"siz/v1/{SITE_ID}/control/{device_id}/ack"
    return ack_topic, ack_payload

def on_message(client, userdata, msg):
    payload = json.loads(msg.payload.decode("utf-8"))
    ack_topic, ack_payload = execute_command(payload)
    client.publish(ack_topic, json.dumps(ack_payload), qos=0)

client = mqtt.Client(client_id=f"{SITE_ID}-controller", transport="websockets")
client.tls_set()  # wss
client.on_message = on_message
client.connect(BROKER, PORT, keepalive=60)
client.subscribe(CMD_TOPIC, qos=1)
client.loop_forever()`;

const IoT: React.FC = () => {
  useSyncSiteStore();
  const currentSiteId = useSiteStore((state) => state.currentSiteId);
  const [activeTab, setActiveTab] = useState('quick');

  const handleCopyCurrentSiteId = async () => {
    const siteId = currentSiteId;
    if (!siteId) {
      message.warning('当前没有可复制的站点 ID');
      return;
    }

    try {
      await copyText(siteId);
      message.success('站点 ID 已复制');
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const dataReportItems = [
    {
      key: 'python',
      label: 'Python',
      children: (
        <div className="iot-tab-stack">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={9}>
              <Card className="iot-note-card" bordered>
                <div className="iot-note-title">连接 broker</div>
                <Descriptions column={1} size="small" colon={false} items={brokerDescriptionItems} />
              </Card>
            </Col>
            <Col xs={24} lg={15}>
              <CodeBlock title="Python 上报示例" language="paho-mqtt" code={reportExamples.python} />
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'cpp',
      label: 'Arduino(C++)',
      children: (
        <div className="iot-tab-stack">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={9}>
              <Card className="iot-note-card" bordered>
                <div className="iot-note-title">连接 broker</div>
                <Descriptions column={1} size="small" colon={false} items={brokerDescriptionItems} />
              </Card>
            </Col>
            <Col xs={24} lg={15}>
              <CodeBlock title="Arduino / ESP32 上报示例" language="WiFiClientSecure + PubSubClient" code={reportExamples.cpp} />
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'node',
      label: 'Node.js',
      children: (
        <div className="iot-tab-stack">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={9}>
              <Card className="iot-note-card" bordered>
                <div className="iot-note-title">连接 broker</div>
                <Descriptions column={1} size="small" colon={false} items={brokerDescriptionItems} />
              </Card>
            </Col>
            <Col xs={24} lg={15}>
              <CodeBlock title="Node.js 上报示例" language="mqtt" code={reportExamples.node} />
            </Col>
          </Row>
        </div>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'quick',
      label: '快速接入',
      children: (
        <div className="iot-tab-stack">
          <Card className="iot-section-card" bordered>
            <Steps
              className="iot-steps"
              responsive
              labelPlacement="vertical"
              items={quickSteps.map((step) => ({
                title: step.title,
                description: step.description,
                icon: step.icon,
              }))}
            />
          </Card>

          <Row gutter={[16, 16]}>
            {quickSteps.map((step, index) => (
              <Col xs={24} md={12} xl={6} key={step.title}>
                <Card className="iot-mini-card" bordered>
                  <div className="iot-mini-index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="iot-mini-title">{step.title}</div>
                  <div className="iot-mini-desc">{step.description}</div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ),
    },
    {
      key: 'report',
      label: '数据上报',
      children: <Tabs className="iot-inner-tabs" defaultActiveKey="python" items={dataReportItems} />,
    },
    {
      key: 'control',
      label: '控制指令',
      children: (
        <div className="iot-tab-stack">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card className="iot-note-card" bordered>
                <div className="iot-note-title">完整流程</div>
                <Paragraph className="iot-note-copy">
                  平台向 <Text code>siz/v1/{"{siteId}"}/control/{"{deviceId}"}/cmd</Text> 发布控制指令，设备订阅后执行控制，并向
                  <Text code>siz/v1/{"{siteId}"}/control/{"{deviceId}"}/ack</Text> 返回回执。
                </Paragraph>
                <Space wrap>
                  <Tag color="processing">订阅 cmd</Tag>
                  <Tag color="success">执行控制</Tag>
                  <Tag color="blue">回复 ack</Tag>
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={16}>
              <CodeBlock title="Python 控制回路示例" language="paho-mqtt" code={controlCode} />
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'topic',
      label: 'Topic规范',
      children: activeTab === 'topic' ? (
        <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} title={false} />}>
          <IoTTopicTables />
        </Suspense>
      ) : null,
    },
  ];

  return (
    <div className="page-container iot-page">
      <div className="iot-hero">
        <div className="iot-hero-copy">
          <div className="iot-kicker">Integration Guide</div>
          <Title level={2} className="iot-title">
            IoT接入 / IoT Integration
          </Title>
          <Paragraph className="iot-desc">
            统一使用站点 ID 组织 broker、topic、设备上报与控制回路，便于站点级隔离、权限控制和联调定位。
          </Paragraph>
        </div>

        <div className="iot-hero-actions">
          <div className="iot-site-id-panel">
            <div className="iot-site-id-label">当前站点 ID</div>
            <div className="iot-site-id-value">{currentSiteId || '未选择站点'}</div>
          </div>
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopyCurrentSiteId}>
            复制当前站点ID
          </Button>
        </div>
      </div>

      <Card className="iot-main-card" bordered>
        <Tabs className="iot-tabs" activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
};

export default IoT;
