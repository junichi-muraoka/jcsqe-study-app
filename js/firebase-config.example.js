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
  J.isFirebaseConfigured = function isFirebaseConfigured() {
    const c = J.firebaseConfig;
    return !!(c.apiKey && c.authDomain && c.projectId && c.appId);
  };
})(typeof window !== 'undefined' ? window : globalThis);
