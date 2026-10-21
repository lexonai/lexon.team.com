import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Bell, FolderKanban, Home, ListChecks, MessageSquare, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useMe } from '../auth/Workspace'
import { Avatar } from './ui'

const NAV = [
  { to: '/', icon: Home, label: 'Home', end: true }, { to: '/tasks', icon: ListChecks, label: 'Tasks' }, { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' }, { to: '/notifications', icon: Bell, label: 'Alerts' }, { to: '/performance', icon: BarChart3, label: 'Performance' }, { to: '/profile', icon: User, label: 'Profile' }
]

export default function Layout() {
  const me = useMe()
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    const load = async () => { const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', me.userId).is('read_at', null); setUnread(count ?? 0) }
    void load()
    const ch = supabase.channel('team-unread').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${me.userId}` }, p => {
      void load()
      const n = p.new as { title: string; body: string | null }
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) new Notification(n.title, { body: n.body ?? '', icon: './icon-192.png' })
    }).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${me.userId}` }, () => void load()).subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [me.userId])

  // presence heartbeat (own row only; RLS enforces that)
  useEffect(() => {
    const beat = () => { if (!document.hidden) void supabase.from('profiles').update({ presence: 'online', last_seen: new Date().toISOString() }).eq('id', me.userId) }
    beat(); const t = setInterval(beat, 60000); return () => clearInterval(t)
  }, [me.userId])

  const link = (n: typeof NAV[number], mobile: boolean) => (
    <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => mobile
      ? `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${isActive ? 'text-brand' : 'text-slate-500'}`
      : `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-soft text-brand' : 'text-slate-600 hover:bg-slate-50'}`}>
      <span className="relative"><n.icon size={mobile ? 20 : 18} />{n.to === '/notifications' && unread > 0 && <i className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] not-italic text-white">{unread > 9 ? '9+' : unread}</i>}</span>{n.label}
    </NavLink>)
  return (
    <div className="min-h-dvh md:flex">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-white p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-bold text-white">L</span><span className="font-semibold">Lexon Team</span></div>
        <nav className="space-y-1">{NAV.map(n => link(n, false))}</nav>
        <div className="mt-auto flex items-center gap-2 rounded-xl border border-line p-2"><Avatar name={me.name} src={me.avatar} size={32} /><span className="truncate text-sm">{me.name}</span></div>
      </aside>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-24 md:p-8 md:pb-8 animate-page"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">{NAV.filter(n => n.to !== '/performance').map(n => link(n, true))}</nav>
    </div>
  )
}
