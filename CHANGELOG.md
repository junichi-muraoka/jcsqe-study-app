# 変更履歴（Changelog）

このプロジェクトの注目すべき変更はこのファイルに記録されます。

## [1.2.2] - 2026-03-28

### 追加
- **リリース運用**: [docs/release_process.md](docs/release_process.md)（バージョン・CHANGELOG・PRD/STG との関係）
- **セキュリティ・プライバシー概要**: [docs/security.md](docs/security.md)

---

## [1.2.1] - 2026-03-28

### 追加
- **運用 Runbook**: [docs/runbook.md](docs/runbook.md)（デプロイ不具合・Firebase 確認）
- **コンテンツ編集ガイド**: [docs/content_authoring.md](docs/content_authoring.md)（問題・解説・validate ルール）

### その他
- ドキュメント追加提案を Issue [#58](https://github.com/junichi-muraoka/jcsqe-study-app/issues/58)〜[#63](https://github.com/junichi-muraoka/jcsqe-study-app/issues/63) として起票

---

## [1.2.0] - 2026-03-28

### 追加
- **本番・検証デプロイ**: GitHub Actions（`deploy-github-pages.yml`）と `gh-pages` ブランチで **PRD**（`master` → ルート）と **STG**（`staging` → `/staging/`）を配信
- **`staging` ブランチ**と GitHub Environments（`production` / `staging`）の参照

### ドキュメント
- [environments.md](docs/environments.md)、[01_architecture.md](docs/01_architecture.md)、[06_development_workflow.md](docs/06_development_workflow.md)、[CONTRIBUTING.md](CONTRIBUTING.md)、[README.md](README.md)、[firebase_manual_setup.md](docs/firebase_manual_setup.md)、[09_cloud_sync_firebase_spec.md](docs/09_cloud_sync_firebase_spec.md) に上記の運用を反映

---

## [1.1.0] - 2026-03-10

### 追加
- **問題51-127の選択肢別解説**: 全127問で選択肢別の正解・不正解理由とSQuBOK参照を表示
- **問題128-200の選択肢別解説**: `explanations_exp3.js` で EXP3 にマージ（計200問）
- **データ整合性チェックCI**: PR時に問題・解説データの整合性を自動検証（`scripts/validate-questions.js`）
- **機能リクエストIssueテンプレート**: 新機能・改善提案用のテンプレート
- **自動テスト計画**: `docs/07_automated_testing_plan.md` にIssue・PR自動テストの計画を記載
- **E2Eテスト**: Playwrightによるホーム表示・クイズ開始・解説表示・模擬試験タイマーの動作確認
- **出題数モーダル**（分野別・弱点・間隔反復など）
- 問題データを **73問** 拡充（計 **200問**）。各章 **40問** となるよう配分（`questions_extra4.js`）

### 変更
- `explanations_extra.js` を新規追加（問題51-127の解説）
- `explanations.js` のマージロジックを EXP3 対応に更新
- PWAキャッシュに `explanations_extra.js` を追加

---

## [1.0.0] - 2026-03-10

### 🎉 初回リリース

#### Phase 1
- 試験情報パネル（次回試験日・申込期限・カウントダウン）
- PWA化（Service Worker、オフライン対応）
- ライトモード・テーマ切り替え
- キーボードショートカット
- 学習データのエクスポート/インポート

#### Phase 2
- 間隔反復（SM2ベース）モード
- 模擬試験履歴・合格判定
- 成績ダッシュボード（リングチャート、ヒートマップ）
- 用語集
- 合格予測スコア
- 苦手分析・学習計画
- 印刷用まとめ

#### Phase 3
- 難易度タグ（L1/L2/L3）表示
- 章別学習ガイド
- 実績バッジ
- ストリーク（連続学習日数）
- ブックマーク
- 紙吹雪コンボ演出
- デイリーチャレンジ（今日の5問）
- レベルXPシステム

#### UI v2
- ダッシュボード刷新
- テーマ機能（ダーク/ライト）

#### 基本機能
- 分野別学習モード（SQuBOK全5章対応）
- 弱点克服モード（間違えた問題を優先出題）
- 模擬試験モード（40問・60分タイマー付き）
- 127問の4択問題（知識レベルL1〜L3）
- 選択肢別解説（✅正解理由 / ❌不正解理由 / 📖SQuBOK参照）
- ダークモード・グラスモーフィズムUI
- localStorageによる学習データ永続化
- レスポンシブデザイン（モバイル対応）
- GitHub Pages公開
