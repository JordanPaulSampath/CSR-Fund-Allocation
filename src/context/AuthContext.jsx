import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const AuthContext = createContext(null)

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

  // Persist user + token to localStorage
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('csr_helper_user', JSON.stringify(user))
      localStorage.setItem('csr_helper_token', token)
    } else {
      localStorage.removeItem('csr_helper_user')
      localStorage.removeItem('csr_helper_token')
    }
  }, [user, token])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Invalid email or password')
      }
      const data = await res.json()
      setUser(data.user)
      setToken(data.token)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const signup = useCallback(async (companyData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Signup failed')
      }
      const data = await res.json()
      setUser(data.user)
      setToken(data.token)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Update failed')
      }
      const data = await res.json()
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [token])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('csr_helper_user')
    localStorage.removeItem('csr_helper_token')
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    updateProfile,
    logout,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
