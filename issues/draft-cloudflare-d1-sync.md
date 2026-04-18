## 概要

学習データを Firebase Firestore だけでなく、**JCSQE 専用の Cloudflare D1 + 専用 Worker** にも保存できるようにする。[ut-qms / Qraft](https://github.com/junichi-muraoka/ut-qms) の D1 とは **別インスタンス**・**別 Worker** として分離し、JCSQE 側で独立に運用する。

## 目的

- 学習データをブラウザ以外にも保持する第 2 経路を用意する（Firestore と並行運用可能）。
- **エンドユーザーは Worker URL もトークンも入力しない**：運用者が `js/d1-sync-config.js` に Worker のベース URL だけ記載し、ユーザーは Google ログインだけで使える。
- ut-qms とはコード・DB・API キーを混ぜず、**JCSQE 単位で運用**できるようにする。

## スコープ

- `cloudflare/jcsqe-sync-worker/`（Hono + jose ベース。`GET/PUT /api/study`、D1 マイグレーション、CORS 設定）
- `.github/workflows/deploy-jcsqe-sync-worker.yml`（Secrets が揃っているときだけ自動デプロイ、未設定時は明示的に fail）
- `js/d1-sync.js` + `js/d1-sync-config(.example).js`（設定タブの UI から有効化、saveData 後にデバウンス PUT、手動 Pull）
- 設定タブに ☁️ Cloudflare D1 カードを追加（`d1-sync-enabled` / `d1-sync-save-btn` / `d1-sync-pull-btn` / `d1-sync-status`）
- `sw.js` に新規 JS をプリキャッシュ、キャッシュ名 bump
- `docs/jcsqe_cloudflare_d1_sync.md`（設計・運用手順）、`cloudflare/jcsqe-sync-worker/README.md`
- `scripts/verify-oauth-client.js` + テスト（Google OAuth クライアント ID の突合。関連強化）

## 認証モデル

- `Authorization: Bearer <Firebase ID トークン>` を Worker で Google JWKS 検証し、`sub`（Firebase UID）を D1 の行キーに使用。
- レガシー：`Bearer <SYNC_API_SECRET>` + `X-User-Id`（互換用）。新フロントは使用しない。

## 受け入れ条件

- [ ] `cloudflare/jcsqe-sync-worker/` 一式が commit され、`npm ci && npm run dev` がローカルで起動する。
- [ ] 必要 Secrets（`D1_DATABASE_ID` / `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `FIREBASE_PROJECT_ID`）が揃っている場合、master への push で Worker が自動デプロイされる。
- [ ] 設定タブに Cloudflare D1 同期カードが表示され、トグル ON + ログイン済みで `saveData` ごとに PUT される（手動 Pull も動く）。
- [ ] Worker URL 未設定時はカードが無効状態になる（ユーザー向けメッセージ表示、エラー無し）。
- [ ] `docs/jcsqe_cloudflare_d1_sync.md` と `cloudflare/jcsqe-sync-worker/README.md` の手順どおりにセットアップできる。
- [ ] `npm test` が緑（OAuth 突合スクリプトのテスト含む）。

## 非スコープ

- Firestore ↔ D1 の二重同期ルールの厳密化（併存は可、マージ方針は既存仕様どおり）。
- D1 のバックアップ・監視ダッシュボード（別 Issue）。
- UI のデザインリニュー。
