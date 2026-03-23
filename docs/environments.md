# 実行環境一覧

> **関連 Issue**: [#51](https://github.com/junichi-muraoka/jcsqe-study-app/issues/51) / CI/CD: [#52](https://github.com/junichi-muraoka/jcsqe-study-app/issues/52)

## フロントエンド（静的アプリ）

| 区分 | ブランチ（想定） | URL | 備考 |
|------|------------------|-----|------|
| **Production** | `master` | [GitHub Pages](https://junichi-muraoka.github.io/jcsqe-study-app/) | リポジトリ Settings → Pages で `master` / root を指定している場合 |
| **Staging** | 未固定（例: `develop`） | TBD | 別ブランチ or PR プレビューに載せる場合はここに追記 |

## Firebase（Issue #14）

| 区分 | プロジェクト ID | 備考 |
|------|-----------------|------|
| **Production** | （未作成） | Firebase コンソールで作成後、ここに記載 |
| **Staging** | （未作成） | 検証用は別プロジェクト推奨 |

## GitHub Actions

- 手動デプロイ: [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)（`workflow_dispatch`）
- 本番 Pages を **Actions から** 出す場合は、リポジトリの **Settings → Pages → Build and deployment** で **GitHub Actions** を選択する必要があります（ブランチ直出しの場合はこのワークフローは使わない）。

## Secrets（運用時）

| Name | 用途 |
|------|------|
| （任意） | Firebase / Cloudflare 等は #52 の方針に従い、**GitHub Environments** に `staging` / `production` を分ける |
