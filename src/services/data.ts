import { supabase } from '../lib/supabase'

// Every query below runs with the member's own session. Row Level Security in the database decides what comes back:
// a member only ever receives their own tasks, their own projects, their own chats and notifications.
export interface Task { id: string; title: string; description: string | null; status: string; priority: string; progress: number; due: string | null; project: string | null }
export async function myTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('id,title,description,status,priority,progress,due_at,projects(name)').order('due_at', { ascending: true, nullsFirst: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((t: any) => ({ id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority, progress: t.progress, due: t.due_at, project: t.projects?.name ?? null }))
}
export async function updateTask(id: string, patch: { status?: string; progress?: number }) {
  const { error } = await supabase.from('tasks').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}
export interface Project { id: string; name: string; description: string | null; status: string; progress: number; url: string | null }
export async function myProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('id,name,description,status,progress,url').order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}
export interface Notice { id: string; type: string; title: string; body: string | null; read: boolean; at: string; entity: string | null; entityId: string | null }
export async function myNotices(limit = 60): Promise<Notice[]> {
  const { data, error } = await supabase.from('notifications').select('id,type,title,body,read_at,created_at,entity_type,entity_id').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []).map((n: any) => ({ id: n.id, type: n.type, title: n.title, body: n.body, read: !!n.read_at, at: n.created_at, entity: n.entity_type, entityId: n.entity_id }))
}
export async function markNoticesRead(ids?: string[]) {
  let q = supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null)
  if (ids) q = q.in('id', ids)
  const { error } = await q
  if (error) throw new Error(error.message)
}
export interface Perf { total: number; done: number; in_progress: number; overdue: number; avg_progress: number; rating: number | null; hours_7d: number; done_by_week: { week: string; done: number }[] }
export async function myPerformance(ws: string): Promise<Perf> {
  const { data, error } = await supabase.rpc('my_performance', { ws })
  if (error) throw new Error(error.message)
  return data as Perf
}
export interface Link { id: string; label: string; url: string }
export async function myLinks(uid: string): Promise<Link[]> {
  const { data, error } = await supabase.from('member_links').select('id,label,url').eq('user_id', uid).order('created_at')
  if (error) throw new Error(error.message)
  return data ?? []
}
export async function addLink(ws: string, uid: string, label: string, url: string) {
  const { error } = await supabase.from('member_links').insert({ workspace_id: ws, user_id: uid, label: label.trim(), url: url.trim() })
  if (error) throw new Error(error.message.includes('member_links_url_check') ? 'Links must start with https://' : error.message)
}
export async function removeLink(id: string) { const { error } = await supabase.from('member_links').delete().eq('id', id); if (error) throw new Error(error.message) }

export interface Conv { id: string; kind: string; title: string; lastBody: string | null; lastAt: string | null; unread: number; otherAvatar: string | null }
export async function conversations(ws: string): Promise<Conv[]> {
  const { data, error } = await supabase.rpc('my_conversations', { ws })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r: any) => ({ id: r.id, kind: r.kind, title: r.kind === 'direct' ? r.other_name || 'Unnamed' : r.title || 'Group', lastBody: r.last_body, lastAt: r.last_at, unread: Number(r.unread), otherAvatar: r.other_avatar }))
}
export interface Msg { id: string; senderId: string; body: string | null; at: string; deleted: boolean }
export async function messages(cid: string): Promise<Msg[]> {
  const { data, error } = await supabase.from('messages').select('id,sender_id,body,created_at,deleted_at').eq('conversation_id', cid).order('created_at', { ascending: false }).limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []).reverse().map((m: any) => ({ id: m.id, senderId: m.sender_id, body: m.body, at: m.created_at, deleted: !!m.deleted_at }))
}
export async function send(cid: string, uid: string, body: string) {
  const { error } = await supabase.from('messages').insert({ conversation_id: cid, sender_id: uid, body })
  if (error) throw new Error(error.message)
}
export async function markRead(cid: string, uid: string) {
  await supabase.from('conversation_members').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', cid).eq('user_id', uid)
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', uid).eq('entity_type', 'conversation').eq('entity_id', cid).is('read_at', null)
}
export async function people(ws: string): Promise<{ id: string; name: string; avatar: string | null }[]> {
  const { data, error } = await supabase.from('workspace_members').select('user_id,profiles(full_name,avatar_url)').eq('workspace_id', ws).eq('active', true)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r: any) => ({ id: r.user_id, name: r.profiles?.full_name || 'Unnamed', avatar: r.profiles?.avatar_url ?? null }))
}
export async function startDirect(ws: string, other: string): Promise<string> {
  const { data, error } = await supabase.rpc('start_direct', { ws, other })
  if (error) throw new Error(error.message)
  return data as string
}
export async function heartbeat(uid: string) { await supabase.from('profiles').update({ presence: 'online', last_seen: new Date().toISOString() }).eq('id', uid) }
