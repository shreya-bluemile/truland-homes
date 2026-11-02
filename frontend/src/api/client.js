import axios from 'axios'

// No login: the API acts as the main user for every request (see backend UseDefaultUser).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { Accept: 'application/json' },
})

/** Turns an Axios error into a readable message and a field → message map for forms. */
export function parseApiError(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data
  const fieldErrors = {}
  if (data?.errors) {
    for (const [field, messages] of Object.entries(data.errors)) fieldErrors[field] = messages[0]
  }
  let message = data?.message || fallback
  if (!error?.response) message = 'Could not reach the server. Check that the app is running and try again.'
  return { message, fieldErrors }
}

export default api
