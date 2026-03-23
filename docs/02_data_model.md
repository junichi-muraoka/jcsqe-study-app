# データモデル・保存仕様

本アプリはDBを持たないため、静的データ（マスターデータ）と動的データ（ユーザーの学習記録）で分離して管理しています。

## 1. 静的マスターデータ (Static Data)

### `QUESTIONS` 配列 (`questions*.js`)
全ての問題を定義する配列です。各オブジェクトは以下の構造を持ちます。
```javascript
{
  id: 1,                 // 問題の一意なID
  chapter: 1,            // 所属する章ID
  level: "L1",           // 難易度（L1〜L3など）
  tag: "頻出",           // オプション（頻出、要注意など）
  question: "問題文...",   // 問題のテキスト
  choices: ["A", "B", "C", "D"], // 4つの選択肢
  answer: 2              // 正解のインデックス（0〜3）
}
```

### `CHAPTERS` 配列 (`questions*.js`)
章のメタデータ（ID、タイトル、アイコン）を定義します。
```javascript
{ id: 1, name: "ソフトウェア品質の基本概念", icon: "📘" }
```

### `GLOSSARY` 配列 (`glossary.js`)
用語集のデータです。
```javascript
{
  term: "品質特性",
  reading: "ひんしつとくせい",
  desc: "ソフトウェア製品が備えるべき...説明文",
  chapter: 1
}
```

## 2. ユーザーデータ (User Data)
ユーザーの学習記録は、ブラウザの `localStorage`（キー名: `jcsqe_study_data`）に保存されます。保存時には現行スキーマへ正規化され、旧形式の一部データは自動的に移行されます。

テーマ設定は学習データとは別に、`localStorage` の `jcsqe_theme` キーで管理しています。

### 保存データのJSONスキーマ
```json
{
  "version": 1,
  "totalAnswered": 250,
  "totalCorrect": 180,
  "chapterStats": {
    "1": { "answered": 50, "correct": 35 },
    "2": { "answered": 40, "correct": 30 }
  },
  "weakIds": [15, 22, 45],
  "history": [],
  "mockHistory": [
    {
      "date": "2026-03-05T10:00:00.000Z",
      "score": 35,
      "total": 40,
      "pct": 88
    }
  ],
  "dailyActivity": {
    "2026-03-01": 20,
    "2026-03-02": 45
  },
  "bookmarks": [1, 5, 10],
  "spacedRepetition": {
    "1": {
      "interval": 2,
      "ease": 2.5,
      "nextReview": 1709424000000
    }
  },
  "streak": {
    "lastDate": "2026-03-10",
    "count": 5
  },
  "xp": 120
}
```

### 互換性と移行
- 旧形式の `mockExams` は `mockHistory` に変換して扱います。
- 数値だった `streak` と `lastStudyDate` は、`{ lastDate, count }` 形式へ移行します。
- 不足している配列やオブジェクト項目はデフォルト値で補完します。
- `totalCorrect` は `totalAnswered` を超えないように補正します。
- 学習データとして認識できる主要キーが存在しない JSON は、インポート時に拒否します。

## 3. 今後のクラウド化（Firebase対応）に向けた課題
現在、上記ユーザーデータは各デバイスの `localStorage` のみに存在しています。ログイン機能（[Issue #14](https://github.com/junichi-muraoka/jcsqe-study-app/issues/14)）を実装する際は、このJSONオブジェクトを丸ごと、またはコレクションに分解して Firebase Firestore に保存・同期するアーキテクチャへのシフトが必要になります。

**無料枠・同期失敗時の UX・エラー文言**は仕様として [09_cloud_sync_firebase_spec.md](./09_cloud_sync_firebase_spec.md) に記載しています（Issue #14 本文の数値・実装方針と対になる「アプリ側の扱い」）。
