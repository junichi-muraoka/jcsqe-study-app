// Cloudflare Worker + D1 への自動同期（Firebase ID トークン認証。URL は js/d1-sync-config.js に運用者のみ記載）
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};
  const CONFIG_KEY = 'jcsqe_cf_sync_config_v2';
  const LEGACY_KEY = 'jcsqe_cf_sync_config_v1';
  const DEBOUNCE_MS = 3500;
  let timer = null;
  let syncingFromCloud = false;
  let savePatched = false;

  function getConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        return { enabled: !!o.enabled };
      }
      const leg = localStorage.getItem(LEGACY_KEY);
      if (leg) {
        const o = JSON.parse(leg);
        return { enabled: !!o.enabled };
      }
    } catch {
      /* ignore */
    }
    return { enabled: false };
  }

  function saveConfig(c) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ enabled: !!c.enabled }));
  }

  function workerBaseUrl() {
    const u = J.d1SyncWorkerBaseUrl;
    return typeof u === 'string' ? u.trim().replace(/\/$/, '') : '';
  }

  function getFirebaseAuth() {
    if (!global.firebase || !firebase.apps || firebase.apps.length === 0) return null;
    try {
      return firebase.auth();
    } catch {
      return null;
    }
  }

  function getIdToken() {
    const auth = getFirebaseAuth();
    if (!auth || !auth.currentUser) return Promise.resolve(null);
    return auth.currentUser.getIdToken(false);
  }

  function catalogOpts() {
    if (typeof QUESTIONS !== 'undefined' && Array.isArray(QUESTIONS)) {
      return { validQuestionIds: QUESTIONS.map(function(q) { return q.id; }) };
    }
    return undefined;
  }

  function setStatus(msg, isErr) {
    const el = document.getElementById('d1-sync-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isErr ? 'var(--danger)' : 'var(--text-muted)';
  }

  function scheduleCloudPush() {
    if (syncingFromCloud) return;
    const c = getConfig();
    if (!c.enabled || !workerBaseUrl()) return;
    clearTimeout(timer);
    timer = setTimeout(function() { pushCloud(); }, DEBOUNCE_MS);
  }

  function pushCloud() {
    const c = getConfig();
    if (!c.enabled || !workerBaseUrl()) return;
    if (!J.loadData) return;
    getIdToken().then(function(token) {
      if (!token) {
        setStatus('D1 同期には Firebase（Google）でログインしてください', true);
        return;
      }
      const data = J.loadData();
      const url = workerBaseUrl() + '/api/study';
      return fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ data: data })
      });
    }).then(function(r) {
      if (!r) return;
      if (!r.ok) throw new Error(String(r.status));
      setStatus('Cloudflare D1 に同期しました（' + new Date().toLocaleString('ja-JP') + '）');
    }).catch(function() {
      setStatus('D1 同期に失敗しました（ログイン・ネットワーク・Worker を確認）', true);
    });
  }

  function pullCloud() {
    if (!workerBaseUrl()) {
      setStatus('Worker URL が未設定です（運用者向け: js/d1-sync-config.js）', true);
      return;
    }
    setStatus('クラウドから取得中…');
    getIdToken().then(function(token) {
      if (!token) {
        setStatus('取得には Firebase（Google）でログインしてください', true);
        return null;
      }
      const url = workerBaseUrl() + '/api/study';
      return fetch(url, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      });
    }).then(function(r) {
      if (!r) return;
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }).then(function(body) {
      if (!body) return;
      if (body.data == null) {
        setStatus('クラウドにデータがありません');
        return;
      }
      const norm = window.StudyData && window.StudyData.normalizeStudyData;
      if (!norm || !J.saveData) return;
      syncingFromCloud = true;
      try {
        J.saveData(norm(body.data, catalogOpts()));
        setStatus('クラウドのデータを反映しました。画面を確認してください。');
        if (typeof global.refreshStudyUi === 'function') global.refreshStudyUi();
        else if (typeof global.updateHomeStats === 'function') global.updateHomeStats();
        if (typeof global.updateDashboardStats === 'function') global.updateDashboardStats();
      } finally {
        syncingFromCloud = false;
      }
    }).catch(function() {
      setStatus('取得に失敗しました', true);
    });
  }

  function patchSaveData() {
    if (savePatched || !J.saveData) return;
    const orig = J.saveData;
    J.saveData = function(d) {
      orig(d);
      scheduleCloudPush();
    };
    savePatched = true;
  }

  function readForm() {
    const enabled = !!(document.getElementById('d1-sync-enabled') || {}).checked;
    return { enabled: enabled };
  }

  function applyFormToConfig() {
    const f = readForm();
    saveConfig({ enabled: f.enabled });
  }

  function saveD1SyncSettings() {
    applyFormToConfig();
    setStatus('設定を保存しました');
    if (getConfig().enabled && workerBaseUrl()) {
      pushCloud();
    }
  }

  function initCard() {
    const c = getConfig();
    const enEl = document.getElementById('d1-sync-enabled');
    if (enEl) enEl.checked = c.enabled;

    const saveBtn = document.getElementById('d1-sync-save-btn');
    const pullBtn = document.getElementById('d1-sync-pull-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveD1SyncSettings);
    if (pullBtn) pullBtn.addEventListener('click', pullCloud);
  }

  global.saveD1SyncSettings = saveD1SyncSettings;
  global.pullD1Sync = pullCloud;

  patchSaveData();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCard);
  } else {
    initCard();
  }
})(typeof window !== 'undefined' ? window : globalThis);
