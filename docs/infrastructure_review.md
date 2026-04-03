# インフラ・運用の見直しガイド

本リポジトリの **ホスティング・CI・外部サービス** を定期的に点検するときの、**構成一覧**と**チェックリスト**です。手順の詳細は [runbook.md](./runbook.md)・[environments.md](./environments.md) を参照する。

---

## 1. 構成一覧（棚卸し）

### 1.1 GitHub（リポジトリ）

| 領域 | 現状の実装 | 見直しメモ |
|------|------------|------------|
| **ソースの正** | `master`（本番用マージ先）、`staging`（検証） | Branch protection（PR 必須・必須チェック）は [CONTRIBUTING.md](../CONTRIBUTING.md) 推奨どおりか |
| **公開サイト** | Cloudflare Pages（`*.pages.dev`）、[deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) | Secrets・Variables・デプロイ履歴が期待どおりか |
| **Dependabot** | [`.github/dependabot.yml`](../.github/dependabot.yml) … npm / actions とも **monthly** | PR 上限 5。セキュリティパッチが急ぎなら `interval` や手動アップデートを検討 |
| **Issue / PR** | テンプレあり | 運用に合わせてテンプレ更新 |

### 1.2 GitHub Actions（ワークフロー）

| ファイル | トリガー（概要） | 見直しメモ |
|----------|------------------|------------|
| [test.yml](../.github/workflows/test.yml) | `master` / `staging` の push、PR→master | Node バージョン（22）と `npm test` の整合 |
| [e2e.yml](../.github/workflows/e2e.yml) | 同上（パスフィルタあり） | Playwright / Chromium、失敗時のリグレッション Issue（`master` のみ） |
| [deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) | `master` / `main` / `staging` / `develop` の push、`workflow_dispatch` | Wrangler・Cloudflare API（`production_branch` 同期） |
| [deploy-pages.yml](../.github/workflows/deploy-pages.yml) | 手動のみ（レガシー） | **未使用なら**ワークフロー削除 or README に「使わない」と明記で混乱防止 |
| [docs_check.yml](../.github/workflows/docs_check.yml) | PR→master | アプリ変更時の docs 同時更新 |
| [validate_questions.yml](../.github/workflows/validate_questions.yml) | 問題・解説変更 PR | `validate-questions.js` |
| [validate_issue.yml](../.github/workflows/validate_issue.yml) | Issue | テンプレ必須項目 |
| [firestore-rules.yml](../.github/workflows/firestore-rules.yml) | `firestore.rules` / `firebase.json` 変更 | 構文レベルの検証のみ（Firebase へのデプロイは別） |

### 1.3 Firebase（任意機能）

| 項目 | 現状 | 見直しメモ |
|------|------|------------|
| **プロジェクト** | [environments.md](./environments.md) では ID **未記載**（プレースホルダ） | 本番／STG で分けるか、同一プロジェクトか方針を決めコンソールと表を一致させる |
| **ルール** | `firestore.rules`、上記 CI で軽い検証 | ルール変更時は Firebase コンソールまたは `firebase deploy` と同期しているか |
| **認証** | Google、承認済みドメイン | [firebase_manual_setup.md](./firebase_manual_setup.md) のフェーズ E |

### 1.4 クライアント配信・キャッシュ

| 項目 | 現状 | 見直しメモ |
|------|------|------------|
| **PWA** | `sw.js`、`manifest.json` | キャッシュバージョン更新忘れ、アセット一覧の抜け（[05_future_roadmap.md](./05_future_roadmap.md) の PWA 強化） |
| **CDN** | Cloudflare Pages 標準 | カスタムドメインや前段プロキシを入れる場合は DNS・HTTPS の別途整理 |

---

## 2. 定期レビュー・チェックリスト（提案）

**四半期ごと、または大きな機能追加のたび**に目を通す。

- [ ] **Cloudflare Pages**: 本番・STG の `*.pages.dev` が期待どおり開く
- [ ] **Actions**: 直近の `Deploy Cloudflare Pages` / `test` / `e2e` が緑（失敗があれば [runbook.md](./runbook.md)）
- [ ] **Dependabot**: 未マージの PR の有無、重大なセキュリティアラート
- [ ] **Firebase**（利用中の場合）: クォータ、承認済みドメイン、ルールが意図どおりか
- [ ] **ブランチ保護**: `master` の必須チェックがチーム運用と一致しているか
- [ ] **Secrets / Environments**: GitHub Environments にシークレットを置く運用にした場合、権限とローテーション
- [ ] **レガシー** `deploy-pages.yml`: 削除またはドキュメント上で「非推奨」と固定

---

## 3. 「未見直し」になりやすいポイント（優先度高め）

1. **`deploy-pages.yml`（レガシー手動）** … 使わないなら削除またはドキュメントで「非推奨」と固定。  
2. **Firebase プロジェクト ID が environments に空** … 利用開始時に表を更新。  
3. **Actions の Node / Playwright のバージョン** … `package.json` / ワークフロー内の `node-version` のずれ。  
4. **STG で Firebase を試す** … 本番と検証で `*.pages.dev` のホストが別。承認済みドメインを両方入れる。  
5. **Cloudflare API トークン** … `CLOUDFLARE_API_TOKEN` の権限・有効期限。

---

## 4. 関連ドキュメント

| ドキュメント | 内容 |
|--------------|------|
| [environments.md](./environments.md) | URL・ブランチ・Firebase 表 |
| [runbook.md](./runbook.md) | 障害時の確認順 |
| [release_process.md](./release_process.md) | バージョン・CHANGELOG |
| [security.md](./security.md) | データ・公開リポの注意 |
| [08_hybrid_testing_strategy.md](./08_hybrid_testing_strategy.md) | E2E と Playwright MCP（任意） |

---

## 5. 追跡用 Issue（フォローアップ）

上記「3. 『未見直し』になりやすいポイント」の具体化として、次を起票済み。

| Issue | 内容 |
|-------|------|
| [#64](https://github.com/junichi-muraoka/jcsqe-study-app/issues/64) | `environments.md` の Firebase プロジェクト ID・STG/PRD 方針 |
| [#65](https://github.com/junichi-muraoka/jcsqe-study-app/issues/65) | リポジトリ設定の確認（Pages・ブランチ保護・Dependabot 等） |
| [#66](https://github.com/junichi-muraoka/jcsqe-study-app/issues/66) | レガシー `deploy-pages.yml` の整理 |
| [#67](https://github.com/junichi-muraoka/jcsqe-study-app/issues/67) | Actions の Node / Playwright と `package.json` の整合 |
