import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface AuthUser {
  token: string
  fullName: string
  email: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>(null!)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = localStorage.getItem('token')
    const fullName = localStorage.getItem('fullName')
    const email = localStorage.getItem('email')
    if (token && fullName && email) return { token, fullName, email }
    return null
  })

  const login = (userData: AuthUser) => {
    localStorage.setItem('token', userData.token)
    localStorage.setItem('fullName', userData.fullName)
    localStorage.setItem('email', userData.email)
    setUser(userData)
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)