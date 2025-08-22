import { useCallback } from 'react'
import { useAuthToken } from './auth'
import { apiWithTokenRefresh } from './api'

/**
 * Custom hook that provides an API client with automatic token refresh
 * This handles token expiration gracefully by retrying with a fresh token
 */
export function useApi() {
  const { getToken } = useAuthToken()
  
  const apiCall = useCallback(async <T>(
    path: string, 
    init?: RequestInit
  ): Promise<T> => {
    return apiWithTokenRefresh<T>(path, getToken, init)
  }, [getToken])
  
  return { apiCall }
}
