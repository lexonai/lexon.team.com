import { useCallback, useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { MeCtx, type Me } from './Workspace'
import { supabase } from '../lib/supabase'
import Mfa from '../pages/Mfa'

type S = { k: 'checking' } | { k: 'mfa' } | { k: 'denied' } | { k: 'error' } | { k: 'ok'; me: Me }

// A valid session is NOT enough. The account must be an ACTIVE member of the workspace (checked in the database).
// Deactivated people are stopped here and, independently, by every RLS policy.
export default function RequireAuth() {
  const { userId, loading, signOut } = useAuth()
  const [s, setS] = useState<S>({ k: 'checking' })
  const check = useCallback(async () => {
    if (!userId) return
    const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal.error || !aal.data) return setS({ k: 'error' })
    if (aal.data.nextLevel === 'aal2' && aal.data.currentLevel !== 'aal2') return setS({ k: 'mfa' })
    const m = await supabase.from('workspace_members').select('workspace_id,role').eq('user_id', userId).eq('active', true).limit(1).maybeSingle()
    if (m.error) return setS({ k: 'error' })
    if (!m.data) return setS({ k: 'denied' })
    const [p, perms] = await Promise.all([supabase.from('profiles').select('full_name,avatar_url').eq('id', userId).maybeSingle(), supabase.rpc('my_permissions', { ws: m.data.workspace_id })])
    setS({ k: 'ok', me: { workspaceId: m.data.workspace_id, userId, role: m.data.role as Me['role'], name: p.data?.full_name || 'Me', avatar: p.data?.avatar_url ?? null, perms: (perms.data as string[] | null) ?? [] } })
  }, [userId])
  useEffect(() => { if (userId) { setS({ k: 'checking' }); void check() } }, [userId, check])

  if (loading) return <div className="p-10 text-slate-500">Loading…</div>
  if (!userId) return <Navigate to="/login" replace />
  if (s.k === 'checking') return <div className="p-10 text-slate-500">Checking access…</div>
  if (s.k === 'error') return <div className="p-10 text-red-600" role="alert">Could not verify your access. <button className="underline" onClick={check}>Retry</button></div>
  if (s.k === 'denied') return <div className="grid min-h-screen place-items-center p-6"><div className="card max-w-sm p-6 text-center" role="alert"><p className="font-semibold">Access removed</p><p className="mt-1 text-sm text-slate-500">This account is not an active member. Ask your admin.</p><button className="btn-primary mt-4" onClick={() => signOut()}>Sign out</button></div></div>
  if (s.k === 'mfa') return <Mfa onDone={() => { setS({ k: 'checking' }); void check() }} />
  return <MeCtx.Provider value={s.me}><Outlet /></MeCtx.Provider>
}
