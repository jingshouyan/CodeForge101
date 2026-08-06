import { client, request } from './client'
import type { AppPage } from './types'

export function listPages(appId: number | string): Promise<AppPage[]> {
  return request(client.get(`/apps/${appId}/pages`))
}

export function getPage(appId: number | string, pageId: number | string): Promise<AppPage> {
  return request(client.get(`/apps/${appId}/pages/${pageId}`))
}

export function createPage(
  appId: number | string,
  data: { name: string; path: string; schema: string },
): Promise<AppPage> {
  return request(client.post(`/apps/${appId}/pages`, data))
}

export function updatePage(
  appId: number | string,
  pageId: number | string,
  data: { name?: string; path?: string; schema?: string; version: number },
): Promise<AppPage> {
  return request(client.put(`/apps/${appId}/pages/${pageId}`, data))
}

export function deletePage(appId: number | string, pageId: number | string): Promise<null> {
  return request(client.delete(`/apps/${appId}/pages/${pageId}`))
}
