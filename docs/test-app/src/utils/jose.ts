import { createRemoteJWKSet, jwtVerify } from 'jose';
import { PRAMAAN_SERVER, CLIENT_ID } from '../config.js';

const jwks = createRemoteJWKSet(new URL(`${PRAMAAN_SERVER}/api/.well-known/jwks.json`));

export async function verifyIdToken(idToken: string, nonce: string) {
  const verified = await jwtVerify(idToken, jwks, {
    issuer: PRAMAAN_SERVER,
    audience: CLIENT_ID,
    algorithms: ['RS256'],
  });

  if (verified.payload.nonce !== nonce) {
    throw new Error('Invalid nonce');
  }

  return verified.payload;
}
