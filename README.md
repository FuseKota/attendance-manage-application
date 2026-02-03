# 勤怠管理アプリケーション

個人用勤怠管理アプリ。Next.js (App Router) + TypeScript + Supabase で構築。
退勤時に Slack Workflow Webhook を起動し、固定チャンネルへ勤怠情報を送信します。

## 機能

- 出勤/退勤/休憩開始/休憩終了（休憩は複数回OK）
- 事業部選択（固定リスト）
- プロジェクト（Slackチャンネル）選択
- 退勤時に Slack Workflow Webhook を起動
- 投稿に @自分 メンション（Slack user id を設定画面で保存）
- 二重投稿防止（slack_posted_at で管理）
- Slack送信失敗時の再送ボタン
- 履歴表示（セッション一覧 + 労働時間計算）

## 技術スタック

- Next.js 15 (App Router)
- TypeScript
- Supabase (Auth + Database)
- MUI (Material UI) v6
- date-fns / date-fns-tz

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、値を設定してください。

```bash
cp .env.local.example .env.local
```

必要な環境変数:

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SLACK_WORKFLOW_TRIGGER_URL` | Slack Workflow Webhook URL |
| `NEXT_PUBLIC_SITE_URL` | サイトURL（メール確認リダイレクト用、開発時は `http://localhost:3000`） |

### 3. Supabase データベース設定

Supabase の SQL Editor で `supabase/migrations/001_initial.sql` を実行してください。

このSQLは以下を作成します:
- `work_sessions` テーブル（勤務セッション）
- `breaks` テーブル（休憩時間）
- `user_settings` テーブル（ユーザー設定）
- RLS ポリシー（ユーザーは自分のデータのみアクセス可能）

### 4. Supabase Auth 設定

1. Supabase ダッシュボード > Authentication > Providers で Email を有効化
2. Supabase ダッシュボード > Authentication > URL Configuration で:
   - Site URL: `http://localhost:3000`（本番環境では実際のURL）
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 5. Slack Workflow 設定

1. Slack Workflow Builder で新しいワークフローを作成
2. トリガーとして「From a webhook」を選択
3. 以下の変数を設定:

| 変数名 | 型 | 説明 |
|--------|------|------|
| `user_id` | Text | Slack User ID（例: U01234ABCDE） |
| `dept` | Text | 事業部名 |
| `project_channel` | Text | プロジェクトのチャンネルID |
| `start_at` | Text | 出勤時刻（YYYY/MM/DD HH:mm:ss） |
| `end_at` | Text | 退勤時刻（YYYY/MM/DD HH:mm:ss） |

4. ワークフローのステップでこれらの変数を使用してメッセージを投稿
5. 生成された Webhook URL を `SLACK_WORKFLOW_TRIGGER_URL` に設定

### 6. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## 使い方

### 初回設定

1. `/signup` でアカウント作成
2. メールの確認リンクをクリック
3. `/login` でログイン
4. `/settings` で Slack User ID を設定
   - Slack でプロフィールを開き、「...」> 「メンバーIDをコピー」で取得

### 日常の操作

1. `/today` で事業部とプロジェクトを選択
2. 「出勤」ボタンをクリック
3. 休憩時は「休憩開始」「休憩終了」
4. 業務終了時に「退勤」
5. 退勤時に自動で Slack Workflow が起動

### 履歴確認

- `/history` で過去の勤怠一覧を確認
- 労働時間 = 退勤時刻 - 出勤時刻 - 休憩合計

## 動作確認手順

1. ログイン
2. 設定画面で Slack User ID を設定
3. 今日の勤怠画面で:
   - 事業部を選択
   - プロジェクトを選択
   - 「出勤」をクリック
4. ステータスが「勤務中」に変わることを確認
5. 「休憩開始」をクリック → ステータスが「休憩中」に
6. 「休憩終了」をクリック → ステータスが「勤務中」に戻る
7. 「退勤」をクリック
8. Slack の指定チャンネルに投稿されることを確認
9. 履歴画面で労働時間が計算されていることを確認

## プロジェクト構造

```
├── app/
│   ├── actions/          # Server Actions
│   │   ├── attendance.ts # 打刻ロジック
│   │   ├── auth.ts       # 認証
│   │   └── settings.ts   # 設定
│   ├── api/
│   │   └── slack/send/   # Slack送信 Route Handler
│   ├── auth/callback/    # 認証コールバック
│   ├── components/       # 共通コンポーネント
│   ├── history/          # 履歴ページ
│   ├── login/            # ログインページ
│   ├── settings/         # 設定ページ
│   ├── signup/           # 登録ページ
│   ├── today/            # 今日の勤怠ページ
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── supabase/         # Supabase クライアント
│   ├── departments.ts    # 事業部リスト
│   ├── projectChannels.ts # プロジェクトチャンネル（仮データ）
│   ├── slackWorkflow.ts  # Slack送信関数
│   ├── theme.ts          # MUI テーマ
│   └── types.ts          # 型定義
├── supabase/
│   └── migrations/
│       └── 001_initial.sql # DBスキーマ + RLS
└── middleware.ts         # 認証ミドルウェア
```

## デプロイ（Vercel）

1. Vercel にプロジェクトをインポート
2. Environment Variables を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SLACK_WORKFLOW_TRIGGER_URL`
   - `NEXT_PUBLIC_SITE_URL`（デプロイ後のURL）
3. Supabase の Redirect URLs にデプロイ先URLを追加

## 今後の拡張

- プロジェクト（チャンネル）を Slack API から取得
- 月次集計レポート
- CSV エクスポート
