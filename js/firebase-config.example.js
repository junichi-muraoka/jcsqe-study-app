// このファイルの内容を js/firebase-config.js にコピーし、Firebase コンソールの値を貼り付けてください。
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
  /** 任意。useGoogleIdentityServices が true のときのみ使用（ウェブ クライアント ID）。 */
  J.googleOAuthClientId = '';
  /** 既定 false＝Firebase signInWithPopup。true にすると Google Identity Services の埋め込みボタン。 */
  J.useGoogleIdentityServices = false;
  J.isFirebaseConfigured = function isFirebaseConfigured() {
    const c = J.firebaseConfig;
    if (!c.apiKey || !c.authDomain || !c.projectId || !c.appId) return false;
    if (c.apiKey === 'YOUR_API_KEY' || /^your-project/i.test(String(c.projectId || ''))) return false;
    return true;
  };
})(typeof window !== 'undefined' ? window : globalThis);
