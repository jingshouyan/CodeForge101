import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useState } from 'react'
import type { SchemaNode } from '../../../schema/types'
import { resolveProps } from '../../../schema/resolve'
import { registry } from '../../../components/registry'
import { useDesignerStore } from '../../../designer/store'

interface DragInfo {
  source: 'palette' | 'canvas'
  type?: string
  nodeId?: string
  name: string
}

/** 画布节点：可拖（移动到其他容器）+ 可放（作为放置目标）+ 点击选中 */
function CanvasNode({ node }: { node: SchemaNode }) {
  const def = registry[node.type]
  const selectedId = useDesignerStore((s) => s.selectedId)
  const select = useDesignerStore((s) => s.select)
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: node.id,
    data: { source: 'canvas', nodeId: node.id, name: def?.name ?? node.type },
  })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: node.id })
  const setRefs = (el: HTMLDivElement | null) => {
    setDragRef(el)
    setDropRef(el)
  }
  const selected = selectedId === node.id

  return (
    <div
      ref={setRefs}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation()
        select(node.id)
      }}
      className={`rounded p-1 transition-shadow ${isDragging ? 'opacity-40' : ''} ${
        selected ? 'ring-2 ring-blue-500' : isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
      }`}
    >
      {def.render(
        resolveProps(node.props),
        node.children?.map((child) => <CanvasNode key={child.id} node={child} />),
      )}
    </div>
  )
}

export function Canvas() {
  const root = useDesignerStore((s) => s.root)
  const addNode = useDesignerStore((s) => s.addNode)
  const moveNode = useDesignerStore((s) => s.moveNode)
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function onDragStart(e: DragStartEvent) {
    const data = e.active.data.current as DragInfo | undefined
    if (data) setDragInfo(data)
  }

  function onDragEnd(e: DragEndEvent) {
    setDragInfo(null)
    const { active, over } = e
    if (!over) return
    const data = active.data.current as DragInfo | undefined
    if (!data) return
    if (data.source === 'palette' && data.type) {
      addNode(data.type, String(over.id)) // 追加到放置容器末尾
    } else if (data.source === 'canvas' && data.nodeId) {
      moveNode(data.nodeId, String(over.id), Number.MAX_SAFE_INTEGER) // 追加
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {root ? <CanvasNode node={root} /> : null}
      <DragOverlay>
        {dragInfo && (
          <div className="rounded border border-blue-300 bg-white px-3 py-1.5 text-sm text-blue-600 shadow">
            {dragInfo.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
