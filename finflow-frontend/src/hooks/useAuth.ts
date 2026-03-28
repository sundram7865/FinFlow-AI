import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import type { LoginInput, RegisterInput } from '@/types/auth.types'

export const useLogin = () => {
  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()

  return useMutation({
    mutationFn: (data: LoginInput) => authService.login(data),
    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.data.data!
      setAuth(user, accessToken, refreshToken)
      navigate('/dashboard')
    },
  })
}

export const useRegister = () => {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: RegisterInput) => authService.register(data),
    onSuccess:  () => navigate('/login'),
  })
}

export const useLogout = () => {
  const { refreshToken, logout } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => authService.logout(refreshToken ?? ''),
    onSettled:  () => { logout(); navigate('/login') },
  })
}