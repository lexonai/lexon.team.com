import type { ReactNode } from 'react'
export const Card = ({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`card p-4 sm:p-5 ${className}`}>{title && <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-slate-900">{title}</h2>{action}</div>}{children}</section>
)
export const Empty = ({ text }: { text: string }) => <p className="py-6 text-center text-sm text-slate-400">{text}</p>
export const Err = ({ text }: { text: string }) => <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{text}</p>
export function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  const i = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
  return src ? <img src={src} alt="" style={{ width: size, height: size }} className="rounded-full object-cover" /> : <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{i}</span>
}
export const Progress = ({ v }: { v: number }) => <div className="h-1.5 w-full rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${v}%` }} /></div>
export const label = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
export const fdate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'
