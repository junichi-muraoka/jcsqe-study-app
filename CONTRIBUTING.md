# コントリビューションガイド

JCSQE初級 合格対策学習アプリへの貢献ありがとうございます！🎉

## 🤝 貢献の方法

### 1. 問題の追加・修正

最も歓迎するコントリビューションです！

詳細なデータ形式・ファイル分担・検証ルールは **[docs/content_authoring.md](docs/content_authoring.md)** を参照してください。

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

### 2. バグ報告・改修

[Issue](https://github.com/junichi-muraoka/jcsqe-study-app/issues) から報告してください。テンプレートに従い、**現象・再現手順・期待値・実際の動作・発生環境**などを記入してください。

**手動起票の簡略化**（GitHub CLI がインストール済みの場合）:
```bash
npm run bug:report      # テンプレート本文をプリフィルして Issue 作成
npm run bug:report:web  # ブラウザで New Issue を開く
```

**バグ改修フロー**:
1. バグを発見したら Issue を作成し、「報告時」セクションを記入する
2. 修正用のブランチを作成（`git checkout -b fix/issue-番号-概要`）
3. 修正後、PR を作成し、関連 Issue をリンクする
4. **PR マージ前に**、該当 Issue の「修正後」セクション（原因・対策・検証方法・横展開・再発防止）を記入する
5. マージ後、Issue をクローズする

### 3. 機能改善

新機能のアイデアがあれば、まず Issue で提案してください。

## 📋 プルリクエストの手順

1. このリポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/add-questions`）
3. `npm test` を実行して回帰がないことを確認
4. 変更をコミット（`git commit -m "feat: 第3章に5問追加"`）
5. ブランチをプッシュ（`git push origin feature/add-questions`）
6. プルリクエストを作成

## 🌐 デプロイとブランチ（本番・検証）

公開サイトは **GitHub Pages** で、次の 2 環境に分かれています（詳細は [docs/environments.md](docs/environments.md)）。

| 環境 | ブランチ | 公開 URL（本リポジトリ） |
|------|----------|--------------------------|
| 本番（PRD） | `master` | `https://junichi-muraoka.github.io/jcsqe-study-app/` |
| 検証（STG） | `staging` | `https://junichi-muraoka.github.io/jcsqe-study-app/staging/` |

- 通常の機能追加・修正は **PR → `master`** でよい。マージ後、Actions が **本番**を更新する。
- **検証環境だけ先に触りたい**ときは、`staging` 向けの PR または `staging` への直接プッシュで **STG** が更新される（運用ルールはチームで決める）。
- Pages のビルド元ブランチは **`gh-pages`**（Settings → Pages）。`master` 直デプロイではない点に注意。

## 📐 コーディング規約

- JavaScript: Vanilla JS（フレームワーク不使用）
- CSS: カスタムプロパティ（CSS変数）を活用
- コミットメッセージ: `feat:`, `fix:`, `docs:` プレフィックスを使用

## 🔒 Branch Protection の推奨設定（リポジトリ管理者向け）

main（master）ブランチの品質を守るため、以下を推奨します。

| 設定項目 | 推奨値 |
|----------|--------|
| Require a pull request before merging | 有効 |
| Require status checks to pass before merging | 有効。必須チェック: `test` |
| Require branches to be up to date before merging | 任意（CI の再実行を強制） |

**設定手順**: GitHub リポジトリ → Settings → Branches → Add branch protection rule
