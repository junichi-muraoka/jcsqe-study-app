# 🎓 JCSQE初級 合格対策学習アプリ

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-brightgreen)](https://junichi-muraoka.github.io/jcsqe-study-app/)
[![Questions](https://img.shields.io/badge/収録問題数-50問-orange)]()

> **SQuBOK Guide 第3版**に準拠した、JCSQE初級（ソフトウェア品質技術者資格試験）合格を目指す実践型学習Webアプリです。

---

## ✨ 特徴

| 機能 | 説明 |
|------|------|
| 📚 **分野別学習** | SQuBOK全5章から章ごとに問題を出題。即座に解説を表示 |
| 🔄 **弱点克服** | 間違えた問題を自動記録し、優先的に出題。正解すると弱点リストから除外 |
| 🎯 **模擬試験** | 本番と同じ40問・60分のタイマー付き模擬試験 |
| 📊 **成績ダッシュボード** | 章別正答率・学習進捗・弱点一覧を可視化 |
| 💡 **選択肢別解説** | 各問題の正解理由・不正解理由をSQuBOK参照付きで詳細解説 |

## 📖 対応範囲（SQuBOK Guide 第3版）

| 章 | テーマ | 問題数 |
|----|--------|--------|
| 第1章 | ソフトウェア品質の基本概念 | 12問 |
| 第2章 | ソフトウェア品質マネジメント | 11問 |
| 第3章 | ソフトウェア品質技術 | 11問 |
| 第4章 | 専門的なソフトウェア品質の概念と技術 | 9問 |
| 第5章 | ソフトウェア品質の応用領域 | 7問 |

## 🚀 使い方

### オンライン（GitHub Pages）
👉 **[https://junichi-muraoka.github.io/jcsqe-study-app/](https://junichi-muraoka.github.io/jcsqe-study-app/)**

ブラウザでアクセスするだけですぐに学習を開始できます。

### ローカル
```bash
git clone https://github.com/junichi-muraoka/jcsqe-study-app.git
cd jcsqe-study-app
# 方法1: ブラウザで直接開く
open index.html

# 方法2: ローカルサーバーで起動
npx http-server ./ -p 8080 -o
```

## 🛠️ 技術スタック

- **HTML5** — セマンティック構造
- **CSS3** — ダークモード・グラスモーフィズムデザイン
- **Vanilla JavaScript** — フレームワーク不使用、軽量動作
- **localStorage** — 学習データの永続化（サーバー不要）

## 📝 JCSQE試験について

| 項目 | 内容 |
|------|------|
| 正式名称 | ソフトウェア品質技術者資格認定（初級） |
| 主催 | 日本科学技術連盟（JUSE） |
| 出題数 | 40問（4択） |
| 試験時間 | 60分 |
| 合格ライン | 約70%（28問正解） |
| 出題範囲 | SQuBOK Guide 第3版 |
| 知識レベル | L1（知っている）〜 L3（概念と使い方がわかる） |

## 🤝 コントリビューション

問題の追加・修正、機能改善のプルリクエストを歓迎します！

詳しくは [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

## 📄 ライセンス

[MIT License](LICENSE) © 2026 junichi-muraoka

## ⚠️ 免責事項

本アプリは試験対策の学習支援を目的として作成されたものです。収録問題は公式の過去問ではなく、SQuBOK Guide 第3版の内容に基づいて独自に作成したものです。試験の合格を保証するものではありません。
