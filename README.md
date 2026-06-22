# timeslots-v1

基于时间块（Time Block）的微信小程序日程管理工具，把待办和日历融合在一天 24 小时的时间轴上。

**定位**：朋友内测工具，纯手动 CRUD + 协作体验，不计费、无 AI、无商业化。目前是测试阶段，欢迎大家提出宝贵意见

**开发计划**：按 `VERSION_PLAN.md` 逐步迭代。

## 技术栈

| 层 | 选型 |
|----|------|
| 前端 | 微信原生小程序 + TypeScript 5.x + WeUI 1.5.6 + mobx-miniprogram |
| 后端 | Node.js + NestJS + TypeScript + Prisma |
| 数据库 | PostgreSQL 18（Windows native） |
| 认证 | JWT + 微信 code2session |

## 快速开始

```bash
# 安装依赖（前端 + 后端）
cd server && npm install && cd ..
npm install

# 启动后端
cd server && npx nest start --watch

# 前端：用微信开发者工具打开项目根目录（project.config.json 指向 src/）
```

## 目录结构

```
timeslots-v1/
├── src/               # 微信小程序前端
│   ├── app.ts
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── stores/
│   ├── utils/
│   └── types/
├── server/            # NestJS 后端
│   ├── src/
│   │   ├── modules/   # 业务模块
│   │   ├── common/    # 全局基础设施
│   │   └── prisma/    # Prisma 服务
│   └── prisma/
├── archive-v1/        # 旧代码备份（仅参考）
├── PRD.md             # 产品需求
├── AGENTS.md          # AI 辅助开发规则
└── VERSION_PLAN.md    # 版本开发计划（唯一依据）
```
