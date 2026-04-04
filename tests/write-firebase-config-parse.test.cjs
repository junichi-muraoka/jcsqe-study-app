'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const script = path.join(__dirname, '..', 'scripts', 'write-firebase-config.js');

test('prefix text before first { still parses', () => {
  const raw = `paste below:
{"apiKey":"k","authDomain":"x.firebaseapp.com","projectId":"x","appId":"1:1:web:1","googleOAuthClientId":"z.apps.googleusercontent.com"}`;
  const out = path.join(__dirname, '..', 'js', 'firebase-config.js');
  const backup = fs.readFileSync(out, 'utf8');
  try {
    execFileSync(process.execPath, [script], {
      env: { ...process.env, FIREBASE_WEB_CONFIG_JSON: raw },
      encoding: 'utf8'
    });
    assert.match(fs.readFileSync(out, 'utf8'), /J\.googleOAuthClientId = "z\.apps\.googleusercontent\.com"/);
  } finally {
    fs.writeFileSync(out, backup, 'utf8');
  }
});

test('lenient: quoted JSON key then unquoted googleOAuthClientId (mixed)', () => {
  const raw = `{
  "apiKey": "k",
  "appId": "1:1:web:1"
  googleOAuthClientId: "z.apps.googleusercontent.com"
}`;
  const out = path.join(__dirname, '..', 'js', 'firebase-config.js');
  const backup = fs.readFileSync(out, 'utf8');
  try {
    execFileSync(process.execPath, [script], {
      env: { ...process.env, FIREBASE_WEB_CONFIG_JSON: raw },
      encoding: 'utf8'
    });
    const gen = fs.readFileSync(out, 'utf8');
    assert.match(gen, /J\.googleOAuthClientId = "z\.apps\.googleusercontent\.com"/);
  } finally {
    fs.writeFileSync(out, backup, 'utf8');
  }
});

test('lenient: JSON multiline missing comma before next key', () => {
  const raw = `{
  "apiKey": "k",
  "authDomain": "x.firebaseapp.com",
  "projectId": "x",
  "appId": "1:1:web:1"
  "googleOAuthClientId": "z.apps.googleusercontent.com"
}`;
  const out = path.join(__dirname, '..', 'js', 'firebase-config.js');
  const backup = fs.readFileSync(out, 'utf8');
  try {
    execFileSync(process.execPath, [script], {
      env: { ...process.env, FIREBASE_WEB_CONFIG_JSON: raw },
      encoding: 'utf8'
    });
    const gen = fs.readFileSync(out, 'utf8');
    assert.match(gen, /J\.googleOAuthClientId = "z\.apps\.googleusercontent\.com"/);
  } finally {
    fs.writeFileSync(out, backup, 'utf8');
  }
});

test('lenient: JS object missing commas between string props', () => {
  const raw =
    '{ apiKey: "k" authDomain: "x.firebaseapp.com" projectId: "x" appId: "1:1:web:1" googleOAuthClientId: "z.apps.googleusercontent.com" }';
  const r = /([\w$]+\s*:\s*"(?:[^"\\]|\\.)*")\s+([\w$]+\s*:)/g;
  let prev;
  let fixed = raw;
  do {
    prev = fixed;
    fixed = fixed.replace(r, '$1, $2');
  } while (fixed !== prev);
  const obj = new Function('return ' + fixed)();
  assert.strictEqual(obj.apiKey, 'k');
  assert.strictEqual(obj.googleOAuthClientId, 'z.apps.googleusercontent.com');

  const out = path.join(__dirname, '..', 'js', 'firebase-config.js');
  const backup = fs.readFileSync(out, 'utf8');
  try {
    execFileSync(process.execPath, [script], {
      env: { ...process.env, FIREBASE_WEB_CONFIG_JSON: raw },
      encoding: 'utf8'
    });
    const gen = fs.readFileSync(out, 'utf8');
    assert.match(gen, /J\.googleOAuthClientId = "z\.apps\.googleusercontent\.com"/);
  } finally {
    fs.writeFileSync(out, backup, 'utf8');
  }
});
