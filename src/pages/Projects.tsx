import { useEffect, useState } from 'react'
import { Card, Empty, Err, Progress, label } from '../components/ui'
import { myProjects, type Project } from '../services/data'

export default function Projects() {
  const [rows, setRows] = useState<Project[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => { myProjects().then(setRows).catch(e => setErr(e.message)) }, [])
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My projects</h1>
      {err && <Err text={err} />}
      {rows && rows.length === 0 && <Card><Empty text="You are not part of any project yet." /></Card>}
      <div className="grid gap-4 sm:grid-cols-2">{(rows ?? []).map(p => (
        <Card key={p.id}>
          <div className="flex items-center justify-between gap-3"><p className="font-semibold">{p.name}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{label(p.status)}</span></div>
          {p.description && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{p.description}</p>}
          <div className="mt-3 flex items-center gap-3"><Progress v={p.progress} /><span className="text-xs text-slate-500">{p.progress}%</span></div>
          {p.url && /^https:\/\//.test(p.url) && <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-brand">Open project link</a>}
        </Card>
      ))}</div>
    </div>
  )
}
