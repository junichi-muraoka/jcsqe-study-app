// Issue #14: Firebase Auth + Firestore 同期（compat SDK）。未設定時は no-op。
// Cloudflare Pages 等では既定は signInWithPopup（Firebase 標準の Google プロバイダ）。
// GIS + signInWithCredential は Identity Toolkit 400 になりやすいため、
// J.useGoogleIdentityServices === true かつ googleOAuthClientId があるときだけ有効。
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};
  const interpret = J.interpretSyncError || function() {
    return { title: 'エラー', detail: '', severity: 'warning', canRetry: true, continueLocal: true };
  };

  const SYNC_DEBOUNCE_MS = 3500;
  const SKIP_LOGIN_KEY = 'jcsqe_skip_firebase_login';
  let db = null;
  let auth = null;
  let syncTimer = null;
  let savePatched = false;
  let useGsiLogin = false;
  let gsiInitialized = false;
  let googlePopupInProgress = false;

  function isLoginSkipped() {
    try {
      return localStorage.getItem(SKIP_LOGIN_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setLoginGateOpen(open) {
    const gate = document.getElementById('login-gate');
    if (!gate) return;
    gate.classList.toggle('hidden', !open);
    document.body.classList.toggle('login-gate-open', !!open);
  }

  /** Firebase 設定済みかつ未ログイン・スキップなしのときだけゲートを表示 */
  function syncLoginGate(user) {
    if (!J.isFirebaseConfigured || !J.isFirebaseConfigured()) {
      setLoginGateOpen(false);
      return;
    }
    if (user) {
      setLoginGateOpen(false);
      return;
    }
    if (isLoginSkipped()) {
      setLoginGateOpen(false);
      return;
    }
    setLoginGateOpen(true);
  }

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
      const catalogOpts = typeof QUESTIONS !== 'undefined' && Array.isArray(QUESTIONS)
        ? { validQuestionIds: QUESTIONS.map(function(q) { return q.id; }) }
        : undefined;
      J.saveData(norm ? norm(merged, catalogOpts) : merged);
      const st = document.getElementById('firebase-sync-status');
      if (st) st.textContent = '最終同期: ' + new Date().toLocaleString('ja-JP');
    }).catch(function(err) {
      const info = interpret(err);
      showSyncMessage(info);
    });
  }

  function getGoogleOAuthClientId() {
    const id = J.googleOAuthClientId;
    return id && String(id).trim() ? String(id).trim() : '';
  }

  function shouldUseGoogleIdentityServices() {
    return J.useGoogleIdentityServices === true;
  }

  function syncSignInWidgetsVisible(signedIn) {
    const gateBtn = document.getElementById('login-google-btn');
    const gateHost = document.getElementById('gsi-login-gate-host');
    const signIn = document.getElementById('firebase-signin-btn');
    const setHost = document.getElementById('gsi-settings-host');
    const showSignInControls = !signedIn;
    const gatePopupWrap = document.getElementById('login-google-popup-fallback-wrap');
    const setPopupWrap = document.getElementById('settings-google-popup-fallback-wrap');
    if (useGsiLogin) {
      if (gateBtn) gateBtn.classList.add('hidden');
      if (signIn) signIn.classList.add('hidden');
      if (gateHost) {
        gateHost.classList.toggle('hidden', !showSignInControls);
        gateHost.setAttribute('aria-hidden', showSignInControls ? 'false' : 'true');
      }
      if (setHost) {
        setHost.classList.toggle('hidden', !showSignInControls);
        setHost.setAttribute('aria-hidden', showSignInControls ? 'false' : 'true');
      }
      const showPopupFb = !!showSignInControls;
      if (gatePopupWrap) gatePopupWrap.classList.toggle('hidden', !showPopupFb);
      if (setPopupWrap) setPopupWrap.classList.toggle('hidden', !showPopupFb);
    } else {
      if (gateHost) {
        gateHost.classList.add('hidden');
        gateHost.setAttribute('aria-hidden', 'true');
      }
      if (setHost) {
        setHost.classList.add('hidden');
        setHost.setAttribute('aria-hidden', 'true');
      }
      if (gateBtn) gateBtn.classList.toggle('hidden', !showSignInControls);
      if (signIn) signIn.classList.toggle('hidden', !showSignInControls);
      if (gatePopupWrap) gatePopupWrap.classList.add('hidden');
      if (setPopupWrap) setPopupWrap.classList.add('hidden');
    }
  }

  function updateAuthUI(user) {
    const signOut = document.getElementById('firebase-signout-btn');
    const line = document.getElementById('firebase-auth-line');
    syncSignInWidgetsVisible(!!user);
    if (signOut) signOut.classList.toggle('hidden', !user);
    if (line) {
      line.textContent = user
        ? ('ログイン中: ' + (user.displayName || user.email || user.uid))
        : '未ログイン（データはこの端末のみ保存）';
    }
  }

  function showLoginGateAuthError(msg) {
    const el = document.getElementById('login-gate-auth-error');
    if (!el) return;
    if (!msg) {
      el.textContent = '';
      el.classList.add('hidden');
      return;
    }
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function onGsiCredential(response) {
    showLoginGateAuthError('');
    if (!auth) return;
    if (!response || !response.credential) {
      showLoginGateAuthError('Google からログイン情報が返りませんでした。ポップアップをブロックしていないか確認し、もう一度お試しください。');
      return;
    }
    const credential = firebase.auth.GoogleAuthProvider.credential(response.credential);
    auth.signInWithCredential(credential).catch(function(err) {
      console.error('[JCSQE Firebase Auth]', err && err.code, err && err.message, err);
      const info = interpret(err);
      showSyncMessage(info);
      showLoginGateAuthError((info.title ? info.title + ' ' : '') + (info.detail || String(err.message || '')));
    });
  }

  function tryMountGsi() {
    const clientId = getGoogleOAuthClientId();
    if (!clientId || !auth) return false;
    if (!global.google || !google.accounts || !google.accounts.id) return false;
    if (!gsiInitialized) {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: onGsiCredential
      });
      gsiInitialized = true;
    }
    const gateHost = document.getElementById('gsi-login-gate-host');
    const settingsHost = document.getElementById('gsi-settings-host');
    const opts = { theme: 'outline', size: 'large', width: 320, text: 'signin_with', locale: 'ja' };
    if (gateHost && !gateHost.dataset.gsiMounted) {
      google.accounts.id.renderButton(gateHost, opts);
      gateHost.dataset.gsiMounted = '1';
    }
    if (settingsHost && !settingsHost.dataset.gsiMounted) {
      google.accounts.id.renderButton(settingsHost, opts);
      settingsHost.dataset.gsiMounted = '1';
    }
    useGsiLogin = true;
    syncSignInWidgetsVisible(!auth.currentUser);
    return true;
  }

  function scheduleGsiMount() {
    if (!shouldUseGoogleIdentityServices() || !getGoogleOAuthClientId()) return;
    let attempts = 0;
    const t = setInterval(function() {
      attempts++;
      if (tryMountGsi()) {
        clearInterval(t);
        return;
      }
      if (attempts >= 200) {
        clearInterval(t);
        showSyncMessage({
          title: 'Google ログインの準備に失敗しました',
          detail: 'accounts.google.com がブロックされていないか確認するか、ページを再読み込みしてください。',
          severity: 'warning',
          canRetry: true,
          continueLocal: true
        });
      }
    }, 50);
  }

  function buildGoogleProvider() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    return provider;
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
      if (user) showLoginGateAuthError('');
      updateAuthUI(user);
      syncLoginGate(user);
      if (user) {
        pullStudyFromCloud().then(function() {
          scheduleCloudWrite();
        });
      }
    });
    return true;
  }

  /** Firebase 標準の Google ポップアップ（二重起動で auth/cancelled-popup-request になるのを防ぐ） */
  function runGooglePopupSignIn() {
    if (!auth) return;
    if (googlePopupInProgress) return;
    googlePopupInProgress = true;
    const provider = buildGoogleProvider();
    auth
      .signInWithPopup(provider)
      .catch(function(err) {
        console.error('[JCSQE Firebase Auth popup]', err && err.code, err && err.message, err);
        const info = interpret(err);
        showSyncMessage(info);
        showLoginGateAuthError((info.title ? info.title + ' ' : '') + (info.detail || String(err.message || '')));
      })
      .finally(function() {
        googlePopupInProgress = false;
      });
  }

  function signInWithGooglePopupFallback() {
    runGooglePopupSignIn();
  }

  /** 既定: signInWithPopup。GIS 有効時は埋め込みボタンを案内 */
  function signInWithGoogle() {
    if (!auth) return;
    if (useGsiLogin) {
      showSyncMessage({
        title: 'ログイン',
        detail: '表示されている「Google でログイン」ボタンから続行してください。',
        severity: 'warning',
        canRetry: true,
        continueLocal: true
      });
      return;
    }
    runGooglePopupSignIn();
  }

  function bindButtons() {
    const signIn = document.getElementById('firebase-signin-btn');
    const gateGoogle = document.getElementById('login-google-btn');
    const signOut = document.getElementById('firebase-signout-btn');
    const skipBtn = document.getElementById('login-skip-btn');
    if (signIn) {
      signIn.addEventListener('click', signInWithGoogle);
    }
    if (gateGoogle) {
      gateGoogle.addEventListener('click', signInWithGoogle);
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', function() {
        try {
          localStorage.setItem(SKIP_LOGIN_KEY, '1');
        } catch (e) {}
        setLoginGateOpen(false);
      });
    }
    const gatePopupFb = document.getElementById('login-google-popup-fallback');
    const setPopupFb = document.getElementById('settings-google-popup-fallback');
    if (gatePopupFb) gatePopupFb.addEventListener('click', signInWithGooglePopupFallback);
    if (setPopupFb) setPopupFb.addEventListener('click', signInWithGooglePopupFallback);
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
      setLoginGateOpen(false);
      const line = document.getElementById('firebase-auth-line');
      if (line) line.textContent = 'Firebase SDK を読み込めませんでした（ネットワークやブロッカーを確認してください）。';
      const signIn = document.getElementById('firebase-signin-btn');
      const signOut = document.getElementById('firebase-signout-btn');
      if (signIn) signIn.classList.add('hidden');
      if (signOut) signOut.classList.add('hidden');
      return;
    }

    if (!J.isFirebaseConfigured || !J.isFirebaseConfigured()) {
      setLoginGateOpen(false);
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
    scheduleGsiMount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCard);
  } else {
    initCard();
  }

})(typeof window !== 'undefined' ? window : globalThis);
