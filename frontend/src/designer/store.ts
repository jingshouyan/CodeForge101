import { create } from 'zustand'
import type { PageSchema, PropValue, SchemaNode } from '../schema/types'
import { registry } from '../components/registry'
import { findNode, insertNode, isDescendant, moveNode as moveInTree, removeNode as removeFromTree, updateNode } from './tree'

interface DesignerState {
  root: SchemaNode | null
  selectedId: string | null
  past: PageSchema[] // undo 栈
  future: PageSchema[] // redo 栈
  load: (schema: PageSchema) => void
  select: (id: string | null) => void
  addNode: (type: string, parentId: string, index?: number) => void
  removeNode: (id: string) => void
  moveNode: (id: string, targetParentId: string, index: number) => void
  updateProp: (id: string, prop: string, value: unknown) => void
  undo: () => void
  redo: () => void
}

const MAX_HISTORY = 100

function uid(): string {
  return crypto.randomUUID()
}

function snapshot(root: SchemaNode): PageSchema {
  return { version: '1.0', root: structuredClone(root) }
}

/** 默认 props 转规范格式 { kind: 'literal', value } */
function literalProps(defaults: Record<string, unknown>): Record<string, PropValue> {
  const props: Record<string, PropValue> = {}
  for (const [k, v] of Object.entries(defaults)) {
    props[k] = { kind: 'literal', value: v }
  }
  return props
}

export const useDesignerStore = create<DesignerState>((set) => ({
  root: null,
  selectedId: null,
  past: [],
  future: [],

  load: (schema) => set({ root: schema.root, selectedId: null, past: [], future: [] }),

  select: (id) => set({ selectedId: id }),

  addNode: (type, parentId, index) =>
    set((s) => {
      if (!s.root) return s
      const parent = findNode(s.root, parentId)
      const def = registry[type]
      if (!parent || !def) return s
      const node: SchemaNode = {
        id: uid(),
        type,
        props: literalProps(def.defaultProps),
        children: def.canHaveChildren ? [] : undefined,
      }
      const insertAt = index ?? parent.children?.length ?? 0
      const newRoot = insertNode(s.root, node, parentId, insertAt)
      return {
        root: newRoot,
        past: [...s.past, snapshot(s.root)].slice(-MAX_HISTORY),
        future: [],
        selectedId: node.id,
      }
    }),

  removeNode: (id) =>
    set((s) => {
      if (!s.root || s.root.id === id) return s
      const newRoot = removeFromTree(s.root, id)
      if (newRoot === s.root) return s
      return {
        root: newRoot,
        past: [...s.past, snapshot(s.root)].slice(-MAX_HISTORY),
        future: [],
        selectedId: s.selectedId === id ? null : s.selectedId,
      }
    }),

  moveNode: (id, targetParentId, index) =>
    set((s) => {
      if (!s.root || id === targetParentId || isDescendant(s.root, id, targetParentId)) return s
      const newRoot = moveInTree(s.root, id, targetParentId, index)
      return {
        root: newRoot,
        past: [...s.past, snapshot(s.root)].slice(-MAX_HISTORY),
        future: [],
      }
    }),

  updateProp: (id, prop, value) =>
    set((s) => {
      if (!s.root) return s
      const newRoot = updateNode(s.root, id, (node) => ({
        ...node,
        props: { ...node.props, [prop]: { kind: 'literal', value } },
      }))
      if (newRoot === s.root) return s
      return {
        root: newRoot,
        past: [...s.past, snapshot(s.root)].slice(-MAX_HISTORY),
        future: [],
      }
    }),

  undo: () =>
    set((s) => {
      if (!s.root || s.past.length === 0) return s
      const prev = s.past[s.past.length - 1]
      return {
        root: structuredClone(prev.root),
        past: s.past.slice(0, -1),
        future: [...s.future, snapshot(s.root)].slice(-MAX_HISTORY),
      }
    }),

  redo: () =>
    set((s) => {
      if (!s.root || s.future.length === 0) return s
      const next = s.future[s.future.length - 1]
      return {
        root: structuredClone(next.root),
        future: s.future.slice(0, -1),
        past: [...s.past, snapshot(s.root)].slice(-MAX_HISTORY),
      }
    }),
}))
