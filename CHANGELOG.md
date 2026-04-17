# 変更履歴（Changelog）

このプロジェクトの注目すべき変更はこのファイルに記録されます。

## [1.2.23] - 2026-03-28

### 変更（CI / 本番デプロイ）
- **本番（Cloudflare PRD）の自動デプロイ**を **`master` / `main` の push から外し、[GitHub Release の公開](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)時のみ実行**するように変更（[ut-qms / Qraft](https://github.com/junichi-muraoka/ut-qms) と同様の考え方）。検証（`staging` / `develop`）は従来どおり **push でデプロイ**。
- **緊急時**は Actions の **Deploy Cloudflare Pages** を **`master` または `main`** から **Run workflow** すれば本番プロジェクトへデプロイ可能。
- **プレリリース**（Pre-release）は本番 URL を更新しない。

---

## [1.2.22] - 2026-03-28

### 変更
- **本番・検証の自動デプロイを Cloudflare Pages のみに統一**: `deploy-github-pages.yml`（`gh-pages` ブランチへの自動デプロイ）を削除。README・[environments.md](docs/environments.md)・Firebase 手順などを `*.pages.dev` 前提に更新。

### 修正（CI / Cloudflare Pages）
- **Direct Upload** では `wrangler pages deploy` に **`--branch=<Git のブランチ名>`** を付けないと本番扱いにならず、ルート **`https://<プロジェクト>.pages.dev`** が「Nothing is here yet」のままになることがある → ワークフローで付与。
- 併せて、デプロイ直前に Cloudflare **[Pages Update Project](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/edit/) API** で **`production_branch`** を **そのときの Git ブランチ**（`master` / `main` / `staging` / `develop`）に合わせる（ダッシュボードでは Direct Upload プロジェクトは変更しづらいため）。手動 `curl` は不要。

---

## [1.2.21] - 2026-04-03

### 追加
- **`npm run cf:login`** / **`npm run cf:pages:create`**: Cloudflare Pages の空プロジェクト（`jcsqe-study-app` / `jcsqe-study-app-staging`）を Wrangler で作成。ZIP アップロード不要。[docs/cloudflare_pages_setup.md](docs/cloudflare_pages_setup.md) の「3-0」を参照。

---

## [1.2.20] - 2026-04-02

### ドキュメント
- [docs/cloudflare_pages_setup.md](docs/cloudflare_pages_setup.md): Cloudflare Pages（`*.pages.dev`）の初回セットアップを丁寧版に拡充（アカウント ID・API トークン・GitHub Secrets・Firebase 承認済みドメイン・デプロイ確認まで）。**注意事項・やってはいけないこと**（秘密情報・Git 連携の二重化・承認済みドメイン・API キー制限）を追記。[README.md](README.md) / [environments.md](docs/environments.md) からリンク。

---

## [1.2.19] - 2026-03-31

### 追加
- **`scripts/check-no-secrets-in-git.js`**: 追跡ファイルに `AIza…` 形式の API キー等が含まれていないか検査。`npm test`（および CI）で実行し、Firebase 設定の誤コミットを防ぐ。

---

## [1.2.18] - 2026-03-31

### 修正
- **`scripts/write-firebase-config.js`**: `FIREBASE_WEB_CONFIG_JSON` に Firebase コンソールの `const firebaseConfig = { ... };` 形式をそのまま貼れるようにした（従来どおり 1 行 JSON も可）。

---

## [1.2.17] - 2026-03-28

### セキュリティ
- **`js/firebase-config.js`**: リポジトリから実キーを除去しプレースホルダのみを追跡。GitHub Actions の **`FIREBASE_WEB_CONFIG_JSON`** でデプロイ時に注入（[`scripts/write-firebase-config.js`](scripts/write-firebase-config.js)）。**漏洩したキーは Google Cloud コンソールで無効化・回転すること**（手順は [docs/firebase_manual_setup.md](docs/firebase_manual_setup.md)）。

---

## [1.2.16] - 2026-03-28

### 追加
- **GitHub Actions**: [`.github/workflows/deploy-cloudflare-pages.yml`](.github/workflows/deploy-cloudflare-pages.yml) — Cloudflare Pages（`*.pages.dev`）へ `master` / `main`（本番）と `staging` / `develop`（検証）をデプロイ。[ut-qms](https://github.com/junichi-muraoka/ut-qms) に近いブランチ分離と CI デプロイ。

### ドキュメント
- [docs/environments.md](docs/environments.md)、[README.md](README.md)、[docs/firebase_manual_setup.md](docs/firebase_manual_setup.md) に Cloudflare Pages の URL・Secrets・Variables・Firebase 承認済みドメインを追記。

---

## [1.2.15] - 2026-03-30

### 削除
- **Cloudflare D1 同期**（`js/d1-sync.js`、`js/d1-sync-config.js`、`cloudflare/jcsqe-sync-worker/`、GitHub Actions `deploy-jcsqe-sync-worker.yml`、当該ドキュメント）。クラウド同期は **Firebase（Firestore）のみ**とする。
- **npm scripts**: `worker:dev` / `worker:deploy` を削除。

### 修正
- **Service Worker**: `CACHE_NAME` を `jcsqe-v19` に更新。

---

## [1.2.14] - 2026-03-30

### 修正
- **Service Worker**: `firebase-config.js`（および当時存在した `d1-sync-config.js`）をキャッシュしない（常にネットワーク取得）。Firebase 設定を更新しても古いキャッシュで「未設定」のままになる問題を防ぐ。

---

## [1.2.13] - 2026-03-29

### 追加
- **GitHub Actions**: `firestore.rules` を `master` / `main` へマージしたときに Firebase へ自動デプロイ（`FIREBASE_TOKEN` + `FIREBASE_PROJECT_ID` が未設定ならスキップして警告）。手動は Actions の **Firestore rules → Run workflow**。

### ドキュメント
- [docs/firebase_manual_setup.md](docs/firebase_manual_setup.md)、[docs/environments.md](docs/environments.md) に手順を追記。

---

## [1.2.12] - 2026-03-29

### 変更
- **Cloudflare D1 同期**: エンドユーザーに Worker URL / 共有トークンを入力させない。Firebase ID トークンで Worker が認証（`jose`）。運用者は `js/d1-sync-config.js` に Worker のベース URL のみ記載。
- **Worker**: `FIREBASE_PROJECT_ID` を `[vars]` に追加。GitHub Actions に `FIREBASE_PROJECT_ID` secret と `wrangler.toml` 置換ステップを追加。`SYNC_API_SECRET` はレガシー用で任意。

---

## [1.2.11] - 2026-03-29

### 修正
- GitHub Actions「Deploy JCSQE Sync Worker」: Secrets 未設定でデプロイがスキップされたときもジョブが緑になる問題を修正（スキップ時は失敗として分かるようにした）

---

## [1.2.10] - 2026-03-29

### 追加
- **Cloudflare D1 自動同期**: 設定タブで Worker URL とトークンを保存すると、学習データ保存時に D1 へ自動 PUT（`js/d1-sync.js`）
- **GitHub Actions**: `cloudflare/jcsqe-sync-worker/` 変更時に Worker をマイグレーション・デプロイ（[Secrets 設定](docs/jcsqe_cloudflare_d1_sync.md)が必要なときはスキップ）
- **npm scripts**: `worker:dev` / `worker:deploy`

### ドキュメント
- [docs/jcsqe_cloudflare_d1_sync.md](docs/jcsqe_cloudflare_d1_sync.md)、[docs/security.md](docs/security.md)、[cloudflare/jcsqe-sync-worker/README.md](cloudflare/jcsqe-sync-worker/README.md) を更新

---

## [1.2.9] - 2026-03-29

### 追加
- [docs/jcsqe_cloudflare_d1_sync.md](docs/jcsqe_cloudflare_d1_sync.md): ut-qms の D1 とは別インスタンスとする方針の整理
- [cloudflare/jcsqe-sync-worker/](cloudflare/jcsqe-sync-worker/): JCSQE 専用 Cloudflare Worker + D1 用の最小 API（`GET/PUT /api/study`、PoC 用 Bearer + `X-User-Id`）

---

## [1.2.8] - 2026-03-29

### 修正
- **ローカル日付**（[#68](https://github.com/junichi-muraoka/jcsqe-study-app/issues/68)）: ストリーク・日別アクティビティ（ヒートマップ）・今日の5問のシードに `getLocalDateKey()`（ブラウザのローカル暦）を使用。`StudyData.getLocalDateKey` を公開。
- **無効な問題 ID**（[#69](https://github.com/junichi-muraoka/jcsqe-study-app/issues/69)）: `normalizeStudyData` に任意の `validQuestionIds` を渡したとき、`weakIds` / `bookmarks` / `spacedRepetition` をカタログに存在する ID のみに正規化。`storage.js`・インポート・Firebase 同期で `QUESTIONS` に基づき適用。

### 修正（UI）
- 学習計画ジェネレータ用の `#plan-result` が HTML に無く表示されなかったため、ホームタブにカードを追加。

### テスト
- E2E: 学習計画に「試験日」「1日の目安」が出ることを確認。

---

## [1.2.7] - 2026-03-29

### 修正
- 学習計画（\`generateStudyPlan\`）: 試験直前などで残り日数が 0 のとき、1日あたり目標問数が \`Infinity\` になるのを防止

---

## [1.2.6] - 2026-03-29

### その他
- [docs/infrastructure_review.md](docs/infrastructure_review.md): インフラフォローアップ用に Issue [#64](https://github.com/junichi-muraoka/jcsqe-study-app/issues/64)〜[#67](https://github.com/junichi-muraoka/jcsqe-study-app/issues/67) へのリンクを追加

---

## [1.2.5] - 2026-03-29

### 追加
- [docs/infrastructure_review.md](docs/infrastructure_review.md): GitHub Pages・Actions・Firebase・Dependabot などの構成一覧と定期レビュー用チェックリスト

---

## [1.2.4] - 2026-03-29

### 変更
- [docs/08_hybrid_testing_strategy.md](docs/08_hybrid_testing_strategy.md): Playwright MCP の導入状況（未導入・任意）を明記
- [docs/05_future_roadmap.md](docs/05_future_roadmap.md): 問題数 200 問達成・出題数モーダル・フラッシュカードの記述を現状に合わせて更新

### Issue
- [#48](https://github.com/junichi-muraoka/jcsqe-study-app/issues/48) クローズ（glossary 初期化は既に修正済みと確認）
- [#47](https://github.com/junichi-muraoka/jcsqe-study-app/issues/47) クローズ（200 問達成済み）
- [#45](https://github.com/junichi-muraoka/jcsqe-study-app/issues/45) に MCP ステータスをコメント

---

## [1.2.3] - 2026-03-28

### 追加
- **試験メタ・公式リンク**: [docs/exam_meta.md](docs/exam_meta.md)
- **アクセシビリティ方針**: [docs/accessibility.md](docs/accessibility.md)

---

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
