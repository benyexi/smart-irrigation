import React, { useMemo, useState } from 'react';
import { AppstoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Popconfirm, Row, Space, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { Site } from '../../types/site';
import { deleteSite, getSites, setCurrentSiteId } from '../../utils/siteStorage';
import SiteModal from './SiteModal';
import './Sites.css';

const { Title, Text } = Typography;

const statusColorMap: Record<Site['status'], string> = {
  running: '#00d4aa',
  pending: '#8892a4',
  alarm: '#ff4757',
};

const statusTextMap: Record<Site['status'], string> = {
  running: '运行中',
  pending: '待配置',
  alarm: '报警',
};

const irrigationText: Record<Site['irrigationType'], string> = {
  drip: '滴灌',
  spray: '喷灌',
  flood: '漫灌',
};

const decisionText: Record<Exclude<Site['decisionMode'], null>, string> = {
  1: '模式1 定时灌溉',
  2: '模式2 ET0 法',
  3: '模式3 含水率阈值',
  4: '模式4 水势阈值',
  5: '模式5 植物水分亏缺',
};

const SitesPage: React.FC = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>(() => getSites());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const stats = useMemo(() => {
    const running = sites.filter((site) => site.status === 'running').length;
    const pending = sites.filter((site) => site.status === 'pending').length;
    const alarm = sites.filter((site) => site.status === 'alarm').length;
    return {
      total: sites.length,
      running,
      pending,
      alarm,
    };
  }, [sites]);

  const refreshSites = () => {
    setSites(getSites());
  };

  const openCreateModal = () => {
    setEditingSite(null);
    setModalOpen(true);
  };

  const openEditModal = (site: Site) => {
    setEditingSite(site);
    setModalOpen(true);
  };

  const onDeleteSite = (id: string) => {
    deleteSite(id);
    refreshSites();
  };

  const enterDashboard = (site: Site) => {
    setCurrentSiteId(site.id);
    navigate('/dashboard');
  };

  return (
    <div className="page-container sites-page">
      <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Space align="center" size={10}>
            <AppstoreOutlined style={{ color: 'var(--primary)', fontSize: 20 }} />
            <Title level={3} style={{ margin: 0 }}>
              我的站点
            </Title>
          </Space>
        </Col>
        <Col>
          <Button type="primary" onClick={openCreateModal}>
            ＋ 新建站点
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card className="site-stat-card">
            <div className="site-stat-label">总站点数</div>
            <div className="site-stat-value">{stats.total}</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="site-stat-card">
            <div className="site-stat-label">运行中</div>
            <div className="site-stat-value" style={{ color: '#00d4aa' }}>
              {stats.running}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="site-stat-card">
            <div className="site-stat-label">待配置</div>
            <div className="site-stat-value" style={{ color: '#8892a4' }}>
              {stats.pending}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="site-stat-card">
            <div className="site-stat-label">报警</div>
            <div className="site-stat-value" style={{ color: '#ff4757' }}>
              {stats.alarm}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {sites.map((site) => (
          <Col xs={24} lg={8} key={site.id}>
            <Card className="site-card" bordered>
              <div className="site-card-head">
                <Text className="site-card-title">{site.name}</Text>
                <Tag color={statusColorMap[site.status]}>{statusTextMap[site.status]}</Tag>
              </div>

              <Descriptions
                size="small"
                column={1}
                className="site-descriptions"
                labelStyle={{ color: 'var(--text-secondary)', minWidth: 82 }}
              >
                <Descriptions.Item label="植物类型">{site.plantType}</Descriptions.Item>
                <Descriptions.Item label="灌溉方式">{irrigationText[site.irrigationType]}</Descriptions.Item>
                <Descriptions.Item label="面积">{site.area} 亩</Descriptions.Item>
                <Descriptions.Item label="决策模式">
                  {site.decisionMode === null ? '未配置' : decisionText[site.decisionMode]}
                </Descriptions.Item>
                <Descriptions.Item label="传感器数量">{site.sensors.length}</Descriptions.Item>
              </Descriptions>

              <Space style={{ marginTop: 8 }} wrap>
                <Button size="small" onClick={() => enterDashboard(site)}>
                  进入看板
                </Button>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(site)}>
                  编辑配置
                </Button>
                <Popconfirm
                  title="确认删除该站点吗？"
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => onDeleteSite(site.id)}
                >
                  <Button size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <SiteModal
        open={modalOpen}
        initialSite={editingSite}
        onCancel={() => setModalOpen(false)}
        onSaved={() => {
          refreshSites();
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default SitesPage;
