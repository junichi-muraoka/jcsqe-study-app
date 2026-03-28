// Issue #14: Firebase Auth + Firestore 同期（compat SDK）。未設定時は no-op。
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};
  const interpret = J.interpretSyncError || function() {
    return { title: 'エラー', detail: '', severity: 'warning', canRetry: true, continueLocal: true };
  };

  const SYNC_DEBOUNCE_MS = 3500;
  let db = null;
  let auth = null;
  let syncTimer = null;
  let savePatched = false;

  function showSyncMessage(info) {
    const el = document.getElementById('sync-toast');
    if (!el) return;
    el.textContent = (info.title ? info.title + ' ' : '') + (info.detail || '');
    el.className = 'sync-toast' + (info.severity === 'error' ? ' sync-toast-error' : '');
    el.classList.remove('hidden');
    clearTimeout(showSyncMessage._t);
    showSyncMessage._t = setTimeout(function() {
      el.classList.add('hidden');
    }, 8000);
  }

  function mergeStudyData(local, remote) {
    if (!remote || typeof remote !== 'object') return local;
    const norm = window.StudyData && window.StudyData.normalizeStudyData;
    const r = norm ? norm(remote) : remote;
    const l = local;
    const la = l.totalAnswered || 0;
    const ra = r.totalAnswered || 0;
    if (ra > la) return r;
    if (la > ra) return l;
    return l;
  }

  function patchSaveData() {
    if (savePatched || !J.saveData) return;
    const orig = J.saveData;
    J.saveData = function(data) {
      orig(data);
      scheduleCloudWrite();
    };
    savePatched = true;
  }

  function scheduleCloudWrite() {
    if (!auth || !auth.currentUser || !db) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function() {
      syncTimer = null;
      pushStudyToCloud();
    }, SYNC_DEBOUNCE_MS);
  }

  function pushStudyToCloud() {
    if (!auth || !auth.currentUser || !db) return;
    const uid = auth.currentUser.uid;
    let data;
    try {
      data = J.loadData();
    } catch (e) {
      return;
    }
    const ref = db.collection('users').doc(uid);
    ref.set({
      study: data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(function() {
      const st = document.getElementById('firebase-sync-status');
      if (st) st.textContent = '最終同期: ' + new Date().toLocaleString('ja-JP');
    }).catch(function(err) {
      const info = interpret(err);
      showSyncMessage(info);
    });
  }

  function pullStudyFromCloud() {
    if (!auth || !auth.currentUser || !db) return Promise.resolve();
    const uid = auth.currentUser.uid;
    return db.collection('users').doc(uid).get().then(function(snap) {
      if (!snap.exists) return;
      const v = snap.data();
      const remote = v && v.study;
      if (!remote) return;
      const local = J.loadData();
      const merged = mergeStudyData(local, remote);
      const norm = window.StudyData && window.StudyData.normalizeStudyData;
      J.saveData(norm ? norm(merged) : merged);
      const st = document.getElementById('firebase-sync-status');
      if (st) st.textContent = '最終同期: ' + new Date().toLocaleString('ja-JP');
    }).catch(function(err) {
      const info = interpret(err);
      showSyncMessage(info);
    });
  }

  function updateAuthUI(user) {
    const signIn = document.getElementById('firebase-signin-btn');
    const signOut = document.getElementById('firebase-signout-btn');
    const line = document.getElementById('firebase-auth-line');
    if (signIn) signIn.classList.toggle('hidden', !!user);
    if (signOut) signOut.classList.toggle('hidden', !user);
    if (line) {
      line.textContent = user
        ? ('ログイン中: ' + (user.displayName || user.email || user.uid))
        : '未ログイン（データはこの端末のみ保存）';
    }
  }

  function initFirebase() {
    if (!global.firebase || !J.isFirebaseConfigured || !J.isFirebaseConfigured()) {
      return false;
    }
    if (firebase.apps.length === 0) {
      firebase.initializeApp(J.firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    patchSaveData();
    auth.onAuthStateChanged(function(user) {
      updateAuthUI(user);
      if (user) {
        pullStudyFromCloud().then(function() {
          scheduleCloudWrite();
        });
      }
    });
    return true;
  }

  function bindButtons() {
    const signIn = document.getElementById('firebase-signin-btn');
    const signOut = document.getElementById('firebase-signout-btn');
    if (signIn) {
      signIn.addEventListener('click', function() {
        if (!auth) return;
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(function(err) {
          const info = interpret(err);
          showSyncMessage(info);
        });
      });
    }
    if (signOut) {
      signOut.addEventListener('click', function() {
        if (!auth) return;
        auth.signOut().catch(function() {});
      });
    }
  }

  function initCard() {
    const card = document.getElementById('firebase-auth-card');
    if (!card) return;

    if (!global.firebase) {
      const line = document.getElementById('firebase-auth-line');
      if (line) line.textContent = 'Firebase SDK を読み込めませんでした（ネットワークやブロッカーを確認してください）。';
      const signIn = document.getElementById('firebase-signin-btn');
      const signOut = document.getElementById('firebase-signout-btn');
      if (signIn) signIn.classList.add('hidden');
      if (signOut) signOut.classList.add('hidden');
      return;
    }

    if (!J.isFirebaseConfigured || !J.isFirebaseConfigured()) {
      const line = document.getElementById('firebase-auth-line');
      if (line) {
        line.textContent = 'クラウド同期は未設定です。js/firebase-config.js に Firebase の設定を追加してください。';
      }
      const signIn = document.getElementById('firebase-signin-btn');
      const signOut = document.getElementById('firebase-signout-btn');
      if (signIn) signIn.classList.add('hidden');
      if (signOut) signOut.classList.add('hidden');
      return;
    }

    if (!initFirebase()) return;
    bindButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCard);
  } else {
    initCard();
  }

})(typeof window !== 'undefined' ? window : globalThis);
