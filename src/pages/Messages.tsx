import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Plus, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Avatar, Card, Empty, Err } from '../components/ui'
import { useMe } from '../lib/useMe'
import { conversations, markRead, messages, people, send, startDirect, type Conv, type Msg } from '../services/data'

export default function Messages() {
  const { me } = useMe()
  const [convs, setConvs] = useState<Conv[] | null>(null)
  const [open, setOpen] = useState<Conv | null>(null)
  const [picking, setPicking] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const load = useCallback(() => { if (me) conversations(me.workspaceId).then(setConvs).catch(e => setErr(e.message)) }, [me])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const ch = supabase.channel('team-msg-list').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => load()).subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [load])
  if (!me) return null
  if (open) return <Chat conv={open} me={me.userId} onBack={() => { setOpen(null); load() }} />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Messages</h1><button onClick={() => setPicking(true)} className="btn-primary"><Plus size={16} /> New</button></div>
      {err && <Err text={err} />}
      {convs && convs.length === 0 && <Card><Empty text="No conversations yet." /></Card>}
      <ul className="space-y-2">{(convs ?? []).map(c => (
        <li key={c.id}><button onClick={() => setOpen(c)} className="card card-hover flex w-full items-center gap-3 p-3 text-left"><Avatar name={c.title} src={c.otherAvatar} size={42} /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{c.title}</span><span className="block truncate text-sm text-slate-500">{c.lastBody ?? 'No messages yet'}</span></span>{c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-xs text-white">{c.unread}</span>}</button></li>
      ))}</ul>
      {picking && <Picker ws={me.workspaceId} me={me.userId} onClose={() => setPicking(false)} onPick={async id => { setPicking(false); try { const cid = await startDirect(me.workspaceId, id); const list = await conversations(me.workspaceId); setConvs(list); setOpen(list.find(c => c.id === cid) ?? null) } catch (e) { setErr((e as Error).message) } }} />}
    </div>
  )
}

function Picker({ ws, me, onClose, onPick }: { ws: string; me: string; onClose: () => void; onPick: (id: string) => void }) {
  const [rows, setRows] = useState<{ id: string; name: string; avatar: string | null }[]>([])
  useEffect(() => { people(ws).then(r => setRows(r.filter(x => x.id !== me))).catch(() => {}) }, [ws, me])
  return <div className="fixed inset-0 z-50 grid place-items-end bg-slate-900/30 backdrop-blur-sm sm:place-items-center" onClick={onClose}><div className="card max-h-[70dvh] w-full max-w-md overflow-y-auto rounded-b-none p-4 sm:rounded-b-2xl" onClick={e => e.stopPropagation()}><h2 className="mb-2 font-semibold">Start a chat</h2><ul>{rows.map(r => <li key={r.id}><button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-50" onClick={() => onPick(r.id)}><Avatar name={r.name} src={r.avatar} /><span className="text-sm">{r.name}</span></button></li>)}</ul></div></div>
}

function Chat({ conv, me, onBack }: { conv: Conv; me: string; onBack: () => void }) {
  const [msgs, setMsgs] = useState<Msg[] | null>(null)
  const [text, setText] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const load = useCallback(() => messages(conv.id).then(m => { setMsgs(m); void markRead(conv.id, me) }).catch(e => setErr(e.message)), [conv.id, me])
  useEffect(() => {
    load()
    const ch = supabase.channel(`team-chat-${conv.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` }, () => load()).subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [conv.id, load])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs])
  const submit = async (e: React.FormEvent) => { e.preventDefault(); const b = text.trim(); if (!b) return; setText(''); try { await send(conv.id, me, b); load() } catch (x) { setErr((x as Error).message); setText(b) } }
  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col md:h-[calc(100dvh-5rem)]">
      <div className="mb-3 flex items-center gap-3"><button onClick={onBack} aria-label="Back"><ArrowLeft size={20} /></button><Avatar name={conv.title} src={conv.otherAvatar} /><h1 className="truncate text-lg font-semibold">{conv.title}</h1></div>
      {err && <Err text={err} />}
      <div className="card flex-1 space-y-2 overflow-y-auto p-3">
        {msgs?.map(m => <div key={m.id} className={`flex ${m.senderId === me ? 'justify-end' : ''}`}><p className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${m.senderId === me ? 'bg-brand text-white' : 'bg-slate-100'}`}>{m.deleted ? <i className="opacity-60">Message deleted</i> : m.body}</p></div>)}
        <div ref={end} />
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2"><input value={text} onChange={e => setText(e.target.value)} placeholder="Message" aria-label="Message" maxLength={4000} className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-base" /><button className="btn-primary px-4" aria-label="Send"><Send size={16} /></button></form>
    </div>
  )
}
