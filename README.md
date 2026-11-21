# Web Bot Auth Conformance

An open, implementation-neutral conformance suite for **verifiers** of [Web Bot Auth](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/), the IETF draft that lets automated clients (crawlers, bots and agents) sign HTTP requests with [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421) message signatures and publish their keys in a directory.

**Status: planning.** There is no code yet. This repository holds the plan; the work is described in [PLAN.md](PLAN.md). Comments and issues are welcome now, before anything is built.

## Why

Verifiers for Web Bot Auth are appearing in CDNs, web servers and applications, but there is no shared way to check that one behaves as the draft says.

- The draft's Appendix E and the published vectors show requests a verifier must **accept**.
- Little shared data shows what a verifier must **reject**, and none of it covers the dynamic behaviour below.
- Each implementation tests itself, against its own reading of the text.

The failures that matter in production are mostly not in the signature maths. They are in how a verifier fetches, caches and attributes key directories: identity pooled across every user of a shared host, a key set fetched under one URL spelling but credited to another, rotation that drops keys too early or too late, and slow key hosts that make every request from a new agent fail. Static vectors cannot test any of that.

## What it will be

1. **A runner** that tests any verifier as a black box over HTTP, so the same suite runs against a CDN rule, a web server module or an application library in any language.
2. **A vector corpus** in one machine-readable format: the draft's Appendix E, the published positive vectors, negative cases written from the draft text, and new cases for both registered algorithms (`ed25519`, `rsa-pss-sha512`), validity windows and clock skew. Each case cites the section of the draft it tests.
3. **A scripted key-directory server** that the runner points signers at, to test the dynamic rules: well-known and arbitrary-URL key sets (section 4.5), query spellings (section 5.5, issue 154), refresh, negative caching and coalescing (Appendix C), rotation and removal (section 4.4), and failing or slow key hosts (section 6.10).
4. **CI integration**: a container image and a GitHub Action, plus adapters for the open implementations listed in the draft.
5. **An interoperability report** across willing implementations, with defects reported privately to maintainers first, and unclear text raised with the working group.

## Principles

- **Follow the text, mark the readings.** Where the draft is ambiguous, a case is labelled as an interpretation, reported to the working group, and kept out of the pass or fail score until the text settles.
- **Outcomes first, reasons optional.** The draft defines three verifier outcomes (Appendix C.1: verified, invalid, unverified). Reason codes are useful for debugging but can help a forger probe, so checking them is opt-in.
- **Versioned with the draft.** The corpus is tagged per draft revision.
- **Derived from the text.** Every case, accepting or rejecting, is written from the draft's own requirements and cites the section it tests.

## Licence

Code: [Apache License 2.0](LICENSE). Test data: CC0 1.0, so it can be copied into any implementation's own tests.

## Get involved

Discussion of the protocol belongs on the IETF [web-bot-auth list](https://mailarchive.ietf.org/arch/browse/web-bot-auth/). For this suite, open an issue here: implementers who want their verifier included in the first interoperability round are especially welcome.
