import { useAuth } from '@clerk/clerk-react'
import { useCallback, useMemo } from 'react'

export function useTokenManager() {
	const { getToken } = useAuth()

	// Always fetch a fresh token via Clerk; rely on Clerk's automatic refresh.
	// Prefer a JWT template named "backend" (configure in Clerk) for longer TTL and backend claims.
	const getValidToken = useCallback(async (): Promise<string> => {
		const token =
			(await getToken({ template: 'dev-jwt' }).catch(() => getToken())) || ''
		if (!token) throw new Error('Failed to acquire auth token')
		return token
	}, [getToken])

	const clearTokenCache = useCallback(() => {
		// No-op: we do not maintain a custom cache anymore.
	}, [])

	return useMemo(
		() => ({
			getValidToken,
			clearTokenCache,
		}),
		[getValidToken, clearTokenCache],
	)
}

// Hook for components that need a token
export function useAuthToken() {
	const { getValidToken, clearTokenCache } = useTokenManager()
	return useMemo(
		() => ({
			getToken: getValidToken,
			clearCache: clearTokenCache,
		}),
		[getValidToken, clearTokenCache],
	)
}

// Lightweight, resilient sign-in opener that falls back to the path-based auth page if
// Clerk's modal cannot open for any reason (e.g., script not yet loaded).
export function useSignInHandler() {
	return useCallback(() => {
		// Use path-based auth screen to avoid any modal overlays/portals interfering
		if (typeof window !== 'undefined') {
			window.location.href = '/auth'
		}
	}, [])
}
