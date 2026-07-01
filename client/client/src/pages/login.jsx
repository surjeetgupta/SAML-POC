import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SAMLAuthProvider, OAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import './login.css'

const SAML_PROVIDER_ID = 'saml.covisint-saml-idp'
const OIDC_PROVIDER_ID = 'oidc.csa-oidc'

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        navigate('/dashboard', { replace: true })
      } else {
        setLoading(false)
      }
    })
    return unsubscribe
  }, [navigate])

  const handleSamlLogin = async () => {
    setError(null)
    try {
      const provider = new SAMLAuthProvider(SAML_PROVIDER_ID)
      await signInWithPopup(auth, provider)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleOidcLogin = async () => {
    setError(null)
    try {
      const provider = new OAuthProvider(OIDC_PROVIDER_ID)
      await signInWithPopup(auth, provider)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="spinner" />
          <p className="loading-text">Checking authentication…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="12" fill="#0066CC" />
            <path d="M14 24C14 18.477 18.477 14 24 14s10 4.477 10 10-4.477 10-10 10S14 29.523 14 24Z" fill="white" fillOpacity="0.2" />
            <path d="M20 24l3 3 6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="login-title">BNDP Customer Portal</h1>
        <p className="login-subtitle">Sign in with your organization account</p>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <button className="saml-button" onClick={handleSamlLogin}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" fill="currentColor" />
            <path d="M10 6a4 4 0 100 8 4 4 0 000-8zm0 6.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor" />
          </svg>
          Sign in with Covisint SAML
        </button>

        <div className="login-divider">
          <span>or</span>
        </div>

        <button className="oidc-button" onClick={handleOidcLogin}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Sign in with CSA OIDC
        </button>

        <p className="login-footer">
          Secured by Firebase &amp; SAML 2.0 &amp; OIDC
        </p>
      </div>
    </div>
  )
}
