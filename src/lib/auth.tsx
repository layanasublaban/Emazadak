import { api, ApiError, userToken } from '@/lib/api'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface User {
  id: string
  fullName: string
  email: string
  phone: string
  nationalId: string
  dob: string
  city: string
  accountType: 'individual' | 'company'
  companyName?: string
  commercialReg?: string
  createdAt: number
  /** Identity verification status (demo: becomes "pending" after sign up). */
  verification: 'unverified' | 'pending' | 'verified'
  suspended?: boolean
}

export interface SignUpInput extends Omit<User, 'id' | 'createdAt' | 'verification'> {
  password: string
}

export interface MyState {
  deposits: string[]
  bids: { id: number; auctionId: string; amount: number; at: number; cancelled: boolean }[]
  offers: { id: number; auctionId: string; amount: number; status: string; at: number }[]
  submissions: { id: string; status: string; reason?: string | null; at: number; title?: string }[]
  transactions: { id: number; auctionId: string; type: string; amount: number; status: string; at: number }[]
}
const emptyState: MyState = { deposits: [], bids: [], offers: [], submissions: [], transactions: [] }

type Result = { ok: true } | { ok: false; error: string }
interface AuthState {
  user: User | null
  loggedIn: boolean
  /** The signed-in user's deposits / bids / offers / submissions (from the server). */
  state: MyState
  refresh: () => Promise<void>
  signIn: (email: string, password: string, remember: boolean) => Promise<Result>
  signUp: (input: SignUpInput) => Promise<Result>
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  loggedIn: false,
  state: emptyState,
  refresh: async () => {},
  signIn: async () => ({ ok: false, error: 'Auth unavailable' }),
  signUp: async () => ({ ok: false, error: 'Auth unavailable' }),
  logout: () => {},
})

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')

/** Website auth backed by the API (JWT in storage). Admin panel has its own session. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [state, setState] = useState<MyState>(emptyState)

  const refresh = useCallback(async () => {
    if (!userToken.get()) return
    try {
      const r = await api<{ user: User } & Partial<MyState>>('/me/state')
      setUser(r.user)
      setState({ ...emptyState, ...r })
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) { setUser(null); setState(emptyState) }
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    if (!user) return
    const t = setInterval(() => void refresh(), 10_000)
    return () => clearInterval(t)
  }, [user, refresh])

  const signIn = useCallback<AuthState['signIn']>(async (email, password, remember) => {
    try {
      const r = await api<{ token: string; user: User }>('/auth/signin', { body: { email, password }, auth: false })
      userToken.set(r.token, remember)
      setUser(r.user)
      void refresh()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: msg(e) }
    }
  }, [refresh])

  const signUp = useCallback<AuthState['signUp']>(async (input) => {
    try {
      const r = await api<{ token: string; user: User }>('/auth/signup', { body: input, auth: false })
      userToken.set(r.token, true)
      setUser(r.user)
      void refresh()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: msg(e) }
    }
  }, [refresh])

  const logout = useCallback(() => {
    userToken.set(null)
    setUser(null)
    setState(emptyState)
  }, [])

  const value = useMemo(() => ({ user, loggedIn: !!user, state, refresh, signIn, signUp, logout }), [user, state, refresh, signIn, signUp, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
