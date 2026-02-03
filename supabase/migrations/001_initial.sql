-- =============================================
-- 勤怠管理アプリケーション - 初期スキーマ
-- =============================================

-- work_sessions テーブル
-- 勤務セッション（出勤〜退勤）を管理
CREATE TABLE IF NOT EXISTS work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dept TEXT NOT NULL,
  project_channel_id TEXT NOT NULL,
  project_channel_name TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NULL,
  note TEXT NULL,
  slack_posted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- breaks テーブル
-- 休憩時間を管理（1セッションに複数の休憩が可能）
CREATE TABLE IF NOT EXISTS breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NULL
);

-- user_settings テーブル
-- ユーザー設定を管理
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'Asia/Tokyo',
  slack_user_id TEXT NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_start_at ON work_sessions(start_at DESC);
CREATE INDEX IF NOT EXISTS idx_breaks_session_id ON breaks(session_id);

-- updated_at 自動更新用トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- work_sessions の updated_at 自動更新トリガー
DROP TRIGGER IF EXISTS update_work_sessions_updated_at ON work_sessions;
CREATE TRIGGER update_work_sessions_updated_at
  BEFORE UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security (RLS) 設定
-- =============================================

-- RLS 有効化
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- work_sessions ポリシー
-- =============================================

-- SELECT: 自分のセッションのみ閲覧可能
CREATE POLICY "Users can view own work_sessions"
  ON work_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: 自分のセッションのみ作成可能
CREATE POLICY "Users can insert own work_sessions"
  ON work_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: 自分のセッションのみ更新可能
CREATE POLICY "Users can update own work_sessions"
  ON work_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 自分のセッションのみ削除可能
CREATE POLICY "Users can delete own work_sessions"
  ON work_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- breaks ポリシー
-- =============================================

-- SELECT: 自分のセッションに紐づく休憩のみ閲覧可能
CREATE POLICY "Users can view own breaks"
  ON breaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_sessions
      WHERE work_sessions.id = breaks.session_id
        AND work_sessions.user_id = auth.uid()
    )
  );

-- INSERT: 自分のセッションに紐づく休憩のみ作成可能
CREATE POLICY "Users can insert own breaks"
  ON breaks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_sessions
      WHERE work_sessions.id = breaks.session_id
        AND work_sessions.user_id = auth.uid()
    )
  );

-- UPDATE: 自分のセッションに紐づく休憩のみ更新可能
CREATE POLICY "Users can update own breaks"
  ON breaks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM work_sessions
      WHERE work_sessions.id = breaks.session_id
        AND work_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_sessions
      WHERE work_sessions.id = breaks.session_id
        AND work_sessions.user_id = auth.uid()
    )
  );

-- DELETE: 自分のセッションに紐づく休憩のみ削除可能
CREATE POLICY "Users can delete own breaks"
  ON breaks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM work_sessions
      WHERE work_sessions.id = breaks.session_id
        AND work_sessions.user_id = auth.uid()
    )
  );

-- =============================================
-- user_settings ポリシー
-- =============================================

-- SELECT: 自分の設定のみ閲覧可能
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: 自分の設定のみ作成可能
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: 自分の設定のみ更新可能
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 自分の設定のみ削除可能
CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);
