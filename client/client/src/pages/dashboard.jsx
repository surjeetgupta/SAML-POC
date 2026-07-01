import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase'
import './dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)       // Firebase auth user
  const [session, setSession] = useState(null) // Server session user
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        navigate('/login', { replace: true })
        return
      }
      setUser(firebaseUser)

      // Verify ID token with backend and create/refresh server session
      try {
        const idToken = await firebaseUser.getIdToken()
        const verifyRes = await fetch('http://localhost:3000/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ idToken }),
        })
        if (verifyRes.ok) {
          const data = await verifyRes.json()
          setSession(data.user)
        } else {
          const data = await verifyRes.json().catch(() => ({}))
          throw new Error(data.error || `Verification failed (${verifyRes.status})`)
        }
      } catch (err) {
        setAuthError(err.message || 'Session verification failed. Please sign in again.')
      }

      setLoading(false)
    })
    return unsubscribe
  }, [navigate])

  const handleLogout = async () => {
    // Clear server session
    await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading dashboard…</p>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="dashboard-loading">
        <div className="error-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="error-title">Authentication Failed</h2>
        <p className="error-message">{authError}</p>
        <button
          className="error-retry-btn"
          onClick={async () => {
            await signOut(auth)
            navigate('/login', { replace: true })
          }}
        >
          Back to Login
        </button>
      </div>
    )
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="12" fill="#0066CC" />
            <path d="M20 24l3 3 6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>BNDP Portal</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            Overview
          </a>
          <a href="#" className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </a>
          <a href="#" className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M21 12h-2M5 12H3M19.07 19.07l-1.41-1.41M5.34 5.34L3.93 3.93" />
            </svg>
            Settings
          </a>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">Welcome back, {displayName}</h1>
            <p className="dashboard-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="user-avatar" title={user?.email}>
            {initials}
          </div>
        </header>

        {/* Stats */}
        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Auth Provider</span>
            <span className="stat-value">
              {user?.reloadUserInfo?.providerUserInfo?.[0]?.providerId?.startsWith('saml.')
                ? 'SAML 2.0'
                : user?.reloadUserInfo?.providerUserInfo?.[0]?.providerId?.startsWith('oidc.')
                ? 'OIDC'
                : 'SSO'}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Identity Platform</span>
            <span className="stat-value">Firebase</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">IDP</span>
            <span className="stat-value">Covisint</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Session Status</span>
            <span className="stat-value stat-active">Active</span>
          </div>
        </section>

        {/* User info card */}
        <section className="info-card">
          <h2 className="info-card-title">Account Details</h2>
          <dl className="info-list">
            <div className="info-row">
              <dt>Display Name</dt>
              <dd>{session?.name || user?.displayName || '—'}</dd>
            </div>
            <div className="info-row">
              <dt>Email</dt>
              <dd>{session?.email || user?.email || '—'}</dd>
            </div>
            <div className="info-row">
              <dt>Firebase UID</dt>
              <dd className="uid">{user?.uid}</dd>
            </div>
            <div className="info-row">
              <dt>Email Verified</dt>
              <dd>{user?.emailVerified ? 'Yes' : 'No'}</dd>
            </div>
            <div className="info-row">
              <dt>Last Sign-in</dt>
              <dd>
                {user?.metadata?.lastSignInTime
                  ? new Date(user.metadata.lastSignInTime).toLocaleString()
                  : '—'}
              </dd>
            </div>
          </dl>
        </section>

        {/* Covisint SAML attributes — shown only if present in the server session */}
        {session && (session.firstName || session.ssoUserId || session.phone) && (
          <section className="info-card">
            <h2 className="info-card-title">Covisint SAML Attributes</h2>
            <dl className="info-list">
              {session.firstName && (
                <div className="info-row">
                  <dt>First Name</dt>
                  <dd>{session.firstName}</dd>
                </div>
              )}
              {session.lastName && (
                <div className="info-row">
                  <dt>Last Name</dt>
                  <dd>{session.lastName}</dd>
                </div>
              )}
              {session.ssoUserId && (
                <div className="info-row">
                  <dt>SSO User ID</dt>
                  <dd className="uid">{session.ssoUserId}</dd>
                </div>
              )}
              {session.phone && (
                <div className="info-row">
                  <dt>Phone</dt>
                  <dd>{session.phone}</dd>
                </div>
              )}
            </dl>
          </section>
        )}
      </main>
    </div>
  )
}
