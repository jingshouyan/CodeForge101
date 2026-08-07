import type { SchemaNode } from '../../../schema/types'
import { registry } from '../../../components/registry'
import { useDesignerStore } from '../../../designer/store'

/** 大纲树：层级浏览与选中 */
export function Outline() {
  const root = useDesignerStore((s) => s.root)
  if (!root) return null
  return (
    <div className="p-3">
      <h3 className="mb-2 text-xs font-semibold text-gray-400">大纲</h3>
      <OutlineNode node={root} depth={0} />
    </div>
  )
}

function OutlineNode({ node, depth }: { node: SchemaNode; depth: number }) {
  const selectedId = useDesignerStore((s) => s.selectedId)
  const select = useDesignerStore((s) => s.select)
  const def = registry[node.type]
  const selected = selectedId === node.id
  return (
    <div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          select(node.id)
        }}
        style={{ paddingLeft: depth * 14 + 6 }}
        className={`block w-full truncate rounded px-1 py-0.5 text-left text-sm ${
          selected ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        {def?.name ?? node.type}
      </button>
      {node.children?.map((child) => <OutlineNode key={child.id} node={child} depth={depth + 1} />)}
    </div>
  )
}
