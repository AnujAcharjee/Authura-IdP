# 🧪 Pramaan Test Client

This is a reference OAuth 2.0 + OpenID Connect (OIDC) client used to test integration with **Pramaan Identity Provider**.

The application runs in Docker and uses HTTPS locally to simulate a production-grade authentication environment.

---

# 🚀 Setup Guide

## 1. Clone the Repository

```bash
git clone https://github.com/AnujAcharjee/pramaan.git
cd pramaan/docs/test-app
```

## 2. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and add:

```
CLIENT_ID=
CLIENT_SECRET=
```

Obtain these values from the Pramaan dashboard after creating a client.

## 3. Install Dependencies

```bash
npm install
```

## 4. Build Docker Images

```bash
npm run docker:build
```

## 5. Start the Containers

```bash
npm run docker:up
```

## 6. Trust the Local HTTPS Certificate

```bash
npm run trust
```

This generates a `root.crt` file in the project root directory.
Import and trust the `root.crt` in your system if prompted.

> 🤖 Need Help Installing the Certificate?

If you're unsure how to install the generated `root.crt` on your system, copy and ask an AI assistant:

```
I have generated a local Certificate Authority file named `root.crt` for enabling HTTPS on localhost for an OAuth 2.0 + OIDC application.

I need step-by-step instructions to:

1. Import this certificate into my system's Trusted Root Certification Authorities
2. Mark it as trusted
3. Verify that https://localhost is secure

My operating system is: <Windows / macOS / Linux>.
Please give exact system-level steps.
```

Replace `<Windows / macOS / Linux>` with your OS.

## 7. Start the Application

```bash
npm run start
```

---

# 🔐 What This Test Client Demonstrates

- OAuth 2.0 Authorization Code Flow with PKCE
- OpenID Connect ID token validation
- Secure cookie handling
- Server-side session management
- HTTPS enforcement
- State and nonce validation
- Token exchange
- Secure session creation

---

# ⚠️ Important

- Do not disable HTTPS
- Always validate state and nonce
- Never expose CLIENT_SECRET publicly
- Always verify ID token signatures using JWKS
