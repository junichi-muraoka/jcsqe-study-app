# Cloudflare Pages 初回セットアップ（丁寧版）

このドキュメントは、**JCSQE アプリを `https://○○.pages.dev` で公開する**ための、**初めての人向けの手順**です。

## 全体のイメージ（先に読む）

| やること | どこで |
|----------|--------|
| Cloudflare に「この名前の Pages プロジェクトを 2 つ用意する」 | Cloudflare のサイト |
| 「GitHub から自動デプロイしていいよ」と証明するトークンを作る | Cloudflare のサイト |
| トークンとアカウント ID を GitHub に秘密で渡す | GitHub のリポジトリ設定 |
| （ログインを使うなら）Firebase に「この URL からログインしていい」と書く | Firebase のサイト |
| デプロイを 1 回走らせる | GitHub の Actions |

**GitHub Pages（`github.io`）とは別の URL**ですが、**中身のアプリは同じ**です。どちらか一方だけでも動きます。

---

## 0. 用意するもの

- **Cloudflare のアカウント**（無料でよい）[サインアップ](https://dash.cloudflare.com/sign-up)
- **このリポジトリの管理者権限**（GitHub の Settings で Secrets を追加できること）

---

## 1. Cloudflare にログインする

1. ブラウザで **[https://dash.cloudflare.com/](https://dash.cloudflare.com/)** を開く。  
2. アカウントにログインする（初めてならメール認証などを済ませる）。

---

## 2. アカウント ID をメモする（あとで GitHub に貼る）

1. ダッシュボードの **右サイドバー**を見る。  
2. **「アカウント ID」** と書かれた **英数字 32 文字くらい**の文字列がある（例: `a1b2c3d4e5f6...`）。  
3. それを **コピー**して、メモ帳などに **仮で貼っておく**。  
   - 見つからないとき: 左メニュー **「Workers と Pages」**（または **Workers & Pages**）を開いても、概要に **アカウント ID** が出ることが多い。

これが **`CLOUDFLARE_ACCOUNT_ID`** になります。

---

## 3. Pages 用のプロジェクトを「2 つ」作る

GitHub Actions は、次の **名前のプロジェクト**にファイルを流し込みます（デフォルト）。

| 役割 | プロジェクト名（デフォルト） |
|------|------------------------------|
| 本番（`master` / `main`） | `jcsqe-study-app` |
| 検証（`staging` / `develop`） | `jcsqe-study-app-staging` |

**重要:**  
- **GitHub と Cloudflare を「リポジトリ連携」でつなぐ必要はありません。** このリポジトリは **GitHub Actions が `wrangler` でアップロード**する方式です。  
- 先に Cloudflare 側に **同じ名前の空のプロジェクト**があれば、その後の `pages deploy` が成功しやすいです。

### 3-0. ターミナルで自動作成（推奨・ZIP 不要）

**ブラウザで ZIP を作らず**、**Wrangler CLI** でプロジェクト名だけ作成できます（初回のみ）。

1. このリポジトリのルートでターミナルを開く（`package.json` があるフォルダ）。  
2. **一度だけ** Cloudflare にログインする:

   ```bash
   npm run cf:login
   ```

   ブラウザが開いたら **許可**し、ターミナルに成功と出るまで待つ。

3. **本番・検証の 2 プロジェクトをまとめて作成**する:

   ```bash
   npm run cf:pages:create
   ```

4. 成功したら **Workers & Pages** の一覧に **`jcsqe-study-app`** と **`jcsqe-study-app-staging`** が出る。

**注意:**

- **すでに同名のプロジェクトがある**と「既に存在する」系のエラーになる。そのときは **スキップしてよい**（またはダッシュボードで名前を変えてから `package.json` のスクリプト内の名前を合わせる）。  
- Wrangler 3.114 以降は **`--production-branch`** が必須のため、スクリプトでは本番を `master`、検証を `staging` に固定している（Git 連携なしでも API 上の指定として必要）。  
- Node.js が入っていることが前提（`npm test` が動く環境ならだいたいよい）。

この方法で済んだら、**3-A（ダッシュボード）や index.html ZIP は不要**です。

### 3-A. ダッシュボードから作る（一般的）

画面の表記はアップデートで変わることがあります。次の **考え方**で探してください。

1. 左メニューから **「Workers と Pages」** または **「Workers & Pages」** を開く。  
2. **「作成」** や **「Create」**、**「アプリケーションを作成」** のようなボタンがあるので押す。  
3. **「Pages」** を選ぶ（Workers ではなく **Pages**）。  
4. **「Git プロバイダに接続」** のような選択肢が出たら、**それは選ばない**（このプロジェクトは GitHub Actions から送るため）。  
5. **「アップロード」** / **「ダイレクトアップロード」** / **「Create a project」** など、**ZIP やフォルダをアップロードする系**の流れの中で、**プロジェクト名**を聞かれたら  
   - 1 つ目: **`jcsqe-study-app`**  
   - もう一度同様の手順で 2 つ目: **`jcsqe-study-app-staging`**  
6. **中身は空でも最小でもよい**（あとで GitHub Actions が上書きする）。もし **ZIP が必須**なら、中身が `index.html` だけの ZIP を 1 個作ってアップロードしてもよい。

**プロジェクト一覧に、上の 2 つの名前が並べば OK** です。

### 3-B. 名前を変えたい場合

Cloudflare 側の名前を **`my-app-prd`** のように別名にしたいときは、GitHub リポジトリで:

1. **Settings → Secrets and variables → Actions** を開く。  
2. **「Variables」** タブ（Secrets ではなく **Variables**）を開く。  
3. **New repository variable** で次を追加する。

| Name | Value（例） |
|------|----------------|
| `CF_PAGES_PROJECT_PRODUCTION` | 本番用に付けた Cloudflare のプロジェクト名 |
| `CF_PAGES_PROJECT_STAGING` | 検証用に付けた Cloudflare のプロジェクト名 |

未設定のときだけ、ワークフローは **`jcsqe-study-app` / `jcsqe-study-app-staging`** を使います。

---

## 4. API トークンを作る（GitHub に渡す「パスワード」）

GitHub Actions の **`wrangler pages deploy`** は、このトークンで Cloudflare に「ファイルを載せていい」と証明します。**権限が足りない**と `Authentication error [code: 10000]` などで失敗します。

### 4-1. API トークンの画面を開く

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログインする。  
2. 画面 **右上** の **人型アイコン（プロフィール）** をクリックする。  
3. メニューから **「マイプロフィール」** または **「My Profile」** を選ぶ。  
4. 上のタブまたは左メニューから **「API トークン」** / **「API Tokens」** を開く。  
   - 直接 URL の例: `https://dash.cloudflare.com/profile/api-tokens`（ログイン済みなら開ける）

### 4-2. カスタムトークンを新規作成する

1. **「トークンを作成」** / **「Create Token」** をクリック。  
2. **「カスタムトークンを作成」** / **「Create Custom Token」** を選ぶ（**「テンプレートから作成」だけ**だと Pages 用が足りないことがある）。

### 4-3. トークン名

- **トークン名**（任意）: 例 `github-actions-jcsqe-pages`  
  あとから「何用か」分かる名前にしておく。

### 4-4. 権限（Permissions）を足す（ここが最重要）

**「権限を追加」** / **「Add」** のようなボタンで、行を **1 行ずつ** 追加します。UI は英語のことが多いです。

**必須（これが無いと `pages deploy` が通らないことが多い）**

| 列「権限の種類」で選ぶグループ | 列「リソース」で選ぶ項目 | 列「アクション」で選ぶ |
|--------------------------------|--------------------------|-------------------------|
| **Account** | **Cloudflare Pages** | **Edit** |

- 1 行目を追加するとき: **「Account」** → ドロップダウンで **「Cloudflare Pages」** → さらに **「Edit」**（編集）。

**GitHub Actions のログに「アカウントを読めない」「membership」などと出る場合に追加する**

| Account | Account Settings | **Read** |

**それでも足りないときに試す（環境により表記が違う）**

| Account | Workers Scripts | **Edit** |

**注意:** **「Edit Cloudflare Workers」テンプレート**だけでは **Pages の Edit が含まれていない**ことがあります。**必ず「Cloudflare Pages → Edit」が一覧に出ているか**確認してください。

### 4-5. アカウントの範囲（Account Resources）

- **「アカウントのリソース」** / **「Account Resources」** で、**すべてのアカウント**ではなく、**このトークンを使う Cloudflare アカウント**が選ばれているか確認する。  
- 通常は **「次のアカウントを含む」** / **Include** → ドロップダウンで **自分のメールに紐づくアカウント** を選べばよい。

### 4-6. 作成とコピー

1. 画面下の **「続行」** / **「Continue to summary」** → 内容を確認。  
2. **「トークンを作成」** / **「Create Token」** を押す。  
3. 表示された **長い文字列（シークレット）をコピー**する。  
   - **この画面を閉じると二度と表示されません。** メモ帳に必ず貼る。

### 4-7. GitHub の Secret を更新する（既に名前がある場合）

1. GitHub リポジトリ → **Settings** → **Secrets and variables** → **Actions**。  
2. 一覧の **`CLOUDFLARE_API_TOKEN`** の右の **鉛筆（編集）** をクリック。  
3. **値**を、**4-6 でコピーした新しい文字列**に **貼り替える**。  
4. **Update secret** を保存する。

**新規で作る場合**は **「New repository secret」** で Name を **`CLOUDFLARE_API_TOKEN`** にする（大文字小文字そのまま）。

### 4-8. 動作確認

- **Actions** → **Deploy Cloudflare Pages** → **Run workflow**（`master`）で、**Deploy to Cloudflare Pages** ステップが **緑**になれば OK です。

これが **`CLOUDFLARE_API_TOKEN`** の入れ替え手順です。

---

## 5. GitHub に Secrets を登録する

1. ブラウザで **GitHub のこのリポジトリ**を開く（例: `junichi-muraoka/jcsqe-study-app`）。  
2. 上メニュー **「Settings」**（リポジトリの設定）。  
3. 左メニュー **「Secrets and variables」** → **「Actions」**。  
4. **「New repository secret」** を押す。

次の **2 つ**を、**名前と値が一字違いもなく**追加する。

| Name（名前） | Secret（値） |
|--------------|--------------|
| `CLOUDFLARE_API_TOKEN` | 手順 4 でコピーした **長いトークン** |
| `CLOUDFLARE_ACCOUNT_ID` | 手順 2 でコピーした **32 文字くらいの ID** |

**すでに GitHub Pages 用に入れている `FIREBASE_WEB_CONFIG_JSON`** は、**そのままでよい**です（Cloudflare のデプロイでも同じ Secret が使われます）。未設定なら Firebase はオフのまま配信されます。

---

## 6. Firebase の「承認済みドメイン」（Google ログインを使う場合だけ）

Cloudflare の URL は **`https://jcsqe-study-app.pages.dev`** のような **ホスト**になります。Firebase は **「このホストからのログインは許可」** の一覧が必要です。

1. **[Firebase Console](https://console.firebase.google.com/)** → プロジェクト **`jcsqe-study-app`**。  
2. 左 **「Authentication」**（認証）→ **「設定」** タブ → **「承認済みドメイン」**。  
3. **「ドメインを追加」** で、次を **1 行ずつ**（**`https://` は付けない**）。

   - `jcsqe-study-app.pages.dev`  
   - `jcsqe-study-app-staging.pages.dev`（検証 URL も使う場合）

詳しい表記は [firebase_manual_setup.md](./firebase_manual_setup.md) のフェーズ E も参照。

---

## 7. デプロイを実行して確認する

1. GitHub の **「Actions」** タブを開く。  
2. 左の一覧から **「Deploy Cloudflare Pages」** を選ぶ。  
3. **「Run workflow」** → ブランチで **`master`** を選んで **実行**。  
4. 緑のチェックになれば成功。失敗ならログを開き、**英語のエラー**を [トラブルシュート](#トラブルシュート) と照らす。

成功後:

- Cloudflare の **Workers & Pages** で、該当プロジェクトを開くと **デプロイ履歴** と **`*.pages.dev` の URL** が表示される。  
- ブラウザでその URL を開き、アプリが表示されれば OK。

**検証環境**を試すには、**`staging` ブランチ**に変更を push するか、ワークフローを **`staging` ブランチ**で実行する。

---

## トラブルシュート

| 症状・ログの例 | まず確認すること |
|----------------|------------------|
| `Invalid API Token` / 401 | トークンをコピペミスしていないか。権限に **Pages の Edit** があるか。 |
| **`https://master.<プロジェクト>.pages.dev` には出るのに、ルートの `https://<プロジェクト>.pages.dev` だけ「Nothing is here yet」** | **Production branch** が CI の `--branch`（本番は `master` または `main`）と一致していない。Direct Upload プロジェクトはダッシュボードで変更できないことがあり、[Pages Update Project API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/edit/) で `production_branch` を合わせる（下記）。 |
| プロジェクトが無い / 名前不一致 | Cloudflare の **プロジェクト名**が `jcsqe-study-app` 等と一致しているか。変えたなら **Variables** の `CF_PAGES_PROJECT_*` |
| サイトは出るがログインできない | Firebase の **承認済みドメイン**に、その **`○○.pages.dev`** を入れたか。 |
| API キー制限で弾かれる | Google Cloud の **API キー**の **HTTP リファラー**に `https://jcsqe-study-app.pages.dev/*` などを入れたか。 |

**ルート `*.pages.dev` が空のとき（`production_branch` の合わせ方）**  
アカウント ID・API トークン（Pages:Edit）を入れて実行する（本番ブランチが `master` の例）:

```bash
curl --request PATCH \
  "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/pages/projects/jcsqe-study-app" \
  --header "Authorization: Bearer <CLOUDFLARE_API_TOKEN>" \
  --header "Content-Type: application/json" \
  --data "{\"production_branch\": \"master\"}"
```

成功後、もう一度 **Deploy Cloudflare Pages** を実行するか `master` に push する。

---

## 注意事項・絶対にやってはいけないこと

### 秘密情報（最優先）

| やってはいけないこと | 理由 |
|----------------------|------|
| **`CLOUDFLARE_API_TOKEN`・`FIREBASE_WEB_CONFIG_JSON`・本番の `firebaseConfig` を、リポジトリのファイルに書いて `git commit` する** | 公開リポジトリなら **誰でも見える**。過去に問題になったのはこれ。 |
| **API トークンや Secret の値を、Issue・PR・コメント・README・チャットに貼る** | 履歴に残り **即漏洩**。貼ってしまったら **トークンを Cloudflare 側で無効化**し、**新しい Secret** を登録する。 |
| **キーやトークンが写ったスクリーンショットを公開する** | 画像でも読み取られる。 |

**入れる場所は GitHub の「Actions の Secrets」だけ**（ローカル用の `firebase-config.js` を編集するのはよいが、**本番の値をコミットしない**）。

### Cloudflare まわり

| やってはいけないこと | 理由 |
|----------------------|------|
| **Cloudflare のダッシュボードで、同じ GitHub リポジトリを「Git 連携」して自動ビルドも有効にし、同時にこの Actions の `pages deploy` も使う** | **二重デプロイ・設定の食い違い**の原因になる。どちらか一方に寄せる（このリポジトリの想定は **Actions からのデプロイ**）。 |
| **API トークンを無効化したのに、GitHub の Secret を更新しない** | デプロイが **ずっと失敗**する。トークンを作り直したら **必ず GitHub の値も差し替える**。 |
| **プロジェクト名を Cloudflare で変えたのに、`CF_PAGES_PROJECT_*` やデフォルト名と揃えない** | **別のプロジェクトにデプロイ**したり、**存在しない名前**で失敗したりする。 |

### Firebase（ログインする場合）

| やってはいけないこと | 理由 |
|----------------------|------|
| **承認済みドメインに `https://jcsqe-study-app.pages.dev` のように `https://` 付きで追加する** | **ホスト名だけ**が正しい。付けると **登録ミス**になりやすい。 |
| **Firestore ルールを「誰でも読み書き」に広げてトラブルを回避する** | **全ユーザのデータが漏れる**。ルールは [firestore.rules](../firestore.rules) の方針を維持する。 |

### Google Cloud（API キー）

| やってはいけないこと | 理由 |
|----------------------|------|
| **ブラウザ用 API キーの「アプリケーションの制限」を「なし」のまま放置する** | キーがどこからでも使える状態になり **悪用されやすい**。**HTTP リファラー**で配信オリジンに限定する。 |

### 運用上の心がけ

- **`npm test` を通さずに Secrets だけいじる**と、別の問題でデプロイが落ちることがある。**ローカルでも `npm test`** を一度走らせると安心。
- 詳細は [security.md](./security.md)（シークレット検査・公開リポジトリの前提）も参照。

---

## 関連リンク

- [environments.md](./environments.md) — ブランチと URL の対応一覧  
- [deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) — 自動化の中身  

---

## 補足: `npm run` と同じコマンド

`package.json` では **`npm run cf:login`** と **`npm run cf:pages:create`** に上記と同じ処理が入っています。手で打つなら:

```bash
npx wrangler@3 login
npx wrangler@3 pages project create jcsqe-study-app --production-branch=master
npx wrangler@3 pages project create jcsqe-study-app-staging --production-branch=staging
```
