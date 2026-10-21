import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Bell, CheckSquare, FolderKanban, Home, MessageSquare, TrendingUp, User } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useMe } from './lib/useMe'
import Logo from './components/Logo'
import { heartbeat } from './services/data'
import './lib/install'

const NAV = [{ to: '/', icon: Home, l: 'Home', end: true }, { to: '/tasks', icon: CheckSquare, l: 'Tasks' }, { to: '/projects', icon: FolderKanban, l: 'Projects' }, { to: '/messages', icon: MessageSquare, l: 'Messages' }, { to: '/performance', icon: TrendingUp, l: 'Stats' }, { to: '/profile', icon: User, l: 'Me' }]

export default function Layout() {
  const { me } = useMe()
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    if (!me) return
    const count = async () => { const r = await supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null); setUnread(r.count ?? 0) }
    count()
    const ch = supabase.channel('team-bell').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (p: any) => {
      count()
      if (p.eventType === 'INSERT' && typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
        try { new Notification(p.new.title, { body: p.new.body ?? undefined, icon: './icon-192.png' }) } catch { /* not supported */ }
      }
    }).subscribe()
    heartbeat(me.userId); const hb = setInterval(() => heartbeat(me.userId), 60000)
    return () => { void supabase.removeChannel(ch); clearInterval(hb) }
  }, [me])
  const link = ({ isActive }: { isActive: boolean }) => `flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] md:flex-row md:gap-3 md:px-3 md:py-2 md:text-sm ${isActive ? 'bg-brand-soft text-brand font-medium' : 'text-slate-500'}`
  return (
    <div className="min-h-dvh md:flex">
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-line bg-white p-4 md:flex"><div className="mb-4 flex items-center gap-2"><Logo size={34} /><span className="font-semibold">Lexon Team</span></div>{NAV.map(n => <NavLink key={n.to} to={n.to} end={n.end} className={link}><n.icon size={18} />{n.l}</NavLink>)}</aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur md:justify-end" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <span className="flex items-center gap-2 md:hidden"><Logo size={28} /><b>Lexon Team</b></span>
          <NavLink to="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative p-1"><Bell size={21} />{unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] text-white">{unread > 9 ? '9+' : unread}</span>}</NavLink>
        </header>
        <main className="mx-auto max-w-3xl animate-page p-4 pb-28 md:pb-8"><Outlet /></main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-white px-1 pt-1 md:hidden" style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }} aria-label="Main">{NAV.map(n => <NavLink key={n.to} to={n.to} end={n.end} className={link}><n.icon size={20} />{n.l}</NavLink>)}</nav>
    </div>
  )
}
