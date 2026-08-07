import type { ReactNode } from 'react'

/**
 * 组件注册表：设计器（Palette/Inspector）与渲染器（RuntimeRenderer）共享。
 * 新增组件 = 注册一条目，设计器面板、属性表单、运行时渲染自动生效。
 * M2：静态组件 container / title / text / button；数据组件 M3 加入。
 */
export interface PropField {
  prop: string
  label: string
  control: 'text' | 'textarea' | 'number' | 'select' | 'boolean'
  options?: { label: string; value: string }[]
  default?: unknown
  advanced?: boolean // true 时属性面板默认折叠
}

export interface ComponentDef {
  type: string
  name: string
  category: string
  canHaveChildren: boolean
  defaultProps: Record<string, unknown> // 字面量默认值
  inspector: PropField[]
  render: (props: Record<string, unknown>, children?: ReactNode) => ReactNode
}

export const registry: Record<string, ComponentDef> = {
  container: {
    type: 'container',
    name: '容器',
    category: '布局',
    canHaveChildren: true,
    defaultProps: { layout: 'vertical', gap: 8 },
    inspector: [
      {
        prop: 'layout',
        label: '方向',
        control: 'select',
        options: [
          { label: '竖排', value: 'vertical' },
          { label: '横排', value: 'horizontal' },
        ],
      },
      { prop: 'gap', label: '间距', control: 'number' },
    ],
    render: (props, children) => (
      <div
        className={props.layout === 'horizontal' ? 'flex flex-row' : 'flex flex-col'}
        style={{ gap: typeof props.gap === 'number' ? props.gap : 8 }}
      >
        {children}
      </div>
    ),
  },
  row: {
    type: 'row',
    name: '行',
    category: '布局',
    canHaveChildren: true,
    defaultProps: { gap: 8 },
    inspector: [{ prop: 'gap', label: '间距', control: 'number' }],
    render: (props, children) => (
      <div className="flex flex-row" style={{ gap: typeof props.gap === 'number' ? props.gap : 8 }}>
        {children}
      </div>
    ),
  },
  col: {
    type: 'col',
    name: '列',
    category: '布局',
    canHaveChildren: true,
    defaultProps: { span: 12 },
    inspector: [{ prop: 'span', label: '宽度（1-12 格）', control: 'number' }],
    render: (props, children) => {
      const span = Math.min(Math.max(Number(props.span) || 12, 1), 12)
      return (
        <div className="min-w-0" style={{ flexBasis: `${(span / 12) * 100}%` }}>
          {children}
        </div>
      )
    },
  },
  title: {
    type: 'title',
    name: '标题',
    category: '基础',
    canHaveChildren: false,
    defaultProps: { content: '页面标题' },
    inspector: [{ prop: 'content', label: '内容', control: 'text' }],
    render: (props) => <h2 className="text-lg font-bold text-gray-900">{String(props.content ?? '')}</h2>,
  },
  text: {
    type: 'text',
    name: '文本',
    category: '基础',
    canHaveChildren: false,
    defaultProps: { content: '文本内容' },
    inspector: [{ prop: 'content', label: '内容', control: 'textarea' }],
    render: (props) => <div className="text-sm text-gray-700">{String(props.content ?? '')}</div>,
  },
  button: {
    type: 'button',
    name: '按钮',
    category: '基础',
    canHaveChildren: false,
    defaultProps: { text: '按钮' },
    inspector: [{ prop: 'text', label: '文案', control: 'text' }],
    render: (props) => (
      <button
        type="button"
        className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
      >
        {String(props.text ?? '按钮')}
      </button>
    ),
  },
  divider: {
    type: 'divider',
    name: '分割线',
    category: '基础',
    canHaveChildren: false,
    defaultProps: {},
    inspector: [],
    render: () => <hr className="my-1 border-gray-200" />,
  },
}
