# JCSQE 学習データ同期 Worker（専用 D1）

[ut-qms](https://github.com/junichi-muraoka/ut-qms) の D1 とは **別のデータベース**・**別 Worker** として動かすための最小 API です。

## 前提

- Cloudflare アカウントと [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) が使えること
- Node.js が入っていること
- Firebase と **同じ project ID**（Web アプリの `js/firebase-config.js` の `projectId` と一致）

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

### 2. Firebase project ID を `wrangler.toml` に書く

`[vars]` の `FIREBASE_PROJECT_ID` を、Firebase コンソールの **project ID**（公開情報）に置き換える。GitHub Actions 利用時は Repository secret `FIREBASE_PROJECT_ID` で CI が置換する。

### 3. マイグレーション適用

```bash
npx wrangler d1 migrations apply jcsqe-study-data --local   # ローカル SQLite
npx wrangler d1 migrations apply jcsqe-study-data --remote  # リモート D1
```

### 4. ローカル開発用の変数（任意）

`.dev.vars.example` を `.dev.vars` にコピーし、`FIREBASE_PROJECT_ID` を入れる（`wrangler dev` 用）。

### 5. 旧クライアント用シークレット（任意）

従来の **Bearer 共有シークレット + `X-User-Id`** だけ使う場合のみ:

```bash
npx wrangler secret put SYNC_API_SECRET
```

通常のフロント（Firebase ID トークン認証）では **不要**。

## 開発・デプロイ

```bash
npm run dev      # ローカル
npm run deploy   # Cloudflare へデプロイ
```

デプロイ後の URL（例: `https://jcsqe-study-sync.<account>.workers.dev`）に対し:

- `GET /api/health` … 疎通確認
- `GET /api/study` … `Authorization: Bearer <Firebase ID トークン>`（ログインユーザーの JWT）。主キーはトークン内の `sub`（Firebase UID）
- `PUT /api/study` … ボディ `{"data":{...}}`（学習データオブジェクト）。同上の Bearer

**レガシー**（移行用）: `Authorization: Bearer <SYNC_API_SECRET>` と `X-User-Id: <uuid>` の組み合わせも受理する。

## GitHub Pages から呼ぶとき

- **エンドユーザーは URL もトークンも入力しません。** 運用者がリポジトリの `js/d1-sync-config.js` に **Worker のベース URL だけ** 1 度書き、コミット・デプロイします。
- ユーザーは **Google でログイン**（Firebase Auth）すれば、ブラウザが **ID トークン**を Worker に送ります。
- CORS はデフォルトで `https://junichi-muraoka.github.io` と localhost。別 URL なら `ALLOWED_ORIGIN` を `wrangler.toml` の `[vars]` かダッシュボードで変更

## GitHub Actions で自動デプロイ（推奨）

`master` へ `cloudflare/jcsqe-sync-worker/` の変更が push されると [.github/workflows/deploy-jcsqe-sync-worker.yml](../../.github/workflows/deploy-jcsqe-sync-worker.yml) が動きます。次の **Repository secrets** を設定しておくこと（いずれか欠けるとジョブは失敗します）。

| Secret | 説明 |
|--------|------|
| `D1_DATABASE_ID` | `npx wrangler d1 create jcsqe-study-data` の出力 UUID（`wrangler.toml` のプレースホルダを CI が置換） |
| `CLOUDFLARE_API_TOKEN` | Workers / D1 用 API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare の Account ID |
| `FIREBASE_PROJECT_ID` | Firebase の project ID（`wrangler.toml` の `FIREBASE_PROJECT_ID` を CI が置換） |
| `JCSQE_SYNC_API_SECRET` | 任意。レガシー API 用。空なら `wrangler secret put SYNC_API_SECRET` はスキップ |

## セキュリティ注意

- フロントに **共有シークレットを持たせない**構成です。Worker は Google の JWKS で **Firebase ID トークン**を検証し、`sub` を D1 のユーザー主キーにします。
- 旧 PoC の `SYNC_API_SECRET` は、互換用に残していますが、公開アプリでは Firebase 認証のみを推奨します。
