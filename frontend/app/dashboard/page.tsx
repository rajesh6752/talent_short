'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleLogout = () => {
    logout()
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/login')
  }

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a' }}>
      {/* Premium Navbar */}
      <nav style={{
        background: 'rgba(15, 20, 32, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', height: '80px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                padding: '0.5rem',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                borderRadius: '12px'
              }}>
                <svg style={{ width: '32px', height: '32px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em' }}>TalentForge AI</h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '16px'
                }}>
                  {user.first_name[0].toUpperCase()}{user.last_name[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{user.first_name} {user.last_name}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  borderRadius: '12px',
                  fontWeight: '700',
                  transition: 'all 0.3s',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '40px', fontWeight: '900', color: 'white', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Welcome back, <span style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>{user.first_name}</span>! 👋
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px' }}>Here's what's happening with your hiring today.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Jobs', value: '12', icon: '💼', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)', change: '+3 this week' },
            { label: 'Active Candidates', value: '487', icon: '👥', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', change: '+52 today' },
            { label: 'Interviews', value: '28', icon: '📅', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', change: '8 scheduled' },
            { label: 'Offers Sent', value: '8', icon: '✉️', gradient: 'linear-gradient(135deg, #10b981, #059669)', change: '2 accepted' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '1.75rem',
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{
                  padding: '0.875rem',
                  borderRadius: '14px',
                  background: stat.gradient,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                  <span style={{ fontSize: '32px' }}>{stat.icon}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '32px', fontWeight: '900', color: 'white', lineHeight: '1' }}>{stat.value}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>{stat.label}</p>
                </div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#22c55e' }}>{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Profile Card */}
          <div style={{
            padding: '2rem',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '0.5rem', fontSize: '24px' }}>👤</span>
              Your Profile
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '0.375rem' }}>Full Name</p>
                <p style={{ fontWeight: '700', color: 'white', fontSize: '15px' }}>{user.first_name} {user.last_name}</p>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '0.375rem' }}>Email</p>
                <p style={{ fontWeight: '600', color: 'white', fontSize: '14px' }}>{user.email}</p>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '0.375rem' }}>User ID</p>
                <p style={{ fontFamily: 'monospace', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{user.id.slice(0, 8)}...</p>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '0.375rem' }}>Status</p>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.375rem 0.875rem',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  ● Active
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            padding: '2rem',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '0.5rem', fontSize: '24px' }}>⚡</span>
              Quick Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'Post New Job', icon: '➕' },
                { label: 'View Candidates', icon: '👥' },
                { label: 'Schedule Interview', icon: '📅' },
                { label: 'AI Analytics', icon: '📊' },
              ].map((action, i) => (
                <button
                  key={i}
                  style={{
                    padding: '1.75rem',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '2px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.borderColor = '#667eea'
                    e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '0.75rem' }}>{action.icon}</div>
                  <p style={{ fontWeight: '700', color: 'white', fontSize: '15px' }}>{action.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div style={{
          marginTop: '1.5rem',
          padding: '2rem',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '0.5rem', fontSize: '24px' }}>📈</span>
            Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { action: 'New application received', candidate: 'Sarah Johnson', job: 'Senior Developer', time: '2 min ago', color: '#3b82f6' },
              { action: 'Interview scheduled', candidate: 'Michael Chen', job: 'Product Manager', time: '1 hour ago', color: '#22c55e' },
              { action: 'Candidate screened', candidate: 'Emily Davis', job: 'UX Designer', time: '3 hours ago', color: '#a855f7' },
            ].map((activity, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.3s'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activity.color, marginRight: '1rem' }}></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', color: 'white', fontSize: '14px', marginBottom: '0.25rem' }}>{activity.action}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{activity.candidate} • {activity.job}</p>
                </div>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
