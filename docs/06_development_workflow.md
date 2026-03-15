# 開発・ドキュメント管理ワークフロー (Development Workflow)

本プロジェクトでは、持続可能な開発とドキュメントの鮮度を保つために、**GitHub Actions (CI)** と **AIエージェント** を組み合わせた自動化ワークフローを導入しています。

## 1. ドキュメント更新忘れ防止CI (GitHub Actions)

アプリケーションの仕様を変えたにも関わらず、設計書や仕様書の更新が追いついていない「ドキュメントの陳腐化」を防ぎます。

- **ファイル**: `.github/workflows/docs_check.yml`
- **トリガー**: `master` ブランチに対する Pull Request の作成・更新時
- **仕組み**:
  1. `app.js` や `index.html`, `style.css` などのアプリ本体コードに変更があったかを検知。
  2. 同時に `docs/` ディレクトリ内や `README.md` に変更があったかを検知。
  3. **「コードが変更されたのに、ドキュメントが一切変更されていない」** 場合、CIが「エラー（❌）」となり、Pull Request のマージをブロック（または警告）します。

## 2. テストCI (GitHub Actions)

軽量な回帰テストを `node:test` で実行し、データ移行やインポート検証など壊れやすいロジックの退行を防ぎます。

- **ファイル**: `.github/workflows/test.yml`
- **トリガー**: `master` への push / Pull Request
- **実行内容**:
  1. Node.js 22 をセットアップ
  2. `npm test` を実行
  3. `tests/` 配下のテストをまとめて検証

ローカルでも以下で同じテストを実行できます。

```bash
npm test
```

## 3. AIエージェントによる自動ドキュメント更新

CIが落とされた（あるいは更新が必要だと気付いた）場合、人間が手動でドキュメントを直す手間を省くため、AIアシスタント（Antigravity等）に更新を代行させるためのカスタム手順書を用意しています。

- **ファイル**: `.agents/workflows/update_docs.md`
- **特徴**: リポジトリ内にAI専用の「指示書（プロンプト）」を配置しておくことで、AIが現在のプロジェクトの文脈や差分を正確に読み取り、自律的にドキュメントを更新します。
- **使い方**:
  開発・改修作業が一段落したタイミングで、AIチャット画面にて以下のように指示を出します。
  > `/update_docs ワークフローを実行して`
  > （または：「最新のコミット差分を見て、docs/ 内のドキュメントを最新化してコミットして」）

  すると、AIが以下のステップを自動実行します。
  1. `git diff` で直近のコード変更箇所を特定。
  2. `01` から `05` までの各ドキュメント（アーキテクチャ、データモデル、機能仕様など）を読み込み、影響範囲を推論。
  3. 必要なファイル群を自動で編集・上書き。
  4. 変更を `git commit` し、ドキュメント更新を完了させる。

## 3. データ整合性チェック（問題・解説）

問題データ（`questions*.js`）と解説データ（`explanations.js`）の整合性を PR 時に自動検証します。

- **ファイル**: `.github/workflows/validate_questions.yml`
- **トリガー**: `questions*.js` または `explanations.js` が変更された PR
- **スクリプト**: `scripts/validate-questions.js`

詳細な計画は [07_automated_testing_plan.md](07_automated_testing_plan.md) を参照してください。

## 4. E2E テスト（Playwright）

PR でアプリ本体が変更されたとき、Playwright による E2E テストが自動実行されます。

- **ファイル**: `.github/workflows/e2e.yml`
- **テスト**: `tests/e2e.spec.js`
- **Playwright MCP との連携**: [08_hybrid_testing_strategy.md](08_hybrid_testing_strategy.md) にハイブリッド構成案を記載

## 5. Issue 作成時のバリデーション

Issue 作成・編集時に、テンプレートの必須項目が埋まっているか自動チェックします。

- **ファイル**: `.github/workflows/validate_issue.yml`
- **スクリプト**: `scripts/validate-issue.js`
- **対象**: [Bug] 再現手順・環境、[Question] 対象の章、[Feature] 提案内容

## 6. まとめ：理想的な開発サイクル

1. **開発**: 開発者がコードを書き、新しい機能を追加する。
2. **AI更新**: AIに `/update_docs` を指示し、ドキュメントの追従を任せる。
3. **テスト実行**: `npm test` と GitHub Actions で回帰がないことを確認する。
4. **（任意）テスト生成**: Playwright MCP で AI にテストコード生成を依頼し、`tests/` に追加。
5. **PR作成**: GitHubにプッシュしPull Requestを作成する。
6. **CI通過**: GitHub Actions がテストとドキュメント更新を確認し、グリーン（✅）になる。
7. **マージ**: 安心して `master` へ取り込む。

この仕組みにより、開発スピードを落とさずに常に最新の設計書・仕様書を維持することができます。
