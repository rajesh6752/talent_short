'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store'

export default function RegisterPage() {
  const router = useRouter()
  const { setUser, setTokens } = useAuthStore()
  const [formData, setFormData] = useState({
    email: '', password: '', first_name: '', last_name: '', phone: ''
  })
  const [errors, setErrors] = useState<any>({})
  const [touched, setTouched] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false, type: 'success', message: ''
  })

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'first_name':
        return !value ? 'First name is required' : ''
      case 'last_name':
        return !value ? 'Last name is required' : ''
      case 'email':
        if (!value) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format'
        return ''
      case 'phone':
        if (value && !/^\+?[1-9]\d{9,14}$/.test(value)) return 'Enter valid mobile number (10-15 digits)'
        return ''
      case 'password':
        if (!value) return 'Password is required'
        if (value.length < 8) return 'Minimum 8 characters required'
        return ''
      default:
        return ''
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors({ ...errors, [field]: error })
    }
  }

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
    const error = validateField(field, formData[field as keyof typeof formData])
    setErrors({ ...errors, [field]: error })
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type, message: '' }), 4000)
  }

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' }
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 2) return { strength: 33, label: 'Weak', color: '#ef4444' }
    if (strength <= 3) return { strength: 66, label: 'Medium', color: '#f59e0b' }
    return { strength: 100, label: 'Strong', color: '#22c55e' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: any = {}
    Object.keys(formData).forEach(key => {
      if (key !== 'phone') {
        const error = validateField(key, formData[key as keyof typeof formData])
        if (error) newErrors[key] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
      showToast('error', 'Please fix the errors before submitting')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/register', formData)
      const { user, tokens } = response.data

      setTokens(tokens.access_token, tokens.refresh_token)
      setUser(user)
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)

      showToast('success', 'Account created! Redirecting...')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field: string) => ({
    width: '100%',
    padding: '1rem 1.25rem',
    paddingRight: '3rem',
    fontSize: '15px',
    background: touched[field] && !errors[field] ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.05)',
    border: `2px solid ${touched[field] && errors[field] ? '#ef4444' : touched[field] && !errors[field] ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '12px',
    color: 'white',
    outline: 'none',
    transition: 'all 0.3s',
    boxSizing: 'border-box' as const
  })

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#0a0e1a', position: 'relative' }}>
      {toast.show && (
        <div style={{
          position: 'fixed', top: '2rem', right: '2rem', zIndex: 1000, padding: '1.25rem 1.5rem',
          background: toast.type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          backdropFilter: 'blur(10px)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)', animation: 'slideInRight 0.4s ease-out'
        }}>
          <div style={{ fontSize: '24px' }}>{toast.type === 'success' ? '✓' : '✕'}</div>
          <div>
            <div style={{ fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
              {toast.type === 'success' ? 'Success!' : 'Error'}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>{toast.message}</div>
          </div>
        </div>
      )}

      <div style={{
        background: `url('/images/ai-tech-bg.jpg') center/cover, linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)`,
        backgroundBlendMode: 'overlay', padding: '4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* Geometric pattern */}
        <div style={{
          position: 'absolute', inset: 0,
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
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          animation: 'pulse 4s ease-in-out infinite'
        }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '500px' }}>
          <div style={{
            width: '140px', height: '140px', margin: '0 auto 3rem', background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)', borderRadius: '32px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'float 3s ease-in-out infinite'
          }}>
            <svg width="70" height="70" fill="white" viewBox="0 0 24 24">
              <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeWidth={2.5} stroke="currentColor" fill="none" />
            </svg>
          </div>

          <h2 style={{
            fontSize: '48px', fontWeight: '900', color: 'white', marginBottom: '1.5rem',
            textAlign: 'center', lineHeight: '1.1', letterSpacing: '-0.02em'
          }}>Join TalentForge AI</h2>

          <p style={{ fontSize: '19px', color: 'rgba(255,255,255,0.95)', lineHeight: '1.7', marginBottom: '3rem', textAlign: 'center' }}>
            Start hiring smarter with AI-powered recruitment
          </p>

          {[
            { icon: '🚀', title: 'Quick Setup', desc: 'Get started in under 60 seconds' },
            { icon: '💳', title: 'No Payment', desc: 'Free trial, no credit card required' },
            { icon: '✨', title: 'Full Access', desc: 'All premium features included' }
          ].map((f, i) => (
            <div key={i} style={{
              padding: '1.5rem', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
              borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '1rem',
              animation: `slideIn 0.6s ease-out ${i * 0.1}s both`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '32px' }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>{f.title}</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>{f.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: '3rem 4rem', display: 'flex', alignItems: 'center', background: '#0a0e1a', overflowY: 'auto', maxHeight: '100vh'
      }}>
        <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none', fontSize: '14px', marginBottom: '2rem'
          }}>← Back to home</Link>

          <h1 style={{ fontSize: '40px', fontWeight: '900', color: 'white', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Create Account
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2.5rem', fontSize: '16px' }}>
            Start your free trial today
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>
                  First Name
                </label>
                <div style={{ position: 'relative' }}>
                  <input type="text" required value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    onBlur={() => handleBlur('first_name')} style={inputStyle('first_name')}
                    onFocus={(e) => { if (!errors.first_name) { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.15)' } }}
                  />
                  {touched.first_name && !errors.first_name && (
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: '20px' }}>✓</div>
                  )}
                </div>
                {touched.first_name && errors.first_name && (
                  <div style={{ marginTop: '0.5rem', fontSize: '13px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>⚠</span> {errors.first_name}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>
                  Last Name
                </label>
                <div style={{ position: 'relative' }}>
                  <input type="text" required value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    onBlur={() => handleBlur('last_name')} style={inputStyle('last_name')}
                    onFocus={(e) => { if (!errors.last_name) { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.15)' } }}
                  />
                  {touched.last_name && !errors.last_name && (
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: '20px' }}>✓</div>
                  )}
                </div>
                {touched.last_name && errors.last_name && (
                  <div style={{ marginTop: '0.5rem', fontSize: '13px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>⚠</span> {errors.last_name}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <input type="email" required value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')} placeholder="you@company.com" style={inputStyle('email')}
                  onFocus={(e) => { if (!errors.email) { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.15)' } }}
                />
                {touched.email && !errors.email && (
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: '20px' }}>✓</div>
                )}
              </div>
              {touched.email && errors.email && (
                <div style={{ marginTop: '0.5rem', fontSize: '13px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠</span> {errors.email}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>
                Mobile
              </label>
              <div style={{ position: 'relative' }}>
                <input type="tel" value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  style={{
                    width: '100%', padding: '1rem 1.25rem', paddingRight: '3rem', fontSize: '15px',
                    background: touched.phone && !errors.phone && formData.phone ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${touched.phone && errors.phone ? '#ef4444' : touched.phone && !errors.phone && formData.phone ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px', color: 'white', outline: 'none',
                    transition: 'all 0.3s', boxSizing: 'border-box' as const
                  }}
                  onFocus={(e) => {
                    if (!errors.phone) {
                      e.target.style.borderColor = '#667eea'
                      e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.15)'
                    }
                  }}
                  placeholder="+1234567890"
                />
                {touched.phone && !errors.phone && formData.phone && (
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: '20px', fontWeight: 'bold' }}>✓</div>
                )}
              </div>
              {touched.phone && errors.phone && (
                <div style={{ marginTop: '0.5rem', fontSize: '13px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠</span> {errors.phone}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type="password" required value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')} placeholder="Minimum 8 characters" style={inputStyle('password')}
                  onFocus={(e) => { if (!errors.password) { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.15)' } }}
                />
                {touched.password && !errors.password && (
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: '20px' }}>✓</div>
                )}
              </div>
              {touched.password && errors.password && (
                <div style={{ marginTop: '0.5rem', fontSize: '13px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠</span> {errors.password}
                </div>
              )}
              {formData.password && !errors.password && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Password Strength:</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: passwordStrength.color }}>{passwordStrength.label}</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${passwordStrength.strength}%`, background: passwordStrength.color,
                      transition: 'all 0.3s', borderRadius: '3px'
                    }} />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '1.25rem', fontSize: '16px', fontWeight: '700', color: 'white',
                background: loading ? 'rgba(102, 126, 234, 0.5)' : 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 10px 30px rgba(102, 126, 234, 0.4)', transition: 'all 0.3s',
                marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.5)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)')}
            >
              {loading && (
                <div style={{
                  width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                }} />
              )}
              {loading ? 'Creating Account...' : 'Create Free Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#667eea', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
        @keyframes slideIn { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
