# JCSQE 学習データ同期 Worker（専用 D1）

[ut-qms](https://github.com/junichi-muraoka/ut-qms) の D1 とは **別のデータベース**・**別 Worker** として動かすための最小 API です。

## 前提

- Cloudflare アカウントと [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) が使えること
- Node.js が入っていること

## 初回セットアップ

```bash
cd cloudflare/jcsqe-sync-worker
npm install
```

### 1. D1 を新規作成（JCSQE 専用）

```bash
npx wrangler d1 create jcsqe-study-data
```

表示された `database_id` を `wrangler.toml` の `database_id` に貼り付ける（`REPLACE_WITH_WRANGLER_D1_CREATE_OUTPUT` を置換）。

### 2. マイグレーション適用

```bash
npx wrangler d1 migrations apply jcsqe-study-data --local   # ローカル SQLite
npx wrangler d1 migrations apply jcsqe-study-data --remote  # リモート D1
```

### 3. シークレット

```bash
npx wrangler secret put SYNC_API_SECRET
```

対話で強いランダム文字列を入力する。ローカル開発では `.dev.vars.example` を `.dev.vars` にコピーして `SYNC_API_SECRET` を設定する。

## 開発・デプロイ

```bash
npm run dev      # ローカル
npm run deploy   # Cloudflare へデプロイ
```

デプロイ後の URL（例: `https://jcsqe-study-sync.<account>.workers.dev`）に対し:

- `GET /api/health` … 疎通確認
- `GET /api/study` … `Authorization: Bearer <SYNC_API_SECRET>` と `X-User-Id: <uuid>` 必須
- `PUT /api/study` … ボディ `{"data":{...}}`（学習データオブジェクト）

## GitHub Pages から呼ぶとき

- Worker の URL をフロントに設定（将来は設定画面や環境変数ビルド）
- CORS はデフォルトで `https://junichi-muraoka.github.io` と localhost。別 URL なら `ALLOWED_ORIGIN` を `wrangler.toml` の `[vars]` かダッシュボードで変更

## セキュリティ注意

- PoC では **共有シークレット 1 本**で書き込みを守っています。本番で複数ユーザー運用する場合は **ユーザー単位のトークン**や **OAuth + JWT** への置き換えを検討してください。
