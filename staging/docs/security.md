# セキュリティ・プライバシー概要

> **関連 Issue**: [#61](https://github.com/junichi-muraoka/jcsqe-study-app/issues/61)  
> クラウド同期の技術仕様・制限は [09_cloud_sync_firebase_spec.md](./09_cloud_sync_firebase_spec.md)、セットアップは [firebase_manual_setup.md](./firebase_manual_setup.md)。

## 1. アーキテクチャ上の前提

- **バックエンドサーバーをアプリ側は持たない**。配信されるのは **静的ファイル（HTML/CSS/JS）**（GitHub Pages 等）。
- 学習の進捗・解答履歴などは **ブラウザの `localStorage`** に保存される。データは **ユーザーの端末内**に留まる（他ユーザと自動共有しない）。

## 2. 公開リポジトリについて

- ソースは **GitHub 上で公開**されているため、**クライアントに含まれるコード・設定は誰でも閲覧可能**と考える。
- **API キー等をクライアントに埋め込むと漏洩リスクがある**（Firebase の Web API キーはクライアントに置く設計だが、**Firestore ルール**と **Authentication** でアクセスを制御する）。ルールは [firestore.rules](../firestore.rules) とコンソール設定が前提。

## 3. Firebase を有効にした場合

- **Google ログイン**と **Firestore** への同期を行う。同期の扱い・エラー表示は [09](./09_cloud_sync_firebase_spec.md) を参照。
- **承認済みドメイン**に GitHub Pages のホストを登録しないと、ログインが失敗する（[firebase_manual_setup.md](./firebase_manual_setup.md)）。
- 無料枠の制限・障害時の挙動は Issue #14 および [09](./09_cloud_sync_firebase_spec.md) の表を参照。

## 4. 通信・保存

- GitHub Pages 経由の配信は **HTTPS**（GitHub 側の証明書）。
- **クラウド同期を使わない**場合でも、**端末紛失・共有 PC** では `localStorage` の内容が他人に見られる可能性がある。学習データの機密性が高い場合は **端末のロック**や **データエクスポート後の取り扱い**に注意する。

## 5. 脆弱性の報告

- セキュリティ上の重大な問題を見つけた場合は、**公開 Issue ではなく**リポジトリオーナーに連絡するか、GitHub の **Security advisories**（有効な場合）の運用に従う。
