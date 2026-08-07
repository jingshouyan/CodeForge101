import type { SchemaNode } from '../schema/types'

export function findNode(root: SchemaNode, id: string): SchemaNode | null {
  if (root.id === id) return root
  for (const child of root.children ?? []) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export interface ParentRef {
  parent: SchemaNode
  index: number
}

export function findParent(root: SchemaNode, id: string): ParentRef | null {
  const children = root.children ?? []
  for (let i = 0; i < children.length; i++) {
    if (children[i].id === id) return { parent: root, index: i }
    const found = findParent(children[i], id)
    if (found) return found
  }
  return null
}

/** id 是否在 ancestorId 的子树内（含自身），用于防自嵌套 */
export function isDescendant(root: SchemaNode, ancestorId: string, id: string): boolean {
  const ancestor = findNode(root, ancestorId)
  if (!ancestor) return false
  return findNode(ancestor, id) !== null
}

/** 向 parentId 节点的 children[index] 位置插入 node（index 越界则插入末尾） */
export function insertNode(root: SchemaNode, node: SchemaNode, parentId: string, index: number): SchemaNode {
  return updateNode(root, parentId, (parent) => {
    const children = [...(parent.children ?? [])]
    children.splice(index, 0, node)
    return { ...parent, children }
  })
}

/** 删除 id 节点（根节点不可删，直接返回原树） */
export function removeNode(root: SchemaNode, id: string): SchemaNode {
  if (root.id === id) return root
  const ref = findParent(root, id)
  if (!ref) return root
  return updateNode(root, ref.parent.id, (parent) => ({
    ...parent,
    children: (parent.children ?? []).filter((c) => c.id !== id),
  }))
}

/** 移动 id 节点到 targetParentId.children[index]；同父移动自动修正 index */
export function moveNode(root: SchemaNode, id: string, targetParentId: string, index: number): SchemaNode {
  const node = findNode(root, id)
  const ref = findParent(root, id)
  if (!node || !ref) return root

  if (ref.parent.id === targetParentId) {
    const children = [...(ref.parent.children ?? [])]
    const [removed] = children.splice(ref.index, 1)
    const insertAt = index > ref.index ? index - 1 : index
    children.splice(insertAt, 0, removed)
    return updateNode(root, ref.parent.id, (parent) => ({ ...parent, children }))
  }
  const without = removeNode(root, id)
  return insertNode(without, node, targetParentId, index)
}

/** 对 id 节点应用 fn；未命中或未变更时返回原引用 */
export function updateNode(root: SchemaNode, id: string, fn: (node: SchemaNode) => SchemaNode): SchemaNode {
  if (root.id === id) return fn(root)
  const children = root.children?.map((c) => updateNode(c, id, fn))
  if (children && children.some((c, i) => c !== root.children![i])) {
    return { ...root, children }
  }
  return root
}
