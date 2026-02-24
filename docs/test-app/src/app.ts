import express, { Request, Response } from 'express';
import session from 'express-session';
import path from 'path';
import { verifyIdToken } from './utils/jose.js';
import { CLIENT_ID, CLIENT_SECRET, CLIENT_URI, PRAMAAN_SERVER } from './config.js';
import { generateOAuthParameters } from './utils/securityParameters.js';
import { AppUser, OAuthSessionData, TokenResponse } from './@types/app.types.js';

const app = express();
const CALLBACK_URL = `${CLIENT_URI}/oauth/callback`;
const IS_HTTPS = CLIENT_URI.startsWith('https://');

/**
 * In-memory user store (DB-like behavior)
 */
const USERS = new Map<string, AppUser>();

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

app.set('trust proxy', 1);

app.use(
  session({
    name: 'oauth-test-client',
    secret: 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_HTTPS,
      maxAge: 10 * 60 * 1000, // 10 minutes
    },
  }),
);

/** ------------------ Helpers ------------------ */

function buildAuthorizationUrl(state: string, nonce: string, codeChallenge: string): string {
  const authUrl = new URL(`${PRAMAAN_SERVER}/api/oauth/authorize`);

  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', CALLBACK_URL!);
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  return authUrl.toString();
}

async function exchangeCodeForTokens(code: string, codeVerifier: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${PRAMAAN_SERVER}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token exchange failed:', errorText);
    throw new Error('Token exchange failed');
  }

  const json = await response.json();

  // Your API returns wrapped format:
  // { success: true, message, data }

  const data = json.data as TokenResponse;

  return data;
}

async function fetchInfo(accountId: string, accessToken: string) {
  const response = await fetch(`${PRAMAAN_SERVER}/api/oauth/account/${accountId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) throw new Error('Profile fetch failed');

  return response.json();
}

// ---------------- LOGIN ----------------

app.get('/login', (req: Request, res: Response) => {
  const oauthParameters = generateOAuthParameters();

  const authorizationUrl = buildAuthorizationUrl(
    oauthParameters.state,
    oauthParameters.nonce,
    oauthParameters.codeChallenge,
  );

  req.session.oauth = {
    intent: 'oauth-signin',
    state: oauthParameters.state,
    nonce: oauthParameters.nonce,
    codeVerifier: oauthParameters.codeVerifier,
  };

  res.redirect(authorizationUrl);
});

// ---------------- CALLBACK ----------------

app.get('/oauth/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error(error_description);
      return res.redirect(`/login?error=${encodeURIComponent('Access denied. Please try again.')}`);
    }

    if (!state || state !== req.session.oauth?.state) {
      return res.status(403).send('Invalid state parameter');
    }

    if (typeof code !== 'string') {
      return res.status(400).send('Missing authorization code');
    }

    const oauthSession = req.session.oauth;
    if (!oauthSession) {
      return res.status(400).send('OAuth session missing');
    }

    const { codeVerifier, nonce } = oauthSession;

    // Exchange code
    const tokenData = await exchangeCodeForTokens(code, codeVerifier);

    if (!tokenData?.idToken) {
      return res.redirect(`/login?error=${encodeURIComponent('Something went wrong. Please try again.')}`);
    }

    // Verify ID token
    const payload = await verifyIdToken(tokenData.idToken, nonce);
    const providerUserId = typeof payload.sub === 'string' ? payload.sub : String(payload.sub);

    const userKey = `oidc:${payload.sub}`;
    let user = USERS.get(userKey);

    // If user is not registered - register the user first
    if (!user) {
      const profileRes = await fetchInfo(providerUserId, tokenData.accessToken);

      const profile = profileRes.data;

      user = {
        id: crypto.randomUUID(),
        provider: 'oidc',
        providerUserId,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar ?? null,
        createdAt: new Date(),
      };

      USERS.set(userKey, user);
    }

    req.session.user = user;
    delete req.session.oauth;

    return res.redirect('/dashboard');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('OAuth callback error:', message);
    return res.status(500).send('OAuth callback error');
  }
});

// ---------------- OTHER ROUTES --------------------

app.get('/', (req: Request, res: Response) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  return res.render('index');
});

app.get('/dashboard', (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.redirect('/');
  }

  return res.render('dashboard', { user: req.session.user });
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

export default app;
