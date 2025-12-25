'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setTokens } = useAuthStore()
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        const initAuth = async () => {
            const accessToken = localStorage.getItem('access_token')
            const refreshToken = localStorage.getItem('refresh_token')

            if (accessToken && refreshToken) {
                try {
                    // Fetch user data from /auth/me endpoint
                    const response = await api.get('/auth/me', {
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    })

                    // Restore user and tokens in store
                    setUser(response.data)
                    setTokens(accessToken, refreshToken)
                } catch (error) {
                    // If token is invalid, clear localStorage
                    console.error('Failed to restore session:', error)
                    localStorage.removeItem('access_token')
                    localStorage.removeItem('refresh_token')
                }
            }

            setIsInitialized(true)
        }

        initAuth()
    }, [setUser, setTokens])

    // Show nothing while initializing to prevent flash
    if (!isInitialized) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#0a0e1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(102, 126, 234, 0.2)',
                    borderTopColor: '#667eea',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        )
    }

    return <>{children}</>
}
