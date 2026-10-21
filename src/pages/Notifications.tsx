import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Empty, Err } from '../components/ui'
import { markNoticesRead, myNotices, type Notice } from '../services/data'

export default function Notifications() {
  const [rows, setRows] = useState<Notice[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const load = useCallback(() => myNotices().then(setRows).catch(e => setErr(e.message)), [])
  useEffect(() => { load(); const ch = supabase.channel('team-notices').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => load()).subscribe(); return () => { void supabase.removeChannel(ch) } }, [load])
  const unread = (rows ?? []).filter(r => !r.read)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Notifications</h1>{unread.length > 0 && <button className="btn-ghost text-xs" onClick={async () => { try { await markNoticesRead(); load() } catch (e) { setErr((e as Error).message) } }}>Mark all read</button>}</div>
      {err && <Err text={err} />}
      <Card>{rows && rows.length === 0 ? <Empty text="You are all caught up." /> : <ul className="divide-y divide-line">{(rows ?? []).map(n => <li key={n.id} className="flex gap-3 py-3"><i className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-200' : 'bg-brand'}`} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{n.title}</p>{n.body && <p className="text-sm text-slate-500">{n.body}</p>}<p className="text-xs text-slate-400">{new Date(n.at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div></li>)}</ul>}</Card>
    </div>
  )
}
