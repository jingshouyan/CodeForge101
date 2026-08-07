import type { PageSchema } from '../schema/types'

/** 设计器草稿：未保存的修改在预览时写入 sessionStorage，运行时按 ?draft=1 读取 */
function draftKey(appId: string, pageId: string): string {
  return `codeforge:draft:${appId}:${pageId}`
}

export function readDraft(appId: string, pageId: string): PageSchema | null {
  const raw = sessionStorage.getItem(draftKey(appId, pageId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as PageSchema
  } catch {
    return null
  }
}

export function writeDraft(appId: string, pageId: string, schema: PageSchema): void {
  sessionStorage.setItem(draftKey(appId, pageId), JSON.stringify(schema))
}

export function clearDraft(appId: string, pageId: string): void {
  sessionStorage.removeItem(draftKey(appId, pageId))
}
