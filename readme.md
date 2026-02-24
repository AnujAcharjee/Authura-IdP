# Pramaan — Identity Provider


**Pramaan** is an OAuth 2.0 and OpenID Connect (OIDC) compliant Identity Provider (IdP) designed to provide secure, standards-based authentication and authorization for web, mobile, and backend applications.

OAuth 2.0 and OpenID Connect are complementary industry standards that solve different but related security challenges in modern distributed systems.

- **[OAuth 2.0](https://oauth.net/2/)** is an authorization framework that answers:  
  _"What is this client application allowed to access?"_

- **[OpenID Connect (OIDC)](https://medium.com/@dmosyan/openid-connect-oidc-explained-b7a368c90168)** is an authentication layer built on OAuth 2.0 that answers:  
  _"Who is the authenticated user?"_

Pramaan implements the **OAuth 2.0 Authorization Code Flow with PKCE**, the recommended and most secure flow for both public and confidential clients. OpenID Connect support is automatically enabled when the `openid` scope is requested.

Pramaan acts as a centralized trust authority — issuing tokens, managing user identity, and enforcing secure authorization policies across connected applications.

🌐 **Website:** https://pramaan.anujacharjee.com


# 🚀 Getting Started

Follow these steps to integrate Pramaan into your application.


## 1. Create Your First OAuth Client

Register your application inside Pramaan to obtain:

- Client ID
- Client Secret (for confidential clients)
- Redirect URI configuration

📄 **Guide:**  
[Create Client Documentation](./docs/01-create-client.md)

## 2. Implement OAuth Flow in Your Application

Integrate Pramaan using:

- Security parameter generation (state, nonce, PKCE)
- Authorization redirect
- Token exchange
- ID token verification
- User creation
- Session management

📄 **Guide:**  
[Implementation Guide](./docs/02-signup-flow.md)


# 📁 Documentation Structure

```
root/
├── README.md
└── docs/
    ├── test-app               
    ├── 01-create-client.md
    └── 02-signup-flow.md
```


# 🧪 Test Client (Sample Application)

A fully working reference client is included to help you test the complete OAuth 2.0 + OIDC flow against Pramaan.
You can clone and run the test client locally.

For detailed setup instructions, click [more](https://github.com/AnujAcharjee/pramaan/tree/main/docs/test-app/README.md)



# 🔐 OAuth Tokens vs Application Sessions

Understanding this distinction is critical.

| OAuth Token         | Application Session  |
| ------------------- | -------------------- |
| Issued by Pramaan   | Issued by your app   |
| Short-lived         | Longer-lived         |
| Used for API access | Used for login state |

⚠ Never use OAuth tokens as your application session.

After successful authentication, create your own session mechanism.


# 🛠 Common Issues & Solutions

### Invalid Redirect URI

Ensure the redirect URI exactly matches what is registered in Pramaan.

### State Mismatch

Possible CSRF attempt or expired session.  
Validate state parameter properly.

### Invalid ID Token

Verify:

- Issuer
- Audience
- Nonce
- Signature
- Expiration

### Access Token Expired

Use refresh token or require re-authentication.


# 🏗 Production Checklist

- HTTPS enabled for all redirect URIs
- Secure cookies (`httpOnly`, `secure`, `sameSite`)
- PKCE enforced
- ID token verification enabled
- Sessions expire correctly
- Database indexed on `pramaanId`
- Rate limiting on login endpoints
- CSRF protection enabled
- XSS protection enabled
- Proper logging & monitoring configured


# 🔒 Security Best Practices

- Never expose `CLIENT_SECRET`
- Always validate `state`
- Always validate `nonce`
- Verify ID token signature using JWKS
- Use server-side sessions (recommended)
- Do not store OAuth tokens in database
- Expire OAuth parameters in 10–15 minutes
- Enforce RS256 verification

---

**Last Updated:** February 2026  
**Version:** 2.0
