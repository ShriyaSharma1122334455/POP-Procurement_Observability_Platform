import { post, get } from './client'
import type { User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
  role?: 'procurement_manager' | 'cfo' | 'operations_manager'
}

export interface AuthTokenResponse {
  user: User
  token: string
  expiresIn: number
}

export const authApi = {
  login: (data: LoginCredentials) => post<AuthTokenResponse>('/auth/login', data),
  signup: (data: SignupData) => post<AuthTokenResponse>('/auth/register', data),
  me: () => get<User>('/auth/me'),
  logout: () => post<void>('/auth/logout'),
}
