import { api, ApiError } from '@/lib/api'
import { reloadAuctions } from '@/lib/useAuctionsSync'

const wrap = async <T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; code: string; error: string }> => {
  try { return { ok: true, data: await fn() } } catch (e) {
    return e instanceof ApiError ? { ok: false, code: e.code, error: e.message } : { ok: false, code: 'error', error: 'Something went wrong.' }
  }
}
export const payDeposit = (id: string) => wrap(async () => { const r = await api(`/auctions/${id}/deposit`, { method: 'POST', body: {} }); await reloadAuctions(); return r })
export const placeBid = (id: string, amount: number) => wrap(async () => { const r = await api(`/auctions/${id}/bids`, { body: { amount } }); await reloadAuctions(); return r })
export const makeOffer = (id: string, amount: number) => wrap(() => api(`/auctions/${id}/offers`, { body: { amount } }))
export const submitProperty = (data: Record<string, unknown>) => wrap(() => api('/submissions', { body: data }))
export const fetchBids = (id: string) => api<{ id: number; amount: number; at: number; bidder: string; userId: string }[]>(`/auctions/${id}/bids`, { auth: false }).catch(() => [])
