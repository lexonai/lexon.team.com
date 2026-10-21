import { createContext, useContext } from 'react'
// Resolved once by RequireAuth after the database confirmed an ACTIVE membership.
export interface Me { workspaceId: string; userId: string; role: 'owner' | 'admin' | 'member'; name: string; avatar: string | null; perms: string[] }
export const MeCtx = createContext<Me | null>(null)
export const useMe = () => { const m = useContext(MeCtx); if (!m) throw new Error('No workspace'); return m }
