// Cloudflare Worker + D1 への自動同期（設定時のみ）
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};
  const CONFIG_KEY = 'jcsqe_cf_sync_config_v1';
  const DEBOUNCE_MS = 3500;
  let timer = null;
  let syncingFromCloud = false;
  let savePatched = false;

  function getConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (!raw) return { enabled: false, baseUrl: '', token: '', userId: '' };
      const o = JSON.parse(raw);
      return {
        enabled: !!o.enabled,
        baseUrl: typeof o.baseUrl === 'string' ? o.baseUrl.trim() : '',
        token: typeof o.token === 'string' ? o.token : '',
        userId: typeof o.userId === 'string' ? o.userId : ''
      };
    } catch {
      return { enabled: false, baseUrl: '', token: '', userId: '' };
    }
  }

  function saveConfig(c) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
  }

  function ensureUserId() {
    const c = getConfig();
    if (c.userId) return c.userId;
    var id = '';
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      id = global.crypto.randomUUID();
    } else {
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(ch) {
        var r = Math.random() * 16 | 0;
        var v = ch === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    c.userId = id;
    saveConfig(c);
    return id;
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
    if (!c.enabled || !c.baseUrl || !c.token) return;
    clearTimeout(timer);
    timer = setTimeout(function() { pushCloud(); }, DEBOUNCE_MS);
  }

  function pushCloud() {
    const c = getConfig();
    if (!c.enabled || !c.baseUrl || !c.token) return;
    if (!J.loadData) return;
    const uid = ensureUserId();
    const data = J.loadData();
    const url = c.baseUrl.replace(/\/$/, '') + '/api/study';
    fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + c.token,
        'X-User-Id': uid
      },
      body: JSON.stringify({ data: data })
    }).then(function(r) {
      if (!r.ok) throw new Error(String(r.status));
      setStatus('Cloudflare D1 に同期しました（' + new Date().toLocaleString('ja-JP') + '）');
    }).catch(function() {
      setStatus('D1 同期に失敗しました（URL・トークン・ネットワークを確認）', true);
    });
  }

  function pullCloud() {
    const c = getConfig();
    if (!c.baseUrl || !c.token) {
      setStatus('先に Worker URL と API トークンを保存してください', true);
      return;
    }
    const uid = ensureUserId();
    const url = c.baseUrl.replace(/\/$/, '') + '/api/study';
    setStatus('クラウドから取得中…');
    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + c.token,
        'X-User-Id': uid
      }
    }).then(function(r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }).then(function(body) {
      if (!body || body.data == null) {
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
    const baseUrl = (document.getElementById('d1-sync-base-url') || {}).value || '';
    const token = (document.getElementById('d1-sync-token') || {}).value || '';
    const enabled = !!(document.getElementById('d1-sync-enabled') || {}).checked;
    return { baseUrl: baseUrl.trim(), token: token, enabled: enabled };
  }

  function applyFormToConfig() {
    const prev = getConfig();
    const f = readForm();
    saveConfig({
      enabled: f.enabled,
      baseUrl: f.baseUrl,
      token: f.token,
      userId: prev.userId || ''
    });
    if (!getConfig().userId) ensureUserId();
  }

  function saveD1SyncSettings() {
    applyFormToConfig();
    setStatus('設定を保存しました');
    if (getConfig().enabled && getConfig().baseUrl && getConfig().token) {
      pushCloud();
    }
  }

  function initCard() {
    const c = getConfig();
    const urlEl = document.getElementById('d1-sync-base-url');
    const tokEl = document.getElementById('d1-sync-token');
    const enEl = document.getElementById('d1-sync-enabled');
    if (urlEl) urlEl.value = c.baseUrl || '';
    if (tokEl) tokEl.value = c.token || '';
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
