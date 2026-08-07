import { describe, expect, it } from 'vitest'
import type { SchemaNode } from '../schema/types'
import { findNode, findParent, insertNode, isDescendant, moveNode, removeNode, updateNode } from './tree'

function n(id: string, children: SchemaNode[] = []): SchemaNode {
  return { id, type: 'container', children }
}

const tree = n('root', [n('a', [n('a1'), n('a2')]), n('b')])

describe('tree', () => {
  it('findNode 命中与未命中', () => {
    expect(findNode(tree, 'a1')?.id).toBe('a1')
    expect(findNode(tree, 'x')).toBeNull()
  })

  it('findParent 返回父节点与下标', () => {
    expect(findParent(tree, 'a2')).toEqual({ parent: findNode(tree, 'a')!, index: 1 })
    expect(findParent(tree, 'root')).toBeNull()
  })

  it('insertNode 插入到指定位置', () => {
    const next = insertNode(tree, n('a3'), 'a', 1)
    expect(next.children![0].children!.map((c) => c.id)).toEqual(['a1', 'a3', 'a2'])
  })

  it('insertNode 越界 index 插入末尾', () => {
    const next = insertNode(tree, n('c'), 'root', 99)
    expect(next.children!.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })

  it('removeNode 删除节点并保留兄弟', () => {
    const next = removeNode(tree, 'a1')
    expect(findNode(next, 'a')!.children!.map((c) => c.id)).toEqual(['a2'])
  })

  it('removeNode 根节点不可删', () => {
    expect(removeNode(tree, 'root')).toBe(tree)
  })

  it('moveNode 跨父移动', () => {
    const next = moveNode(tree, 'a2', 'b', 0)
    expect(findNode(next, 'a')!.children!.map((c) => c.id)).toEqual(['a1'])
    expect(findNode(next, 'b')!.children!.map((c) => c.id)).toEqual(['a2'])
  })

  it('moveNode 同父下移时修正 index', () => {
    // a 的子节点 [a1, a2]，把 a1 移到 index 2（即 a2 之后）
    const next = moveNode(tree, 'a1', 'a', 2)
    expect(findNode(next, 'a')!.children!.map((c) => c.id)).toEqual(['a2', 'a1'])
  })

  it('moveNode 同父上移', () => {
    const next = moveNode(tree, 'a2', 'a', 0)
    expect(findNode(next, 'a')!.children!.map((c) => c.id)).toEqual(['a2', 'a1'])
  })

  it('isDescendant 防自嵌套', () => {
    expect(isDescendant(tree, 'a', 'a1')).toBe(true)
    expect(isDescendant(tree, 'a', 'a')).toBe(true)
    expect(isDescendant(tree, 'a', 'b')).toBe(false)
    expect(isDescendant(tree, 'x', 'a')).toBe(false)
  })

  it('updateNode 未命中时返回原引用', () => {
    const next = updateNode(tree, 'x', (node) => ({ ...node }))
    expect(next).toBe(tree)
  })

  it('updateNode 命中时更新', () => {
    const next = updateNode(tree, 'a1', (node) => ({ ...node, type: 'text' }))
    expect(findNode(next, 'a1')!.type).toBe('text')
    expect(findNode(tree, 'a1')!.type).toBe('container') // 原树不变
  })
})
