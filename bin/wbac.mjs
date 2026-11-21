#!/usr/bin/env node
// wbac: Web Bot Auth conformance runner (prototype).
//
//   wbac keygen --out keys/a.private.json [--no-rsa]
//       Writes private test keys and prints the public JWK Set to host.
//   wbac run --target URL --keys-a FILE [--keys-b FILE] [--identity-field NAME]
//            [--skip-directory] [--label TEXT] [--json FILE] [--delay MS]
//       A keys file is {"url": "<https URL where its JWK Set is hosted>", "ed": {...}, "rsa": {...}}.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { generateKeys } from '../src/keys.mjs';
import { runSuite } from '../src/run.mjs';
import { toMarkdown } from '../src/report.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const args = {};
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (!a.startsWith('--')) continue;
  const next = rest[i + 1];
  if (next === undefined || next.startsWith('--')) args[a.slice(2)] = true;
  else { args[a.slice(2)] = next; i++; }
}

if (cmd === 'keygen') {
  if (!args.out) throw new Error('--out is required');
  const { priv, jwks } = generateKeys({ rsa: !args['no-rsa'] });
  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, JSON.stringify({ url: '<set to the https URL where you host the JWK Set>', ...priv }, null, 2), { mode: 0o600 });
  process.stdout.write(JSON.stringify(jwks, null, 2) + '\n');
} else if (cmd === 'run') {
  if (!args.target || !args['keys-a']) throw new Error('--target and --keys-a are required');
  const load = (f) => JSON.parse(readFileSync(f, 'utf8'));
  const keys = { A: load(args['keys-a']), ...(args['keys-b'] ? { B: load(args['keys-b']) } : {}) };
  const results = await runSuite({
    target: args.target, keys, identityField: args['identity-field'],
    skipDirectory: Boolean(args['skip-directory']), delayMs: args.delay ? Number(args.delay) : 1500,
    only: args.only ? String(args.only).split(',') : undefined,
  });
  const label = args.label ?? args.target;
  if (args.json) writeFileSync(args.json, JSON.stringify({ label, target: args.target, ranAt: new Date().toISOString(), results }, null, 2) + '\n');
  process.stdout.write(toMarkdown(label, results) + '\n');
} else {
  process.stdout.write('usage: wbac keygen --out FILE | wbac run --target URL --keys-a FILE [--keys-b FILE] [options]\n');
}
