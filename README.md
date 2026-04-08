# 智灌云 — 智能灌溉决策平台

> 深色科技风 · 纯前端静态演示 · React + TypeScript + Ant Design 6 + ECharts

**在线演示：** https://benyexi.github.io/smart-irrigation/

---

## 功能页面

| 页面 | 路径 | 功能描述 |
|---|---|---|
| 登录页 | `#/login` | 全屏深色背景 + SVG波浪动效，账号 `admin` / 密码 `123456` |
| 主控看板 | `#/dashboard` | 4大数字卡片、天气条、Gauge仪表盘（液流/茎径/膨压）、土壤含水率多深度折线图、灌溉计划柱状图 |
| 实时监控 | `#/monitor` | 传感器状态卡片、阀门/水泵手动控制开关 |
| 站点管理 | `#/sites` | 站点信息维护、田块可视化平面图、设备绑定与状态概览 |
| 历史数据 | `#/history` | 多指标ECharts折线图、数据表格、CSV导出、生成HTML报告下载 |
| 站点地图 | `#/map` | 高德地图（需配置API Key）/ SVG示意图 + 站点列表 + 状态标记 |
| 决策引擎 | `#/engine` | 9个滑块输入参数、5种决策模式、JS决策逻辑、进度条动画、决策日志表格 |
| 知识库 | `#/knowledge` | 植物信息表（Kc值/水势阈值）、土壤物理性质表 |
| 报警记录 | `#/alerts` | 未处理/已处理分Tab、级别标签、标记处理功能 |
| 用户设置 | `#/settings` | 个人信息、通知开关、API密钥 |
| 数据大屏 | `#/screen` | 全屏独立页面、粒子动效背景、5秒自动刷新、土壤折线图+液流图+雷达图+报警饼图+站点分布SVG |

---

## 站点管理（替代旧 `/setup`）

- 旧的 `#/setup` 配置向导已移除，配置功能并入 `#/sites` 的多步骤弹窗。
- 新增 4 步配置流程：基础信息、传感器与田块平面图、决策模式、报警规则。
- 田块平面图支持：
  - 传感器坐标可视化与拖拽
  - 点击空白点快速添加传感器
  - 画管道、画喷头、清除管道
- 数据持久化：站点与当前站点选择存储于浏览器 `localStorage`。

---

## 核心差异

本平台的核心差异在于：**植物生理指标**（树液流速率、茎干直径变化量、叶片膨压）与**土壤水势**联合驱动灌溉决策，而非仅依赖普通土壤墒情。

| 决策模式 | 说明 |
|---|---|
| 土壤含水率阈值法 | 设置上下限自动开停灌 |
| 液流速率指标法 | 基于植物液流速率判断水分亏缺 |
| 叶片膨压指标法 | 精准反映植物细胞水分状态 |
| ET₀-Kc 系数法 | 基于参考蒸散量和作物系数（FAO-56） |
| 综合指标法 | 多指标融合评分，最智能 |

---

## 技术栈

- **React 19 + TypeScript + Vite** — 纯静态，无后端依赖
- **Ant Design 6** — 深色主题（`darkAlgorithm`），科技绿 `#00d4aa` 主色
- **ECharts 6 + echarts-for-react** — 所有图表统一深色背景
- **React Router v6 (HashRouter)** — 兼容 GitHub Pages
- **所有数据来自 `src/mock/`** — 可随时替换为真实 API

---

## 视觉规范

| 变量 | 值 | 用途 |
|---|---|---|
| `--bg-base` | `#0f1117` | 页面背景 |
| `--bg-card` | `#1a1d2e` | 卡片背景 |
| `--bg-sidebar` | `#141720` | 侧边栏背景 |
| `--border-base` | `#2a2d3e` | 边框颜色 |
| `--primary` | `#00d4aa` | 科技绿主色 |
| `--accent-blue` | `#4f9cf9` | 辅色蓝 |
| `--accent-orange` | `#ff6b35` | 辅色橙 |
| `--accent-red` | `#ff4757` | 报警红 |

---

## 本地运行

```bash
git clone https://github.com/benyexi/smart-irrigation.git
cd smart-irrigation
npm install
npm run dev
```

访问 http://localhost:5173/

---

## 部署

```bash
npm run deploy   # 自动构建并推送到 gh-pages 分支
```

---

## 后续开发计划

- 接入真实 FastAPI 后端（PostgreSQL + TimescaleDB）
- MQTT 实时数据推送（WebSocket）
- 高德地图真实 API Key 配置
- 移动端 App（React Native / Expo）
- 多租户 SaaS 权限体系
