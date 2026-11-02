import { useEffect, useState } from 'react'
import api from '../api/client'
import { AuthContext } from './useAuth'

/** Loads the user the app acts as, for the name in the header. There is no login. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => setUser(null))
  }, [])

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
}
