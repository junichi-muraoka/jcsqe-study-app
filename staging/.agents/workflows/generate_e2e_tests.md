# E2E テスト生成ワークフロー

Playwright MCP が利用可能な場合、AI に E2E テストの生成を依頼するための手順です。

## 前提

- Cursor に Playwright MCP サーバーが設定されていること
- ローカルで `npm run test:e2e` が動作すること

## 依頼例

```
[新機能の説明] をテストする Playwright のテストコードを生成して。
既存の tests/e2e.spec.js の形式（test.describe, test()）に合わせて、
tests/e2e.spec.js に追加する形で出力して。
```

## 生成後の確認

1. 生成されたコードを `tests/e2e.spec.js` に追加
2. `npm run test:e2e` でローカル実行し、テストが通ることを確認
3. 必要に応じてセレクタや待機時間を調整
4. PR を作成

## 参考

- ハイブリッド戦略の詳細: [docs/08_hybrid_testing_strategy.md](../docs/08_hybrid_testing_strategy.md)
