import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/layout/Logo'
import { useAuth } from '../context/AuthContext'
import { parseApiError } from '../api/client'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={location.state?.from || '/contractor-quotations'} replace />

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage('')
    try {
      await login(form.email, form.password)
      navigate(location.state?.from || '/contractor-quotations', { replace: true })
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err)
      setErrors(fieldErrors)
      if (!Object.keys(fieldErrors).length) setMessage(message)
    } finally {
      setSubmitting(false)
    }
  }

  const input = 'w-full rounded-[4px] border-[0.909px] border-line-input px-[13px] py-[10px] text-[12px] text-ink outline-none focus:border-brand'

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-[#727272] to-[#3d3d3d] p-4">
      <form onSubmit={submit} noValidate className="w-full max-w-[400px] rounded-[16px] bg-white px-[30px] py-[34px] shadow-xl">
        <div className="mb-[28px] text-center"><Logo variant="dark" size="lg" /></div>
        <h1 className="mb-[18px] text-[18px] font-medium text-black">Sign in</h1>
        {message && <p role="alert" className="mb-3 rounded-[4px] bg-[#fdebed] px-3 py-2 text-[12px] text-brand-bright">{message}</p>}
        <label className="mb-[6px] block text-[12px] font-bold text-ink-label" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="username" className={input} value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        {errors.email && <p className="mt-1 text-[11px] text-brand-bright">{errors.email}</p>}
        <label className="mb-[6px] mt-[14px] block text-[12px] font-bold text-ink-label" htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" className={input} value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {errors.password && <p className="mt-1 text-[11px] text-brand-bright">{errors.password}</p>}
        <button type="submit" disabled={submitting}
          className="mt-[24px] h-[44px] w-full rounded-[8px] bg-brand-bright text-[15px] font-semibold text-white disabled:opacity-60">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
