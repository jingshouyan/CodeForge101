import { useDraggable } from '@dnd-kit/core'
import { useMemo } from 'react'
import { registry, type ComponentDef } from '../../../components/registry'
import { useDesignerStore } from '../../../designer/store'
import { findNode } from '../../../designer/tree'

/** 组件面板：按分类分组；拖拽到画布 或 点击添加到选中容器 */
export function Palette() {
  const root = useDesignerStore((s) => s.root)
  const selectedId = useDesignerStore((s) => s.selectedId)
  const addNode = useDesignerStore((s) => s.addNode)

  const groups = useMemo(() => {
    const g: Record<string, ComponentDef[]> = {}
    for (const def of Object.values(registry)) {
      ;(g[def.category] ??= []).push(def)
    }
    return g
  }, [])

  function addToBestParent(type: string) {
    if (!root) return
    const selected = selectedId ? findNode(root, selectedId) : null
    const parent = selected && registry[selected.type]?.canHaveChildren && selectedId ? selectedId : root.id
    addNode(type, parent)
  }

  return (
    <aside className="flex w-56 flex-col gap-4 overflow-auto border-r bg-white p-3">
      {Object.entries(groups).map(([cat, defs]) => (
        <div key={cat}>
          <h3 className="mb-2 text-xs font-semibold text-gray-400">{cat}</h3>
          <div className="flex flex-col gap-1.5">
            {defs.map((def) => (
              <PaletteItem key={def.type} def={def} onAdd={() => addToBestParent(def.type)} />
            ))}
          </div>
        </div>
      ))}
    </aside>
  )
}

function PaletteItem({ def, onAdd }: { def: ComponentDef; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${def.type}`,
    data: { source: 'palette', type: def.type, name: def.name },
  })
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onAdd}
      className={`rounded border px-3 py-2 text-left text-sm hover:border-blue-400 hover:text-blue-600 ${
        isDragging ? 'opacity-40' : 'border-gray-200 text-gray-700'
      }`}
    >
      {def.name}
    </button>
  )
}
