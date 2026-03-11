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
ユーザーの学習記録や設定は、ブラウザの `localStorage`（キー名: `jcsqe_data`）に保存されます。JSON文字列化して保存・読み込みが行われます。

### 保存データのJSONスキーマ
```json
{
  "totalAnswered": 250,        // これまでの総解答数
  "totalCorrect": 180,         // これまでの総正解数
  "weakIds": [15, 22, 45],     // 過去に間違え、まだ克服していない問題IDの配列
  "chapterStats": {            // 章ごとの学習状況
    "1": { "answered": 50, "correct": 35 },
    "2": { "answered": 40, "correct": 30 }
  },
  "bookmarks": [1, 5, 10],     // ユーザーが「★」をつけた（ブックマークした）問題IDの配列
  
  // 間隔反復（Spaced Repetition）の学習スケジュール用データ
  "spacedRepetition": {
    "1": { 
      "interval": 2,           // 次の復習までの日数間隔
      "ease": 2.5,             // 記憶の定着率（易しさ）係数
      "nextReview": 1709424000000 // 次回复習すべき時刻のタイムスタンプ
    }
  },

  // カレンダー・ヒートマップ用のアクティビティログ
  "dailyActivity": {
    "2026-03-01": 20,          // 該当日に解いた問題数
    "2026-03-02": 45
  },

  // 模擬試験の受験履歴
  "mockExams": [
    {
      "date": "2026-03-05T10:00:00Z",
      "score": 35,             // 40問中の正解数
      "passed": true           // 70%以上で合格フラグ
    }
  ],

  // 獲得した実績バッジ
  "badges": ["first_blood", "streak_7"],
  
  // アプリの設定・状態
  "theme": "dark",             // 'light' または 'dark'
  "streak": 5,                 // 連続学習日数
  "lastStudyDate": "2026-03-10", // 最後に学習した日付（ストリーク計算用）
  "version": 1                 // データマイグレーション用のバージョン番号
}
```

## 3. 今後のクラウド化（Firebase対応）に向けた課題
現在、上記ユーザーデータは各デバイスの `localStorage` のみに存在しています。ログイン機能（Issue #14）を実装する際は、このJSONオブジェクトを丸ごと、またはコレクションに分解して Firebase Firestore に保存・同期するアーキテクチャへのシフトが必要になります。
