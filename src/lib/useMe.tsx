import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../auth/AuthProvider'

export interface Me { userId: string; workspaceId: string; name: string; title: string | null; avatar: string | null; role: string; perms: string[]; theme: string }
const C = createContext<{ me: Me | null; reload: () => void }>({ me: null, reload: () => {} })
export const useMe = () => useContext(C)

// Loads the signed-in person's membership. Only an ACTIVE member gets a value; everything else is blocked by RequireMember.
export function MeProvider({ children, onState }: { children: ReactNode; onState: (s: 'ok' | 'denied' | 'error') => void }) {
  const { userId } = useAuth()
  const [me, setMe] = useState<Me | null>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const m = await supabase.from('workspace_members').select('workspace_id,role').eq('user_id', userId).eq('active', true).limit(1).maybeSingle()
      if (m.error) return onState('error')
      if (!m.data) return onState('denied')
      const [p, perms] = await Promise.all([
        supabase.from('profiles').select('full_name,job_title,avatar_url,theme').eq('id', userId).single(),
        supabase.rpc('my_permissions', { ws: m.data.workspace_id })
      ])
      if (p.error) return onState('error')
      setMe({ userId, workspaceId: m.data.workspace_id, name: p.data.full_name || 'Team member', title: p.data.job_title, avatar: p.data.avatar_url, role: m.data.role, perms: (perms.data as string[]) ?? [], theme: p.data.theme })
      onState('ok')
    })()
  }, [userId, n, onState])
  return <C.Provider value={{ me, reload: () => setN(x => x + 1) }}>{children}</C.Provider>
}
