# 運用 Runbook（デプロイ・障害時）

> **関連 Issue**: [#58](https://github.com/junichi-muraoka/jcsqe-study-app/issues/58)  
> 本番（PRD）・検証（STG）の仕組みの詳細は [environments.md](./environments.md) を参照する。

## 1. ざっくり整理

| 症状 | まず見る場所 |
|------|----------------|
| サイトが古い／変わらない | [2. デプロイが反映されない](#2-デプロイが反映されない) |
| Actions が赤い | [3. GitHub Actions が失敗](#3-github-actions-が失敗) |
| Firebase ログインだけ失敗 | [4. Firebase・クラウド同期](#4-firebaseクラウド同期) |

## 2. デプロイが反映されない

### 2.1 確認順（PRD / STG 共通）

1. **本番** … **`master` にマージしただけでは本番 URL は更新されない**。**GitHub Release を Publish** したあと、[deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) が動いたか。または **Run workflow** を `master` で実行したか。  
2. **検証** … **`staging` / `develop` に push** があったか。  
3. **Actions** → **Deploy Cloudflare Pages** が **成功**しているか。ログに **Align Cloudflare Pages production branch** と **wrangler pages deploy** が通っているか。

### 2.2 本番だけ古い／STG だけ古い

- **本番（`jcsqe-study-app.pages.dev`）だけ古い** → `master` の push と **Deploy Cloudflare Pages** の成功を確認。Cloudflare ダッシュボードの **デプロイ履歴**も参照。
- **STG（`jcsqe-study-app-staging.pages.dev`）だけ古い** → `staging` または `develop` の push と同ワークフロー成功を確認。

### 2.3 ロールバックの考え方

- **アプリ内容**を戻す: 通常は **Git で該当ブランチを以前のコミットに戻して push** し、デプロイを再実行させる。

## 3. GitHub Actions が失敗

1. 失敗したジョブの **ログ**を開く（どのステップか: `npm test` / **Align Cloudflare Pages production branch** / **wrangler** 等）。
2. **`npm test` で落ちている** → ローカルで `npm test` を実行し、問題データ・解説の整合性を直す（[content_authoring.md](./content_authoring.md)）。
3. **Cloudflare の PATCH や `pages deploy` で落ちている** → API トークン権限・`CLOUDFLARE_ACCOUNT_ID`・プロジェクト名（Variables）を確認。数分待って **Re-run jobs** も試す。

## 4. Firebase・クラウド同期

前提: [firebase_manual_setup.md](./firebase_manual_setup.md)、仕様は [09_cloud_sync_firebase_spec.md](./09_cloud_sync_firebase_spec.md)。

| 症状 | 確認 |
|------|------|
| **ログインポップアップがブロック／すぐ閉じる** | Firebase Console → Authentication → 設定 → **承認済みドメイン**に、開いている **`*.pages.dev` のホスト**があるか（本番と検証でホストが別）。 |
| **STG だけログインできない** | **承認済みドメイン**に検証用の `*.pages.dev`（例: `jcsqe-study-app-staging.pages.dev`）を入れたか。本番とホストが別。 |
| **同期エラー表示** | トースト文言と `js/sync-firebase-errors.js` のコード。クォータ・オフラインは [09](./09_cloud_sync_firebase_spec.md) の表を参照。 |
| **ローカルでは動くが Pages だけ失敗** | 承認済みドメイン、`js/firebase-config.js` の設定値、ブラウザ拡張（広告ブロック等）。 |
| **`getProjectConfig` 403 / ポップアップ「The requested action is invalid.」** | ① Firebase **承認済みドメイン**に開いている `*.pages.dev` と `*.firebaseapp.com` 相当があるか ② **GCP の Browser キー**で、アプリが使っている **`apiKey` と同じキー**に HTTP リファラー制限（本番・STG・`*.firebaseapp.com` 等）と API 制限（Identity Toolkit / Token Service）があるか ③ **Secret 変更後**は PRD/STG それぞれ **再デプロイ**したか（STG は自動では追従しない）。詳細は [firebase_manual_setup.md](./firebase_manual_setup.md)。 |

## 5. 連絡・起票

- 再現手順が揃っているなら **[Bug] Issue**（`.github/ISSUE_TEMPLATE/bug_report.md`）を推奨。
- CI の恒久的な失敗は **ログ URL** を本文に貼る。
