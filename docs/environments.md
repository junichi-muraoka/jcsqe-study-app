# 実行環境一覧

> **関連 Issue**: [#51](https://github.com/junichi-muraoka/jcsqe-study-app/issues/51) / CI/CD: [#52](https://github.com/junichi-muraoka/jcsqe-study-app/issues/52)  
> ドキュメント整備: ~~#58〜#63~~ 反映済み（[exam_meta.md](./exam_meta.md)、[accessibility.md](./accessibility.md) 含む）。  
> **インフラの棚卸し・定期見直し**: [infrastructure_review.md](./infrastructure_review.md)

## フロントエンド（静的アプリ）

### Cloudflare Pages（`*.pages.dev`）

[ut-qms（Qraft）](https://github.com/junichi-muraoka/ut-qms) と同様、**本番用・検証用で Pages プロジェクトを分け**、CI から `wrangler pages deploy` で配信する。

| 区分 | ブランチ | 公開 URL（デフォルトのプロジェクト名の場合） | デプロイ |
|------|----------|---------------------------------------------|----------|
| **Production（PRD）** | `master` / `main` | `https://jcsqe-study-app.pages.dev` | **GitHub Release を公開したとき**（`release: published`、**プレリリースは除く**）。または **Actions → Deploy Cloudflare Pages → `master` / `main` で Run workflow**。[ut-qms（Qraft）](https://github.com/junichi-muraoka/ut-qms) と同様、**`master` への push だけでは本番 URL は更新されない**。 |
| **Staging（STG）** | `staging` / `develop` | `https://jcsqe-study-app-staging.pages.dev` | 上記ブランチへの **push**（または同ブランチで `workflow_dispatch`）→ [Deploy Cloudflare Pages](../.github/workflows/deploy-cloudflare-pages.yml) |

- **プロジェクト名**は Cloudflare ダッシュボードの **Workers & Pages → プロジェクト名**と一致させる。リポジトリの **Settings → Secrets and variables → Actions → Variables** で上書きできる（未設定時は上表のデフォルト）。
  - `CF_PAGES_PROJECT_PRODUCTION`（本番）
  - `CF_PAGES_PROJECT_STAGING`（検証）
- **実際の URL**はダッシュボードの **ドメイン**（`*.pages.dev` またはカスタムドメイン）を正とする。プレビュー用のプレビュー URL はワークフローの表示 URL と異なる場合がある。

#### デプロイ時に CI がすること（[deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml)）

**Direct Upload** 用の Pages では、次を **毎回**実行する（詳細は [cloudflare_pages_setup.md](./cloudflare_pages_setup.md) の「CI が自動で行うこと」）。

1. **`npm test`** →（任意）**Firebase 設定の注入** → **`_site` 作成**
2. **Cloudflare API（PATCH）**で対象プロジェクトの **`production_branch`** を、実行中の **Git ブランチ名**に合わせる（ルート `*.pages.dev` を本番として載せるため）。
3. **`wrangler pages deploy`** に **`--project-name`** と **`--branch`**（上と同じブランチ名）を付けてアップロード。

#### PRD と STG の中身を揃えたいとき

- **本番 URL**は **Release 公開**で更新する。**`master` にマージしただけでは本番は変わらない**（意図しない本番更新を防ぐ）。反映したいコミットに **タグを付けて Release を Publish** する（手順は [release_process.md](./release_process.md)）。
- **検証 URL**は **`staging` / `develop` への push** で更新。**`master` だけ更新しても STG は自動では追従しない**。
- 本番と検証のコミットを揃えたいときは、例として **`staging` に `master` を取り込んで push** し、本番を出すときはそのコミット（または `master` の先端）から **Release** する。

#### 初回セットアップ（Cloudflare Pages）

**手順の全文（チェックリスト）**は [cloudflare_pages_setup.md](./cloudflare_pages_setup.md)。概要だけ:

1. Cloudflare で **空の Pages プロジェクトを 2 つ**作成し、名前をデフォルト（`jcsqe-study-app` / `jcsqe-study-app-staging`）または Variables に合わせる。**Git 連携は使わず**、GitHub Actions からのみデプロイする想定。
2. GitHub **Repository secrets**: `CLOUDFLARE_API_TOKEN`（**Account** → **API トークン**で **Pages:Edit** など Pages デプロイに必要な権限）、`CLOUDFLARE_ACCOUNT_ID`。
3. Firebase の **承認済みドメイン**に、各環境の `*.pages.dev` ホスト（例: `jcsqe-study-app.pages.dev`）を追加する。手順は [firebase_manual_setup.md](./firebase_manual_setup.md) のフェーズ E。

#### ブランチの対応（ut-qms との違い）

| 役割 | ut-qms | 本リポジトリ |
|------|--------|--------------|
| 本番 | `main` 等 | `master` または `main` |
| 検証 | `develop` | **`staging`**（メイン）および **`develop`**（push 対象として同列） |

### GitHub Pages（廃止）

本番・検証の **自動デプロイは Cloudflare Pages のみ**（上表）。旧 **`deploy-github-pages.yml`**（`gh-pages` ブランチへの push）は **削除済み**。リポジトリに **`gh-pages` ブランチ**や **Settings → Pages** の設定が残っていても、**Actions からは更新されない**。混同を避けるなら Pages を無効化してよい。

### レガシー手動ワークフロー

- [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml): 公式 `actions/deploy-pages` による**手動のみ**のデプロイ。通常は使わず [deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) を正とする。

## Firebase（Issue #14）

| 区分 | プロジェクト ID | 備考 |
|------|-----------------|------|
| **Production** | `jcsqe-study-app` | Cloudflare PRD（`jcsqe-study-app.pages.dev`）向け |
| **Staging** | `jcsqe-study-app` | Cloudflare STG（`jcsqe-study-app-staging.pages.dev`）向け。**現状は PRD と同一 Firebase プロジェクト**（承認済みドメインに STG のホストも含める）。検証専用に別プロジェクトへ分離する場合は [#64](https://github.com/junichi-muraoka/jcsqe-study-app/issues/64) で方針を更新する |

手動セットアップの具体手順: [firebase_manual_setup.md](./firebase_manual_setup.md)

## GitHub Actions（一覧）

| ワークフロー | 用途 |
|--------------|------|
| [test.yml](../.github/workflows/test.yml) | `master` / `staging` の `npm test` |
| [e2e.yml](../.github/workflows/e2e.yml) | 変更パスに応じた E2E |
| [deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) | **PRD / STG** の Cloudflare Pages（`*.pages.dev`）デプロイ |
| [firestore-rules.yml](../.github/workflows/firestore-rules.yml) | `firestore.rules` の検証と **master へのマージ時の自動デプロイ**（要 `FIREBASE_TOKEN` 等） |
| [deploy-pages.yml](../.github/workflows/deploy-pages.yml) | レガシー手動デプロイ（任意） |

## Secrets（運用時）

| Name | 用途 |
|------|------|
| `FIREBASE_TOKEN` | （任意）[firestore-rules.yml](../.github/workflows/firestore-rules.yml) が `firestore.rules` をデプロイするとき。`firebase login:ci` で発行 |
| `FIREBASE_PROJECT_ID` | （同上）Firebase project ID |
| `FIREBASE_WEB_CONFIG_JSON` | （任意）Firebase コンソールの `firebaseConfig` を **1 行の JSON** にした文字列（必要なら `googleOAuthClientId` 等を同梱）。デプロイ時に `js/firebase-config.js` を生成（[deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml)） |
| `GOOGLE_OAUTH_CLIENT_ID` | （任意）ウェブ OAuth クライアント ID だけ差し替えたいとき。設定時は `FIREBASE_WEB_CONFIG_JSON` 内の値より優先される |
| `CLOUDFLARE_API_TOKEN` | （任意）[deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) 用。Pages デプロイ権限を含む API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | （同上）Cloudflare アカウント ID |
| （その他） | Firebase / 外部ホスト連携時は GitHub Environments の `staging` / `production` に分ける |

**Variables（Cloudflare Pages のプロジェクト名上書き）**

| Name | 用途 |
|------|------|
| `CF_PAGES_PROJECT_PRODUCTION` | 未設定時は `jcsqe-study-app` |
| `CF_PAGES_PROJECT_STAGING` | 未設定時は `jcsqe-study-app-staging` |
