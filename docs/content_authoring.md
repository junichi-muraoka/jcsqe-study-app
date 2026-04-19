# コンテンツ編集ガイド（問題・解説）

> **関連 Issue**: [#59](https://github.com/junichi-muraoka/jcsqe-study-app/issues/59)  
> 入口の手順は [CONTRIBUTING.md](../CONTRIBUTING.md)。本書は **データ形式・ファイル分担・検証**に特化する。

## 1. どのファイルに書くか

| 内容 | 主なファイル |
|------|----------------|
| 章リスト・ベース問題 | `questions.js` の `CHAPTERS` / `QUESTIONS` |
| 追加問題（分割ファイル） | `questions_extra1.js` 〜 `questions_extra5.js`（`QUESTIONS.push(...)` で追加） |
| 選択肢別解説（EXP / EXP2） | `explanations.js` の `EXP`（id 1〜25）、`EXP2`（26〜50 など） |
| 追加解説・EXP3 | `explanations_extra.js`、`explanations_exp3.js`（id 128 以降など） |

読み込み順は `index.html` の `<script>` 順に従う。新規 ID を増やすときは **既存 ID と重複しない**こと。

## 2. 問題オブジェクトのルール

`CONTRIBUTING.md` の例に加え、次を満たすこと（`scripts/validate-questions.js` と一致）。

| フィールド | ルール |
|------------|--------|
| `id` | **全ファイル通して一意**。重複不可。 |
| `chapter` | **1〜5** の整数 |
| `level` | **`L1` / `L2` / `L3`** のいずれか |
| `choices` | **ちょうど 4 要素**の配列 |
| `answer` | **0〜3**（先頭の選択肢が 0） |
| `explanation` | **空でない文字列**（全体解説） |

## 3. 選択肢別解説（EXP / EXP2 / EXP3）

- 問題 ID ごとに **1 エントリ**。キーは問題の `id` と同じ数値。
- 各エントリは `{ s: "SQuBOK参照の一行", d: [ "選択肢0の解説", ... ] }` 形式で、**`d` は必ず 4 要素**（選択肢と対応）。
- `s` には **SQuBOK Guide 第3版の参照**を明記する（章・節・用語が分かるように）。

## 4. 編集後の必須チェック

ローカルで次を実行し、**エラーなし**にする。

```bash
npm test
```

これは `node --test` に加え **`scripts/validate-questions.js`** を実行する。  
PR では **validate_questions** ワークフローも問題・解説変更時に動く。

## 5. やってはいけないこと（目安）

- **他社・他書籍の文をそのまま転載**しない（学習用の独自表現にする）。
- **問題 ID の衝突**や、**解説だけ追加して問題がない ID** を作らない（バリデータが検出）。
- `choices` や `d` の **個数ミス**（4 以外）は出題・表示が崩れる。

## 6. 章ごとの問題数バランス

プロジェクト方針として **各章 60 問**などに揃える場合は、追加時に [README.md](../README.md) の「対応範囲」表と整合を取る。
