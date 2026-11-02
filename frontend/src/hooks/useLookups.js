import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'

/** Lots and categories for dropdowns. */
export default function useLookups() {
  const [data, setData] = useState({ lots: [], categories: [] })
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    api.get('/lookups').then(({ data }) => { setData(data); setError(null) })
      .catch(() => setError('Could not load lots and categories.'))
  }, [])

  useEffect(() => { reload() }, [reload])
  return { ...data, error, reload }
}
