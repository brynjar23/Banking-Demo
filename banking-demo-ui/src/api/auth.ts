import client from './client'

export interface AuthResponse {
  token: string
  fullName: string
  email: string
}

export const register = (fullName: string, email: string, password: string) =>
  client.post<AuthResponse>('/api/Auth/register', { fullName, email, password })

export const login = (email: string, password: string) =>
  client.post<AuthResponse>('/api/Auth/login', { email, password })