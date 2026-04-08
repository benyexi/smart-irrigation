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
| IoT接入 | `#/iot` | MQTT接入配置、主题订阅与发布、设备在线状态与消息调试 |
| 站点管理 | `#/sites` | 站点信息维护、田块可视化平面图、设备绑定与状态概览 |
| 历史数据 | `#/history` | 多指标ECharts折线图、数据表格、CSV导出、生成HTML报告下载 |
| 站点地图 | `#/map` | 高德地图（需配置API Key）/ SVG示意图 + 站点列表 + 状态标记 |
| 决策引擎 | `#/engine` | 9个滑块输入参数、5种决策模式、JS决策逻辑、进度条动画、决策日志表格 |
| 知识库 | `#/knowledge` | 植物信息表（Kc值/水势阈值）、土壤物理性质表 |
| 报警记录 | `#/alerts` | 未处理/已处理分Tab、级别标签、标记处理功能 |
| 用户设置 | `#/settings` | 个人信息、通知开关、API密钥 |
| 数据大屏 | `#/screen` | 全屏独立页面、粒子动效背景、5秒自动刷新、土壤折线图+液流图+雷达图+报警饼图+站点分布SVG |

---

## IoT接入与MQTT实时通信

- 统一 MQTT Topic 规范：  
  `siz/v1/{siteId}/sensor/{deviceId}/data`（传感器上报）  
  `siz/v1/{siteId}/control/{deviceId}/cmd`（控制指令）  
  `siz/v1/{siteId}/control/{deviceId}/ack`（指令回执）  
  `siz/v1/{siteId}/status`（设备心跳）
- `#/monitor` 现支持：Broker连接状态栏、在线时长与消息计数、实时卡片、原始日志（清空/暂停/导出）、数据模拟器、阀门/水泵控制闭环（10秒 ack 超时机制）和指令历史筛选。
- `#/dashboard` 顶部新增 MQTT 实时状态指示，且液流/茎径/膨压 Gauge 会按 MQTT 数据实时刷新。
- `#/iot` 页面提供快速接入步骤、Python/Arduino/Node.js 上报示例、控制回执示例、Topic 与传感器枚举规范及复制站点ID能力。

---

## 本次接手后改动（相对初始接手版本）

1. **配置入口重构**
   - 删除了旧的 `#/setup`「灌溉配置」页面与路由。
   - 左侧导航将原「灌溉配置」替换为「站点管理」，配置能力统一收敛到 `#/sites`。

2. **站点数据模型与持久化**
   - 新增 `src/types/site.ts`：统一 `Site / Sensor / Pipeline / AlarmRule / ModeParams` 类型。
   - 新增 `src/utils/siteStorage.ts`：基于 `localStorage` 管理站点列表与当前站点（含 DEMO 初始化）。

3. **站点管理模块（核心新增）**
   - `#/sites` 新增统计卡 + 站点卡片网格（进入看板、编辑配置、删除）。
   - 站点配置改为 4 步 Modal：基础信息、传感器与平面图、决策模式、报警规则。

4. **田块可视化编辑器升级**
   - 画布升级为大尺寸编辑区，支持传感器/喷头/管道拖拽调整。
   - 支持画管道、画喷头、点击空白快速添加、右键删除设备与管线。
   - 新增植物点阵层：根据作物类型显示木本/草本符号，并支持行距/株距（米）与方向控制。
   - 新增 `src/pages/Sites/fieldTemplates.ts`，内置常见作物的默认株行距模板（如毛白杨、苹果、玉米等）。

5. **跨页面联动**
   - Dashboard 顶部站点选择改为站点库数据源，并支持直接打开当前站点配置。
   - Map 页面站点来源统一为站点库，新建站点可按经纬度在示意图中显示。

6. **视觉与文案迭代**
   - 登录页与核心页面恢复中英双语信息层级。
   - 页面风格从早期粗糙版本迭代为更统一的商业化视觉表达，并保持当前配色规范。

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
