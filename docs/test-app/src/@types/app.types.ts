export interface OAuthSessionData {
  intent: string;
  state: string;
  nonce: string;
  codeVerifier: string;
}

export interface AppUser {
  id: string;
  provider: 'oidc';
  providerUserId: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: Date;
}

export interface TokenResponse {
  accessToken: string;
  idToken: string;
}