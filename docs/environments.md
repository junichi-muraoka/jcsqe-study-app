# 実行環境一覧

> **関連 Issue**: [#51](https://github.com/junichi-muraoka/jcsqe-study-app/issues/51) / CI/CD: [#52](https://github.com/junichi-muraoka/jcsqe-study-app/issues/52)  
> ドキュメント整備: ~~#58〜#63~~ 反映済み（[exam_meta.md](./exam_meta.md)、[accessibility.md](./accessibility.md) 含む）。  
> **インフラの棚卸し・定期見直し**: [infrastructure_review.md](./infrastructure_review.md)

## フロントエンド（静的アプリ）

### Cloudflare Pages（`*.pages.dev`）

[ut-qms（Qraft）](https://github.com/junichi-muraoka/ut-qms) と同様、**本番用・検証用で Pages プロジェクトを分け**、CI から `wrangler pages deploy` で配信する。

| 区分 | ブランチ | 公開 URL（デフォルトのプロジェクト名の場合） | デプロイ |
|------|----------|---------------------------------------------|----------|
| **Production（PRD）** | `master` / `main` | `https://jcsqe-study-app.pages.dev` | `push` または `workflow_dispatch` → [Deploy Cloudflare Pages](../.github/workflows/deploy-cloudflare-pages.yml) |
| **Staging（STG）** | `staging` / `develop` | `https://jcsqe-study-app-staging.pages.dev` | 同上 |

- **プロジェクト名**は Cloudflare ダッシュボードの **Workers & Pages → プロジェクト名**と一致させる。リポジトリの **Settings → Secrets and variables → Actions → Variables** で上書きできる（未設定時は上表のデフォルト）。
  - `CF_PAGES_PROJECT_PRODUCTION`（本番）
  - `CF_PAGES_PROJECT_STAGING`（検証）
- **実際の URL**はダッシュボードの **ドメイン**（`*.pages.dev` またはカスタムドメイン）を正とする。プレビュー用のプレビュー URL はワークフローの表示 URL と異なる場合がある。

#### 初回セットアップ（Cloudflare Pages）

1. Cloudflare で **空の Pages プロジェクトを 2 つ**作成し、名前をデフォルト（`jcsqe-study-app` / `jcsqe-study-app-staging`）または Variables に合わせる。**Git 連携は使わず**、GitHub Actions からのみデプロイする想定。
2. GitHub **Repository secrets**: `CLOUDFLARE_API_TOKEN`（**Account** → **API トークン**で **Pages:Edit** など Pages デプロイに必要な権限）、`CLOUDFLARE_ACCOUNT_ID`。
3. Firebase の **承認済みドメイン**に、各環境の `*.pages.dev` ホスト（例: `jcsqe-study-app.pages.dev`）を追加する。手順は [firebase_manual_setup.md](./firebase_manual_setup.md) のフェーズ E。

#### ブランチの対応（ut-qms との違い）

| 役割 | ut-qms | 本リポジトリ |
|------|--------|--------------|
| 本番 | `main` 等 | `master` または `main` |
| 検証 | `develop` | **`staging`**（メイン）および **`develop`**（push 対象として同列） |

### GitHub Pages（併用可）

| 区分 | ブランチ | 公開 URL（本リポジトリ） | デプロイ |
|------|----------|--------------------------|----------|
| **Production（PRD）** | `master` | [https://junichi-muraoka.github.io/jcsqe-study-app/](https://junichi-muraoka.github.io/jcsqe-study-app/) | `push` または `workflow_dispatch` → [Deploy GitHub Pages (STG / PRD)](../.github/workflows/deploy-github-pages.yml) |
| **Staging（STG）** | `staging` | [https://junichi-muraoka.github.io/jcsqe-study-app/staging/](https://junichi-muraoka.github.io/jcsqe-study-app/staging/) | 同上 |

他リポジトリに転用する場合は `https://<owner>.github.io/<repo>/` および `/staging/` に読み替える。Cloudflare のみに寄せる場合は [deploy-github-pages.yml](../.github/workflows/deploy-github-pages.yml) を無効化または削除して二重デプロイを避ける。

### 仕組み（GitHub Pages）

1. ワークフロー [`.github/workflows/deploy-github-pages.yml`](../.github/workflows/deploy-github-pages.yml) が `rsync` で公開用ディレクトリ `_site` を作り（`.git` / `.github` / テスト等を除外）、`peaceiris/actions-gh-pages` で **`gh-pages` ブランチ**にプッシュする。
2. **本番**はルート（`/`）、**STG**はサブディレクトリ（`/staging/`）。`keep_files: true` により、PRD デプロイで STG が消えず、STG デプロイで本番ルートが消えない。
3. アセットは相対パス（`./`）のため、`/staging/` 配下でもそのまま動作する。

### 初回セットアップ（リポジトリ管理者）

1. **`staging` ブランチ**を作成する（例: `git checkout -b staging` → `git push -u origin staging`）。`master` と同じ内容からでよい。
2. **Settings → Pages → Build and deployment**
   - **Source**: Deploy from a branch
   - **Branch**: `gh-pages` / **Folder**: `/ (root)`  
   （従来「`master` の root」で出していた場合は、ここを **`gh-pages`** に切り替える。切り替え後、本番 URL は同じパス `/` のまま、`gh-pages` の内容が配信される。）
3. **`push` でデプロイ**  
   - `master` にマージ・プッシュ → 本番が更新される。  
   - `staging` にプッシュ → STG が更新される。
4. **GitHub Environments**（任意）  
   - ワークフローが `environment: production` / `staging` を参照する。リポジトリの **Settings → Environments** で保護ルール（承認者など）を付けられる。

### 手動デプロイ

Actions タブで **Deploy GitHub Pages (STG / PRD)** を選び **Run workflow** → 実行するブランチを **master**（本番）または **staging**（STG）にして実行する。

### 旧ワークフロー

- [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml): 公式 `actions/deploy-pages` による**手動のみ**の全置換デプロイ（レガシー）。通常は `deploy-github-pages.yml` を使う。

## Firebase（Issue #14）

| 区分 | プロジェクト ID | 備考 |
|------|-----------------|------|
| **Production** | （未作成） | Firebase コンソールで作成後、ここに記載 |
| **Staging** | （未作成） | 検証用は別プロジェクト推奨 |

手動セットアップの具体手順: [firebase_manual_setup.md](./firebase_manual_setup.md)

## GitHub Actions（一覧）

| ワークフロー | 用途 |
|--------------|------|
| [test.yml](../.github/workflows/test.yml) | `master` / `staging` の `npm test` |
| [e2e.yml](../.github/workflows/e2e.yml) | 変更パスに応じた E2E |
| [deploy-github-pages.yml](../.github/workflows/deploy-github-pages.yml) | **PRD / STG** の GitHub Pages デプロイ |
| [deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) | **PRD / STG** の Cloudflare Pages（`*.pages.dev`）デプロイ |
| [firestore-rules.yml](../.github/workflows/firestore-rules.yml) | `firestore.rules` の検証と **master へのマージ時の自動デプロイ**（要 `FIREBASE_TOKEN` 等） |
| [deploy-pages.yml](../.github/workflows/deploy-pages.yml) | レガシー手動デプロイ（任意） |

## Secrets（運用時）

| Name | 用途 |
|------|------|
| `FIREBASE_TOKEN` | （任意）[firestore-rules.yml](../.github/workflows/firestore-rules.yml) が `firestore.rules` をデプロイするとき。`firebase login:ci` で発行 |
| `FIREBASE_PROJECT_ID` | （同上）Firebase project ID |
| `FIREBASE_WEB_CONFIG_JSON` | （任意）Firebase コンソールの `firebaseConfig` を **1 行の JSON** にした文字列。デプロイ時に `js/firebase-config.js` を生成（[deploy-github-pages.yml](../.github/workflows/deploy-github-pages.yml)、[deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml)） |
| `CLOUDFLARE_API_TOKEN` | （任意）[deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) 用。Pages デプロイ権限を含む API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | （同上）Cloudflare アカウント ID |
| （その他） | Firebase / 外部ホスト連携時は GitHub Environments の `staging` / `production` に分ける |

**Variables（Cloudflare Pages のプロジェクト名上書き）**

| Name | 用途 |
|------|------|
| `CF_PAGES_PROJECT_PRODUCTION` | 未設定時は `jcsqe-study-app` |
| `CF_PAGES_PROJECT_STAGING` | 未設定時は `jcsqe-study-app-staging` |
