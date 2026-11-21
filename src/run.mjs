// Runs the cases against one verifier over HTTP and scores them.
//
// How an outcome is read from the response, in order:
//  1. A `Web-Bot-Auth-Outcome` header (verified | invalid | unverified), if the
//     verifier implements this suite's opt-in report convention.
//  2. Otherwise the status code: 2xx is verified, anything else is "rejected"
//     (invalid and unverified cannot be told apart, so those cases are scored at
//     accept-or-reject level and marked "coarse").
// Identity, for D cases, comes from a `Web-Bot-Auth-Identity` header or a field
// in a JSON body (--identity-field).
import { CASES } from './cases.mjs';
import { buildSignedRequest } from './signing.mjs';

const OUTCOMES = new Set(['verified', 'invalid', 'unverified']);

function readIdentity(res, body, field) {
  const h = res.headers.get('web-bot-auth-identity');
  if (h) return h;
  if (!field) return undefined;
  try { return field.split('.').reduce((o, k) => o?.[k], JSON.parse(body)); } catch { return undefined; }
}

// Some verifiers prefix the identifier with a scheme label (e.g. "key-set:").
const bareIdentity = (id) => id?.replace(/^[a-z][a-z-]*:(?=https?:)/, '');

export async function runSuite(opts) {
  const { target, keys, identityField, delayMs = 1500, skipDirectory = false, only } = opts;
  const results = [];
  for (const c of CASES) {
    if (only && !only.includes(c.id)) continue;
    const needs = c.needs ?? [];
    if (needs.includes('directory') && skipDirectory) { results.push({ ...meta(c), result: 'n/a', note: 'adapter supplies its own key lookup' }); continue; }
    if (c.needsSecondKeySet && !keys.B) { results.push({ ...meta(c), result: 'n/a', note: 'needs a second key set (--keys-b)' }); continue; }
    const spec = c.build(keys);
    let observed, identity, status, error;
    try {
      const headers = await buildSignedRequest(target, spec);
      const res = await fetch(target, { headers });
      status = res.status;
      const body = await res.text();
      const reported = res.headers.get('web-bot-auth-outcome');
      observed = OUTCOMES.has(reported) ? reported : (res.ok ? 'verified' : 'rejected');
      identity = readIdentity(res, body, identityField);
    } catch (e) { error = String(e?.message ?? e); observed = 'error'; }
    results.push(score(c, keys, { observed, identity, status, error }));
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
}

function meta(c) {
  return { id: c.id, name: c.name, expected: c.expected, scoring: c.scoring, ref: c.ref, note: c.note };
}

function score(c, keys, o) {
  const r = { ...meta(c), observed: o.observed, status: o.status, identity: o.identity, error: o.error };
  if (o.observed === 'error') return { ...r, result: 'error' };
  let pass;
  if (o.observed === 'rejected') { pass = c.expected !== 'verified'; r.coarse = true; }
  else pass = o.observed === c.expected;
  if (pass && c.expectIdentity) {
    const want = c.expectIdentity(keys);
    if (o.identity === undefined) { r.result = 'n/a'; r.note = 'verifier does not report identity'; return r; }
    pass = bareIdentity(o.identity) === want;
    if (!pass) r.note = `identity was ${o.identity}`;
  }
  r.result = c.scoring === 'interpretation' ? 'info' : pass ? 'pass' : 'fail';
  return r;
}
