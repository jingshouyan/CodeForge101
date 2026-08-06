# CodeForge 低代码平台

前端 React + Tailwind / 后端 Go + Gin + GORM / 数据库 PostgreSQL 16（WSL Docker）。

## 文档

- [docs/design.md](docs/design.md) — 方案设计（总览与决策）
- [docs/detailed-design.md](docs/detailed-design.md) — 详细设计（API / Schema / 组件 / DDL）

## 环境要求

- Go 1.26+、Node 20+
- PostgreSQL 16：开发环境使用 WSL 中的 Docker 容器 `postgres16`（0.0.0.0:5432）

## 启动步骤

1. **数据库**：确保 WSL 中 PG 容器在跑：`wsl docker ps`（应看到 `postgres16`）。连接默认 `localhost:5432 / code_forge101`，可用环境变量覆盖：`DATABASE_HOST / DATABASE_PORT / DATABASE_USER / DATABASE_PASSWORD / DATABASE_NAME / DATABASE_SSLMODE`（或整串 `DATABASE_URL`）
2. **后端**（端口 8080）：`go -C backend run ./cmd/server`——首次启动自动建表并创建 admin 账号。配置优先级：环境变量 > `backend/config.yaml`（可选，参考 `config.example.yaml`）> 默认值
3. **前端**（端口 5173）：`npm --prefix frontend run dev`，访问 http://localhost:5173
4. **登录**：admin / admin123（请尽快修改）

## M1 已完成

- JWT 认证（login / me）、应用 CRUD、页面 CRUD（乐观锁版本控制）
- 静态渲染器：手写 JSON Schema → 组件树（container / text / button）
- 管理端：应用列表 / 应用详情 / 页面 JSON 编辑 / 预览

后续里程碑：M2 设计器 → M3 动态数据 → M5 审批流 → M6 发布（详见 design.md §10）。
