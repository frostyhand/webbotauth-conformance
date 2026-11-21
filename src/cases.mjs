// Conformance cases. Each signs a fresh request at run time, because almost every
// verifier enforces signature lifetimes, so fixed vectors expire.
//
// expected: verified | invalid | unverified (draft, "Verifier Outcomes").
// scoring:  "scored" cases follow a MUST or a mechanical failure in the draft or
//           RFC 9421; "interpretation" cases are reported but not scored.
// needs:    "identity" if the verifier must report which identifier it resolved;
//           "directory" if the case tests the verifier's own key-directory handling.
//
// Section references are anchors in draft-ietf-webbotauth-httpsig-protocol
// (main branch, November 2026), so they survive renumbering.

const DRAFT = 'draft-ietf-webbotauth-httpsig-protocol';

export const CASES = [
  {
    id: 'S01', name: 'Ed25519 signature, fresh, Signature-Agent covered',
    expected: 'verified', scoring: 'scored', ref: `${DRAFT}#generating-http-message-signature`,
    build: (k) => ({ key: k.A.ed, agent: k.A.url }),
  },
  {
    id: 'S02', name: 'rsa-pss-sha512 signature, fresh, Signature-Agent covered',
    expected: 'verified', scoring: 'scored', ref: `${DRAFT}#generating-http-message-signature`,
    build: (k) => ({ key: { ...k.A.rsa, alg: 'PS512' }, agent: k.A.url }),
  },
  {
    id: 'S03', name: 'Expired signature (expires one minute ago)',
    expected: 'invalid', scoring: 'scored', ref: `${DRAFT}#verifier-outcomes; RFC 9421 Section 3.2.1`,
    build: (k) => ({ key: k.A.ed, agent: k.A.url, created: -600, expires: -60 }),
  },
  {
    id: 'S04', name: 'Signature value altered after signing',
    expected: 'invalid', scoring: 'scored', ref: 'RFC 9421 Section 3.2',
    build: (k) => ({ key: k.A.ed, agent: k.A.url, mutate: 'flip-signature' }),
  },
  {
    id: 'S05', name: 'Covered Signature-Agent value changed after signing',
    expected: 'invalid', scoring: 'scored', ref: `${DRAFT}#signature-agent; RFC 9421 Section 3.2`,
    build: (k) => ({ key: k.A.ed, agent: k.A.url, sendAgent: k.A.url + '#changed' }),
  },
  {
    id: 'S06', name: 'Signature-Agent present but not covered by the signature',
    expected: 'invalid', scoring: 'interpretation', ref: `${DRAFT}#signature-agent`,
    note: 'The draft says the member MUST be signed, as an obligation on the signer; whether a verifier must then reject is not stated.',
    build: (k) => ({ key: k.A.ed, agent: k.A.url, coverAgent: false }),
  },
  {
    id: 'S07', name: 'keyid not provided by the resolved directory',
    expected: 'unverified', scoring: 'scored', ref: `${DRAFT}#verifier-outcomes`,
    build: (k) => ({ key: k.A.ed, agent: k.A.url, keyid: 'not-in-this-directory' }),
  },
  {
    id: 'S08', name: 'Signature-Agent member carries a parameter (MUST be ignored)',
    expected: 'unverified', scoring: 'scored', ref: `${DRAFT}#signature-agent`,
    build: (k) => ({ key: k.A.ed, agent: k.A.url, agentParams: ';x=1' }),
  },
  {
    id: 'S09', name: 'Signature-Agent URL uses http, not https',
    expected: 'unverified', scoring: 'scored', ref: `${DRAFT}#signature-agent`,
    build: (k) => ({ key: k.A.ed, agent: k.A.url.replace(/^https:/, 'http:') }),
  },
  {
    id: 'S10', name: 'Lifetime longer than 24 hours (48 h)',
    expected: 'verified', scoring: 'interpretation', ref: `${DRAFT}#generating-http-message-signature`,
    note: 'The draft only RECOMMENDS at most 24 hours. Shows the verifier\'s own lifetime policy.',
    build: (k) => ({ key: k.A.ed, agent: k.A.url, expires: 48 * 3600 }),
  },
  {
    id: 'D01', name: 'Identity is the resolved key-set URL, not its origin',
    expected: 'verified', scoring: 'scored', needs: ['identity', 'directory'], ref: `${DRAFT}#url-is-identifier`,
    expectIdentity: (k) => k.A.url,
    build: (k) => ({ key: k.A.ed, agent: k.A.url }),
  },
  {
    id: 'D02', needsSecondKeySet: true, name: 'Two key sets on one shared host get two identities',
    expected: 'verified', scoring: 'scored', needs: ['identity', 'directory'], ref: `${DRAFT}#url-is-identifier`,
    expectIdentity: (k) => k.B.url,
    build: (k) => ({ key: k.B.ed, agent: k.B.url }),
  },
  {
    id: 'D03', needsSecondKeySet: true, name: 'Key learned from directory A, request asserts directory B',
    expected: 'unverified', scoring: 'scored', needs: ['directory'], ref: `${DRAFT}#validating-message-signature (key lookup keyed on the (URL, key) pair)`,
    note: 'Runs after S01, so a verifier that caches keys by keyid alone has already seen this key.',
    build: (k) => ({ key: k.A.ed, agent: k.B.url }),
  },
  {
    id: 'D04', name: 'Signature-Agent URL with an added query string',
    expected: 'verified', scoring: 'interpretation', needs: ['identity', 'directory'], ref: `${DRAFT}#url-is-identifier; issue 154`,
    note: 'Whether the query is part of the identifier is open in issue 154. Reported, not scored.',
    build: (k) => ({ key: k.A.ed, agent: k.A.url + (k.A.url.includes('?') ? '&' : '?') + 'wbac=1' }),
  },
];
