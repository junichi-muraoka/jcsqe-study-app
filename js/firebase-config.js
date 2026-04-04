// リポジトリに本番の API キーを載せないでください。ローカル検証は example をコピーして編集するか、
// デプロイは GitHub Actions の Secret FIREBASE_WEB_CONFIG_JSON で注入する。
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};

  J.firebaseConfig = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:xxxxxxxx'
  };

  /** Cloudflare Pages 等で GIS + signInWithCredential 用（GCP の OAuth 2.0 クライアント ID）。Secret JSON に googleOAuthClientId で追加。 */
  J.googleOAuthClientId = '';

  J.isFirebaseConfigured = function isFirebaseConfigured() {
    const c = J.firebaseConfig;
    if (!c.apiKey || !c.authDomain || !c.projectId || !c.appId) return false;
    if (c.apiKey === 'YOUR_API_KEY' || /^your-project/i.test(String(c.projectId || ''))) return false;
    return true;
  };
})(typeof window !== 'undefined' ? window : globalThis);
