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

1. Cloudflare 右上の **プロフィールアイコン** → **「マイプロフィール」** などから **「API トークン」** を開く。  
   - 直接 URL: ダッシュボードの **「マイプロフィール」→「API トークン」**  
2. **「トークンを作成」** → **「カスタムトークンを作成」**（または **Create Custom Token**）。  
3. **名前**は分かりやすく（例: `github-actions-pages-jcsqe`）。  
4. **権限（Permissions）** で、少なくとも次を含める（表示名は英語のことが多いです）。

   - **Account**（アカウント）  
     - **Cloudflare Pages** → **Edit**（編集）  
   - 足りないと言われたら、次も足すことがある:  
     - **Account** → **Workers Scripts** → **Edit**  
     - または **Account** → **Account Settings** → **Read**

   **「テンプレート」** に **「Edit Cloudflare Workers」** のようなものがあれば、それを選んでから **Pages の Edit** を追加する、というやり方でもよいです。

5. **アカウントのリソース**は **「このアカウントを含む」** のように、**自分のアカウントだけ**に絞る。  
6. **「続行」→「トークンを作成」** まで進む。  
7. 表示された **長い文字列をコピー**し、**この画面を閉じると二度と見られない**ので、メモ帳に貼る（あとで GitHub に入れる）。

これが **`CLOUDFLARE_API_TOKEN`** です。

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
| プロジェクトが無い / 名前不一致 | Cloudflare の **プロジェクト名**が `jcsqe-study-app` 等と一致しているか。変えたなら **Variables** の `CF_PAGES_PROJECT_*` |
| サイトは出るがログインできない | Firebase の **承認済みドメイン**に、その **`○○.pages.dev`** を入れたか。 |
| API キー制限で弾かれる | Google Cloud の **API キー**の **HTTP リファラー**に `https://jcsqe-study-app.pages.dev/*` などを入れたか。 |

---

## 関連リンク

- [environments.md](./environments.md) — ブランチと URL の対応一覧  
- [deploy-cloudflare-pages.yml](../.github/workflows/deploy-cloudflare-pages.yml) — 自動化の中身  

---

## 補足: コマンドでプロジェクトだけ作りたい場合（上級者向け）

PC に Node.js があり、Cloudflare にログインできるなら、例:

```bash
npx wrangler@latest login
npx wrangler@latest pages project create jcsqe-study-app
npx wrangler@latest pages project create jcsqe-study-app-staging
```

ダッシュボードで名前が揃っていれば、**3 章の手順はスキップ**しても構いません。
