import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
export default function Mfa({ onDone }: { onDone: () => void }) {
  const { signOut } = useAuth()
  const [factor, setFactor] = useState<string | null>(null); const [code, setCode] = useState(''); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  useEffect(() => { supabase.auth.mfa.listFactors().then(({ data, error }) => error ? setErr(error.message) : setFactor(data?.totp?.[0]?.id ?? null)) }, [])
  const go = async (e: React.FormEvent) => { e.preventDefault(); if (!factor) return; setBusy(true); setErr(null); const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor, code }); if (error) { setErr('Invalid code. Try again.'); setBusy(false); return } onDone() }
  return <div className="grid min-h-screen place-items-center p-4"><form onSubmit={go} className="card w-full max-w-sm space-y-4 p-8 text-center"><h1 className="text-xl font-semibold">Two-step check</h1><p className="text-sm text-slate-500">Enter the 6-digit code from your authenticator app.</p>
    <input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-line py-3 text-center text-2xl tracking-[0.4em]" aria-label="6-digit code" />
    {err && <p role="alert" className="text-sm text-red-600">{err}</p>}<button disabled={busy || code.length !== 6 || !factor} className="btn-primary w-full disabled:opacity-50">Verify</button><button type="button" onClick={() => signOut()} className="text-sm text-slate-500">Sign out</button></form></div>
}
