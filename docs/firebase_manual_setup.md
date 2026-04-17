# Firebase 手動セットアップ手順（本番・検証 URL 向け）

このアプリのクラウド同期は **任意** です。未設定のままでも `localStorage` のみで動きます。  
以下は **Cloudflare Pages（`*.pages.dev`）などの公開 URL で** Google ログインと Firestore 同期を使うときの、画面操作とコマンドを順番に並べたチェックリストです。

---

## API キーが GitHub に載った場合（GCP からの警告メール）

1. **すぐに [Google Cloud Console](https://console.cloud.google.com/)** → 対象プロジェクト → **API とサービス** → **認証情報** で、漏洩した **API キーを削除するか回転**する（新キー発行後、Firebase コンソールの Web アプリ設定が新キーに更新されているか確認）。
2. **GitHub** の **Settings → Secrets and variables → Actions** に **`FIREBASE_WEB_CONFIG_JSON`** を登録する（下記「フェーズ G」）。デプロイ時にのみ `js/firebase-config.js` が生成される。
3. **（推奨）** 同じ認証情報画面でキーの **アプリケーションの制限**を **HTTP リファラー** にし、次を **すべて** 含める（`signInWithPopup` は **`https://<projectId>.firebaseapp.com/__/auth/handler`** 経由で Identity Toolkit を呼ぶため、`pages.dev` だけだと **403 / getProjectConfig** になる）:  
   - `https://*.pages.dev/*`（Cloudflare Pages）  
   - **`https://<projectId>.firebaseapp.com/*`**（例: `https://jcsqe-study-app.firebaseapp.com/*`）  
   - （任意）`https://<projectId>.web.app/*`  
   - `https://*.github.io/*`・`http://localhost:*/*` などローカル・旧ホスト
4. **過去のコミット**には旧キーが残る。**キー無効化が最優先**。履歴から消すには `git filter-repo` 等と force push が必要で、フォークやクローンとの調整が要る。

---

## 事前に決めておくこと

| 項目 | 例 | メモ |
|------|-----|------|
| 本番（PRD）の URL | `https://jcsqe-study-app.pages.dev` | `master` / `main` → [deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml)（[environments.md](./environments.md)） |
| 検証（STG）の URL | `https://jcsqe-study-app-staging.pages.dev` | `staging` / `develop` → 同上 |
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
2. アプリのニックネームを入力（例: `jcsqe-web`）。**Firebase Hosting は不要**ならチェックを外してもよい（このリポジトリは Cloudflare Pages / 静的ホストで配信）。
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

## フェーズ E — 承認済みドメイン（Authorized domains）を追加する

公開 URL から **ログイン用ポップアップ**が動くには、Firebase がそのオリジンを許可している必要があります。

**Cloudflare Pages** では本番と検証で **ホスト名が別**（`*.pages.dev` が 2 つ）のため、**両方**を承認済みドメインに追加する。旧 **GitHub Pages** の URL も使う場合は `user.github.io` も追加する。

1. **Authentication** → **設定**（タブ）→ **承認済みドメイン**。
2. 既に `localhost` があればそのまま（ローカル検証用）。
3. **ドメインを追加**をクリックし、次を **それぞれ** 追加する（プロジェクト名に合わせる）。

   | 追加するドメイン | 用途 |
   |------------------|------|
   | `jcsqe-study-app.pages.dev` | **Cloudflare Pages** 本番 |
   | `jcsqe-study-app-staging.pages.dev` | **Cloudflare Pages** 検証 |
   | （任意）`junichi-muraoka.github.io` | 旧 **GitHub Pages** をまだ使う場合 |
   | （カスタムドメインを使う場合） | 例: `www.example.com` |

   **注意**: `https://` は付けない。ホスト名だけ。

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

**Cloudflare Pages にデプロイしてクラウド同期を使う（推奨）**

1. フェーズ B の **`firebaseConfig`** を、GitHub の **Repository secrets** の **`FIREBASE_WEB_CONFIG_JSON`** に保存する。次のどちらでも可（[`scripts/write-firebase-config.js`](../scripts/write-firebase-config.js) が解釈する）:  
   - **1 行の JSON** — `{"apiKey":"…","authDomain":"…",…}`  
   - **Firebase コンソールのまま** — `const firebaseConfig = { apiKey: "…", … };` の **ブロック全体**（`{` から `}` まで含む）
2. `master` / `staging` などをプッシュすると、[deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) が `scripts/write-firebase-config.js` で **`js/firebase-config.js` を上書き**してからデプロイする。
3. Secret を未設定のままにすると、リポジトリ同梱の **プレースホルダ**のまま配信され、クラウド同期はオフのままです。

**ローカルだけでログインを試す**

1. `js/firebase-config.example.js` をコピーして `js/firebase-config.js` を作るか、既存の `firebase-config.js` のプレースホルダをフェーズ B の実値に置き換える。
2. **公開リポジトリでは実値を `git commit` しない。** 誤って載せた場合はキーを回転し、上記 Secret 方式に切り替える。

保存後、ブラウザで `index.html` を開くか `npx http-server` で起動し、**設定タブ → クラウド同期** から **Google でログイン**を試す。

---

## フェーズ H — 動作確認の順序（推奨）

1. **localhost**（`http://127.0.0.1:8080` など）でログイン → Firestore の **データ** タブに `users` コレクションと自分の UID ドキュメントができるか確認。
2. 同じアカウントで **本番の Cloudflare Pages URL** を開き、再度ログインできるか確認（フェーズ E が漏れているとここで失敗しやすい）。
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
| ローカルでは動くが公開 URL だけ失敗 | `jcsqe-study-app.pages.dev` 等を承認済みドメインに追加したか |
| 別ブランチのプレビュー URL を使う | そのホスト名も承認済みドメインに追加が必要な場合がある |
| ポップアップが `firebaseapp.com/__/auth/handler` で **The requested action is invalid**、Console に **`getProjectConfig` 403** | ① ブラウザ用 **API キー**の **HTTP リファラー**に **`https://<projectId>.firebaseapp.com/*`** を追加。② 同じキーの **API の制限**で **Identity Toolkit API**（および必要なら **Token Service API**）が許可されているか確認。「キーを制限しない」にすると切り分けしやすい。③ **別の API キー**を編集していないか（Firebase の `apiKey` と一致するキーか） |

---

## 参照

- [09_cloud_sync_firebase_spec.md](./09_cloud_sync_firebase_spec.md) — 同期仕様・エラー UX  
- [README の Firebase 概要](../README.md) — リポジトリトップからの入口  
