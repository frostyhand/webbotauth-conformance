### Cloudflare web-bot-auth 0.2.0 (library, via adapter) (run 2026-11-21)

Scored: 7 pass, 1 fail. Also 2 reported only, 4 not applicable, 0 errors.

| Case | Expected | Observed | Result | Notes |
| --- | --- | --- | --- | --- |
| S01 Ed25519 signature, fresh, Signature-Agent covered | verified | verified, HTTP 200 | pass |  |
| S02 rsa-pss-sha512 signature, fresh, Signature-Agent covered | verified | verified, HTTP 200 | pass |  |
| S03 Expired signature (expires one minute ago) | invalid | invalid, HTTP 401 | pass |  |
| S04 Signature value altered after signing | invalid | invalid, HTTP 401 | pass |  |
| S05 Covered Signature-Agent value changed after signing | invalid | invalid, HTTP 401 | pass |  |
| S06 Signature-Agent present but not covered by the signature | invalid | verified, HTTP 200 | info | The draft says the member MUST be signed, as an obligation on the signer; whether a verifier must then reject is not stated. |
| S07 keyid not provided by the resolved directory | unverified | unverified, HTTP 401 | pass |  |
| S08 Signature-Agent member carries a parameter (MUST be ignored) | unverified | verified, HTTP 200 | fail |  |
| S09 Signature-Agent URL uses http, not https | unverified | unverified, HTTP 401 | pass |  |
| S10 Lifetime longer than 24 hours (48 h) | verified | verified, HTTP 200 | info | The draft only RECOMMENDS at most 24 hours. Shows the verifier's own lifetime policy. |
| D01 Identity is the resolved key-set URL, not its origin | verified |  | n/a | adapter supplies its own key lookup |
| D02 Two key sets on one shared host get two identities | verified |  | n/a | adapter supplies its own key lookup |
| D03 Key learned from directory A, request asserts directory B | unverified |  | n/a | adapter supplies its own key lookup |
| D04 Signature-Agent URL with an added query string | verified |  | n/a | adapter supplies its own key lookup |

### Storeware (production, black box) (run 2026-11-21)

Scored: 11 pass, 0 fail. Also 3 reported only, 0 not applicable, 0 errors.

| Case | Expected | Observed | Result | Notes |
| --- | --- | --- | --- | --- |
| S01 Ed25519 signature, fresh, Signature-Agent covered | verified | verified, HTTP 200 | pass |  |
| S02 rsa-pss-sha512 signature, fresh, Signature-Agent covered | verified | verified, HTTP 200 | pass |  |
| S03 Expired signature (expires one minute ago) | invalid | rejected (status only), HTTP 401 | pass |  |
| S04 Signature value altered after signing | invalid | rejected (status only), HTTP 401 | pass |  |
| S05 Covered Signature-Agent value changed after signing | invalid | rejected (status only), HTTP 401 | pass |  |
| S06 Signature-Agent present but not covered by the signature | invalid | verified, HTTP 200 | info | The draft says the member MUST be signed, as an obligation on the signer; whether a verifier must then reject is not stated. |
| S07 keyid not provided by the resolved directory | unverified | rejected (status only), HTTP 401 | pass |  |
| S08 Signature-Agent member carries a parameter (MUST be ignored) | unverified | rejected (status only), HTTP 401 | pass |  |
| S09 Signature-Agent URL uses http, not https | unverified | rejected (status only), HTTP 401 | pass |  |
| S10 Lifetime longer than 24 hours (48 h) | verified | rejected (status only), HTTP 401 | info | The draft only RECOMMENDS at most 24 hours. Shows the verifier's own lifetime policy. |
| D01 Identity is the resolved key-set URL, not its origin | verified | verified, HTTP 200 | pass |  |
| D02 Two key sets on one shared host get two identities | verified | verified, HTTP 200 | pass |  |
| D03 Key learned from directory A, request asserts directory B | unverified | rejected (status only), HTTP 401 | pass | Runs after S01, so a verifier that caches keys by keyid alone has already seen this key. |
| D04 Signature-Agent URL with an added query string | verified | verified, HTTP 200 | info | Whether the query is part of the identifier is open in issue 154. Reported, not scored. |
