import type { ReactNode } from 'react'

/**
 * 组件注册表：设计器与渲染器共享。
 * M1 只含静态组件（container/text/button），数据组件 M3 加入。
 */
export interface ComponentDef {
  type: string
  name: string
  render: (props: Record<string, unknown>, children?: ReactNode) => ReactNode
}

export const registry: Record<string, ComponentDef> = {
  container: {
    type: 'container',
    name: '容器',
    render: (props, children) => (
      <div
        className={props.layout === 'horizontal' ? 'flex flex-row' : 'flex flex-col'}
        style={{ gap: typeof props.gap === 'number' ? props.gap : 8 }}
      >
        {children}
      </div>
    ),
  },
  text: {
    type: 'text',
    name: '文本',
    render: (props) => <div className="text-sm text-gray-800">{String(props.content ?? '')}</div>,
  },
  button: {
    type: 'button',
    name: '按钮',
    render: (props) => (
      <button
        type="button"
        className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
      >
        {String(props.text ?? '按钮')}
      </button>
    ),
  },
}
