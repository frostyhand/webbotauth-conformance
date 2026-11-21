// Builds and signs one request for a case, using Cloudflare's published signer
// (web-bot-auth on npm) so the signatures are ones real agents send.
import { sign } from 'web-bot-auth';
import { signerFromJWK } from 'web-bot-auth/crypto';

const LABEL = 'sig1';

export async function buildSignedRequest(target, spec, now = Date.now()) {
  const agentValue = `${LABEL}="${spec.agent}"${spec.agentParams ?? ''}`;
  const headers = new Headers({ 'Signature-Agent': agentValue, 'User-Agent': 'webbotauth-conformance/0.1' });
  let signer = await signerFromJWK(spec.key);
  if (spec.keyid) {
    const inner = signer;
    signer = { algorithm: inner.algorithm, keyid: spec.keyid, sign: (data) => inner.sign(data) };
  }
  const created = new Date(now + (spec.created ?? 0) * 1000);
  const expires = new Date(now + (spec.expires ?? 120) * 1000);
  const fields = await sign(new Request(target, { headers }), {
    signer, created, expires, label: LABEL,
    ...(spec.coverAgent === false ? {} : { signatureAgentKey: LABEL }),
  });
  let signature = fields.signature;
  if (spec.mutate === 'flip-signature') signature = flipBase64(signature);
  headers.set('Signature', signature);
  headers.set('Signature-Input', fields.signatureInput);
  if (spec.sendAgent) headers.set('Signature-Agent', `${LABEL}="${spec.sendAgent}"`);
  return headers;
}

// Changes one character inside the base64 byte sequence (between the colons).
function flipBase64(sig) {
  const start = sig.indexOf(':') + 1;
  const i = start + 5;
  const c = sig[i];
  const swapped = c === 'A' ? 'B' : 'A';
  return sig.slice(0, i) + swapped + sig.slice(i + 1);
}
