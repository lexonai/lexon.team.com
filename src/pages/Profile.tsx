import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Avatar, Card, Err } from '../components/ui'
import { useAuth } from '../auth/AuthProvider'
import { useMe } from '../lib/useMe'
import { addLink, myLinks, removeLink, type Link } from '../services/data'
import { installState, promptInstall } from '../lib/install'

export default function Profile() {
  const { me, reload } = useMe()
  const { signOut } = useAuth()
  const [links, setLinks] = useState<Link[]>([])
  const [label, setLabel] = useState(''); const [url, setUrl] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [inst, setInst] = useState(installState())
  const [notif, setNotif] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
  const load = useCallback(() => { if (me) myLinks(me.userId).then(setLinks).catch(e => setErr(e.message)) }, [me])
  useEffect(() => { load() }, [load])
  useEffect(() => { const h = () => setInst(installState()); window.addEventListener('lexon-install', h); return () => window.removeEventListener('lexon-install', h) }, [])
  if (!me) return null
  const theme = async (t: string) => { await supabase.from('profiles').update({ theme: t }).eq('id', me.userId); reload() }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      {err && <Err text={err} />}
      <Card><div className="flex items-center gap-4"><Avatar name={me.name} src={me.avatar} size={64} /><div><p className="text-lg font-semibold">{me.name}</p><p className="text-sm text-slate-500">{me.title ?? 'Team member'}</p></div></div><p className="mt-3 text-xs text-slate-400">Name, role and department are managed by your admin.</p></Card>
      <Card title="My links">
        <ul className="mb-3 space-y-1 text-sm">{links.length === 0 && <li className="text-slate-400">No links yet.</li>}{links.map(l => <li key={l.id} className="flex items-center justify-between gap-2"><a href={l.url} target="_blank" rel="noopener noreferrer" className="truncate text-brand">{l.label}</a><button className="text-xs text-slate-400" onClick={async () => { await removeLink(l.id); load() }}>Remove</button></li>)}</ul>
        <form onSubmit={async e => { e.preventDefault(); try { await addLink(me.workspaceId, me.userId, label, url); setLabel(''); setUrl(''); setErr(null); load() } catch (x) { setErr((x as Error).message) } }} className="flex flex-wrap gap-2"><input required value={label} onChange={e => setLabel(e.target.value)} placeholder="Label" aria-label="Label" className="w-28 rounded-lg border border-line px-2 py-2 text-sm" /><input required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" aria-label="URL" className="min-w-0 flex-1 rounded-lg border border-line px-2 py-2 text-sm" /><button className="btn-ghost">Add</button></form>
      </Card>
      <Card title="App">
        <div className="space-y-3 text-sm">
          {inst === 'available' && <button className="btn-primary" onClick={() => promptInstall()}>Install Lexon Team</button>}
          {inst === 'installed' && <p className="text-emerald-700">Installed on this device.</p>}
          {inst === 'ios' && <p className="text-slate-600">On iPhone: tap Share, then “Add to Home Screen”.</p>}
          {inst === 'unavailable' && <p className="text-slate-500">To install: Chrome/Edge menu, then “Install app”.</p>}
          {notif === 'default' && <button className="btn-ghost" onClick={async () => setNotif(await Notification.requestPermission())}>Turn on alerts</button>}
          {notif === 'granted' && <p className="text-emerald-700">Alerts are on while the app is open.</p>}
          <label className="flex items-center justify-between gap-3">Theme<select value={me.theme} onChange={e => theme(e.target.value)} className="rounded-lg border border-line bg-white px-2 py-1.5"><option value="system">System</option><option value="light">Light</option></select></label>
        </div>
      </Card>
      <button onClick={() => signOut()} className="btn-ghost w-full py-3 text-red-600">Sign out</button>
    </div>
  )
}
