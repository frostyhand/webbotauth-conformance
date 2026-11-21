// Test key generation. Writes the private half to a local file (never commit it)
// and prints the public JWK Set, which you host at a stable HTTPS URL.
import { generateKeyPairSync, createHash } from 'node:crypto';

const b64u = (b) => Buffer.from(b).toString('base64url');
// RFC 7638 thumbprint over the required members, in lexicographic order.
const thumbprint = (members) => b64u(createHash('sha256').update(JSON.stringify(members)).digest());

export function generateKeys({ rsa = true } = {}) {
  const ed = generateKeyPairSync('ed25519');
  const edPub = ed.publicKey.export({ format: 'jwk' });
  const edKid = thumbprint({ crv: edPub.crv, kty: edPub.kty, x: edPub.x });
  const priv = { ed: { ...ed.privateKey.export({ format: 'jwk' }), kid: edKid } };
  const keys = [{ ...edPub, kid: edKid, use: 'sig' }];
  if (rsa) {
    const r = generateKeyPairSync('rsa', { modulusLength: 2048, publicExponent: 65537 });
    const rPub = r.publicKey.export({ format: 'jwk' });
    const rKid = thumbprint({ e: rPub.e, kty: rPub.kty, n: rPub.n });
    priv.rsa = { ...r.privateKey.export({ format: 'jwk' }), kid: rKid, alg: 'PS512' };
    keys.push({ ...rPub, kid: rKid, use: 'sig', alg: 'PS512' });
  }
  return { priv, jwks: { keys } };
}
