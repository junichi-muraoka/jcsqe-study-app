# [Bug] glossaryFlashcardMode の初期化順による ReferenceError

## 📌 報告時（発見者が記入）

### 現象
アプリ読み込み時に `ReferenceError: Cannot access 'glossaryFlashcardMode' before initialization` が発生し、`window.startDailyChallenge` 等が未定義のままになる。E2E テストが全て失敗する。

### 原因
`renderGlossary()` が初期化時（約700行目）に呼ばれるが、`glossaryFlashcardMode` の宣言が約741行目にあり、 temporal dead zone により参照エラーが発生。

### 対策
`glossaryFlashcardMode`, `glossaryFlashcardItems`, `glossaryFlashcardIdx` の宣言を IIFE 先頭（comboCount の直後）に移動。

### 再発防止
E2E テストがアプリの起動を検証するため、同様の初期化順バグは検出される。

---

## 🔧 修正後（修正者が記入）

### 原因
`renderGlossary()` が初期化時（約700行目）に呼ばれるが、`glossaryFlashcardMode` の宣言が約741行目にあり、temporal dead zone により参照エラーが発生。

### 対策
`glossaryFlashcardMode`, `glossaryFlashcardItems`, `glossaryFlashcardIdx` の宣言を IIFE 先頭（comboCount の直後）に移動。（app.js 11–13行目）

### 検証方法
`npm run test:e2e` が通過すること。

### 横展開
該当箇所のみ。他に同様の初期化順バグは未確認。

### 再発防止
E2E テストがアプリの起動を検証するため、同様の初期化順バグは検出される。

### 関連PR
<!-- 修正PRのリンク（例: #123） -->
