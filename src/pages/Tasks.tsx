import { useCallback, useEffect, useState } from 'react'
import { Card, Empty, Err, Progress, fdate, label } from '../components/ui'
import { myTasks, updateTask, type Task } from '../services/data'

const ST = ['todo', 'in_progress', 'review', 'done']
export default function Tasks() {
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [tab, setTab] = useState<'open' | 'done'>('open')
  const load = useCallback(() => myTasks().then(setTasks).catch(e => setErr(e.message)), [])
  useEffect(() => { load() }, [load])
  const patch = async (id: string, p: { status?: string; progress?: number }) => { try { await updateTask(id, p); load() } catch (e) { setErr((e as Error).message) } }
  const list = (tasks ?? []).filter(t => (tab === 'done') === (t.status === 'done'))
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My tasks</h1>
      <div className="flex gap-1 border-b border-line" role="tablist">{(['open', 'done'] as const).map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize ${tab === t ? 'border-brand text-brand' : 'border-transparent text-slate-500'}`}>{t}</button>)}</div>
      {err && <Err text={err} />}
      {tasks && list.length === 0 && <Card><Empty text={tab === 'open' ? 'No open tasks. Enjoy.' : 'No completed tasks yet.'} /></Card>}
      {list.map(t => (
        <Card key={t.id}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium">{t.title}</p><p className="text-xs text-slate-400">{t.project ?? 'No project'} · due {fdate(t.due)} · {t.priority}</p></div></div>
          {t.description && <p className="mt-2 text-sm text-slate-600">{t.description}</p>}
          <div className="mt-3 flex items-center gap-3"><Progress v={t.progress} /><span className="w-10 text-right text-xs text-slate-500">{t.progress}%</span></div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select value={t.status} onChange={e => patch(t.id, { status: e.target.value })} aria-label="Status" className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm">{ST.map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
            <input type="range" min={0} max={100} step={5} value={t.progress} disabled={t.status === 'done'} aria-label="Progress" onChange={e => setTasks(ts => ts && ts.map(x => x.id === t.id ? { ...x, progress: +e.target.value } : x))} onPointerUp={e => patch(t.id, { progress: +(e.target as HTMLInputElement).value })} onKeyUp={e => patch(t.id, { progress: +(e.target as HTMLInputElement).value })} className="min-w-[120px] flex-1" />
          </div>
        </Card>
      ))}
    </div>
  )
}
