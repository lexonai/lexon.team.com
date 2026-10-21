import { useEffect, useState } from 'react'
import { Card, Err } from '../components/ui'
import { useMe } from '../lib/useMe'
import { myPerformance, type Perf } from '../services/data'

export default function Performance() {
  const { me } = useMe()
  const [p, setP] = useState<Perf | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => { if (me) myPerformance(me.workspaceId).then(setP).catch(e => setErr(e.message)) }, [me])
  const max = Math.max(1, ...(p?.done_by_week ?? []).map(w => w.done))
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My performance</h1>
      {err && <Err text={err} />}
      {p && <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['Assigned', p.total], ['Completed', p.done], ['Overdue', p.overdue], ['Hours (7 days)', p.hours_7d]].map(([l, v]) => <div key={l as string} className="card p-4"><p className="text-xs text-slate-500">{l}</p><p className="text-2xl font-semibold">{v}</p></div>)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="Completion"><p className="text-3xl font-semibold">{p.total ? Math.round((p.done / p.total) * 100) : 0}%</p><p className="text-sm text-slate-500">of assigned tasks done · active tasks average {p.avg_progress}%</p></Card>
          <Card title="Rating"><p className="text-3xl font-semibold">{p.rating ?? '—'}<span className="text-base text-slate-400"> / 5</span></p><p className="text-sm text-slate-500">Set by your admin.</p></Card>
        </div>
        <Card title="Tasks completed per week">{p.done_by_week.length === 0 ? <p className="text-sm text-slate-400">No completed tasks in the last 8 weeks.</p> : <div className="flex h-32 items-end gap-2">{p.done_by_week.map(w => <div key={w.week} className="flex flex-1 flex-col items-center gap-1"><div className="bar-grow w-full rounded-t-md bg-brand" style={{ height: `${(w.done / max) * 100}%`, minHeight: 4 }} title={`${w.done}`} /><span className="text-[10px] text-slate-400">{w.week.slice(5)}</span></div>)}</div>}</Card>
      </>}
    </div>
  )
}
