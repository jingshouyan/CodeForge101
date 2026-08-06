# 低代码平台方案设计 v0.2（已定稿核心决策）

> 状态：核心决策已定，待进入详细设计 / 编码
> 技术栈：前端 React + Tailwind / 后端 Go + Gin + GORM / 数据库 PostgreSQL 16
> 详细设计见 [docs/detailed-design.md](detailed-design.md)（API 定义 / Schema 规格 / 组件清单 / DDL / 实现要点 / 测试策略）

## 1. 定位与范围

**定位：综合平台，分期交付**——第一阶段做**管理后台类**（表单 + 列表 + 页面搭建，参考宜搭 / JetAdmin / amis），后续扩展 **H5 展示页**与**数据大屏**能力。架构上从 v1 就为后两阶段预留扩展点（布局系统、组件注册表、聚合查询），避免后期推倒重来。

**目标（P1，管理后台）**：

- 可视化搭建页面（表单、表格、详情、布局容器、弹窗）
- 数据模型可视化定义，自动生成 CRUD API
- 页面发布 / 版本管理（草稿与线上隔离）
- 角色权限控制（应用级）

**后续阶段目标**：

- P2：H5 / 展示页——布局样式增强、主题、多端预览
- P3：数据大屏——图表组件库、聚合查询、数据自动刷新

**非目标（P1）**：

- 复杂工作流（会签 / 条件分支 / 自由流转）——P1 只做**顺序审批链**
- 数据大屏 / 复杂图表编排
- 自定义组件插件市场
- 多租户 SaaS

## 2. 核心概念

| 概念 | 说明 |
| --- | --- |
| 应用 App | 一组页面的集合，拥有独立权限 |
| 页面 Page | 应用内的一个路由页面，由组件树描述（JSON） |
| 组件 Component | 页面组成单元（Input、Select、Table、Form、Dialog…） |
| 组件树 Schema | 页面的 JSON 描述：组件嵌套 + props + 数据绑定 |
| 数据模型 DataModel | 业务实体定义（字段、类型），映射到底层数据表 |
| 发布版本 Release | 页面 Schema 的快照，线上运行时只读 |
| 审批流 Workflow | 表单提交后的审批链定义（节点顺序、审批人），挂在数据模型上 |
| 菜单 Menu | 应用内页面组织（分组/排序），显式 JSON 定义，业务人员可拖拽调整 |
| 事件-动作 Event→Action | 组件间通信方式（如表单提交→刷新表格、按钮点击→打开弹窗），用选择器配置 |

## 3. 总体架构

```
┌────────────────────────────────────────────────┐
│ 前端 (React + Vite + Tailwind + TS)             │
│  ┌──────────┐   ┌───────────┐   ┌───────────┐  │
│  │ 设计器     │   │ 运行时渲染器 │   │ 管理端     │  │
│  │ Designer │   │ Renderer  │   │ Admin     │  │
│  └──────────┘   └───────────┘   └───────────┘  │
│   · dnd-kit 拖拽  · JSON→组件树   · 应用管理      │
│   · 属性面板      · 数据请求      · 数据模型管理   │
│   · 大纲树        · 绑定求值      · 用户/权限     │
└──────────────┬─────────────────────────────────┘
               │ REST (JSON)
┌──────────────┴─────────────────────────────────┐
│ 后端 (Go + Gin + GORM)                          │
│  auth │ app │ page │ designer │ data │ release │ files │ workflow
│  ────────────────────────────────────────────  │
│  动态数据服务：DataModel → 自动 CRUD API          │
└──────────────┬─────────────────────────────────┘
               │
        ┌──────┴──────┐
        │ PostgreSQL  │
        └─────────────┘
```

**部署形态**：单体单二进制——前端构建产物由 `go:embed` 嵌入后端，一条命令部署；开发期前端用 Vite dev server 代理 API。

## 4. 页面 Schema 设计（核心）

组件树：每个节点 `{ id, type, props, children }`。

props 支持三种值：

| 形式 | 示例 | 说明 |
| --- | --- | --- |
| 字面量 | `{"kind": "literal", "value": false}` | 静态值 |
| 数据绑定 | `{"kind": "binding", "path": "$model.order.status"}` | 绑定到页面数据 |
| 表达式 | `{"kind": "expr", "expr": "$model.status === 'closed'"}` | v1 仅支持简单比较/逻辑 |

示例（订单列表页）：

```json
{
  "version": "1.0",
  "root": {
    "type": "page",
    "children": [
      {
        "type": "filterForm",
        "props": {
          "model": "order",
          "fields": [{ "field": "status", "title": "状态", "control": "select" }]
        }
      },
      {
        "type": "dataTable",
        "props": {
          "model": "order",
          "columns": [
            { "field": "order_no", "title": "订单号" },
            { "field": "amount", "title": "金额" },
            { "field": "status", "title": "状态" }
          ],
          "actions": ["create", "edit", "delete"]
        }
      }
    ]
  }
}
```

演进策略：Schema 带 `version` 字段，渲染器向后兼容；设计器与渲染器共享同一份组件注册表，保证所见即所得。

**组件间通信（P1）**：事件 → 动作模型，动作用选择器配置、不暴露代码：

- `filterForm` 提交 → 刷新指定 `dataTable`（携带筛选条件）
- `button` 点击 → 打开 `dialog` / 跳转页面
- 表格行操作「新增/编辑」→ 打开弹窗内嵌表单，保存后刷新表格

**编辑承载（v1）**：弹窗内嵌表单；独立详情页后置。

**为 P2/P3 预留**：

- 布局容器（grid / row / col / stack）从 v1 就是一等公民，P2 的 H5 页面无需破坏性改 Schema
- 组件注册表支持按阶段登记新组件（如 P3 的 Chart / StatCard），设计器面板自动出现，渲染器按 `type` 分发

**渲染器纯净原则（为导出铺路）**：运行时渲染器不依赖平台专属能力（登录态、平台 API 封装），数据获取通过注入的 adapter 完成——后续导出独立工程时，仅替换 adapter 即可。

## 5. 数据模型与动态数据服务（关键权衡）

**方案 A：动态建表（推荐）**——保存 DataModel 时自动 CREATE TABLE，每个模型一张真实表。

- 优点：SQL 查询能力强，可直查、可索引、报表友好
- 缺点：字段变更需迁移（DDL）
- v1 简化：只允许「新增字段」（ALTER TABLE ADD COLUMN），删除/改类型需人工处理或重建

**方案 B：JSON 大字段存储**——数据存 JSON 列。

- 优点：结构随意、零迁移
- 缺点：查询/索引/统计能力弱

推荐 A。**系统字段**（每张动态表自动带，业务人员不可修改）：`id`、`created_by`、`created_at`、`updated_at`、`deleted_at`（软删除，列表默认过滤）、`wf_status`、`wf_instance_id`（审批用）。

字段类型映射：

| 模型字段 | SQL 类型 |
| --- | --- |
| text | VARCHAR(255) |
| textarea | TEXT |
| number | DECIMAL(18,4) |
| date | DATE |
| datetime | DATETIME |
| boolean | BOOL |
| enum | VARCHAR + 校验 |
| relation（外键） | BIGINT + 逻辑关联（v1 不做物理外键） |
| file / image | TEXT（存文件 URL，经上传接口） |

- 枚举选项来源：`options` 支持**静态枚举**（写死选项）或**引用模型**（下拉数据源 = 另一张模型的记录），设计器里都是选择器配置
- 模型删除策略：只允许「停用」（status=disabled），物理删除走人工 SQL，防误删业务数据
- 上传接口：`POST /api/files`（类型白名单 + 大小限制 + 随机文件名），文件存本地磁盘（路径可配置），URL 落库

动态 CRUD API：`POST / GET / PUT / DELETE /api/data/{tableName}`

- 查询：`?page=1&pageSize=20&filter={"status":"closed"}&sort=-created_at`
- 列表响应：`{ list, total, page, pageSize }`
- 写入时按字段定义校验（类型 / 必填 / enum）
- **P3 预留**：聚合查询 `/api/data/{tableName}/aggregate`（group by + sum / count / avg），供大屏图表使用

## 6. 数据库表设计

```
users         (id, username, password_hash, nickname, role, created_at)
apps          (id, name, icon, description, owner_id, menu JSONB, status, created_at)
app_pages     (id, app_id, name, path, schema JSONB, status, created_at, updated_at)
app_releases  (id, app_id, version, schema_snapshot JSONB, created_by, created_at)
data_models   (id, app_id, name, table_name, fields JSONB, created_at, updated_at)
workflow_defs (id, app_id, name, model_id, nodes JSONB, status, created_at, updated_at)
  # nodes: [{ name, approver_type: user|role, approver_ids, order }...]
workflow_instances (id, def_id, record_id, model_id, status, current_node_order, created_by, created_at)
  # status: pending / approved / rejected
workflow_tasks (id, instance_id, node_order, assignee, status, comment, acted_at)
  # status: pending / approved / rejected；每节点一条留痕
```

- `app_pages.schema`：设计态 JSON（JSONB 存储，可编辑）
- 发布：复制 schema 生成快照到 `app_releases`；运行时渲染读取最新发布版本；发布历史支持**一键回滚**（将选中快照重新发布）
- 并发编辑：页面/模型更新带 `updated_at` 乐观锁校验，冲突提示另存为新版本
- 动态表结构由 `data_models.fields` 驱动，与动态建表保持一致

## 7. 后端模块设计（Gin）

```
internal/
  router/       # 路由注册 + 中间件（JWT、CORS、日志、恢复）
  middleware/   # auth、permission
  handler/      # HTTP handlers
  service/      # 业务逻辑
  model/        # GORM 模型
  dto/          # 请求/响应结构
  datadynamic/  # 动态数据服务（核心，拼 SQL / GORM 动态查询）
  release/      # 发布与版本
```

统一响应：`{ "code": 0, "message": "ok", "data": ... }`；分页数据统一 `{ list, total, page, pageSize }`。

## 8. 前端模块设计

```
src/
  designer/    # 设计器：画布 Canvas、组件面板 Palette、属性面板 Inspector、大纲树 Outline
  renderer/    # 运行时：JSON → React 组件树、数据请求、绑定求值
  admin/       # 管理端：应用管理、数据模型管理、用户/权限
  components/  # 基础组件库（Input/Select/Table/Form/Button/Dialog…）
  stores/      # zustand
  api/         # 请求封装
```

关键点：设计器与渲染器共享「组件定义注册表」（id、默认 props、属性面板配置、渲染组件），保证所见即所得。

**工程组织与路由**：同一个 Vite 工程，两段路由——`/admin/*`（设计器 + 管理端）、`/app/:appId/*`（运行时渲染器，按 path 匹配页面）。`src/runtime/` 目录保持纯净：只依赖 `src/components` 与 schema 类型，不 import 设计器/管理端代码；将来导出独立工程时整目录抽出、替换数据 adapter 即可。

**面向业务人员的设计原则（P1）**：

- 向导式起步：新建应用/页面走「模板 → 选数据模型 → 拖字段」流程，不要求从白纸开始
- 属性面板默认只展示常见配置项，高级项（表达式、样式细节）折叠隐藏
- 数据绑定不暴露表达式语法——用选择器（下拉选模型/字段/枚举）；表达式编辑仅作为「高级模式」预留
- 操作路径极短：保存 = 自动存草稿，一键预览、一键发布
- 错误提示用业务语言，不抛技术术语

选型：dnd-kit（拖拽）、zustand（状态）、TanStack Query（数据请求）、react-hook-form（表单，运行时按 schema 生成校验）。

## 8.5 审批流设计（P1 范围）

- 流程定义：名称 + 顺序审批节点链；每节点指定审批人（用户或角色），v1 不支持会签/条件分支/并行
- 实例状态机：`pending → approved / rejected`；驳回后发起人可修改记录重新提交（重新进入第一个节点）
- 提交接入：表单配置「提交后进入审批流」；提交时写业务记录 + 建实例 + 生成首节点任务，业务表增加系统列 `wf_status`、`wf_instance_id`
- 审批动作：通过 / 驳回（驳回意见必填）；任务表留痕，记录可查审批历史
- API：`/api/workflow/defs`（流程定义 CRUD）、`/api/workflow/instances`（我的申请）、`/api/workflow/tasks`（待办 + 审批动作）
- 通知：站内待办入口（运行时顶部待办列表）；邮件 / IM 通知后置

## 9. 认证与权限
- JWT（golang-jwt）+ bcrypt 密码哈希
- 角色：admin（全部）/ designer（设计页面，业务人员即此角色）/ viewer（只读）
- 权限粒度：应用级（谁能查看 / 编辑哪个应用）+ **数据可见性（模型级）**：每个数据模型可配置「全员可见 / 仅本人可见」（默认仅本人）；审批流转中审批人可见相关记录；仅本人模型下，非 owner 的增删改由服务端校验拒绝
- 预留：字段级权限，后续版本

## 9.5 安全基线

- 动态 CRUD：filter / sort / 分页全部**参数化查询**，禁止拼接 SQL；模型/字段名白名单校验
- 记录级归属与可见性校验在服务端完成，不信任前端传参
- 上传：类型白名单 + 大小限制 + 随机文件名，目录不可执行
- 渲染：React 默认转义，Schema 内禁止可执行 HTML（富文本组件单独白名单）
- 密码 bcrypt、JWT 过期、CORS 白名单

## 10. 里程碑（按阶段交付）

**P1 管理后台**：

| 阶段 | 内容 | 验证标准 |
| --- | --- | --- |
| M1 | 工程骨架 + 认证 + 应用/页面 CRUD + 静态渲染器 | 能登录、建应用，手写 JSON 页面可渲染 |
| M2 | 设计器：拖拽画布 + 属性面板 + 大纲树 | 纯静态页面可视化搭建 |
| M3 | 数据模型 + 动态 CRUD（系统字段/软删除/可见性配置） | 模型可建可查，API 安全可用 |
| M4 | 表单/表格绑定 + 弹窗编辑 + 筛选联动 | 搭出可增删改查的订单管理页 |
| M5 | 审批流：定义配置 + 实例/任务 + 表单提交接入 | 订单表单可发起审批，审批人通过/驳回 |
| M6 | 发布/版本 + 回滚 + 角色权限 | 草稿/线上隔离，权限生效 |
| M7 | 表达式联动、自定义组件 | 页面间联动、可扩展 |

**P2 H5 / 展示页**：布局与样式系统增强、主题、多端预览
**P3 数据大屏**：图表组件库、聚合查询、自动刷新

## 11. 待讨论问题（Open Questions）

1. ~~**平台定位**~~ ✅ 已定：综合平台，分期交付（P1 管理后台 → P2 H5 → P3 大屏）
2. ~~**目标用户**~~ ✅ 已定：纯业务人员为主，设计器走极简向导式交互
3. ~~**数据库**~~ ✅ 已定：PostgreSQL 16
4. ~~**动态数据存储**~~ ✅ 已定：动态建表（v1 只允许新增字段，变更走轻量迁移）
5. ~~**是否需要工作流 / 审批流**~~ ✅ 已定：P1 内置顺序审批链（会签/条件分支后续）
6. ~~**部署形态**~~ ✅ 已定：单体单二进制（go:embed 嵌入前端）
7. **界面语言**：暂定中文（内部系统），如需要双语再调整
8. ~~**是否要代码导出**~~ ✅ 已定：后置；渲染器保持纯净（数据层 adapter 注入），为导出铺路

**明确后置（不进 P1）**：组织架构/部门（审批按部门选人）、审计日志、邮件/IM 通知、数据导入导出、PDF 打印、多人实时协作

## 12. 工程结构（M1 落地）

### 12.1 仓库布局

```
├── docs/                    # 设计文档
│   ├── design.md            # 方案设计（本文）
│   └── detailed-design.md   # 详细设计
├── backend/                 # Go + Gin + GORM
│   ├── cmd/server/          # 入口：连接 DB → 迁移 → 种子 → 路由
│   └── internal/
│       ├── config/          # viper：默认值 + config.yaml（可选）+ 环境变量覆盖
│       ├── database/        # GORM 连接、AutoMigrate、admin 种子
│       ├── model/           # GORM 模型（User/App/AppMember/AppPage）
│       ├── dto/             # 统一响应 {code,message,data}、请求/响应结构
│       ├── middleware/      # JWT 校验（Bearer token → uid/role 注入 context）
│       ├── handler/         # HTTP 层（参数绑定、状态码映射）
│       ├── service/         # 业务层（owner 权限、乐观锁、schema 校验）
│       └── router/          # 路由注册
└── frontend/                # React + Vite + Tailwind v4
    └── src/
        ├── schema/types.ts  # SchemaNode/PropValue/EventAction 类型（与详细设计对应）
        ├── api/             # axios 封装（token 注入、401 跳转、统一解包）+ 各域 API
        ├── stores/          # zustand（auth）
        ├── pages/           # LoginPage、admin/*（管理端）、runtime/*（运行时）
        └── runtime/         # registry（组件注册表）+ RuntimeRenderer（递归渲染）
```

### 12.2 数据库与部署（M1 实际落地）

- 开发库：WSL Docker 容器 `postgres16`（postgres:16-alpine，0.0.0.0:5432），Windows 端经 WSL2 端口转发直连
- 连接串：环境变量 `DATABASE_URL`（默认 `postgres://code_forge101:abcd1234@localhost:5432/code_forge101`）
- 平台表：M1 迁移 users / apps / app_members / app_pages 四张；app_releases、data_models、workflow_* 随里程碑加入
- 启动：`go -C backend run ./cmd/server`（8080）；`npm --prefix frontend run dev`（5173，/api 代理到 8080）
- M1 未做 go:embed（M6 发布里程碑一并落地）

### 12.3 与详细设计的偏差（M1 简化）

| 项 | 详细设计 | M1 实际 | 说明 |
| --- | --- | --- | --- |
| 前端数据请求 | TanStack Query | 原生 useEffect + axios | M3 数据组件引入后再上 Query |
| CORS | 未列 | 未配置 | 开发期走 Vite 代理同源；生产 go:embed 同源 |
| apps.menu | JSONB 字段 | 表字段已建，接口后置 | M2 设计器做菜单配置 |
| 用户管理 | /users CRUD | 仅种子 admin | M5 权限里程碑补 |
| App 权限 | 成员表角色 | owner/admin 两级 | app_members 表已建，接口 M5 补 |

### 12.4 验证记录（M1）

- 登录 → 返回 token，`/auth/me` 正常
- 建应用 → 建页面（JSON schema）→ 更新（版本 1→2）→ 乐观锁冲突（旧版本提交返回 400）
- 无 token 访问 → 401
- 前端 `tsc + vite build` 通过；dev server 200；`/api` 代理链路通
- 浏览器人工验证：http://localhost:5173（admin / admin123）
