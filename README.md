# SAML / OIDC POC App

A proof-of-concept demonstrating enterprise SSO (SAML & OIDC) login using **Firebase Authentication**, a **React + Vite** frontend, and an **Express** backend that issues server-side sessions.

---

## Architecture

```
Client (React + Vite)          Server (Express)
  │                               │
  │  Firebase SAML/OIDC popup     │
  ├─ signInWithPopup ──────────►  │
  │                               │
  │  POST /api/auth/verify        │
  │  { idToken }  ──────────────► │  verifyIdToken (Firebase Admin)
  │                               │  → set server session
  │ ◄──────────────── { user } ── │
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A **Firebase project** with Authentication enabled
- A **SAML identity provider** configured in Firebase (e.g. Covisint)
- An **OIDC identity provider** configured in Firebase (optional)
- A Firebase **service account** key (for the server)

---

## 1. Firebase Console Setup

### 1a. Enable Authentication providers

1. Go to **Firebase Console → Authentication → Sign-in method**.
2. Add a **SAML** provider:
   - Provider ID: `saml.<your-saml-provider-name>`
   - Fill in the IdP metadata (Entity ID, SSO URL, certificate) from your identity provider.
   - Set the SP Entity ID to your Firebase project's default.
3. (Optional) Add an **OIDC** provider:
   - Provider ID: `oidc.<your-oidc-provider-name>`
   - Fill in Client ID, Issuer URL, and Client Secret from your IdP.

### 1b. Authorised domains

Add your frontend domain (e.g. `localhost`) under **Authentication → Settings → Authorized domains**.

---

## 2. Environment Variables

### Client — `client/client/.env`

Create the file and add your Firebase web app credentials (found in **Firebase Console → Project Settings → Your apps**):

```env
API_KEY=<your-firebase-api-key>
AUTH_DOMAIN=<your-project-id>.firebaseapp.com
```

> **Never commit this file.** It is already listed in `.gitignore`.

### Server — `server/.env`

```env
SESSION_SECRET=<a-long-random-string>
GOOGLE_APPLICATION_CREDENTIALS=<absolute-path-to-service-account.json>
```

> **Never commit this file or the service account JSON.** Both are already listed in `.gitignore`.

#### Generating a service account key

1. Firebase Console → **Project Settings → Service accounts**.
2. Click **Generate new private key** and save the downloaded JSON somewhere safe (outside the repo).
3. Set `GOOGLE_APPLICATION_CREDENTIALS` to its absolute path.

---

## 3. Update Provider IDs

In `client/client/src/pages/login.jsx`, replace the provider IDs with the ones you configured in Firebase:

```js
const SAML_PROVIDER_ID = 'saml.<your-saml-provider-name>'
const OIDC_PROVIDER_ID = 'oidc.<your-oidc-provider-name>'
```

---

## 4. Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client/client
npm install
```

---

## 5. Run Locally

Open two terminals:

```bash
# Terminal 1 — Backend (runs on port 3000)
cd server
node app.js
```

```bash
# Terminal 2 — Frontend (runs on port 5173)
cd client/client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Authentication Flow

1. User clicks **Sign in with SAML** (or OIDC) on the login page.
2. Firebase opens a popup redirecting to the identity provider.
3. On success, Firebase returns an **ID token** to the client.
4. The client sends the ID token to `POST /api/auth/verify`.
5. The server validates the token with **Firebase Admin SDK** and stores user claims in a server-side session.
6. The user is redirected to `/dashboard`.

---

## Project Structure

```
├── client/client/          # React + Vite frontend
│   ├── src/
│   │   ├── firebase.js     # Firebase app initialisation
│   │   └── pages/
│   │       ├── login.jsx   # SAML / OIDC login page
│   │       └── dashboard.jsx
│   └── .env                # ⚠ Not committed — see step 2
│
├── server/
│   ├── app.js              # Express server + session management
│   └── .env                # ⚠ Not committed — see step 2
│
└── .gitignore
```

---

## Security Notes

- Keep `.env` files and the service account JSON **out of version control**.
- Set a strong, random `SESSION_SECRET` in production.
- In production, set `NODE_ENV=production` so session cookies are marked `Secure`.
