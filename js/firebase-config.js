// Firebase Web 設定（クライアント用。APIキーは Firebase コンソールの公開設定）
// 未設定のままではクラウド同期は無効。値を入れる手順は README / docs/09 を参照。
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};

  J.firebaseConfig = {
  apiKey: "AIzaSyDHD14As3Z0_i69V-Qu6pTUaeaq3XSME7g",
  authDomain: "jcsqe-study-app.firebaseapp.com",
  projectId: "jcsqe-study-app",
  storageBucket: "jcsqe-study-app.firebasestorage.app",
  messagingSenderId: "450426213178",
  appId: "1:450426213178:web:d6dfbdd543486739dfb603",
  measurementId: "G-RTSG13C4CY"
};

  J.isFirebaseConfigured = function isFirebaseConfigured() {
    const c = J.firebaseConfig;
    return !!(c.apiKey && c.authDomain && c.projectId && c.appId);
  };
})(typeof window !== 'undefined' ? window : globalThis);
