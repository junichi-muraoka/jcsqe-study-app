# リリース運用（バージョン・CHANGELOG・デプロイ）

> **関連 Issue**: [#60](https://github.com/junichi-muraoka/jcsqe-study-app/issues/60)

## 1. バージョン番号

- **ソース・ドキュメントの版**はリポジトリ直下の **`package.json` の `version`**（[セマンティック バージョニング](https://semver.org/lang/ja/)）で管理する。
- **例**: `1.2.1` = メジャー.マイナー.パッチ  
  - **パッチ**: バグ修正・ドキュメントのみ・軽微な内部変更  
  - **マイナー**: 後方互換な機能追加・運用フロー追加など  
  - **メジャー**: 互換性を壊す大きな変更（現状は慎重に）

## 2. CHANGELOG

- 変更の記録は **[CHANGELOG.md](../CHANGELOG.md)** に書く。
- **新しい版**を追記するときは、日付と「追加 / 変更 / 修正」など見出しを揃え、**ユーザーまたは開発者が知りたい差分**を短く書く。
- **コミットメッセージ**と二重管理にならないよう、リリース単位で CHANGELOG を 1 回まとめて更新してもよい。

## 3. 本番（PRD）・検証（STG）との関係

本番の Cloudflare デプロイは [ut-qms（Qraft）](https://github.com/junichi-muraoka/ut-qms) と同様、**GitHub で Release を公開したとき**がトリガー（`release: published`、**プレリリースは本番に載せない**）。検証は **`staging` / `develop` への push** で更新。

| 操作 | 公開への影響 |
|------|----------------|
| **`master` / `main` にマージ・プッシュ** | **本番 URL は自動では更新されない**（コードはリポジトリに入るだけ） |
| **GitHub Release を作成し Publish**（タグ例: `v1.2.12`） | [deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) が **本番** `*.pages.dev` を、**そのタグのコミット**で更新する |
| **`staging` / `develop` にプッシュ** | 同ワークフローが **検証**用 `*.pages.dev` を更新する |
| **緊急時** | Actions で **Deploy Cloudflare Pages** を **`master` または `main` ブランチ**から **Run workflow**（本番プロジェクトへデプロイ） |

### 本番リリースの手順（推奨）

1. `master` にマージし、テストが通ることを確認する。  
2. **Releases → Create a new release** → **Choose a tag** で `vX.Y.Z` を新規作成（対象は `master` の先端コミットでよい）。  
3. **Generate release notes** で PR 一覧を埋め、**Publish release**。  
4. Actions の **Deploy Cloudflare Pages** が成功したら本番 URL を確認する。

- **`package.json` の `version`** とタグ・CHANGELOG を揃える運用にすると追いやすい（必須ではない）。
- **バージョンを上げたコミット**が `master` に入っただけでは本番サイトは変わらない。**Release を公開したタイミング**で本番が更新される。

参考（別リポジトリの同種ガイド）: [ut-qms / `release_management_guide.md`](https://github.com/junichi-muraoka/ut-qms/blob/main/docs/release_management_guide.md)（Qraft のリリース・バージョン管理の考え方）。

## 4. リリース前の最低チェック（推奨）

1. `npm test` が通ること  
2. 問題・解説を触った場合は `npm run validate`（または `npm test` に含まれる整合性チェック）  
3. デプロイ後は [environments.md](./environments.md) の URL で本番・STG を目視確認（必要なら）

## 5. 関連ドキュメント

- [environments.md](./environments.md) … URL・Pages 設定  
- [runbook.md](./runbook.md) … デプロイが反映されないとき  
- [CONTRIBUTING.md](../CONTRIBUTING.md) … PR・ブランチ運用
