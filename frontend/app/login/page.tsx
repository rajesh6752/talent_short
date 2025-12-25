'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store'

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setTokens } = useAuthStore()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false, type: 'success', message: ''
  })

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format'
    return ''
  }

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    return ''
  }

  const handleChange = (field: 'email' | 'password', value: string) => {
    setFormData({ ...formData, [field]: value })
    if (touched[field]) {
      const error = field === 'email' ? validateEmail(value) : validatePassword(value)
      setErrors({ ...errors, [field]: error })
    }
  }

  const handleBlur = (field: 'email' | 'password') => {
    setTouched({ ...touched, [field]: true })
    const value = formData[field]
    const error = field === 'email' ? validateEmail(value) : validatePassword(value)
    setErrors({ ...errors, [field]: error })
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type, message: '' }), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError })
      setTouched({ email: true, password: true })
      showToast('error', 'Please fix the validation errors')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/login', formData)
      const { user, tokens } = response.data

      setTokens(tokens.access_token, tokens.refresh_token)
      setUser(user)
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)

      showToast('success', 'Login successful! Redirecting...')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: any) {
      console.error('Login error:', err)
      console.log('Error response:', err.response)
      const errorMessage = err.response?.data?.detail || 'Login failed. Please check your credentials.'
      console.log('Showing toast with message:', errorMessage)
      showToast('error', errorMessage)
      setTouched({ email: true, password: true })
      setErrors({
        email: 'Invalid credentials',
        password: 'Invalid credentials'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: '#0a0e1a',
      position: 'relative'
    }}>
      {/* Toast Notification - Enhanced */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          left: '2rem',
          maxWidth: '500px',
          margin: '0 auto',
          zIndex: 9999,
          padding: '1.5rem 2rem',
          background: toast.type === 'success' ? 'rgba(34, 197, 94, 0.98)' : 'rgba(239, 68, 68, 0.98)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: `0 20px 60px ${toast.type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          border: `2px solid ${toast.type === 'success' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.3)'}`,
          animation: 'slideDown 0.4s ease-out'
        }}>
          <div style={{
            fontSize: '32px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%'
          }}>
            {toast.type === 'success' ? '✓' : '⚠'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '800', color: 'white', marginBottom: '0.25rem', fontSize: '18px' }}>
              {toast.type === 'success' ? 'Success!' : 'Authentication Failed'}
            </div>
            <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.95)' }}>
              {toast.message}
            </div>
          </div>
          <button
            onClick={() => setToast({ show: false, type: 'success', message: '' })}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >×</button>
        </div>
      )}

      {/* Left Side - Enhanced Graphics */}
      <div style={{
        background: `url('/images/ai-tech-bg.jpg') center/cover, linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)`,
        backgroundBlendMode: 'overlay',
        padding: '4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(30deg, rgba(255,255,255,0.05) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.05) 87.5%, rgba(255,255,255,0.05)),
            linear-gradient(150deg, rgba(255,255,255,0.05) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.05) 87.5%, rgba(255,255,255,0.05)),
            linear-gradient(30deg, rgba(255,255,255,0.05) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.05) 87.5%, rgba(255,255,255,0.05)),
            linear-gradient(150deg, rgba(255,255,255,0.05) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.05) 87.5%, rgba(255,255,255,0.05))
          `,
          backgroundSize: '80px 140px',
          backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px'
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)
          `,
          animation: 'pulse 4s ease-in-out infinite'
        }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '500px', margin: '0 auto' }}>
          <div style={{
            width: '140px',
            height: '140px',
            margin: '0 auto 3rem',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)',
            borderRadius: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'float 3s ease-in-out infinite'
          }}>
            <svg width="70" height="70" fill="white" viewBox="0 0 24 24">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeWidth={2.5} stroke="currentColor" fill="none" />
            </svg>
          </div>

          <h2 style={{
            fontSize: '48px',
            fontWeight: '900',
            color: 'white',
            marginBottom: '1.5rem',
            textAlign: 'center',
            lineHeight: '1.1',
            letterSpacing: '-0.02em'
          }}>
            Welcome Back
          </h2>

          <p style={{
            fontSize: '19px',
            color: 'rgba(255,255,255,0.95)',
            lineHeight: '1.7',
            marginBottom: '3rem',
            textAlign: 'center'
          }}>
            Access the most powerful AI recruitment platform
          </p>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {[
              { icon: '🎯', title: 'Smart Matching', desc: 'AI finds perfect candidates in seconds' },
              { icon: '📊', title: 'Real-time Analytics', desc: 'Track your hiring pipeline instantly' },
              { icon: '🔒', title: 'Secure & Compliant', desc: 'Enterprise-grade security standards' }
            ].map((feature, i) => (
              <div key={i} style={{
                padding: '1.5rem',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.2)',
                animation: `slideIn 0.6s ease-out ${i * 0.1}s both`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '32px' }}>{feature.icon}</div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                      {feature.title}
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
                      {feature.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div style={{
        padding: '4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0e1a'
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '3rem',
            transition: 'color 0.3s'
          }} onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
            ← Back to home
          </Link>

          <h1 style={{
            fontSize: '40px',
            fontWeight: '900',
            color: 'white',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em'
          }}>Sign In</h1>

          <p style={{
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '3rem',
            fontSize: '16px'
          }}>
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '0.625rem'
              }}>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@company.com"
                  style={{
                    width: '100%',
                    padding: '1.125rem 1.25rem',
                    paddingRight: '3rem',
                    fontSize: '15px',
                    background: touched.email && !errors.email ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${touched.email && errors.email ? '#ef4444' : touched.email && !errors.email ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    if (!errors.email) {
                      e.target.style.borderColor = '#667eea'
                      e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.15)'
                    }
                  }}
                />
                {touched.email && !errors.email && formData.email && (
                  <div style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#22c55e',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>✓</div>
                )}
              </div>
              {touched.email && errors.email && (
                <div style={{
                  marginTop: '0.625rem',
                  padding: '0.75rem 1rem',
                  fontSize: '13px',
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '16px' }}>⚠</span> {errors.email}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '0.625rem'
              }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '1.125rem 1.25rem',
                    paddingRight: '3rem',
                    fontSize: '15px',
                    background: touched.password && !errors.password ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${touched.password && errors.password ? '#ef4444' : touched.password && !errors.password ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = '#667eea'
                      e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.15)'
                    }
                  }}
                />
                {touched.password && !errors.password && formData.password && (
                  <div style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#22c55e',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>✓</div>
                )}
              </div>
              {touched.password && errors.password && (
                <div style={{
                  marginTop: '0.625rem',
                  padding: '0.75rem 1rem',
                  fontSize: '13px',
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '16px' }}>⚠</span> {errors.password}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1.25rem',
                fontSize: '16px',
                fontWeight: '700',
                color: 'white',
                background: loading ? 'rgba(102, 126, 234, 0.5)' : 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 10px 30px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.5)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)')}
            >
              {loading && (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              )}
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.6)'
          }}>
            Don't have an account?{' '}
            <Link href="/register" style={{
              color: '#667eea',
              fontWeight: '600',
              textDecoration: 'none'
            }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
