import type { SchemaNode } from '../schema/types'
import { resolveProps } from '../schema/resolve'
import { registry } from '../components/registry'

export function RuntimeRenderer({ node }: { node: SchemaNode }) {
  const def = registry[node.type]
  if (!def) {
    return <div className="text-sm text-red-500">未知组件：{node.type}</div>
  }
  const children = node.children?.map((child) => <RuntimeRenderer key={child.id} node={child} />)
  return <>{def.render(resolveProps(node.props), children)}</>
}
