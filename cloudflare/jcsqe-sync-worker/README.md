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

- アプリの **設定**タブ「Cloudflare D1 同期」に Worker の URL と `SYNC_API_SECRET` を入力して保存する。
- CORS はデフォルトで `https://junichi-muraoka.github.io` と localhost。別 URL なら `ALLOWED_ORIGIN` を `wrangler.toml` の `[vars]` かダッシュボードで変更

## GitHub Actions で自動デプロイ（推奨）

`master` へ `cloudflare/jcsqe-sync-worker/` の変更が push されると [.github/workflows/deploy-jcsqe-sync-worker.yml](../../.github/workflows/deploy-jcsqe-sync-worker.yml) が動きます。次の **Repository secrets** を設定しておくこと（未設定時はジョブがスキップされます）。

| Secret | 説明 |
|--------|------|
| `D1_DATABASE_ID` | `npx wrangler d1 create jcsqe-study-data` の出力 UUID（`wrangler.toml` のプレースホルダを CI が置換） |
| `CLOUDFLARE_API_TOKEN` | Workers / D1 用 API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare の Account ID |
| `JCSQE_SYNC_API_SECRET` | `SYNC_API_SECRET` と同じ値（任意。空なら `wrangler secret put` はスキップ） |

## セキュリティ注意

- PoC では **共有シークレット 1 本**で書き込みを守っています。本番で複数ユーザー運用する場合は **ユーザー単位のトークン**や **OAuth + JWT** への置き換えを検討してください。
