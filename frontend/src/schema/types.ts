// Schema 类型定义：与 docs/detailed-design.md §3 对应
export interface PageSchema {
  version: string
  root: SchemaNode
}

export interface SchemaNode {
  id: string
  type: string
  props?: Record<string, PropValue>
  children?: SchemaNode[]
  events?: Record<string, EventAction>
}

export type PropValue =
  | { kind: 'literal'; value: unknown }
  | { kind: 'binding'; path: string }
  | { kind: 'expr'; expr: string }

export interface EventAction {
  type: string
  targetId?: string
  params?: Record<string, unknown>
}
