import { client, request } from './client'
import type { User } from './types'

export interface LoginResult {
  token: string
  user: User
}

export function login(username: string, password: string): Promise<LoginResult> {
  return request(client.post('/auth/login', { username, password }))
}

export function fetchMe(): Promise<User> {
  return request(client.get('/auth/me'))
}
