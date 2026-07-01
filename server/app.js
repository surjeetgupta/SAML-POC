const express = require('express')
const cors = require('cors')
const session = require('express-session')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

// ── Firebase Admin (Application Default Credentials via GOOGLE_APPLICATION_CREDENTIALS
//    or explicit service account key path in env) ──────────────────────────────
initializeApp({
  projectId: 'otl-eng-bn-bndp',
})

const auth = getAuth()

const app = express()

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
}))

// ── Auth: verify Firebase ID token and create a server session ────────────────
app.post('/api/auth/verify', async (req, res) => {
  const { idToken } = req.body

  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' })
  }

  try {
    const decoded = await auth.verifyIdToken(idToken)
    console.log('Token verified for user:', idToken)
    if(!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Store relevant claims in the server session
    req.session.user = {
      uid:          decoded.uid,
      email:        decoded.email       || null,
      name:         decoded.name        || decoded.email || null,
      emailVerified: decoded.email_verified || false,
      // Covisint SAML custom attributes (if present in the assertion)
      firstName:    decoded.FirstName   || null,
      lastName:     decoded.LastName    || null,
      ssoUserId:    decoded.SSOUserID   || null,
      phone:        decoded.PhoneNumber || null,
    }

    return res.json({ success: true, user: req.session.user })
  } catch (err) {
    console.error('Token verification failed:', err.message)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
})



// ── Auth: logout ──────────────────────────────────────────────────────────────
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' })
    }
    res.clearCookie('connect.sid')
    return res.json({ success: true })
  })
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
