# 🎓 JCSQE初級 合格対策学習アプリ

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Pages PRD](https://img.shields.io/badge/Demo-PRD%20%28GitHub%20Pages%29-brightgreen)](https://junichi-muraoka.github.io/jcsqe-study-app/)
[![STG](https://img.shields.io/badge/Demo-STG%20%28GitHub%20Pages%29-blue)](https://junichi-muraoka.github.io/jcsqe-study-app/staging/)
[![Questions](https://img.shields.io/badge/収録問題数-200問-orange)]()

> **SQuBOK Guide 第3版**に準拠した、JCSQE初級（ソフトウェア品質技術者資格試験）合格を目指す実践型学習Webアプリです。

---

## ✨ 特徴

| 機能 | 説明 |
|------|------|
| 📚 **分野別学習** | SQuBOK全5章から章ごとに問題を出題。即座に解説を表示 |
| 🔄 **弱点克服** | 間違えた問題を自動記録し、優先的に出題。正解すると弱点リストから除外 |
| 🎯 **模擬試験** | 本番と同じ40問・60分のタイマー付き模擬試験 |
| 📊 **成績ダッシュボード** | 章別正答率・学習進捗・弱点一覧を可視化 |
| 💡 **選択肢別解説** | 各問題の正解理由・不正解理由をSQuBOK参照付きで詳細解説 |

## 📖 対応範囲（SQuBOK Guide 第3版）

| 章 | テーマ | 問題数 |
|----|--------|--------|
| 第1章 | ソフトウェア品質の基本概念 | 40問 |
| 第2章 | ソフトウェア品質マネジメント | 40問 |
| 第3章 | ソフトウェア品質技術 | 40問 |
| 第4章 | 専門的なソフトウェア品質の概念と技術 | 40問 |
| 第5章 | ソフトウェア品質の応用領域 | 40問 |

## 🚀 使い方

### オンライン（GitHub Pages）

| 環境 | URL | 更新のしかた |
|------|-----|----------------|
| **本番（PRD）** | [junichi-muraoka.github.io/jcsqe-study-app/](https://junichi-muraoka.github.io/jcsqe-study-app/) | `master` へマージ・プッシュ |
| **検証（STG）** | […/jcsqe-study-app/staging/](https://junichi-muraoka.github.io/jcsqe-study-app/staging/) | `staging` ブランチへプッシュ |

デプロイの仕組み・Pages の初回設定は [docs/environments.md](docs/environments.md) を参照。

ブラウザでアクセスするだけですぐに学習を開始できます。

### ローカル
```bash
git clone https://github.com/junichi-muraoka/jcsqe-study-app.git
cd jcsqe-study-app
npm test
# 方法1: ブラウザで直接開く
open index.html

# 方法2: ローカルサーバーで起動
npx http-server ./ -p 8080 -o
```

## 🛠️ 技術スタック

- **HTML5** — セマンティック構造
- **CSS3** — ダークモード・グラスモーフィズムデザイン
- **Vanilla JavaScript** — フレームワーク不使用、軽量動作
- **localStorage** — 学習データの永続化（サーバー不要）
- **Firebase（任意）** — Google ログインと Firestore への学習データ同期。[`js/firebase-config.js`](js/firebase-config.js) に Firebase コンソールの Web 設定を入れると有効（未設定でも従来どおりオフライン動作）

### Firebase を有効にする手順（概要）

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成し、**Authentication（Google）** と **Cloud Firestore** を有効化する。
2. プロジェクト設定から Web アプリ用の設定オブジェクトをコピーし、`js/firebase-config.js` の `firebaseConfig` に貼り付ける（テンプレは [`js/firebase-config.example.js`](js/firebase-config.example.js)）。
3. `firestore.rules` をデプロイする（`firebase deploy --only firestore:rules` またはコンソールでルール設定）。
4. 認証ドメインに GitHub Pages のホストを **承認済みドメイン**に追加する（`user.github.io` は本番・STG 共通。**パス** `/staging/` は同一オリジン内のためホスト追加は不要）。手順は [docs/firebase_manual_setup.md](docs/firebase_manual_setup.md)。

**画面操作を順番に追う手順**は [docs/firebase_manual_setup.md](docs/firebase_manual_setup.md) を参照。仕様・エラー UX は [docs/09_cloud_sync_firebase_spec.md](docs/09_cloud_sync_firebase_spec.md)。

## 📝 JCSQE試験について

| 項目 | 内容 |
|------|------|
| 正式名称 | ソフトウェア品質技術者資格認定（初級） |
| 主催 | 日本科学技術連盟（JUSE） |
| 出題数 | 40問（4択） |
| 試験時間 | 60分 |
| 合格ライン | 約70%（28問正解） |
| 出題範囲 | SQuBOK Guide 第3版 |
| 知識レベル | L1（知っている）〜 L3（概念と使い方がわかる） |

## 🤝 コントリビューション

問題の追加・修正、機能改善のプルリクエストを歓迎します！

詳しくは [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

## 📚 ドキュメント (Documentation)

開発者向けの技術的な仕様や将来のロードマップについては、`docs/` フォルダ内の以下のドキュメントを参照してください。

- [システムアーキテクチャ (01_architecture.md)](docs/01_architecture.md)
- [データモデル・保存仕様 (02_data_model.md)](docs/02_data_model.md)
- [機能仕様書 (03_features.md)](docs/03_features.md)
- [UI設計・デザイン仕様 (04_ui_design.md)](docs/04_ui_design.md)
- [将来の拡張ロードマップ (05_future_roadmap.md)](docs/05_future_roadmap.md)
- [開発・ドキュメント管理ワークフロー (06_development_workflow.md)](docs/06_development_workflow.md)（CI・**本番/検証デプロイ**）
- [クラウド同期・Firebase 制限とエラー UX (09_cloud_sync_firebase_spec.md)](docs/09_cloud_sync_firebase_spec.md)
- [Firebase 手動セットアップ手順（コンソール・CLI）(firebase_manual_setup.md)](docs/firebase_manual_setup.md)
- [実行環境一覧（本番・検証・Firebase）(environments.md)](docs/environments.md)
- [運用 Runbook（デプロイ・障害時）(runbook.md)](docs/runbook.md)
- [コンテンツ編集ガイド（問題・解説）(content_authoring.md)](docs/content_authoring.md)
- [リリース運用（バージョン・CHANGELOG）(release_process.md)](docs/release_process.md)
- [セキュリティ・プライバシー概要 (security.md)](docs/security.md)

## 📄 ライセンス

[MIT License](LICENSE) © 2026 junichi-muraoka

## ⚠️ 免責事項

本アプリは試験対策の学習支援を目的として作成されたものです。収録問題は公式の過去問ではなく、SQuBOK Guide 第3版の内容に基づいて独自に作成したものです。試験の合格を保証するものではありません。
