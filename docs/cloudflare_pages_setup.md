# Cloudflare Pages 初回セットアップ（`*.pages.dev` を有効にする）

GitHub Actions の [Deploy Cloudflare Pages](../.github/workflows/deploy-cloudflare-pages.yml) で、`master` / `staging` などの push から **静的サイトを Cloudflare にデプロイ**するための手順です。GitHub Pages と**中身は同じアプリ**で、**公開 URL が `*.pages.dev` になる**だけです。

## 前提

- Cloudflare の無料アカウントでよい。
- リポジトリに **`FIREBASE_WEB_CONFIG_JSON`** が入っていれば、Cloudflare 側のデプロイでも同じく Firebase 設定が注入される（[firebase_manual_setup.md](./firebase_manual_setup.md)）。

## 手順チェックリスト

### 1. Cloudflare で Pages プロジェクトを 2 つ用意する

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) → **Workers & Pages** → **作成** → **Pages**。
2. **Git 連携は使わない**（「GitHub と接続」は選ばない）。**ダイレクトアップロード**で作るか、空のプロジェクト名だけ決めて作成できる UI ならそれでよい。
3. プロジェクト名を次のどちらかに揃える。
   - **デフォルトのまま**使う: `jcsqe-study-app`（本番）、`jcsqe-study-app-staging`（検証）
   - **別名にする**: GitHub の **Settings → Secrets and variables → Actions → Variables** で  
     `CF_PAGES_PROJECT_PRODUCTION` / `CF_PAGES_PROJECT_STAGING` にその名前を登録する。

初回の `wrangler pages deploy` は、**同名の Pages プロジェクトがダッシュボード上に存在する**必要があります（空でよい）。

### 2. Account ID を控える

1. Cloudflare ダッシュボード右サイドバー、または **Workers & Pages** 概要の **アカウント ID**（32 文字の hex）をコピー。

### 3. API トークンを作る

1. **マイプロフィール**（右上）→ **API トークン** → **トークンを作成** → **カスタムトークン**。
2. 権限の例（必要に応じて調整）:
   - **Account** → **Cloudflare Pages** → **編集**
   - （無い場合）**Account** → **Workers Scripts** → **編集** など、Pages デプロイ用ドキュメントに沿う
3. **アカウントリソース**で、このアカウントに限定する。
4. 作成後、**トークン文字列を一度だけコピー**（あとからは表示されない）。

### 4. GitHub に Secrets を登録する

リポジトリ **Settings → Secrets and variables → Actions → New repository secret**

| Name | 値 |
|------|-----|
| `CLOUDFLARE_API_TOKEN` | 上でコピーした API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | 手順 2 のアカウント ID |

`FIREBASE_WEB_CONFIG_JSON` は、GitHub Pages 用と**同じ Secret**でよい（未設定なら Cloudflare 側もプレースホルダのまま配信される）。

### 5. Firebase の承認済みドメイン（ログインする場合）

**Authentication → 設定 → 承認済みドメイン** に、**ホスト名だけ**で追加する（`https://` なし）。

- `jcsqe-study-app.pages.dev`
- `jcsqe-study-app-staging.pages.dev`（検証を使う場合）

詳細は [firebase_manual_setup.md](./firebase_manual_setup.md) のフェーズ E。

### 6. デプロイを走らせる

- **`master` に push** するか、**Actions → Deploy Cloudflare Pages → Run workflow** で **`master`** を選ぶ → 本番プロジェクトへデプロイ。
- **`staging` ブランチに push** → 検証プロジェクトへデプロイ。

成功後、**Workers & Pages** の該当プロジェクトに **デプロイ履歴**と **`*.pages.dev` の URL** が出る。

## トラブルシュート

| 症状 | 確認すること |
|------|----------------|
| `Authentication error` / 401 | `CLOUDFLARE_API_TOKEN` の権限と有効期限 |
| プロジェクトが見つからない | ダッシュボードの**プロジェクト名**と `CF_PAGES_PROJECT_*` / デフォルト名が一致しているか |
| ログインだけ失敗 | 承認済みドメインに **その `*.pages.dev` ホスト**があるか |

## 関連

- [environments.md](./environments.md) — ブランチと URL の対応
- [deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) — ワークフロー本体
