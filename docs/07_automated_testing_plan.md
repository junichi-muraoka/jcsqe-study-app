# Issue・PR 自動テスト・自動チェック計画

> **関連 Issue**: [#44](https://github.com/junichi-muraoka/jcsqe-study-app/issues/44)

本ドキュメントは、Issue や Pull Request に対して自動テスト・自動チェックを導入する際の計画をまとめたものです。期限は設けず、優先度に応じて段階的に導入します。

---

## 1. データ整合性チェック（優先度高）✅ 実装済み

`questions.js` と `explanations.js` の整合性を PR 時に検証します。

### チェック内容
- 全問題に `explanation` フィールドが存在する
- EXP/EXP2 のエントリがある場合、選択肢別解説（d）が 4 つである
- `answer` が 0〜3 の範囲
- `chapter` が 1〜5
- `level` が L1/L2/L3
- ID の重複がない

### トリガー
PR で `questions*.js` または `explanations.js` が変更されたとき

### 実装
- **スクリプト**: `scripts/validate-questions.js`
- **ワークフロー**: `.github/workflows/validate_questions.yml`

---

## 2. Issue 作成時のバリデーション ✅ 実装済み

Issue 作成時にテンプレートの必須項目が埋まっているかチェックします。

| テンプレート       | チェック内容                         |
|--------------------|--------------------------------------|
| bug_report         | 再現手順に 3 ステップ以上、環境情報あり |
| question_request   | 対象の章が指定されている             |
| feature_request    | 提案内容が記入されている             |

### トリガー
`issues: opened`, `issues: edited`

### 実装
- **スクリプト**: `scripts/validate-issue.js`
- **ワークフロー**: `.github/workflows/validate_issue.yml`
- バリデーション失敗時、Issue にコメントで案内

---

## 3. PR と Issue の連携

- PR に `Closes #123` が含まれている → マージ時に Issue #123 を自動クローズ（GitHub 標準機能）
- PR が Issue を参照している → ラベル付与やステータス更新

---

## 4. E2E テスト（アプリの動作確認）✅ 実装済み

Playwright でブラウザ操作を自動化します。

### テスト例
- ホーム画面が表示される
- 「今日の 5 問」をクリック → クイズ開始
- 1 問解答 → 解説が表示される
- 模擬試験モードでタイマーが表示される

### トリガー
PR で `index.html`, `app.js`, `style.css`, `questions*.js`, `explanations*.js` が変更されたとき

### 実装
- **テスト**: `tests/e2e.spec.js`
- **設定**: `playwright.config.js`
- **ワークフロー**: `.github/workflows/e2e.yml`

---

## 5. 問題追加リクエスト用のフォーマット検証

`question_request` で問題文を貼り付けた場合、その形式を検証します。

### トリガー
Issue 作成時、または PR で問題データを追加したとき

---

## 導入の優先順位

| 順位 | 内容                         | 工数 | 効果                           |
|------|------------------------------|------|--------------------------------|
| 1    | データ整合性チェック         | 小   | 問題・解説の不整合を防げる     |
| 2    | PR マージ時の Issue 自動クローズ | 小   | 運用が楽になる                 |
| 3    | Issue 作成時のバリデーション | 中   | 不完全な Issue を減らせる      |
| 4    | E2E テスト                   | 大   | リグレッションを防げる         |

**おすすめ**: まずは「1. データ整合性チェック」から着手。既存の `docs_check.yml` と同様のワークフローで、問題・解説ファイルの変更時のみ実行する形にできる。

---

## 補足：この計画でカバーしきれないもの

上記の計画は「Issue・PR 周りの自動化」に焦点を当てたものです。より完璧を目指す場合、以下も検討の余地があります。

| 項目                 | 説明                                           |
|----------------------|------------------------------------------------|
| ユニットテスト       | `app.js` のロジック（スコア計算、状態遷移等）を個別にテスト |
| アクセシビリティ     | a11y チェック（キーボード操作、スクリーンリーダー対応） |
| パフォーマンス       | Lighthouse 等でのスコア監視                    |
| 依存関係の脆弱性     | npm パッケージのセキュリティスキャン（現状は依存なし） |
| クロスブラウザ       | Chrome / Firefox / Safari での動作確認         |

現状の Vanilla JS・依存ゼロの構成では、まずはデータ整合性と E2E で十分な効果が得られます。必要に応じて段階的に拡張するのが現実的です。

---

## Playwright × Playwright MCP ハイブリッド構成

Playwright（CI用）と Playwright MCP（AI駆動）の両方のメリットを活かす構成案は [08_hybrid_testing_strategy.md](08_hybrid_testing_strategy.md) にまとめています。
