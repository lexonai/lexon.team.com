import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Empty, Err, Progress, fdate, label } from '../components/ui'
import { useMe } from '../lib/useMe'
import { myNotices, myTasks, type Notice, type Task } from '../services/data'

export default function Home() {
  const { me } = useMe()
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [notes, setNotes] = useState<Notice[]>([])
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => { myTasks().then(setTasks).catch(e => setErr(e.message)); myNotices(5).then(setNotes).catch(() => {}) }, [])
  const open = (tasks ?? []).filter(t => t.status !== 'done')
  const due = open.filter(t => t.due && new Date(t.due) < new Date())
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold">Hi, {me?.name.split(' ')[0]}</h1><p className="text-sm text-slate-500">{me?.title ?? 'Team member'}</p></div>
      {err && <Err text={err} />}
      <div className="grid grid-cols-3 gap-3">
        {[['Open', open.length], ['Overdue', due.length], ['Done', (tasks ?? []).length - open.length]].map(([l, v]) => <div key={l as string} className="card p-4"><p className="text-xs text-slate-500">{l}</p><p className={`text-2xl font-semibold ${l === 'Overdue' && +v > 0 ? 'text-red-600' : ''}`}>{v}</p></div>)}
      </div>
      <Card title="Assigned to you" action={<Link to="/tasks" className="text-sm text-brand">All tasks</Link>}>
        {tasks === null ? <p className="text-sm text-slate-400">Loading…</p> : open.length === 0 ? <Empty text="Nothing assigned right now." /> : (
          <ul className="divide-y divide-line">{open.slice(0, 5).map(t => <li key={t.id} className="py-3"><div className="flex justify-between gap-3"><p className="truncate text-sm font-medium">{t.title}</p><span className="shrink-0 text-xs text-slate-400">{fdate(t.due)}</span></div><div className="mt-2 flex items-center gap-3"><Progress v={t.progress} /><span className="text-xs text-slate-500">{label(t.status)}</span></div></li>)}</ul>
        )}
      </Card>
      <Card title="Latest" action={<Link to="/notifications" className="text-sm text-brand">All</Link>}>
        {notes.length === 0 ? <Empty text="No notifications." /> : <ul className="space-y-2">{notes.map(n => <li key={n.id} className="text-sm"><b className={n.read ? 'font-medium' : 'font-semibold'}>{n.title}</b>{n.body && <span className="text-slate-500"> · {n.body}</span>}</li>)}</ul>}
      </Card>
    </div>
  )
}
