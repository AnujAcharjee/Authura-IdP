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
