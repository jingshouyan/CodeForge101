# 低代码平台详细设计 v1.0

> 对应 `design.md`（总览）。本文给出：API 定义、Schema 规格、组件清单、DDL、实现要点、测试策略。
> 范围：P1 管理后台。

## 1. 通用约定

- Base URL：`/api`；认证：`Authorization: Bearer <JWT>`
- 响应统一：`{ "code": 0, "message": "ok", "data": ... }`；`code != 0` 为业务错误
- 分页数据统一：`{ "list": [], "total": 0, "page": 1, "pageSize": 20 }`，`page/pageSize` 入参默认 1/20，上限 100
- 时间一律 ISO-8601（UTC）；软删除的数据列表默认过滤

## 2. API 定义

### 2.1 认证 auth

| 方法 | 路径 | 说明 | 请求要点 | 响应 data |
| --- | --- | --- | --- | --- |
| POST | /auth/login | 登录 | `{username, password}` | `{token, user}` |
| POST | /auth/logout | 登出 | - | null |
| GET | /auth/me | 当前用户 | - | `{id, username, nickname, role}` |

### 2.2 用户 users（admin）

| 方法 | 路径 | 说明 | 请求要点 |
| --- | --- | --- | --- |
| GET | /users | 分页列表，支持 `?keyword=` | - |
| POST | /users | 新建 | `{username, password, nickname, role}` |
| PUT | /users/:id | 修改 | `{nickname, role, password?}` |
| PUT | /users/:id/status | 停用/启用 | `{status}` |

### 2.3 应用 apps

| 方法 | 路径 | 说明 | 请求要点 |
| --- | --- | --- | --- |
| GET | /apps | 我可见的应用列表 | - |
| POST | /apps | 创建（创建者即 owner） | `{name, icon?, description?}` |
| GET | /apps/:id | 详情（含 menu、成员） | - |
| PUT | /apps/:id | 修改名称/描述 | `{name?, description?}` |
| PUT | /apps/:id/menu | 保存菜单 | `{menu: [{group?, title, pageId}]}` |
| PUT | /apps/:id/status | 停用/启用 | `{status}` |
| GET | /apps/:id/members | 成员列表 | - |
| POST | /apps/:id/members | 添加成员 | `{userId, role: designer\|viewer}` |
| DELETE | /apps/:id/members/:userId | 移除成员 | - |

### 2.4 页面 pages

| 方法 | 路径 | 说明 | 请求要点 |
| --- | --- | --- | --- |
| GET | /apps/:id/pages | 页面列表 | - |
| POST | /apps/:id/pages | 新建页面 | `{name, path, schema}` |
| GET | /apps/:id/pages/:pageId | 详情（草稿 schema） | - |
| PUT | /apps/:id/pages/:pageId | 保存草稿（乐观锁） | `{name?, path?, schema, version}`，`version` 不匹配返回冲突 |
| DELETE | /apps/:id/pages/:pageId | 删除页面 | - |
| POST | /apps/:id/pages/:pageId/publish | 发布，生成新 release | - |
| GET | /apps/:id/pages/:pageId/releases | 发布历史 | - |
| POST | /apps/:id/pages/:pageId/releases/:releaseId/rollback | 回滚到指定版本 | - |

### 2.5 数据模型 models

| 方法 | 路径 | 说明 | 请求要点 |
| --- | --- | --- | --- |
| GET | /apps/:id/models | 模型列表 | - |
| POST | /apps/:id/models | 创建（自动建表） | `{name, fields[], visibility?}`；`table_name` 系统自动生成，不可改 |
| GET | /apps/:id/models/:modelId | 详情（含 fields） | - |
| PUT | /apps/:id/models/:modelId | 仅允许**新增字段** | `{fields[]}`（只能追加）；触发 ALTER TABLE |
| PUT | /apps/:id/models/:modelId/visibility | 可见性 | `{visibility: all\|owner}` |
| PUT | /apps/:id/models/:modelId/status | 停用/启用 | `{status: enabled\|disabled}` |

`fields[]` 元素：

```json
{
  "field": "status", "label": "状态", "type": "enum",
  "required": false, "default": null,
  "options": { "type": "static", "items": [{"label": "已关闭", "value": "closed"}] },
  "options": { "type": "model", "modelId": 5, "labelField": "name", "valueField": "id" }
}
```

字段类型：`text / textarea / number / date / datetime / boolean / enum / relation / file / image`。

### 2.6 动态数据 data（运行时核心）

| 方法 | 路径 | 说明 | 请求要点 |
| --- | --- | --- | --- |
| GET | /data/{tableName} | 分页查询 | `page, pageSize, filter, sort, keyword` |
| POST | /data/{tableName} | 新增 | 业务字段 JSON，服务端校验 |
| GET | /data/{tableName}/:id | 详情 | - |
| PUT | /data/{tableName}/:id | 更新 | 业务字段 JSON |
| DELETE | /data/{tableName}/:id | 软删除 | - |
| POST | /data/{tableName}/:id/submit | 提交审批（若模型挂了流程） | - |
| POST | /data/{tableName}/aggregate | 聚合（P3 启用） | `{groupBy, metrics: [{op: sum\|count\|avg, field}]}` |

**filter 格式**（URL 编码 JSON）：操作符白名单 `eq / ne / gt / gte / lt / lte / like / in`，简写 `{field: value}` 等价 `eq`。

```
?filter={"status":"closed","amount":{"gt":100}}
?filter={"status":{"in":["a","b"]},"name":{"like":"张"}}
```

**sort 格式**：`-field` 降序，逗号分隔；仅允许模型字段，默认 `-id`。`keyword` 对 text 字段模糊搜索。

### 2.7 文件 files

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /files | multipart 上传，返回 `{url}`；类型白名单（jpg/png/gif/webp/pdf/doc/xls ≤10MB） |
| GET | /files/{name} | 静态访问（文件名随机不可枚举） |

### 2.8 工作流 workflow

| 方法 | 路径 | 说明 | 请求要点 |
| --- | --- | --- | --- |
| GET | /workflow/defs?appId= | 流程定义列表 | - |
| POST | /workflow/defs | 新建 | `{appId, name, modelId, nodes[]}` |
| PUT | /workflow/defs/:id | 修改（仅未启用时可改） | - |
| PUT | /workflow/defs/:id/status | 启用/停用 | `{status}` |
| GET | /workflow/instances?status=&appId= | 我的申请 | - |
| GET | /workflow/instances/:id | 实例详情 + 节点历史 | - |
| GET | /workflow/tasks?status=pending | 我的待办（含角色任务） | - |
| POST | /workflow/tasks/:id/approve | 通过 | `{comment?}` |
| POST | /workflow/tasks/:id/reject | 驳回 | `{comment}`（必填） |
| GET | /workflow/records/:recordId/history | 某条记录的审批历史 | - |

`nodes[]`：`[{ "name": "部门主管审批", "approverType": "user|role", "approverId": 3 }]`，数组顺序即审批顺序。

## 3. Schema 规格

### 3.1 类型定义

```ts
interface PageSchema {
  version: "1.0";
  root: SchemaNode;
}

interface SchemaNode {
  id: string;                      // uuid，事件引用与设计器选择都用它
  type: string;                    // 组件类型，见 §4 组件清单
  props?: Record<string, PropValue>;
  children?: SchemaNode[];
  events?: Record<string, EventAction>;   // 事件名 → 动作
}

type PropValue =
  | { kind: "literal"; value: any }        // 静态值（默认）
  | { kind: "binding"; path: string }      // 数据绑定
  | { kind: "expr"; expr: string };        // 表达式（高级模式）

interface EventAction {
  type: "refreshTable" | "openDialog" | "closeDialog"
      | "navigate" | "submit" | "submitWorkflow";
  targetId?: string;               // 目标组件 id（refreshTable/openDialog 需要）
  params?: Record<string, any>;    // navigate: {path}; openDialog: {record?}
}
```

### 3.2 绑定上下文（runtime 求值环境）

| 上下文 | 含义 | 示例 |
| --- | --- | --- |
| `$form` | 当前表单值 | `$form.status` |
| `$record` | 表格当前行 | `$record.amount` |
| `$params` | 路由/查询参数 | `$params.id` |

v1 绑定规则：`binding` 只支持 `$form / $record / $params` 直接字段引用（无函数、无链式计算）；表达式仅 `{{ a === b }}` 级别，高级模式默认隐藏。

### 3.3 事件动作（P1 全量）

| 事件 | 触发组件 | 动作 | 参数 |
| --- | --- | --- | --- |
| submit | filterForm | refreshTable | targetId（表格 id） |
| click | button / 表格行操作 | openDialog | targetId + 可选 record |
| click | dialog 内表单保存按钮 | refreshTable | targetId |
| click | 按钮 | navigate | path（页面路径） |
| submit | form（提交模式=直接） | submit | - |
| submit | form（提交模式=审批） | submitWorkflow | - |

设计器中全部用下拉选择器配置，不暴露代码。

## 4. 组件清单（P1）

| type | 名称 | 关键 props | 事件 |
| --- | --- | --- | --- |
| container | 容器 | layout: vertical\|horizontal, gap | - |
| row / col | 栅格行/列 | col.span | - |
| text | 文本 | content（字面量） | - |
| button | 按钮 | text, variant, type: normal\|primary | click |
| form | 表单 | modelId, fields[], submitMode: direct\|workflow, layout | submit |
| input / textarea / number / select / datePicker / dateTimePicker / checkbox / fileUpload / imageUpload | 表单项 | field, label, required, placeholder, options, span | - |
| dataTable | 数据表格 | modelId, columns[], pageSize, rowActions: [create, edit, delete] | 行操作 |
| filterForm | 筛选表单 | modelId, fields[]（仅 eq/like 字段可选） | submit |
| dialog | 弹窗 | title, width, children（内嵌 form） | - |

列配置：`{field, title, width?, render: text\|tag\|date\|image}`。`dataTable` 的系统列展示：创建人、创建时间默认出现在列选择器里。

## 5. 数据库 DDL

平台自身表（GORM AutoMigrate 管理）：

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(64) NOT NULL DEFAULT '',
  role VARCHAR(16) NOT NULL DEFAULT 'viewer',   -- admin | designer | viewer
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE apps (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  icon VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  owner_id BIGINT NOT NULL REFERENCES users(id),
  menu JSONB NOT NULL DEFAULT '[]',             -- [{group?, title, pageId}]
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app_members (
  id BIGSERIAL PRIMARY KEY,
  app_id BIGINT NOT NULL REFERENCES apps(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  role VARCHAR(16) NOT NULL DEFAULT 'viewer',   -- designer | viewer
  UNIQUE (app_id, user_id)
);

CREATE TABLE app_pages (
  id BIGSERIAL PRIMARY KEY,
  app_id BIGINT NOT NULL REFERENCES apps(id),
  name VARCHAR(128) NOT NULL,
  path VARCHAR(128) NOT NULL,
  schema JSONB NOT NULL,
  version BIGINT NOT NULL DEFAULT 1,            -- 乐观锁
  created_by BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (app_id, path)
);

CREATE TABLE app_releases (
  id BIGSERIAL PRIMARY KEY,
  app_id BIGINT NOT NULL,
  page_id BIGINT NOT NULL,
  version INT NOT NULL,                         -- 页内递增
  schema_snapshot JSONB NOT NULL,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE data_models (
  id BIGSERIAL PRIMARY KEY,
  app_id BIGINT NOT NULL REFERENCES apps(id),
  name VARCHAR(64) NOT NULL,
  table_name VARCHAR(64) NOT NULL UNIQUE,       -- biz_<unix秒>，创建后不可改
  fields JSONB NOT NULL,                        -- §2.5 字段定义数组
  visibility VARCHAR(16) NOT NULL DEFAULT 'owner',  -- all | owner
  status VARCHAR(16) NOT NULL DEFAULT 'enabled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_defs (
  id BIGSERIAL PRIMARY KEY,
  app_id BIGINT NOT NULL,
  name VARCHAR(128) NOT NULL,
  model_id BIGINT NOT NULL REFERENCES data_models(id),
  nodes JSONB NOT NULL,                         -- §2.8 nodes[]
  status VARCHAR(16) NOT NULL DEFAULT 'enabled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_instances (
  id BIGSERIAL PRIMARY KEY,
  def_id BIGINT NOT NULL REFERENCES workflow_defs(id),
  record_id BIGINT NOT NULL,
  model_id BIGINT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  current_node_order INT NOT NULL DEFAULT 1,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_tasks (
  id BIGSERIAL PRIMARY KEY,
  instance_id BIGINT NOT NULL REFERENCES workflow_instances(id),
  node_order INT NOT NULL,
  assignee_type VARCHAR(8) NOT NULL,            -- user | role
  assignee_id BIGINT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  comment TEXT NOT NULL DEFAULT '',
  acted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

动态业务表（模型保存时按 fields 生成）：

```sql
CREATE TABLE biz_1710000000 (
  id BIGSERIAL PRIMARY KEY,
  order_no VARCHAR(255),
  amount DECIMAL(18,4),
  status VARCHAR(255),
  -- ... 业务字段按映射生成
  created_by BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,                       -- 软删除
  wf_status VARCHAR(20),                        -- pending | approved | rejected
  wf_instance_id BIGINT
);
CREATE INDEX idx_biz_1710000000_created_by ON biz_1710000000 (created_by);
```

## 6. 后端实现要点

### 6.1 动态 CRUD（datadynamic 模块）

- 读写走 `db.Table(tableName).Scan/Map`，**SQL 全部参数化**；模型/字段名先经 `data_models.fields` 白名单校验，`filter` 操作符白名单（eq/ne/gt/gte/lt/lte/like/in）
- 可见性：`visibility=owner` → 强制追加 `WHERE created_by = :me`；审批流场景，审批人可见其任务关联的记录（`wf_instance_id IN 我的任务`）
- 写入：校验必填/类型/enum → 注入 `created_by/created_at/updated_at` → 事务提交；`submitWorkflow` 与记录写入、实例/任务创建同事务
- 迁移：新增字段 = 解析 `fields` diff → `ALTER TABLE ADD COLUMN`（映射见 design.md §5）；DDL 失败则整体回滚模型保存
- 动态表命名 `biz_<unix秒>`：自动生成、创建后不可改，避免中文/保留字问题

### 6.2 审批状态机（workflow 模块）

```
submit:    记录.wf_status=pending + 建 instance + 建首节点 task   （同事务）
approve:   校验 task 归属 → 末节点? instance=approved, 记录.wf_status=approved
           : current_node_order+1, 建下一节点 task, 旧 task 置 approved
reject:    instance=rejected, 记录.wf_status=rejected, task 置 rejected
重新提交:   rejected 实例的 record 再次 submit → 实例重置 pending, 回第一节点
```

- `assignee_type=role` 的节点：待办查询按「本人 or 本人角色」匹配；任一处理者通过即流转（会签后置）
- 发起人撤回、抄送：后置

### 6.3 权限中间件

- 全部 `/api/*`（除 login）过 JWT；`/files/*` 白名单后缀直读
- 应用操作校验：admin 全过；非 admin 查 `apps.owner_id` / `app_members` 角色——设计类接口需 designer，运行时只读接口 viewer 可过
- 数据接口：可见性 + 归属校验（§6.1）

## 7. 前端实现要点

```
src/
  schema/types.ts        # SchemaNode/PropValue/EventAction 类型
  components/registry.ts # 组件注册表: {type, name, category, icon,
                         #   defaultProps, inspector(属性面板表单定义), render}
  components/base/       # 基础组件实现（每个组件 = 渲染组件 + 属性面板定义）
  designer/              # Canvas / Palette / Inspector / Outline / dnd-kit
  runtime/               # RuntimeRenderer: 递归渲染 + resolveProps + 事件分发
  runtime/adapter.ts     # 数据请求适配（平台实现；导出时替换）
  admin/                 # 应用/模型/成员/用户管理
  stores/                # zustand：设计器状态、运行时页面状态
```

- **注册表驱动**：设计器面板、属性表单、运行时渲染全部由 `registry` 派生；新增组件 = 注册一条目，两端自动生效
- **渲染器纯净**：`runtime/` 只 import `schema/types` 与 `components/base`；数据请求走 `adapter.ts` 接口（getData/saveData/submitWorkflow/uploadFile…），平台实现注入
- **设计器状态**：`SchemaStore`（树操作：add/remove/move/update props/update events），历史栈（undo/redo）
- **运行时状态**：每页面实例一个 store，按组件 id 持有数据（表格列表、表单值）；事件分发 = `emit(eventName, payload)` → 查 `node.events` 执行动作

## 8. 测试策略

| 层 | 内容 |
| --- | --- |
| 后端单测 | 字段校验、filter 解析（含非法操作符拒绝）、审批状态机转移 |
| 后端集成 | 建模型→建表→CRUD→软删→可见性（owner 越权 403）→提交审批全链路 |
| 前端单测 | resolveProps 求值、SchemaStore 树操作、注册表渲染快照（JSON→元素树） |
| E2E | Playwright：登录→建应用→拖组件→保存→发布→访问运行时→增删改查 |

## 9. 风险与开放项

- 动态表迁移只支持「新增字段」：后续加「改类型/删除」需要设计变更迁移（P2 前定）
- `like` 查询中文分词：v1 用 `%kw%`，量大后考虑 pg_trgm 索引（P2 评估）
- 运行时页面缓存：v1 每次请求读 release，量大后加内存缓存（P2 评估）
- 数据量大的表格：v1 服务端分页直查，不做虚拟滚动（P2 评估）
