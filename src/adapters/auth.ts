import type { AuthSession } from '../types'

const SESSION_KEY = 'woodpottery.admin.session.v1'

export interface AuthAdapter {
  getSession(): AuthSession | null
  login(user: string, passphrase: string): Promise<AuthSession>
  logout(): Promise<void>
}

export const DEMO_ADMIN: { user: string; passphrase: string } = {
  user: 'admin',
  passphrase: 'verkstad',
}

export const localDemoAuthAdapter: AuthAdapter = {
  getSession() {
    if (typeof window === 'undefined') return null
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthSession
    } catch {
      return null
    }
  },
  async login(user, passphrase) {
    if (user !== DEMO_ADMIN.user || passphrase !== DEMO_ADMIN.passphrase) {
      throw new Error('Fel användarnamn eller lösenord.')
    }
    const session: AuthSession = { user, issuedAt: new Date().toISOString() }
    if (typeof window !== 'undefined') window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },
  async logout() {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(SESSION_KEY)
  },
}
