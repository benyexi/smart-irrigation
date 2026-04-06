# 智灌云 — 智能灌溉决策平台

> 面向果树、林木、农作物的 SaaS 智能灌溉决策系统演示版

**在线演示**：[benyexi.github.io/smart-irrigation](https://benyexi.github.io/smart-irrigation)

---

## 核心特色

本平台的核心差异在于：**植物生理指标**（树液流速率、茎干直径变化量、叶片膨压）与**土壤水势**联合驱动灌溉决策，而非仅依赖普通土壤墒情。

| 决策模式 | 说明 |
|---|---|
| 定时灌溉 | 按设定时间和灌水量执行 |
| ET₀计算（FAO-56） | 基于参考蒸散量和作物系数 |
| 土壤含水率阈值 | 设置上下限自动开停灌 |
| 土壤水势阈值 | 精准反映植物可用水状态 |
| **植物水分亏缺指标** | 液流/茎径/膨压联合决策，最智能 |

---

## 技术栈

- **前端**：React 19 + TypeScript + Vite
- **UI 组件**：Ant Design 6
- **图表**：ECharts 6 + echarts-for-react
- **路由**：React Router v6
- **状态管理**：React Context + useState
- **部署**：GitHub Pages（静态托管）

---

## 快速启动

npm install
npm run dev
npm run build
npm run deploy

---

## 页面导航

| 路径 | 页面 | 说明 |
|---|---|---|
| /login | 登录页 | 默认账号 admin / 123456 |
| /dashboard | 主控看板 | 天气、植物生理、土壤水分图表 |
| /monitor | 实时监控 | 传感器状态、阀门/泵控制 |
| /setup | 灌溉配置向导 | 4步骤配置站点和决策模式 |
| /history | 历史数据 | ECharts 折线图 + 数据表格 + CSV 导出 |
| /knowledge | 知识库 | 植物信息表 + 土壤物理性质表 |
| /alerts | 报警记录 | 未处理/已处理报警管理 |
| /settings | 用户设置 | 个人信息、通知设置、API 密钥 |

---

## 后续开发计划

- 接入真实 FastAPI 后端（PostgreSQL + TimescaleDB）
- MQTT 实时数据推送（WebSocket）
- 植物水分亏缺决策引擎（Python 算法服务）
- 硬件对接（Arduino / STM32 传感器节点）
- 移动端 App（React Native / Expo）
- 多租户 SaaS 权限体系
