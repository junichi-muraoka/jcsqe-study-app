'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const script = path.join(__dirname, '..', 'scripts', 'verify-oauth-client.js');

const sampleSnippet =
  '(function(global) {\n' +
  "  const J = global.JCSQE = global.JCSQE || {};\n" +
  '  J.firebaseConfig = {"apiKey":"k"};\n' +
  '  J.googleOAuthClientId = "abc123-xyz.apps.googleusercontent.com";\n' +
  '})(typeof window !== "undefined" ? window : globalThis);\n';

test('local file: match exits 0', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jcsqe-verify-oauth-'));
  const fp = path.join(dir, 'firebase-config.js');
  fs.writeFileSync(fp, sampleSnippet, 'utf8');
  execFileSync(process.execPath, [script, fp], {
    env: { ...process.env, GOOGLE_OAUTH_CLIENT_ID: 'abc123-xyz.apps.googleusercontent.com' },
    encoding: 'utf8'
  });
});

test('local file: mismatch exits non-zero', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jcsqe-verify-oauth-'));
  const fp = path.join(dir, 'firebase-config.js');
  fs.writeFileSync(fp, sampleSnippet, 'utf8');
  assert.throws(
    () =>
      execFileSync(process.execPath, [script, fp], {
        env: { ...process.env, GOOGLE_OAUTH_CLIENT_ID: 'wrong.apps.googleusercontent.com' },
        encoding: 'utf8'
      }),
    /MISMATCH/
  );
});

test('GOOGLE_OAUTH_CLIENT_ID unset skips with exit 0', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jcsqe-verify-oauth-'));
  const fp = path.join(dir, 'firebase-config.js');
  fs.writeFileSync(fp, sampleSnippet, 'utf8');
  const env = { ...process.env };
  delete env.GOOGLE_OAUTH_CLIENT_ID;
  const out = execFileSync(process.execPath, [script, fp], { env, encoding: 'utf8' });
  assert.match(out, /skip/i);
});
