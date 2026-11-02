import { createContext, useContext } from 'react'

export const AuthContext = createContext({ user: null })

/** The user the app acts as; needs an AuthProvider above it. */
export const useAuth = () => useContext(AuthContext)
