// Firebase Web 設定（クライアント用。APIキーは Firebase コンソールの公開設定）
// 未設定のままではクラウド同期は無効。値を入れる手順は README / docs/09 を参照。
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};

  J.firebaseConfig = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  };

  J.isFirebaseConfigured = function isFirebaseConfigured() {
    const c = J.firebaseConfig;
    return !!(c.apiKey && c.authDomain && c.projectId && c.appId);
  };
})(typeof window !== 'undefined' ? window : globalThis);
