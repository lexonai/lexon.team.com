import { useCallback, useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { MeProvider } from './lib/useMe'
import { envError } from './lib/env'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import MfaChallenge from './pages/MfaChallenge'
import Layout from './Layout'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Projects from './pages/Projects'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Performance from './pages/Performance'
import Profile from './pages/Profile'

// A valid session is not enough: 2FA (if enabled) must be done AND the account must be an ACTIVE workspace member.
// Both are re-checked by the database on every request; this screen is only the friendly face of that.
function Gate() {
  const { userId, loading, signOut } = useAuth()
  const [state, setState] = useState<'checking' | 'ok' | 'denied' | 'error' | 'mfa'>('checking')
  const [mfaChecked, setMfaChecked] = useState(false)
  const onState = useCallback((s: 'ok' | 'denied' | 'error') => setState(s), [])
  const checkMfa = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (error || !data) return setState('error')
    if (data.nextLevel === 'aal2' && data.currentLevel !== 'aal2') setState('mfa'); else setMfaChecked(true)
  }, [])
  useEffect(() => { if (userId && !mfaChecked) void checkMfa() }, [userId, mfaChecked, checkMfa])
  if (loading) return <p className="p-10 text-slate-500">Loading…</p>
  if (!userId) return <Navigate to="/login" replace />
  if (!mfaChecked && state !== 'mfa') return <p className="p-10 text-slate-500">Checking security…</p>
  if (state === 'mfa') return <MfaChallenge onDone={() => { setState('checking'); setMfaChecked(true) }} />
  return (
    <MeProvider onState={onState}>
      {state === 'denied' ? <div className="grid min-h-dvh place-items-center p-6"><div className="card max-w-sm p-6 text-center" role="alert"><p className="font-semibold">Access removed</p><p className="mt-1 text-sm text-slate-500">This account is not an active member. Ask your admin.</p><button className="btn-primary mt-4" onClick={() => signOut()}>Sign out</button></div></div>
        : state === 'error' ? <p className="p-10 text-red-600" role="alert">Could not verify your session. Reload.</p>
        : state === 'ok' ? <Layout /> : <p className="p-10 text-slate-500">Loading…</p>}
    </MeProvider>
  )
}

export default function App() {
  if (envError) return <div className="m-8 card p-6 text-red-600" role="alert">{envError}</div>
  return (
    <HashRouter><AuthProvider><Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Gate />}>
        <Route index element={<Home />} /><Route path="/tasks" element={<Tasks />} /><Route path="/projects" element={<Projects />} />
        <Route path="/messages" element={<Messages />} /><Route path="/notifications" element={<Notifications />} />
        <Route path="/performance" element={<Performance />} /><Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes></AuthProvider></HashRouter>
  )
}
