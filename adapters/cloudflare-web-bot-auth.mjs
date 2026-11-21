// Puts Cloudflare's open-source verifier (web-bot-auth on npm) behind HTTP so the
// runner can test it like any other verifier. It reports outcomes with this
// suite's opt-in headers.
//
// The library verifies signatures but leaves key lookup to the caller. The
// resolver below follows the current draft: the Signature-Agent member value is
// fetched directly as a JWK Set, and the key is chosen by keyid within that set.
// Because that lookup is written here and not in the library, run the suite
// against this adapter with --skip-directory: D cases would test this file.
//
//   node adapters/cloudflare-web-bot-auth.mjs [port]
import { createServer } from 'node:http';
import { verify } from 'web-bot-auth';
import { verifierFromJWK } from 'web-bot-auth/crypto';

const port = Number(process.argv[2] ?? 8787);

class KeyLookupError extends Error {}

async function resolver(candidate) {
  const uri = candidate.signatureAgent?.uri;
  if (!uri) throw new KeyLookupError('no usable Signature-Agent member');
  if (!uri.startsWith('https://')) throw new KeyLookupError('Signature-Agent must use https');
  let jwks;
  try {
    const res = await fetch(uri, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    jwks = await res.json();
  } catch (e) { throw new KeyLookupError(`directory fetch failed: ${e.message}`); }
  const jwk = jwks?.keys?.find((k) => k.kid === candidate.keyid);
  if (!jwk) throw new KeyLookupError('directory does not provide this keyid');
  return verifierFromJWK(jwk);
}

createServer(async (req, res) => {
  const url = `http://${req.headers.host}${req.url}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  let outcome, identity, reason;
  try {
    const result = await verify(new Request(url, { headers }), { resolver });
    outcome = 'verified';
    identity = result.signatureAgent?.uri;
  } catch (e) {
    outcome = e instanceof KeyLookupError || e?.cause instanceof KeyLookupError ? 'unverified' : 'invalid';
    reason = String(e?.message ?? e).slice(0, 200);
  }
  res.writeHead(outcome === 'verified' ? 200 : 401, {
    'content-type': 'application/json',
    'web-bot-auth-outcome': outcome,
    ...(identity ? { 'web-bot-auth-identity': identity } : {}),
  });
  res.end(JSON.stringify({ outcome, identity, reason }));
}).listen(port, '127.0.0.1', () => process.stdout.write(`listening on http://127.0.0.1:${port}/\n`));
