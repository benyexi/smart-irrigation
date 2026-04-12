import React, { Suspense, lazy, useState } from 'react';
import {
  AlertOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Tag, Typography } from 'antd';
import LiteSelect from '../../components/Inputs/LiteSelect';
import DeferredEChart from '../../components/ECharts/DeferredEChart';
import { mockDashboard } from '../../mock';
import type { Site } from '../../types/site';
import {
  barChartOption,
  makeGauge,
  soilChartOption,
  statCards,
} from './dashboardShared';
import { useDashboardRuntime } from './useDashboardRuntime';

const { Text } = Typography;
const SiteModal = lazy(() => import('../Sites/SiteModal'));

const Dashboard: React.FC = () => {
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const {
    sites,
    site,
    selectedSite,
    mqttStatus,
    plantPhysiology,
    handleSiteChange,
    handleSiteSaved,
  } = useDashboardRuntime();

  return (
    <div className="page-container">
      <style>{`
        @keyframes mqttPulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 212, 170, 0.65); }
          70% { box-shadow: 0 0 0 8px rgba(0, 212, 170, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 212, 170, 0); }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            主控看板
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            实时数据 · 最后更新 {new Date().toLocaleTimeString('zh-CN')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid var(--border-base)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: mqttStatus === 'connected' ? '#00d4aa' : '#7b8494',
                animation:
                  mqttStatus === 'connected'
                    ? 'mqttPulse 1.6s ease-in-out infinite'
                    : 'none',
              }}
            />
            <span
              style={{
                fontSize: 12,
                color:
                  mqttStatus === 'connected'
                    ? '#00d4aa'
                    : 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {mqttStatus === 'connected' ? '实时' : '离线'}
            </span>
          </div>
          <LiteSelect
            value={site ? site.id : selectedSite}
            onChange={handleSiteChange}
            style={{ width: 220 }}
            options={sites.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
          <Button
            size="small"
            type="default"
            ghost
            onClick={() => setSiteModalOpen(true)}
            disabled={!site}
          >
            ⚙️ 配置此站点
          </Button>
          <Tag color="error" icon={<AlertOutlined />}>
            未处理报警 3
          </Tag>
        </div>
      </div>

      <Card
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #1a1d2e, #1e2235)',
          borderColor: '#2a2d3e',
        }}
      >
        <Row gutter={24} align="middle">
          {[
            {
              label: '温度',
              value: `${mockDashboard.weather.temperature}°C`,
              color: '#ff6b35',
            },
            {
              label: '湿度',
              value: `${mockDashboard.weather.humidity}%`,
              color: '#4f9cf9',
            },
            {
              label: '风速',
              value: `${mockDashboard.weather.windSpeed} m/s`,
              color: '#00d4aa',
            },
            {
              label: '辐射',
              value: `${mockDashboard.weather.radiation} W/m²`,
              color: '#ffd32a',
            },
            {
              label: '降雨量',
              value: `${mockDashboard.weather.rainfall} mm`,
              color: '#a55eea',
            },
            {
              label: 'ET₀',
              value: `${mockDashboard.weather.et0} mm/d`,
              color: '#00d4aa',
            },
          ].map((item) => (
            <Col
              key={item.label}
              flex="auto"
              style={{ textAlign: 'center', padding: '4px 0' }}
            >
              <div
                className="stat-number"
                style={{ fontSize: 22, fontWeight: 700, color: item.color }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 2,
                }}
              >
                {item.label}
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {statCards.map((card) => (
          <Col xs={12} lg={6} key={card.label}>
            <Card className={card.cls} style={{ height: 110 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                    }}
                  >
                    {card.label}
                  </div>
                  <div
                    className="stat-number"
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1,
                    }}
                  >
                    {card.value}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 400,
                        marginLeft: 4,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {card.unit}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 6,
                  }}
                >
                  {card.icon}
                  <Tag color={card.up ? 'error' : 'success'} style={{ margin: 0, fontSize: 11 }}>
                    {card.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {card.trend}
                  </Tag>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={15}>
          <Card title="土壤含水率实时曲线（多深度）" style={{ height: 320 }}>
            <DeferredEChart option={soilChartOption} style={{ height: 240 }} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title="植物生理指标" style={{ height: 320 }}>
            <Row>
              <Col span={8}>
                <DeferredEChart
                  option={makeGauge(
                    plantPhysiology.sapFlowRate,
                    300,
                    '液流 g/h',
                    '#00d4aa',
                  )}
                  style={{ height: 150 }}
                />
                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                  液流速率
                </div>
              </Col>
              <Col span={8}>
                <DeferredEChart
                  option={makeGauge(
                    Math.round(Math.abs(plantPhysiology.stemDiameterVariation) * 100),
                    100,
                    '茎径',
                    '#4f9cf9',
                  )}
                  style={{ height: 150 }}
                />
                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                  茎径变化
                </div>
              </Col>
              <Col span={8}>
                <DeferredEChart
                  option={makeGauge(
                    Math.round(plantPhysiology.leafTurgorPressure * 100),
                    200,
                    '膨压',
                    '#ff6b35',
                  )}
                  style={{ height: 150 }}
                />
                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                  叶片膨压
                </div>
              </Col>
            </Row>
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                background: 'rgba(0,212,170,0.06)',
                borderRadius: 6,
                border: '1px solid rgba(0,212,170,0.2)',
              }}
            >
              <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                决策模式：
                <span style={{ color: 'var(--primary)' }}>植物水分亏缺指标</span>
                &nbsp;·&nbsp;当前状态：
                <span style={{ color: '#00d4aa' }}>无需灌溉</span>
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title={`今日灌溉计划 vs 实际执行（近7天）— ${site?.name ?? '未选择站点'}`}>
        <DeferredEChart option={barChartOption} style={{ height: 220 }} />
      </Card>

      {siteModalOpen ? (
        <Suspense fallback={null}>
          <SiteModal
            open={siteModalOpen}
            initialSite={site ?? null}
            onCancel={() => setSiteModalOpen(false)}
            onSaved={(savedSite: Site) => {
              setSiteModalOpen(false);
              handleSiteSaved(savedSite);
            }}
          />
        </Suspense>
      ) : null}
    </div>
  );
};

export default Dashboard;
