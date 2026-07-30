# カケイボ

同棲者（風馬・ちか子）向けの家計簿・精算アプリ。Next.js (App Router) + Supabase + Recharts。

## セットアップ

1. [supabase.com](https://supabase.com) でプロジェクトを作成する。
2. SupabaseダッシュボードのSQL Editorで `supabase/migrations/0001_init.sql` の内容を実行する。
3. Project Settings → API から `Project URL` と `anon public` キーを取得する。
4. `.env.local.example` を `.env.local` にコピーし、取得した値を設定する。
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. 依存関係をインストールして開発サーバーを起動する。
   ```bash
   npm install
   npm run dev
   ```
   [http://localhost:3000](http://localhost:3000) を開く（`/input` にリダイレクトされる）。

## ページ構成

- `/input` — 支出の入力（折半額をリアルタイム計算・マイナス時はエラー）
- `/settlement` — 年月ごとの精算額・光熱費入力ステータス・明細一覧
- `/expenses` — 月次推移グラフ・個人別比較グラフ・費目別予算消化率
- `/fixed-costs` — 固定費（家賃・積立投資など）のマスタ管理。登録内容は初回アクセス時に自動でその月のトランザクションとして生成される（冪等）

## 認証について

このアプリに認証機能はない。ヘッダーの「風馬 / ちか子」切り替えはUI上の初期値プリフィルのみで、アクセス制御ではない。Supabaseの `anon` キーはクライアントに埋め込まれる前提のため、URLとキーを知っている人は誰でも読み書きできる。2人用の家計簿として許容範囲だが、より厳しくしたい場合はVercelのDeployment Protectionや `middleware.ts` でのBasic認証を検討する。

## デプロイ（Vercel）

1. GitHubにリポジトリを作成しpushする。
2. [vercel.com](https://vercel.com) で当該リポジトリをインポートする（Next.jsは自動検出される）。
3. Project Settings → Environment Variables に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定する。
4. `main` へのpushで自動デプロイされ、`https://xxx.vercel.app` のURLが発行される。
5. iPhoneのSafariでそのURLを開き、共有メニューから「ホーム画面に追加」を行うとアプリのように起動できる。
