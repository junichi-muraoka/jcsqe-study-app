# 実行環境一覧

> **関連 Issue**: [#51](https://github.com/junichi-muraoka/jcsqe-study-app/issues/51) / CI/CD: [#52](https://github.com/junichi-muraoka/jcsqe-study-app/issues/52)

## フロントエンド（静的アプリ）

| 区分 | ブランチ | 公開 URL（本リポジトリ） | デプロイ |
|------|----------|--------------------------|----------|
| **Production（PRD）** | `master` | [https://junichi-muraoka.github.io/jcsqe-study-app/](https://junichi-muraoka.github.io/jcsqe-study-app/) | `push` または `workflow_dispatch` → [Deploy GitHub Pages (STG / PRD)](../.github/workflows/deploy-github-pages.yml) |
| **Staging（STG）** | `staging` | [https://junichi-muraoka.github.io/jcsqe-study-app/staging/](https://junichi-muraoka.github.io/jcsqe-study-app/staging/) | 同上 |

他リポジトリに転用する場合は `https://<owner>.github.io/<repo>/` および `/staging/` に読み替える。

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
| [deploy-pages.yml](../.github/workflows/deploy-pages.yml) | レガシー手動デプロイ（任意） |

## Secrets（運用時）

| Name | 用途 |
|------|------|
| （任意） | Firebase / 外部ホスト連携時は GitHub Environments の `staging` / `production` に分ける |
