import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth.types'

interface AuthStore {
  user:         User | null
  accessToken:  string | null
  refreshToken: string | null
  isAuth:       boolean
  setAuth:      (user: User, access: string, refresh: string) => void
  setTokens:    (access: string, refresh: string) => void
  logout:       () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isAuth:       false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuth: true }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuth: false }),
    }),
    { name: 'finflow-auth', partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user, isAuth: s.isAuth }) }
  )
)