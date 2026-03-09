# コントリビューションガイド

JCSQE初級 合格対策学習アプリへの貢献ありがとうございます！🎉

## 🤝 貢献の方法

### 1. 問題の追加・修正

最も歓迎するコントリビューションです！

**問題を追加する場合：**
1. `questions.js` に問題データを追加
2. `explanations.js` に選択肢別解説を追加
3. SQuBOK Guide 第3版の該当箇所を `source` に明記

**問題データの形式：**
```javascript
{
  id: 51,           // ユニークなID
  chapter: 1,       // SQuBOK章番号（1〜5）
  level: "L2",      // 知識レベル（L1/L2/L3）
  question: "問題文",
  choices: ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
  answer: 0,        // 正解のインデックス（0始まり）
  explanation: "全体の解説文"
}
```

### 2. バグ報告

[Issue](https://github.com/junichi-muraoka/jcsqe-study-app/issues) から報告してください。

### 3. 機能改善

新機能のアイデアがあれば、まず Issue で提案してください。

## 📋 プルリクエストの手順

1. このリポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/add-questions`）
3. 変更をコミット（`git commit -m "feat: 第3章に5問追加"`）
4. ブランチをプッシュ（`git push origin feature/add-questions`）
5. プルリクエストを作成

## 📐 コーディング規約

- JavaScript: Vanilla JS（フレームワーク不使用）
- CSS: カスタムプロパティ（CSS変数）を活用
- コミットメッセージ: `feat:`, `fix:`, `docs:` プレフィックスを使用
