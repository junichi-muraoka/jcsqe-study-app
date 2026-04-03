# システムアーキテクチャ・構成

## 1. 全体概要
本アプリケーション（JCSQE初級 合格対策アプリ）は、フロントエンドのみで完結する**SPA（Single Page Application）**として構築されています。
バックエンドサーバーやデータベースを持たず、静的ファイル（HTML/CSS/JS）のみで動作するため、GitHub Pages等でのホスティングに最適化されています。

## 2. ディレクトリ構成
```text
/app
 ├── index.html        ... メインのHTMLファイル（全画面のDOMを内包）
 ├── style.css         ... 全スタイリング（CSS変数、レスポンシブメディアクエリ含む）
 ├── app.js            ... アプリケーションのメインロジック（画面遷移、状態管理、機能実装）
 ├── questions.js      ... 問題データ（ID, 問題文, 選択肢, 正答）と章リスト
 ├── questions_extra1.js … questions_extra4.js … 追加問題（`QUESTIONS.push` でマージ）
 ├── glossary.js       ... 用語集データ
 ├── explanations.js   ... 選択肢別解説 EXP / EXP2 と `QUESTIONS` へのマージ処理
 ├── explanations_exp3.js … 追加問題（id 128〜）の選択肢別解説 EXP3（`explanations.js` より先に読込）
 ├── sw.js             ... ServiceWorker（PWA・オフライン対応用）
 └── manifest.json     ... PWA用マニフェストファイル
```

## 3. UIアーキテクチャ (UI v3)
### 画面遷移モデル
1つの `index.html` の中に複数の `.screen` クラスを持つ div 要素（各種タブ、設定画面、クイズ画面、結果画面）が存在し、`app.js` の `showScreen()` と `switchTab()` によって `display: none / block` (`active` クラス) が切り替わる仕組みです。

- **タブ画面**: `div.app` 内の `.tab-screen`（ホーム、用語集、成績、設定）
- **フルスクリーンオーバーレイ**: `#quiz` と `#result` は `body` の直下に配置し、サイドバー（`z-index: 99999`）より上（`z-index: 200000`）で表示される。`.app` の子にするとスタッキングコンテキストの影響でサイドバーに隠れるため、`body` 直下に分離している。

### レスポンシブナビゲーション
- **デスクトップ幅 (`>= 768px`)**:
  - 画面左側に幅固定（`--sidebar-width`）のサイドバーナビゲーションを配置。
  - コンテンツエリアは右側に寄せて広々と使う。
- **モバイル幅 (`< 768px`)**:
  - サイドバーが画面下部に移動し、ボトム固定ナビゲーション（`--bottom-nav-height`）に変化。
  - 親指で操作しやすい位置にアイコンを配置。

## 4. 状態管理（State Management）
アプリの状態は `app.js` 内のグローバル変数 `state` に保持されます。
```javascript
let state = {
  mode: null,        // 'daily', 'weak', 'spaced', 'mock', 'chapter' などの学習モード
  chapter: null,     // 現在選択されている章ID（全章の場合は0、その他のモードはnull）
  questions: [],     // 出題対象となる問題オブジェクトの配列
  idx: 0,            // 現在何問目を解いているかのインデックス
  score: 0,          // 現在の正答数
  answers: [],       // 各問題の解答結果履歴（間違えた問題の抽出等に使用）
  timeLeft: 0,       // 模擬試験モード用の残り時間（秒）
  timer: null        // 模擬試験用の setInterval ID
};
```

## 5. PWA (Progressive Web App)
- `sw.js` により、必要な静的アセット（JS群、CSS、HTML）をブラウザのキャッシュに保存します。
- これにより、オフライン状態でもアプリを起動し、問題演習を行うことが可能です。

## 6. デプロイ（本番・検証）
- **ホスティング**: Cloudflare Pages（`*.pages.dev`）。GitHub Actions（`.github/workflows/deploy-cloudflare-pages.yml`）が `wrangler pages deploy` で配信する。
- **本番（PRD）**: `master` / `main` → `https://jcsqe-study-app.pages.dev`（プロジェクト名は Variables で上書き可）。
- **検証（STG）**: `staging` / `develop` → `https://jcsqe-study-app-staging.pages.dev`。詳細は [environments.md](./environments.md)。
