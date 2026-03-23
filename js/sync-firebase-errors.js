// Issue #14: Firestore / Auth のエラーをユーザー向けメッセージに変換（Firebase 未読込でも利用可）
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};

  /**
   * @param {unknown} err - FirebaseError または { code, message }
   * @returns {{ code: string, severity: 'error'|'warning', title: string, detail: string, canRetry: boolean, continueLocal: boolean }}
   */
  function interpretSyncError(err) {
    const code = err && typeof err === 'object' && err.code != null
      ? String(err.code)
      : 'unknown';
    const rawMsg = err && typeof err === 'object' && err.message != null ? String(err.message) : '';

    const base = {
      code,
      severity: /** @type {'warning'|'error'} */ ('warning'),
      title: '同期できませんでした',
      detail: '',
      canRetry: true,
      continueLocal: true
    };

    switch (code) {
      case 'resource-exhausted':
        return {
          ...base,
          severity: 'warning',
          title: 'クラウドの利用上限に達しました',
          detail: '本日はクラウドへの保存・同期ができません。学習データはこの端末に保存されています。しばらくしてから再度お試しください。',
          canRetry: false,
          continueLocal: true
        };
      case 'unavailable':
      case 'deadline-exceeded':
        return {
          ...base,
          title: 'サーバーに接続できませんでした',
          detail: '時間をおいて再度お試しください。',
          canRetry: true,
          continueLocal: true
        };
      case 'permission-denied':
        return {
          ...base,
          severity: 'error',
          title: 'アクセスが拒否されました',
          detail: 'ログイン状態とアカウントを確認してください。',
          canRetry: false,
          continueLocal: true
        };
      case 'unauthenticated':
        return {
          ...base,
          title: 'ログインが必要です',
          detail: 'クラウドに保存するにはログインしてください。',
          canRetry: false,
          continueLocal: true
        };
      case 'failed-precondition':
        return {
          ...base,
          title: '同期の条件を満たしていません',
          detail: rawMsg || 'しばらくしてから再度お試しください。',
          canRetry: true,
          continueLocal: true
        };
      case 'cancelled':
        return {
          ...base,
          title: '処理がキャンセルされました',
          detail: '',
          canRetry: true,
          continueLocal: true
        };
      default:
        if (/quota|resource-exhausted/i.test(rawMsg)) {
          return interpretSyncError({ code: 'resource-exhausted', message: rawMsg });
        }
        return {
          ...base,
          detail: rawMsg || '予期しないエラーが発生しました。',
          canRetry: true,
          continueLocal: true
        };
    }
  }

  J.interpretSyncError = interpretSyncError;
})(typeof window !== 'undefined' ? window : globalThis);
