# クラウド同期・Firebase 制限事項とアプリ側の扱い

> **関連 Issue**: [#14](https://github.com/junichi-muraoka/jcsqe-study-app/issues/14)  
> **前提**: Spark（無料）＋ Cloud Firestore / Authentication を利用する想定。

## 1. このドキュメントの位置づけ

| 種類 | 置き場所 |
|------|----------|
| **無料枠の数値・実装方針（バッチ同期など）** | GitHub Issue #14 の本文（マスター） |
| **アプリ仕様としての制限・エラー UX** | 本ファイル（`docs/09_cloud_sync_firebase_spec.md`） |
| **データ JSON 形状・localStorage** | [02_data_model.md](./02_data_model.md) |

README からは「ドキュメント一覧」で本ファイルへリンクするのみにし、利用者向けの長文はここに集約する。

### 1.1 公開 URL（本番・検証）

Cloudflare Pages では本番と検証で **ホストが別**（`*.pages.dev` が 2 つ）。Firebase の **承認済みドメイン**に **それぞれ** 追加する（詳細は [firebase_manual_setup.md](./firebase_manual_setup.md)）。

| 環境 | URL（デフォルトのプロジェクト名） |
|------|-----------------------------------|
| 本番（PRD） | `https://jcsqe-study-app.pages.dev` |
| 検証（STG） | `https://jcsqe-study-app-staging.pages.dev` |

## 2. 制限事項（仕様として固定しておくこと）

### 2.1 Firestore（Spark）

公式: [Firestore quotas](https://firebase.google.com/docs/firestore/quotas)、[Firebase Pricing](https://firebase.google.com/pricing)

| 項目 | 無料枠（目安） | 超過時（Spark） |
|------|----------------|------------------|
| 読み取り | 50,000 / 日 | その日は追加読み取り不可（請求ではなく**制限**） |
| 書き込み | 20,000 / 日 | 同上 |
| 削除 | 20,000 / 日 | 同上 |
| 保存容量 | 1 GiB（合計） | 書き込み不可等 |
| 転送（Outbound） | 10 GiB / 月 | 月次で上限 |

日次枠は**太平洋時間の深夜**付近でリセット（公式表記）。

### 2.2 Authentication

公式: [Authentication limits](https://firebase.google.com/docs/auth/limits)

- Identity Platform を有効にしている場合、Spark には **日次アクティブユーザー等の制限**がある（詳細は公式表とコンソールを参照）。
- **対策**: コンソールの Usage を監視し、必要ならプロジェクト分割・Blaze 検討は運用判断。

### 2.3 アプリが保証すること・しないこと

- **保証する**: 制限や通信失敗時も **ローカル（localStorage）の学習は継続可能**であること（オフライン優先）。
- **保証しない**: クラウド同期の**即時成功**（ネットワーク・枠・ルールにより失敗しうる）。

## 3. アプリ側のエラー検知とユーザー向け表示

Firebase JS SDK は失敗時に `FirebaseError` を投げ、`code`（例: `resource-exhausted`）で区別できる。

### 3.1 実装済みユーティリティ

`js/sync-firebase-errors.js` の `JCSQE.interpretSyncError(err)` が、エラーコードを**ユーザー向け文言と推奨アクション**に変換する。

- `index.html` で `app.js` より前に読み込み済み。
- `js/firebase-sync.js` が Firestore 失敗時に `#sync-toast` で表示する。

### 3.2 実装済み同期ロジック

- 設定タブに「クラウド同期」カード（Google ログイン・ログアウト）。
- `js/firebase-config.js` が未設定の場合は同期を無効化し、説明文のみ表示。
- `saveData` をラップし、**約 3.5 秒デバウンス**後に Firestore `users/{uid}` へ書き込み。
- ログイン直後にクラウドから 1 回読み込み、`totalAnswered` が大きい方を優先してマージ。

### 3.3 UX 方針（推奨）

| 状況 | UI |
|------|-----|
| クォータ超過（`resource-exhausted`） | **非ブロッキング**のバナーまたはトースト。「本日はクラウド同期を利用できません。学習データはこの端末に保存されています。明日以降に再試行できます。」 |
| 一時的な障害（`unavailable` 等） | 「接続できませんでした」＋**再試行**ボタン（指数バックオフ推奨）。 |
| 権限（`permission-denied`） | 「ログイン状態または権限を確認してください」＋設定へ誘導。 |
| 未ログイン（`unauthenticated`） | ログイン誘導（未実装時はメッセージのみ）。 |

**ブロッキングのモーダル**は、同期失敗だけでは出さない（学習継続を優先）。

### 3.4 開発者向けログ

- `console.warn` / `console.error` に **生の `error.code` と message** を残し、Firebase コンソールの Usage と突き合わせ可能にする。

## 4. 実装チェックリスト（Issue #14）

- [x] Firestore 読み書き失敗時に `interpretSyncError` 経由でトースト表示
- [x] 書き込みはデバウンス済み（Issue #14 本文の方針）
- [x] 同期失敗時も `localStorage` への保存は継続（既存の `saveData` とは独立）
- [ ] 設定画面の「最終同期」以外の詳細ステータス（任意）

## 5. 参照

- Issue #14（実装方針・無料枠表）
- [02_data_model.md](./02_data_model.md)（JSON スキーマ）
