import type { SchemaNode, PropValue } from '../schema/types'
import { registry } from './registry'

/** 求值 props：M1 仅支持 literal；binding(M3)/expr(M7) 返回 undefined 占位 */
function resolveProp(pv: PropValue | undefined): unknown {
  if (!pv) return undefined
  if (pv.kind === 'literal') return pv.value
  return undefined
}

export function RuntimeRenderer({ node }: { node: SchemaNode }) {
  const def = registry[node.type]
  if (!def) {
    return <div className="text-sm text-red-500">未知组件：{node.type}</div>
  }
  const props: Record<string, unknown> = {}
  for (const [key, pv] of Object.entries(node.props ?? {})) {
    props[key] = resolveProp(pv)
  }
  const children = node.children?.map((child) => <RuntimeRenderer key={child.id} node={child} />)
  return <>{def.render(props, children)}</>
}
