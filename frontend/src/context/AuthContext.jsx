import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const AuthContext = createContext(null)

export function authHeaders(token) {
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('csr_helper_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('csr_helper_token') || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('csr_helper_user', JSON.stringify(user))
      localStorage.setItem('csr_helper_token', token)
    } else {
      localStorage.removeItem('csr_helper_user')
      localStorage.removeItem('csr_helper_token')
    }
  }, [user, token])

  const login = useCallback(async (username, password) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Invalid username or password')
      }
      const data = await res.json()
      // Backend returns {access_token, user, company_name, email, role}
      setUser({
        id: data.id,
        user: data.user,
        username: data.user,
        email: data.email,
        company_name: data.company_name,
        role: data.role,
      })
      setToken(data.access_token)
      return data
    } catch (err) { setError(err.message); throw err } finally { setLoading(false) }
  }, [])

  const signup = useCallback(async ({ username, email, password, company_name }) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, company_name }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Signup failed')
      }
      const data = await res.json()
      setUser({
        id: data.id,
        user: data.user,
        username: data.user,
        email: data.email,
        company_name: data.company_name,
        role: data.role,
      })
      setToken(data.access_token)
      return data
    } catch (err) { setError(err.message); throw err } finally { setLoading(false) }
  }, [])

  const logout = useCallback(() => {
    setUser(null); setToken(null)
    localStorage.removeItem('csr_helper_user')
    localStorage.removeItem('csr_helper_token')
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = {
    user, token, loading, error,
    isAuthenticated: !!user && !!token,
    login, signup, logout, clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
