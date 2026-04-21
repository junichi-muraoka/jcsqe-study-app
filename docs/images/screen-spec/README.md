# 画面仕様書用キャプチャ

[画面仕様書（10_screen_specification.md）](../../10_screen_specification.md) から参照する PNG を置くフォルダです。

再生成:

```bash
npm run screenshots:screen-spec
```

`scripts/capture-screen-spec.mjs` が `scripts/lib/demo-study-seed.mjs` のダミーデータを `localStorage` に入れてから撮影します（個人の学習データは使用しません）。
