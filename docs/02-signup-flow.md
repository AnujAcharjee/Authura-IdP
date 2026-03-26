# Pramaan Sign-Up Flow Implementation Guide

## Overview

This guide explains how to implement a complete OAuth 2.0 + OIDC sign-up/login flow using **Pramaan** as your Identity Provider (IdP).

> **Core Principle**
>
> - Pramaan is responsible for authenticating the user and issuing identity tokens.
> - Your application is responsible for managing application sessions and user records if needed.

This document focuses strictly on the implementation flow.

## Step 1: Generate OAuth Security Parameters

Before redirecting users to Pramaan, generate security parameters:

### Required Security Parameters

| Parameter      | Purpose                 |
| -------------- | ----------------------- |
| state          | CSRF protection         |
| nonce          | Prevent ID token replay |
| code_verifier  | PKCE proof              |
| code_challenge | Hashed verifier         |

### TypeScript Implementation

```typescript
import crypto from 'crypto';

export function generateVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function generateChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export function generateState(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function generateNonce(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function generateOAuthParameters() {
  const codeVerifier = generateVerifier();

  return {
    state: generateState(),
    nonce: generateNonce(),
    codeVerifier,
    codeChallenge: generateChallenge(codeVerifier),
  };
}
```

## Step 2: Redirect to Pramaan Authorization Endpoint

```typescript
function buildAuthorizationUrl(state: string, nonce: string, codeChallenge: string): string {
  const authUrl = new URL(`https://pramaan.anujacharjee.com/api/oauth/authorize`);

  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', process.env.CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', process.env.CALLBACK_URL!);
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  return authUrl.toString();
}
```

Redirect the browser to this URL.

## Step 3: Handle Callback

```typescript
app.get('/oauth/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.redirect('/login?error=access_denied');
  }

  if (!state || state !== req.session.oauth?.state) {
    return res.status(403).send('Invalid state parameter');
  }

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  // Continue to token exchange
});
```

## Step 4: Exchange Authorization Code for Tokens

```typescript
async function exchangeCodeForTokens(code: string, codeVerifier: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: process.env.CLIENT_ID!,
    client_secret: process.env.CLIENT_SECRET!,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${process.env.PRAMAAN_SERVER}/api/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) throw new Error('Token exchange failed');

  return response.json();
}
```

## Step 5: Verify ID Token

```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose';

const jwks = createRemoteJWKSet(new URL(`${process.env.PRAMAAN_ISSUER}/api/.well-known/jwks.json`));

async function verifyIdToken(idToken: string, nonce: string) {
  const verified = await jwtVerify(idToken, jwks, {
    issuer: process.env.PRAMAAN_ISSUER,
    audience: process.env.CLIENT_ID,
    algorithms: ['RS256'],
  });

  if (verified.payload.nonce !== nonce) {
    throw new Error('Invalid nonce');
  }

  return verified.payload;
}
```

## Step 6: Create or Update User

After verifying the ID Token, you should link the authenticated user to your application's database.

```typescript
async function findOrCreateUser(profile) {
  let user = await db.users.findOne({ pramaanId: profile.sub });

  // If user does not exist locally
  if (!user) {
    /**
     * Option 1 (Recommended):
     * Use the ID token claims (profile) to create the user directly.
     */
    user = await db.users.create({
      pramaanId: profile.sub,
      email: profile.email,
      name: profile.name,
    });

    /**
     * Option 2:
     * If additional fields are required and not present in the ID token,
     * use the access token to fetch user information from the UserInfo endpoint.
     *
     * Example:
     *
     * const response = await fetch(`${process.env.PRAMAAN_ISSUER}/api/oauth/account/${verifiedToken.sub}`, {
     *   headers: {
     *     Authorization: `Bearer ${accessToken}`,
     *   },
     * });
     *
     * const userInfo = await response.json();
     *
     * Then create the user using userInfo fields.
     */
  }

  return user;
}
```

### Why Use the Access Token?

If the ID token does not contain all required user attributes:

- Use the **Access Token**
- Call the **UserInfo endpoint**
- Fetch additional claims
- Then create or update the user

The Access Token is meant for protected resource access — not session management.

## Step 7: Create Application Session

After linking or creating the user, generate your own application session.

```typescript
import jwt from 'jsonwebtoken';

function createSessionToken(user) {
  return jwt.sign({ userId: user.id }, process.env.APP_JWT_SECRET!, {
    expiresIn: '15m',
  });
}
```

Set secure cookie:

```typescript
res.cookie('session', sessionToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
});
```

⚠ Do not use OAuth access tokens as your application session.  
Always create your own session mechanism.

## Complete Flow

- Generate parameters
- Redirect to Pramaan
- Handle callback
- Exchange code
- Verify ID token
- Create/update user
- Create session
