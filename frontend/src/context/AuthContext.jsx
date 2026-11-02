import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext({ user: null })

/** Loads the user the app acts as, for the name in the header. There is no login. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => setUser(null))
  }, [])

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
