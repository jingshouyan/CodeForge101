import axios from 'axios'
import { useAuthStore } from '../stores/auth'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export const client = axios.create({ baseURL: '/api' })

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

/** 解包统一响应 {code, message, data}，业务错误抛异常 */
export async function request<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise
  if (res.data.code !== 0) throw new Error(res.data.message)
  return res.data.data
}
