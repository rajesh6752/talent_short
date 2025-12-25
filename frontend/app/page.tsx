'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated mesh background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 40%)
        `
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        opacity: 0.4
      }} />

      {/* Hero Section */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Navigation */}
        <nav style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>TalentForge AI</span>
          </div>
          <Link href="/login" style={{
            padding: '0.75rem 2rem',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            color: 'white',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'all 0.3s'
          }}>Sign In</Link>
        </nav>

        {/* Hero Content */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '4rem 2rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center',
          minHeight: 'calc(100vh - 100px)'
        }}>
          {/* Left Column - Text Content */}
          <div>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1.25rem',
              background: 'rgba(102, 126, 234, 0.15)',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '20px',
              marginBottom: '2rem',
              color: '#a78bfa',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              ⚡ Powered by Advanced AI
            </div>

            <h1 style={{
              fontSize: '72px',
              fontWeight: '900',
              color: 'white',
              lineHeight: '1.1',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Hire Faster with{' '}
              <span style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>AI Intelligence</span>
            </h1>

            <p style={{
              fontSize: '20px',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: '1.6',
              marginBottom: '2.5rem',
              maxWidth: '500px'
            }}>
              Revolutionary recruitment platform that finds perfect candidates in seconds.
              Powered by advanced AI to match talent with precision.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
              <Link href="/register" style={{
                padding: '1.125rem 2.5rem',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '16px',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s',
                display: 'inline-block'
              }}>
                Start Free Trial →
              </Link>
              <button style={{
                padding: '1.125rem 2rem',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'white',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}>
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '3rem' }}>
              {[
                { value: '10K+', label: 'Companies' },
                { value: '1M+', label: 'Candidates' },
                { value: '98%', label: 'Success Rate' }
              ].map((stat, i) => (
                <div key={i}>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: 'white', marginBottom: '0.25rem' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Illustration */}
          <div style={{ position: 'relative' }}>
            {/* Floating Card */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'float 6s ease-in-out infinite'
            }}>
              {/* Mock Dashboard UI */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
                </div>

                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
                  Candidate Matching
                </div>

                {[
                  { name: 'Sarah Johnson', match: '98%', color: '#667eea', delay: 0 },
                  { name: 'Michael Chen', match: '96%', color: '#764ba2', delay: 0.2 },
                  { name: 'Emily Davis', match: '94%', color: '#8b5cf6', delay: 0.4 }
                ].map((candidate, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    marginBottom: '0.75rem',
                    animation: `slideIn 0.6s ease-out ${candidate.delay}s both`
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${candidate.color}, #764ba2)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        {candidate.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                          {candidate.name}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                          Senior Developer
                        </div>
                      </div>
                    </div>
                    <div style={{
                      padding: '0.5rem 1rem',
                      background: `${candidate.color}22`,
                      color: candidate.color,
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                      {candidate.match}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Elements */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeWidth={2} stroke="currentColor" fill="none" />
              </svg>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ maxWidth: '1400px', margin: '6rem auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>
              Why Choose TalentForge AI
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)' }}>
              The most advanced recruitment platform powered by AI
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {[
              { icon: '🤖', title: 'AI-Powered Matching', desc: 'Advanced algorithms analyze thousands of candidates instantly', color: '#667eea' },
              { icon: '⚡', title: 'Lightning Fast', desc: 'Reduce hiring time by 90% with automated workflows', color: '#764ba2' },
              { icon: '🎯', title: 'Precision Hiring', desc: '98% match accuracy with your requirements', color: '#8b5cf6' }
            ].map((feature, i) => (
              <div key={i} style={{
                padding: '3rem 2rem',
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                transition: 'all 0.3s',
                cursor: 'pointer',
                animation: `fadeInUp 0.6s ease-out ${i * 0.1}s both`
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)'
                  e.currentTarget.style.borderColor = `${feature.color}80`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: `linear-gradient(135deg, ${feature.color}, #764ba2)`,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  marginBottom: '1.5rem',
                  boxShadow: `0 10px 30px ${feature.color}40`
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
