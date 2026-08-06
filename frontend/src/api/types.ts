export interface User {
  id: number
  username: string
  nickname: string
  role: string
}

export interface App {
  id: number
  name: string
  icon: string
  description: string
  ownerId: number
  status: string
  createdAt: string
  updatedAt: string
  owner?: User
}

export interface AppPage {
  id: number
  appId: number
  name: string
  path: string
  schema: string
  version: number
  createdBy: number
  createdAt: string
  updatedAt: string
}
