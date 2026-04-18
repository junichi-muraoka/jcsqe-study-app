#!/usr/bin/env node
/**
 * GOOGLE_OAUTH_CLIENT_ID（GitHub Secret 等）と、firebase-config.js 内の
 * J.googleOAuthClientId が一致するか検証する。
 *
 * 使い方:
 *   GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com node scripts/verify-oauth-client.js _site/js/firebase-config.js
 *   GOOGLE_OAUTH_CLIENT_ID=xxx VERIFY_REMOTE_URL=https://jcsqe-study-app.pages.dev node scripts/verify-oauth-client.js --remote
 *
 * GCP の「承認済み JavaScript 生成元」は公開 API が無く自動検証不可。
 */
'use strict';

const fs = require('fs');

const expected = process.env.GOOGLE_OAUTH_CLIENT_ID && String(process.env.GOOGLE_OAUTH_CLIENT_ID).trim();
if (!expected) {
  console.log('verify-oauth-client: GOOGLE_OAUTH_CLIENT_ID unset — skip.');
  process.exit(0);
}

function extractId(source) {
  const m = String(source).match(/J\.googleOAuthClientId\s*=\s*"([^"]*)"\s*;/);
  return m ? m[1] : null;
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

async function fetchConfigJs(baseUrl) {
  const base = String(baseUrl).replace(/\/$/, '');
  const attempts = parseInt(process.env.VERIFY_OAUTH_ATTEMPTS || '8', 10);
  const delayMs = parseInt(process.env.VERIFY_OAUTH_DELAY_MS || '4000', 10);
  let lastStatus = 0;
  for (let i = 0; i < attempts; i++) {
    const cfgPath = '/js/firebase-config.js';
    const url = base + cfgPath + '?_v=' + Date.now();
    const res = await fetch(url, { redirect: 'follow' });
    lastStatus = res.status;
    if (res.ok) return await res.text();
    console.warn('verify-oauth-client: GET ' + url + ' → HTTP ' + res.status + ' (retry ' + (i + 1) + '/' + attempts + ')');
    await sleep(delayMs);
  }
  throw new Error('Could not fetch firebase-config.js after retries (last HTTP ' + lastStatus + ')');
}

async function main() {
  const argv = process.argv.slice(2);
  let body;
  if (argv[0] === '--remote' || argv[0] === '-r') {
    const base = process.env.VERIFY_REMOTE_URL || argv[1];
    if (!base) {
      console.error('verify-oauth-client: set VERIFY_REMOTE_URL or pass URL after --remote');
      process.exit(1);
    }
    body = await fetchConfigJs(base);
  } else {
    const p = argv[0] || '_site/js/firebase-config.js';
    if (!fs.existsSync(p)) {
      console.error('verify-oauth-client: file not found: ' + p);
      process.exit(1);
    }
    body = fs.readFileSync(p, 'utf8');
  }

  const found = extractId(body);
  if (found === null) {
    console.error('verify-oauth-client: could not parse J.googleOAuthClientId in firebase-config.js');
    process.exit(1);
  }

  if (!/\.apps\.googleusercontent\.com$/.test(found)) {
    console.error('verify-oauth-client: parsed client id does not look like a Web client ID:', found);
    process.exit(1);
  }

  if (found !== expected) {
    console.error('verify-oauth-client: MISMATCH');
    console.error('  Secret GOOGLE_OAUTH_CLIENT_ID:  ' + expected);
    console.error('  In firebase-config.js:         ' + found);
    console.error(
      'Fix: Firebase → Authentication → Google → ウェブ SDK 構成 の「ウェブ クライアント ID」をコピーし、GitHub Secret GOOGLE_OAUTH_CLIENT_ID をその値に更新してください。'
    );
    process.exit(1);
  }

  console.log('verify-oauth-client: OK — matches GOOGLE_OAUTH_CLIENT_ID');
}

main().catch(function(e) {
  console.error('verify-oauth-client:', e.message || e);
  process.exit(1);
});
