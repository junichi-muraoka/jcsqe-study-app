# 運用 Runbook（デプロイ・障害時）

> **関連 Issue**: [#58](https://github.com/junichi-muraoka/jcsqe-study-app/issues/58)  
> 本番（PRD）・検証（STG）の仕組みの詳細は [environments.md](./environments.md) を参照する。

## 1. ざっくり整理

| 症状 | まず見る場所 |
|------|----------------|
| サイトが古い／変わらない | [§2 デプロイが反映されない](#2-デプロイが反映されない) |
| Actions が赤い | [§3 GitHub Actions が失敗](#3-github-actions-が失敗) |
| Firebase ログインだけ失敗 | [§4 Firebase・クラウド同期](#4-firebaseクラウド同期) |

## 2. デプロイが反映されない

### 2.1 確認順（PRD / STG 共通）

1. **該当ブランチにコミットが乗っているか**  
   - 本番: `master`  
   - 検証: `staging`
2. **Actions** → **Deploy GitHub Pages (STG / PRD)** が **成功**しているか（最新の実行）。
3. **リポジトリ Settings → Pages**  
   - **Branch** が **`gh-pages`**、**Folder** が **`/ (root)`** であること。  
   - `master` 直指定のままだと、ワークフローが更新する `gh-pages` と公開ソースがずれる。

### 2.2 本番だけ古い／STG だけ古い

- **本番（ルート）だけ古い** → `master` の push と、その後の **Deploy** ワークフロー成功を確認。`gh-pages` のルートに `index.html` 等が載っているか（ブランチを GitHub 上で開く）。
- **STG（`/staging/`）だけ古い** → `staging` ブランチの push と Deploy 成功を確認。`gh-pages` ブランチに **`staging/`** ディレクトリがあるか。

### 2.3 ロールバックの考え方

- **アプリ内容**を戻す: 通常は **Git で `master`（または `staging`）を以前のコミットに戻して push** し、デプロイを再実行させる。
- **`gh-pages` ブランチを手で編集**するのは、Actions と競合しやすいので非推奨（緊急時のみ）。

## 3. GitHub Actions が失敗

1. 失敗したジョブの **ログ**を開く（どのステップか: `npm test` / `peaceiris` / その他）。
2. **`npm test` で落ちている** → ローカルで `npm test` を実行し、問題データ・解説の整合性を直す（[content_authoring.md](./content_authoring.md)）。
3. **`Deploy to gh-pages` で落ちている** → ログ全文を確認。`peaceiris`・権限・ブランチ競合が多い。数分待って **Re-run jobs** も試す。
4. **並行デプロイ**は `concurrency` で直列化されているが、まれに `gh-pages` の競合が起きる場合は再実行。

## 4. Firebase・クラウド同期

前提: [firebase_manual_setup.md](./firebase_manual_setup.md)、仕様は [09_cloud_sync_firebase_spec.md](./09_cloud_sync_firebase_spec.md)。

| 症状 | 確認 |
|------|------|
| **ログインポップアップがブロック／すぐ閉じる** | Firebase Console → Authentication → 設定 → **承認済みドメイン**に `junichi-muraoka.github.io` があるか（PRD・STG は同一ホスト）。 |
| **STG だけログインできない** | 通常はホストは同じため、本番と同じ設定でよい。ブラウザの **別オリジン扱い**（誤った URL）で開いていないか確認。 |
| **同期エラー表示** | トースト文言と `js/sync-firebase-errors.js` のコード。クォータ・オフラインは [09](./09_cloud_sync_firebase_spec.md) の表を参照。 |
| **ローカルでは動くが Pages だけ失敗** | 承認済みドメイン、`js/firebase-config.js` の設定値、ブラウザ拡張（広告ブロック等）。 |

## 5. 連絡・起票

- 再現手順が揃っているなら **[Bug] Issue**（`.github/ISSUE_TEMPLATE/bug_report.md`）を推奨。
- CI の恒久的な失敗は **ログ URL** を本文に貼る。
