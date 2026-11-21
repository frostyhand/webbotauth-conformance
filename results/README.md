# Prototype results, 21 November 2026

First runs of the prototype runner (`v0.1.0-prototype`) against two verifiers. Cases are in [src/cases.mjs](../src/cases.mjs); each signs a fresh request with Cloudflare's published signer (`web-bot-auth` 0.2.0) and key sets hosted as secret GitHub gists (public keys only).

| Verifier | How it was tested | Scored | Reported only | Not applicable |
| --- | --- | --- | --- | --- |
| Cloudflare `web-bot-auth` 0.2.0 (library) | Local, behind [adapters/cloudflare-web-bot-auth.mjs](../adapters/cloudflare-web-bot-auth.mjs); exact outcomes via the report headers | 7 pass, 1 fail | 2 | 4 (directory cases; the adapter, not the library, does key lookup) |
| Storeware API (production) | Black box over HTTPS; status code only, identity read from the response body | 11 pass, 0 fail | 3 | 0 |

Disclosure: Storeware is operated by the author of this suite. It is included because it is a production verifier the author can test without asking anyone, not as an endorsement.

## Findings

1. **Parameters on a `Signature-Agent` member (S08).** The current draft says a verifier MUST ignore a member that carries parameters. `web-bot-auth` 0.2.0 (released 31 August 2026, before draft 01 on 29 October 2026) passes the member through and the request verifies. This is a gap against the current draft, not a defect against the version the library was written for.
2. **Uncovered `Signature-Agent` (S06).** Both verifiers accept a request whose `Signature-Agent` is present but not covered by the signature. The draft puts the obligation on the signer ("MUST be signed") and does not say what a verifier should do, so this is reported, not scored. Because the member is what the verifier fetches keys from, an uncovered member can be swapped in transit; it may be worth a sentence in the draft.
3. **Lifetimes over 24 hours (S10).** The library accepts a 48-hour signature; Storeware refuses it. The draft only recommends 24 hours, so both are allowed, and verifiers will differ.
4. **Identity and key lookup (D01 to D03).** Storeware reports the full key-set URL as the identity, gives two key sets on the same host two identities, and refuses a key learned from one directory when the request asserts another, as the draft's (URL, key) rule requires.
5. **Query strings (D04).** Storeware verifies a request whose `Signature-Agent` has an added query and attributes it to the URL without the query. Whether the query belongs to the identifier is open in the draft's issue 154.

## Cloudflare's production verifier

Cloudflare's [Web Bot Auth documentation](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) (updated 8 October 2026) still tells bot authors to send `Signature-Agent` as a structured string, "not a dictionary", and references the earlier draft-meunier documents. Its public test endpoint, `https://crawltest.com/cdn-cgi/web-bot-auth`, answered both forms the same way on 21 November 2026: HTTP 401, "unknown public key", which by the documentation means the message was well formed and only the key was unknown. So the production parser accepts the dictionary form the current draft requires, and the documentation lags the draft. Verifying end to end against it needs a key registered through Cloudflare's verified-bots process, which this prototype does not do.

## Tables

[tables.md](tables.md) has the per-case results; the JSON files next to it are the raw output.
