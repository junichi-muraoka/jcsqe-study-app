# Firebase 手動セットアップ手順（本番・GitHub Pages 向け）

このアプリのクラウド同期は **任意** です。未設定のままでも `localStorage` のみで動きます。  
以下は **GitHub Pages 上で Google ログインと Firestore 同期を使う**ときの、画面操作とコマンドを順番に並べたチェックリストです。

---

## 事前に決めておくこと

| 項目 | 例 | メモ |
|------|-----|------|
| 本番（PRD）の URL | `https://junichi-muraoka.github.io/jcsqe-study-app/` | `master` → `gh-pages` ルート（[environments.md](./environments.md)） |
| 検証（STG）の URL | `https://junichi-muraoka.github.io/jcsqe-study-app/staging/` | `staging` ブランチ → `gh-pages` の `/staging/`。オリジンは本番と同じ `junichi-muraoka.github.io` |
| Firebase プロジェクト名 | 任意（コンソールで表示名） | 1 プロジェクトで十分な場合も多い |
| 検証用を分けるか | 別プロジェクト or 同一プロジェクトで別用途 | 小規模なら本番 1 つからで可 |

---

## フェーズ A — Firebase プロジェクトを作る

1. ブラウザで [Firebase Console](https://console.firebase.google.com/) を開く。
2. **プロジェクトを追加**（または **Add project**）をクリック。
3. プロジェクト名を入力 → 続行。
4. Google アナリティクスは不要ならオフで可 → **プロジェクトを作成**。
5. 作成完了まで待ち、**続行**でコンソールのトップに入る。

---

## フェーズ B — Web アプリを登録して設定値を取得する

1. プロジェクト概要画面で **Web**（`</>`）アイコンを選ぶ。  
   なければ **プロジェクトの設定**（歯車）→ **全般** → 下の **マイアプリ** で **アプリを追加** → **Web**。
2. アプリのニックネームを入力（例: `jcsqe-web`）。**Firebase Hosting は不要**ならチェックを外してもよい（このリポジトリは GitHub Pages 利用）。
3. **アプリを登録**。
4. 表示される **`firebaseConfig` のオブジェクト**をメモする。次のキーが `js/firebase-config.js` に必要です。  
   - `apiKey`  
   - `authDomain`  
   - `projectId`  
   - `storageBucket`  
   - `messagingSenderId`  
   - `appId`  

（画面を閉じた場合は **プロジェクトの設定** → **全般** → スクロールして **マイアプリ** の Web アプリから再表示できます。）

---

## フェーズ C — Authentication（Google ログイン）を有効にする

1. 左メニュー **ビルド** → **Authentication**。
2. **始める**（初回のみ）。
3. **Sign-in method** タブ → **Google** をクリック。
4. **有効にする**をオン、**プロジェクトのサポートメール**を選ぶ → **保存**。

---

## フェーズ D — Cloud Firestore を有効にする

1. 左メニュー **ビルド** → **Firestore Database**。
2. **データベースの作成**。
3. ロケーションは **変更しにくい**ので、利用リージョンを選ぶ（例: `asia-northeast1`）→ **次へ**。
4. セキュリティルールは **本番モードで開始**でも **テストモード**でも可。**後でフェーズ F のルールで上書きする前提**ならどちらでもよい → **有効にする**。

---

## フェーズ E — 承認済みドメイン（Authorized domains）に GitHub Pages を追加する

GitHub Pages の URL から **ログイン用ポップアップ**が動くには、Firebase がそのオリジンを許可している必要があります。

**本番（`/`）も検証（`/staging/`）も**、ホストは同じ `junichi-muraoka.github.io` です（パスが違うだけ）。承認済みドメインに **ホスト名 1 つ**入っていれば、STG の URL でもログイン可能です。

1. **Authentication** → **設定**（タブ）→ **承認済みドメイン**。
2. 既に `localhost` があればそのまま（ローカル検証用）。
3. **ドメインを追加**をクリックし、次を **それぞれ** 追加する（実際のユーザー名・リポジトリ名に合わせる）。

   | 追加するドメイン | 用途 |
   |------------------|------|
   | `junichi-muraoka.github.io` | `user.github.io/repo` 形式の **ユーザ／組織 Pages**（PRD・STG 共通） |
   | （カスタムドメインを使う場合） | 例: `www.example.com` |

   **注意**: `https://` は付けない。ホスト名だけ（例: `junichi-muraoka.github.io`）。

4. 保存を確認。

---

## フェーズ F — Firestore セキュリティルールをデプロイする

リポジトリの `firestore.rules` は **「ログインユーザー本人だけが `users/{自分のuid}` を読み書き可」** です。これを Firebase に反映します。

### 方法 1: Firebase CLI（推奨・再現しやすい）

1. PC に [Node.js](https://nodejs.org/) が入っていることを確認。
2. ターミナル（PowerShell 可）で:

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. リポジトリのルート（`firebase.json` と `firestore.rules` がある場所）に `cd` する。
4. 初回のみ、プロジェクトを紐付け:

   ```bash
   firebase use --add
   ```

   対話で Firebase プロジェクトを選び、エイリアス（例: `default`）を付ける。

5. ルールだけデプロイ:

   ```bash
   firebase deploy --only firestore:rules
   ```

6. 成功メッセージを確認。

### 方法 2: コンソールに貼り付け

1. **Firestore Database** → **ルール** タブ。
2. リポジトリの `firestore.rules` の内容をそのまま貼り付け → **公開**。

### 方法 3: GitHub Actions（自動デプロイ）

`master` / `main` へ `firestore.rules` または `firebase.json` がマージされると、[Firestore rules](../.github/workflows/firestore-rules.yml) ワークフローが **ルールを Firebase に反映**します（PR では構文チェックのみ）。

1. ローカルで [Firebase CLI](https://firebase.google.com/docs/cli) を入れ、`firebase login:ci` を実行して表示される **CI 用トークン**をコピーする（`npx firebase-tools login:ci` でも可）。
2. GitHub リポジトリの **Settings → Secrets and variables → Actions** に次を追加する。
   - **`FIREBASE_TOKEN`** … 上記のトークン（**漏洩に注意**。定期的に再発行可）
   - **`FIREBASE_PROJECT_ID`** … Firebase コンソールの project ID
3. シークレット未設定のときはデプロイはスキップされ、ログに警告が出ます。手動で **Run workflow**（`workflow_dispatch`）しても同様です。

---

## フェーズ G — アプリに `firebaseConfig` を書き込む

1. ローカルで `js/firebase-config.example.js` を開き、内容を参考に **`js/firebase-config.js`** を編集する。  
   または `firebase-config.example.js` をコピーして `firebase-config.js` にリネームし、フェーズ B の値を貼る。
2. `YOUR_API_KEY` などプレースホルダを **すべて**実値に置き換える。
3. 保存後、ブラウザで `index.html` を開くか `npx http-server` で起動し、**設定タブ → クラウド同期** から **Google でログイン**を試す。

**公開リポジトリについて**: Web 用 `apiKey` はクライアントに埋め込まれる前提の値ですが、**プロジェクト ID や設定を載せたくない**場合は、`firebase-config.js` を **git に含めない**運用（`.gitignore` + デプロイ時のみ配置）に切り替える必要があります。通常の OSS ではテンプレのみコミットし、本番値は別チャネルで配布する運用もあります。**このリポジトリの方針に合わせて**判断してください。

---

## フェーズ H — 動作確認の順序（推奨）

1. **localhost**（`http://127.0.0.1:8080` など）でログイン → Firestore の **データ** タブに `users` コレクションと自分の UID ドキュメントができるか確認。
2. 同じアカウントで **GitHub Pages の URL** を開き、再度ログインできるか確認（フェーズ E が漏れているとここで失敗しやすい）。
3. 設定画面のメッセージ・トーストにエラーが出たら、`auth/popup-blocked` なら **ポップアップブロック解除**、`permission-denied` ならルール未デプロイを疑う。

---

## フェーズ I — ドキュメントのメンテ（任意だが推奨）

- [`docs/environments.md`](environments.md) の Firebase 表に **本番の `projectId`** を追記すると、後から見失いません。

---

## よくあるつまずき

| 症状 | 確認すること |
|------|----------------|
| ログインボタンで何も起きない / すぐ閉じる | 承認済みドメイン、ポップアップブロック |
| Firestore 書き込みエラー `permission-denied` | `firestore.rules` がデプロイ済みか、ログイン UID とパス `users/{uid}` が一致しているか |
| ローカルでは動くが Pages だけ失敗 | `junichi-muraoka.github.io` を承認済みドメインに追加したか |
| 別ブランチのプレビュー URL を使う | そのホスト名も承認済みドメインに追加が必要な場合がある |

---

## 参照

- [09_cloud_sync_firebase_spec.md](./09_cloud_sync_firebase_spec.md) — 同期仕様・エラー UX  
- [README の Firebase 概要](../README.md) — リポジトリトップからの入口  
