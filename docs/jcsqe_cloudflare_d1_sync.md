# JCSQE 学習データの Cloudflare 同期（専用 D1 + 専用 Worker）

## 1. 目的

学習データを **ブラウザ以外**にも保持する場合の、**Cloudflare 上の保存先**の考え方です。  
[ut-qms（Qraft）](https://github.com/junichi-muraoka/ut-qms) の DB とは **別アプリとして分離**します。

## 2. 分離の方針（結論）

| 項目 | 方針 |
|------|------|
| **データベース** | **JCSQE 専用の D1**（ut-qms の D1 とは **別インスタンス**） |
| **API** | **JCSQE 専用の Cloudflare Worker**（本リポジトリの `cloudflare/jcsqe-sync-worker/`） |
| **フロント** | 引き続き GitHub Pages の静的アプリ（別オリジンから `fetch`） |

同じ Cloudflare アカウントに **DB が 2 つ**並ぶイメージです。QMS 用と JCSQE 用で **中身が混ざりません**。

## 3. ut-qms との関係

- **コードの置き場所**: 学習同期用 Worker は **本リポジトリ**に置き、ut-qms リポジトリには依存しません。
- **運用**: デプロイ・シークレット・D1 バックアップは **JCSQE 用 Worker と D1** 単位で管理できます。
- **将来**: 認証や監視を ut-qms と揃えたくなったら、**OAuth やダッシュボード**だけパターンを合わせる、という段階が可能です。

## 4. フロントエンドとの接続（実装済み）

- **エンドユーザーは Worker URL や API トークンを入力しません。** 運用者が `js/d1-sync-config.js` に **Worker のベース URL だけ** 記載します（`d1-sync-config.example.js` を参照）。
- **Google でログイン**（Firebase Auth）しているとき、ブラウザは **Firebase ID トークン**を `Authorization: Bearer` で送ります。Worker は Google の JWKS で検証し、トークンの `sub`（Firebase UID）を D1 の行キーにします。
- **設定**タブで「保存時に自動で Cloudflare に同期する」を有効にすると、**学習データを保存するたび**（`saveData`）に **自動で PUT** します（デバウンス約 3.5 秒）。
- **クラウドから取得**で `GET` し、ローカルに上書き反映します（`js/d1-sync.js`）。
- CORS は GitHub Pages 想定で Worker 側に設定済み（`ALLOWED_ORIGIN` で変更可）。

## 4.1 GitHub Actions で Worker を自動デプロイ

リポジトリに次の **Secrets** を入れておくと、`cloudflare/jcsqe-sync-worker/` が `master` にマージされたとき **[Deploy JCSQE Sync Worker](https://github.com/junichi-muraoka/jcsqe-study-app/actions)** が **マイグレーション適用 →（任意でレガシー secret）→ deploy** まで実行します。

| Secret | 内容 |
|--------|------|
| `D1_DATABASE_ID` | `wrangler d1 create jcsqe-study-data` で表示された UUID |
| `CLOUDFLARE_API_TOKEN` | Workers + D1 権限の API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | ダッシュボードの Account ID |
| `FIREBASE_PROJECT_ID` | Firebase の project ID（Worker の JWT 検証用。`firebase-config.js` の `projectId` と一致） |
| `JCSQE_SYNC_API_SECRET` | 任意。旧 Bearer 方式用。空なら `wrangler secret put` はスキップ |

## 5. 認証モデル

- **`Authorization: Bearer <Firebase ID トークン>`** … Worker が JWKS で検証。`sub` を `user_id` に使用。
- **レガシー（互換）**: `Authorization: Bearer <SYNC_API_SECRET>` と **`X-User-Id`** … 旧 PoC 用。

## 6. 関連ファイル

| パス | 内容 |
|------|------|
| [cloudflare/jcsqe-sync-worker/README.md](../cloudflare/jcsqe-sync-worker/README.md) | 作成・マイグレーション・デプロイ手順 |
| [cloudflare/jcsqe-sync-worker/migrations/0001_init.sql](../cloudflare/jcsqe-sync-worker/migrations/0001_init.sql) | D1 スキーマ |

## 7. 既存ドキュメントとの関係

- **Firebase 同期**: [09_cloud_sync_firebase_spec.md](./09_cloud_sync_firebase_spec.md)（別経路。併存は可能だが、二重同期のルールは要設計）。
- **データ形状**: [02_data_model.md](./02_data_model.md)
