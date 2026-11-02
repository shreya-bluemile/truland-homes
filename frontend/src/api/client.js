import axios from 'axios'

const TOKEN_KEY = 'truland_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired or revoked token sends the user back to the login page.
    if (error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear()
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(error)
  },
)

/** Turns an Axios error into a readable message and a field → message map for forms. */
export function parseApiError(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data
  const fieldErrors = {}
  if (data?.errors) {
    for (const [field, messages] of Object.entries(data.errors)) fieldErrors[field] = messages[0]
  }
  let message = data?.message || fallback
  if (!error?.response) message = 'Could not reach the server. Check your connection and try again.'
  return { message, fieldErrors }
}

export default api
