import { createContext, useContext } from 'react'

export const ToastContext = createContext(() => {})

/** Returns notify(message, type = 'success'); needs a ToastProvider above it. */
export const useToast = () => useContext(ToastContext)
