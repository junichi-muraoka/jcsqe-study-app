# README 用ビジュアル

GitHub の [README.md](../../../README.md) から参照する画像を置くフォルダです。

| ファイル | 用途 |
|----------|------|
| `banner.svg` | リポジトリ冒頭のヒーローバナー（ベクター） |
| `study-flow.svg` | 学習の流れ（5章 → クイズ → 選択肢別解説）の概念図 |
| `screenshot-home.png` | ホーム（学習メニュー・分野別・計画ジェネレータ） |
| `screenshot-quiz-explanation.png` | 出題中〜解答後の選択肢別解説 |
| `screenshot-stats.png` | 成績タブ（リング・ヒートマップ・弱点・バッジ） |
| `screenshot-mock-exam.png` | 模擬試験（タイマー・40問） |

## スクリーンショットを再生成する（推奨）

ローカルで **同じ構図・シード付き**の PNG を出し直せます（`npm install` と `npx playwright install chromium` が済んでいること）。

```bash
npm run screenshots:readme
```

`scripts/capture-readme-screenshots.mjs` が一時的に `http-server` を立て、`scripts/lib/demo-study-seed.mjs` のダミーを `localStorage` に入れたうえで Playwright がキャプチャします。**個人の本番データは使いません。**

画面仕様書用の別セットは `npm run screenshots:screen-spec`（[10_screen_specification.md](../../10_screen_specification.md)）。

## 手動で差し替えるとき

1. 本番またはローカルで画面をキャプチャする（**個人情報・自分の学習履歴**に注意するか、別プロファイルで撮る）。
2. 上表と同じファイル名でこのフォルダに上書き保存する（PNG 推奨・幅 1360px 前後で README の `width="720"` と相性がよいです）。
3. ルートの `README.md` の `<img>` の `src` / `alt` / キャプションを必要なら更新する。

SVG は軽量で拡大に強いです。実 UI の信頼感は **PNG のスクリーンショット**が担います。
