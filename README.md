# 智灌云（Smart Irrigation）

> 智能灌溉决策平台前端原型（商业化演示版）

**在线演示：** [https://benyexi.github.io/smart-irrigation/](https://benyexi.github.io/smart-irrigation/)

---

## 项目概览

当前仓库为 React + TypeScript 的前端项目，已形成完整的“登录 -> 看板 -> 实时监控 -> 站点管理 -> IoT 接入”演示闭环。

- 前端技术栈：React 19、TypeScript、Vite、Ant Design 6、ECharts
- 路由模式：HashRouter（适配 GitHub Pages）
- 数据现状：`mock + localStorage + MQTT 实时演示`
- 部署方式：`gh-pages` 发布 `dist` 到 GitHub Pages

> 说明：当前版本已不再是早期深色主题，默认是浅色玻璃质感风格（以 `src/styles/variables.css` 为准）。

---

## 功能页面

| 页面 | 路径 | 功能摘要 |
|---|---|---|
| 登录页 | `#/login` | 中英双语品牌登录页，演示账号 `admin / 123456` |
| 落地页 | `#/landing` | 产品首屏介绍、核心能力概览、功能入口与行动按钮 |
| 主控看板 | `#/dashboard` | 站点切换、天气/指标卡、植物生理 Gauge、MQTT 实时状态 |
| 实时监控 | `#/monitor` | MQTT 连接栏、实时卡片、原始日志、模拟器、阀门/水泵控制与 ack 历史 |
| IoT 接入 | `#/iot` | 快速接入步骤、Python/Arduino/Node 示例、Topic 规范与类型枚举 |
| 站点管理 | `#/sites` | 站点列表 + 4 步配置 Modal + 田块可视化编辑（拖拽、画管道、喷头、植物点阵） |
| 历史数据 | `#/history` | 多指标图表、表格、CSV 导出、HTML 报告导出 |
| 站点地图 | `#/map` | 基于站点经纬度的 SVG 地图示意与状态展示 |
| 决策引擎 | `#/engine` | 5 种决策模式前端模拟、进度动画、决策日志 |
| 知识库 | `#/knowledge` | 植物表、土壤表、决策参考、搜索筛选与详情抽屉 |
| 报警记录 | `#/alerts` | 未处理/已处理分 Tab，标记处理 |
| 用户设置 | `#/settings` | 个人信息、通知开关、API Key 展示 |
| 数据大屏 | `#/screen` | 独立全屏展示页，自动刷新图表与站点摘要 |

---

## 落地页与知识库扩充

### 落地页（`#/landing`）

- 页面采用单页长滚动结构，包含 6 个 Section：Hero、核心痛点、解决方案、核心功能、适用场景、联系我们。
- 作为项目入口页，聚合产品定位、核心能力、系统入口和主要行动按钮。
- Hero 区提供两个锚点按钮，可快速跳转到“平台功能”和“联系我们”；右侧为简化仪表盘 SVG 示意。
- 保持浅色玻璃质感风格，与当前登录页、看板和站点模块的视觉语言一致。
- 联系我们区包含前端表单提交反馈，用于演示线索收集流程。
- 用于快速说明平台能力，方便从演示首页直接跳转到登录、看板、站点管理等关键页面。

### 知识库（`#/knowledge`）

- 页面由 3 个 Tab 组成：植物表、土壤表、决策参考。
- 数据内容扩充为植物表、土壤表和决策参考信息。
- 植物参数已扩展到林木/果树/农作物多品类（如毛白杨、欧美杨、小叶杨、青杨、甘肃杨、小黑杨、小钻杨、胡杨、苹果、梨、桃、葡萄、柑橘、枣、玉米、小麦、棉花、大豆、马铃薯）。
- 土壤参数已扩展到 8 类（土壤类型、田间持水量、萎蔫含水率、饱和含水率、容重、饱和导水率、有效持水量）。
- 新增“决策参考”双表：决策模式适用场景对比、常见报警阈值参考。
- 支持搜索与筛选，便于按作物、参数类型或用途快速定位条目。
- 支持详情抽屉查看单条记录，减少在表格中反复跳转的成本。
- 数据来源：FAO-56 / 植物水分生理学 / PWRlab实验数据。
- 作为灌溉决策的参考资料层，与看板、站点管理和决策引擎保持一致的数据语义。

---

## MQTT 与 IoT 规范

统一 Topic：

- 传感器上报：`siz/v1/{siteId}/sensor/{deviceId}/data`
- 控制指令：`siz/v1/{siteId}/control/{deviceId}/cmd`
- 指令响应：`siz/v1/{siteId}/control/{deviceId}/ack`
- 设备状态：`siz/v1/{siteId}/status`

监控页（`#/monitor`）已实现：

- Broker 连接/断开、连接时长、消息计数
- 自动订阅当前站点实时主题
- 传感器在线判定（5 分钟窗口）
- 指令下发 -> 等待 ack（10 秒超时）-> 状态回写
- 原始日志清空/暂停/导出
- 本地模拟器闭环演示
- `Monitor` 的高频页面状态已迁入 Zustand，当前日志、消息计数、传感器运行态、设备指令态、模拟器配置与指令历史由 `src/stores/monitorStore.ts` 统一管理；MQTT 订阅、ack 超时和定时器生命周期仍保留在页面层。

默认 Broker：`wss://broker.emqx.io:8084/mqtt`

---

## 站点管理模块

站点配置入口统一在 `#/sites`，旧 `#/setup` 已移除。

核心能力：

- 站点增删改查（`localStorage` 持久化）
- 传感器配置（类型、设备 ID、位置、Topic、坐标）
- 田块编辑器（超大 SVG 画布）
  - 拖拽传感器位置
  - 画管道 / 画喷头
  - 空白处点击添加 / 右键删除
  - 植物点阵层（木本/草本）
  - 株距、行距、方向控制（模板：`src/pages/Sites/fieldTemplates.ts`）
- 决策模式配置（5 种模式）
- 报警规则配置（系统报警 + 数据报警）

近期工程性改进：

- `SiteModal` 的 SVG 拖拽更新已改为 `requestAnimationFrame` 按帧提交，降低高频鼠标移动对整页状态更新的压力。
- `SiteModal` 已拆为“父级状态编排器 + Step 子组件”结构：基础信息、田块编辑器、决策模式、报警规则分别独立，后续新增字段与交互不再集中堆在一个文件里。
- 田块编辑器已独立为 `SiteFieldEditorStep`，父组件只保留拖拽、保存和跨步骤状态管理。
- MQTT 订阅与状态监听已封装为 React Hook，`Dashboard` 与 `Monitor` 不再手动维护订阅清理逻辑。
- `Monitor` 已引入 Zustand 做状态收口，避免日志、设备状态、实时卡片和模拟器配置全部堆在页面局部 `useState` 中。
- `Monitor` 已拆为“页面运行时编排器 + 视图子组件”结构：状态栏、实时卡片、数据模拟器、控制面板、指令历史、日志侧栏分别独立，页面层只保留 MQTT 生命周期、命令链路和定时器控制。
- 知识库表格已取消固定右列方案，改为稳定的横向滚动与省略显示，避免列叠压。

---

## 视觉与主题（当前代码）

主要设计变量位于 `src/styles/variables.css`：

| 变量 | 当前值 |
|---|---|
| `--bg-base` | `#f2f4f8` |
| `--bg-card` | `rgba(255, 255, 255, 0.78)` |
| `--bg-sidebar` | `rgba(248, 250, 253, 0.72)` |
| `--border-base` | `rgba(15, 23, 42, 0.12)` |
| `--primary` | `#1366ff` |
| `--accent-teal` | `#0f9d80` |
| `--accent-orange` | `#db7f2f` |
| `--accent-red` | `#cf4453` |

---

## 本地运行

```bash
git clone https://github.com/benyexi/smart-irrigation.git
cd smart-irrigation
npm install
npm run dev
```

默认打开：

- [http://localhost:3000/#/login](http://localhost:3000/#/login)

---

## 构建与部署

```bash
npm run build
npm run deploy
```

`npm run deploy` 会自动构建并发布到 `gh-pages` 分支。

---

## 关键目录

- `src/pages/`：业务页面
- `src/stores/monitorStore.ts`：实时监控 Zustand store
- `src/stores/monitorStore.types.ts`：监控页运行时类型与默认值
- `src/pages/Monitor/components/`：监控页各独立面板组件
- `src/pages/Monitor/monitorViewShared.ts`：监控页视图层格式化与共享常量
- `src/utils/mqttClient.ts`：MQTT 客户端封装
- `src/utils/siteStorage.ts`：站点存储（localStorage）
- `src/types/site.ts`：站点/设备核心类型
- `src/mock/`：当前演示数据源

---

## 研发说明文档

详细开发说明（功能现状、开发方法、下一步路线）见：

- [项目开发说明.md](./项目开发说明.md)

---

## 下一步方向（建议）

- 接入真实后端 API（站点、监控、告警、历史、权限）
- 接入 PostgreSQL + TimescaleDB 时序存储
- MQTT 生产化（鉴权、ACL、重连与离线策略）
- 完善自动化测试（单测、组件测试、E2E）
- 统一主题 token 与页面视觉一致性
