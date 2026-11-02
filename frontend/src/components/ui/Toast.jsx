import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(() => {})

/** Small confirmation / error messages in the top-right corner. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const notify = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((list) => [...list, { id, message, type }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), type === 'error' ? 7000 : 4000)
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed right-[22px] top-[70px] z-50 flex w-[360px] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role={t.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto rounded-[4px] border px-[14px] py-[10px] text-[12px] shadow-menu ${t.type === 'error' ? 'border-[#f5c2c7] bg-[#fdebed] text-[#a3000e]' : 'border-[#b7e0c4] bg-[#e8f5ed] text-[#1c6b3f]'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
