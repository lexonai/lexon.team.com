import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const IDLE_MINUTES = 60
interface Ctx { session: Session | null; userId: string | null; loading: boolean; signOut: () => Promise<void> }
const C = createContext<Ctx>({ session: null, userId: null, loading: true, signOut: async () => {} })
export const useAuth = () => useContext(C)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const ref = useRef<Session | null>(null); ref.current = session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  const signOut = useCallback(async () => { await supabase.auth.signOut(); setSession(null) }, [])
  useEffect(() => {
    if (!session) return
    let t: ReturnType<typeof setTimeout>
    const reset = () => { clearTimeout(t); t = setTimeout(() => { void signOut() }, IDLE_MINUTES * 60000) }
    const evs = ['pointerdown', 'keydown', 'touchstart'] as const
    evs.forEach(e => window.addEventListener(e, reset, { passive: true })); reset()
    return () => { clearTimeout(t); evs.forEach(e => window.removeEventListener(e, reset)) }
  }, [session, signOut])
  return <C.Provider value={{ session, userId: session?.user.id ?? null, loading, signOut }}>{children}</C.Provider>
}
