import { client, request } from './client'
import type { App } from './types'

export function listApps(): Promise<App[]> {
  return request(client.get('/apps'))
}

export function createApp(data: { name: string; description?: string }): Promise<App> {
  return request(client.post('/apps', data))
}

export function getApp(id: number | string): Promise<App> {
  return request(client.get(`/apps/${id}`))
}

export function updateApp(id: number | string, data: { name?: string; description?: string }): Promise<App> {
  return request(client.put(`/apps/${id}`, data))
}
