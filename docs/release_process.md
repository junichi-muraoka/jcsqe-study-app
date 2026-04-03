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

| 操作 | 公開への影響 |
|------|----------------|
| `master` / `main` にマージ・プッシュ | [deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) が **本番** `*.pages.dev` を更新する |
| `staging` / `develop` にプッシュ | 同ワークフローが **検証**用 `*.pages.dev` を更新する |

- **`master` だけ更新しても検証 URL は自動では追従しない**。本番と検証を同じコミットに揃えたいときは、`staging`（や `develop`）に **`master` を取り込んで push** するなど、運用で明示的に更新する（[environments.md](./environments.md) の「PRD と STG の中身を揃えたいとき」）。
- **バージョンを上げたコミット**が `master` に入れば、そのタイミングで本番サイトの中身は新しくなる。
- **Git タグ**（例: `v1.2.2`）の付与は任意。付ける場合は `master` の該当コミットに対して行い、リリースノートに CHANGELOG の該当節をコピーしてもよい。

## 4. リリース前の最低チェック（推奨）

1. `npm test` が通ること  
2. 問題・解説を触った場合は `npm run validate`（または `npm test` に含まれる整合性チェック）  
3. デプロイ後は [environments.md](./environments.md) の URL で本番・STG を目視確認（必要なら）

## 5. 関連ドキュメント

- [environments.md](./environments.md) … URL・Pages 設定  
- [runbook.md](./runbook.md) … デプロイが反映されないとき  
- [CONTRIBUTING.md](../CONTRIBUTING.md) … PR・ブランチ運用
