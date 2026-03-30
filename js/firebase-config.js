// Generated in CI from secret FIREBASE_WEB_CONFIG_JSON — do not commit real keys to git.
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};
  J.firebaseConfig = {
  "apiKey": "AIzaSyDHD14As3Z0_i69V-Qu6pTUaeaq3XSME7g",
  "authDomain": "jcsqe-study-app.firebaseapp.com",
  "projectId": "jcsqe-study-app",
  "storageBucket": "jcsqe-study-app.firebasestorage.app",
  "messagingSenderId": "450426213178",
  "appId": "1:450426213178:web:d6dfbdd543486739dfb603",
  "measurementId": "G-RTSG13C4CY"
};
  J.isFirebaseConfigured = function isFirebaseConfigured() {
    const c = J.firebaseConfig;
    if (!c.apiKey || !c.authDomain || !c.projectId || !c.appId) return false;
    if (c.apiKey === 'YOUR_API_KEY' || /^your-project/i.test(String(c.projectId || ''))) return false;
    return true;
  };
})(typeof window !== 'undefined' ? window : globalThis);
