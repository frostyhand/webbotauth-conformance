# Plan

Six milestones. Each ends with a tagged public release.

| # | Milestone | Output |
| --- | --- | --- |
| 1 | Runner | Command-line runner that signs or replays requests against a verifier under test over HTTP and records the outcome. Minimal opt-in report convention (the Appendix C.1 outcome), with adapters that infer outcomes from status codes where that is all a verifier exposes. |
| 2 | Vector corpus | One schema for positive and negative cases; import of Appendix E and the published positive vectors; negative cases written from the draft text; new cases for `ed25519` and `rsa-pss-sha512`, validity windows and clock skew. Each case cites a draft section and revision. |
| 3 | Key-directory simulator | Scripted server that records every fetch and serves changed key sets, errors and delays on cue. Cases for sections 4.4, 4.5, 5.5 and 6.10 and Appendix C. |
| 4 | CI and adapters | Container image, GitHub Action, adapters for the open implementations listed in the draft. |
| 5 | Interoperability round | Results matrix across willing implementations; private reports to maintainers first; issues or pull requests on the draft where the text is unclear; a report to the working group. |
| 6 | Documentation and packaging | User guide for implementers, accessible docs, packaging. |

## Known hard parts

- **No wire format for outcomes.** The draft defines verifier outcomes but not how a verifier reports them, and some deployments deliberately hide reasons.
- **Time.** Most cases must be signed fresh at run time; fixed replayable vectors are kept separate, and long-window vectors are flagged for verifiers that cap validity.
- **Stateful caching.** Refresh, negative caching and coalescing are timing-dependent; tests must allow legitimate variation, such as an early refresh.
- **RSA-PSS portability.** Some runtimes ignore PSS options in one-shot verify calls (see cloudflare/workerd issue 7613), so a verifier can accept or reject for the wrong reason.
- **Draft churn.** The corpus is versioned per draft revision so results stay meaningful as the text moves.

## Background

The cases in milestone 3 come from deploying a production verifier against draft 01. The findings were reported to the working group in November 2026: [implementation report](https://mailarchive.ietf.org/arch/msg/web-bot-auth/fr6TNAd2TULsAOsR2_5F2kyT5k8/).
