import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { callFn } from '../lib/functions'
import { useAuth } from '../auth/AuthProvider'
import Logo from '../components/Logo'

// Email -> authorization check -> code -> access. No registration form: only people an Admin invited can get in.
export default function Login() {
  const { userId } = useAuth()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { const q = new URLSearchParams(location.hash.split('?')[1] ?? '').get('email'); if (q) setEmail(q) }, [])
  if (userId) return <Navigate to="/" replace />

  const start = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null)
    try { await callFn('team-access', { action: 'start', email: email.trim().toLowerCase() }); setStep('code') }
    catch (err) { setError((err as Error).message) }
    setBusy(false)
  }
  const verify = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null)
    const em = email.trim().toLowerCase()
    try {
      // 1) invitation code (first sign-in)  2) emailed 6-digit code (returning members). Same error for every failure.
      const r = await callFn<{ ok: boolean; token_hash?: string }>('team-access', { action: 'verify', email: em, code })
      if (r.ok && r.token_hash) {
        const v = await supabase.auth.verifyOtp({ token_hash: r.token_hash, type: 'magiclink' })
        if (!v.error) return
      } else {
        const v = await supabase.auth.verifyOtp({ email: em, token: code.replace(/\s/g, ''), type: 'email' })
        if (!v.error) return
      }
      setError('That code is not valid. Check it, or ask your admin for a new one.')
    } catch (err) { setError((err as Error).message) }
    setBusy(false)
  }
  const inp = 'w-full rounded-xl border border-line bg-white px-3 py-3 text-base'
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-5 w-fit"><Logo size={56} /></div>
        <h1 className="text-xl font-semibold">Lexon Team</h1>
        <p className="mt-1 text-sm text-slate-500">Only people invited by their workspace admin can sign in.</p>
        {step === 'email' ? (
          <form onSubmit={start} className="mt-6 space-y-3 text-left">
            <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your work email" aria-label="Email" className={inp} autoFocus />
            <button disabled={busy || !email} className="btn-primary w-full py-3 disabled:opacity-60">{busy ? 'Please wait…' : 'Continue'}</button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-6 space-y-3 text-left">
            <p className="text-center text-sm text-slate-600">Enter the <b>invitation code</b> from your admin, or the 6-digit code we emailed to <b>{email}</b>.</p>
            <input required autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} placeholder="Code" aria-label="Code" className={`${inp} text-center font-mono tracking-[0.2em]`} autoFocus maxLength={40} />
            <button disabled={busy || code.replace(/\W/g, '').length < 6} className="btn-primary w-full py-3 disabled:opacity-60">{busy ? 'Checking…' : 'Sign in'}</button>
            <button type="button" onClick={() => { setStep('email'); setCode(''); setError(null) }} className="w-full text-center text-sm text-slate-500">Use a different email</button>
          </form>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
