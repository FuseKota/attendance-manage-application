"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { WorkSession, Break, WorkSessionWithBreaks, SlackWorkflowPayload } from "@/lib/types";
import { sendSlackWorkflow, formatDateTimeForSlack } from "@/lib/slackWorkflow";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: WorkSession | Break;
}

/**
 * 出勤処理
 */
export async function clockIn(
  dept: string,
  projectChannelId: string,
  projectChannelName: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "認証が必要です" };
  }

  // 既に勤務中のセッションがないか確認
  const { data: existingSession } = await supabase
    .from("work_sessions")
    .select("id")
    .eq("user_id", user.id)
    .is("end_at", null)
    .maybeSingle();

  if (existingSession) {
    return { success: false, error: "既に勤務中のセッションがあります" };
  }

  const { data, error } = await supabase
    .from("work_sessions")
    .insert({
      user_id: user.id,
      dept,
      project_channel_id: projectChannelId,
      project_channel_name: projectChannelName,
      start_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Clock in error:", error);
    return { success: false, error: "出勤処理に失敗しました" };
  }

  revalidatePath("/today");
  return { success: true, data };
}

/**
 * 退勤処理
 */
export async function clockOut(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "認証が必要です" };
  }

  // セッション取得
  const { data: session, error: fetchError } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !session) {
    return { success: false, error: "セッションが見つかりません" };
  }

  if (session.end_at) {
    return { success: false, error: "既に退勤済みです" };
  }

  // 未終了の休憩があれば終了させる
  await supabase
    .from("breaks")
    .update({ end_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .is("end_at", null);

  // 退勤時刻を記録
  const { data, error } = await supabase
    .from("work_sessions")
    .update({ end_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    console.error("Clock out error:", error);
    return { success: false, error: "退勤処理に失敗しました" };
  }

  revalidatePath("/today");
  revalidatePath("/history");
  return { success: true, data };
}

/**
 * 休憩開始
 */
export async function startBreak(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "認証が必要です" };
  }

  // セッション確認
  const { data: session } = await supabase
    .from("work_sessions")
    .select("id, end_at")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return { success: false, error: "セッションが見つかりません" };
  }

  if (session.end_at) {
    return { success: false, error: "退勤済みのセッションです" };
  }

  // 既に休憩中か確認
  const { data: existingBreak } = await supabase
    .from("breaks")
    .select("id")
    .eq("session_id", sessionId)
    .is("end_at", null)
    .maybeSingle();

  if (existingBreak) {
    return { success: false, error: "既に休憩中です" };
  }

  const { data, error } = await supabase
    .from("breaks")
    .insert({
      session_id: sessionId,
      start_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Start break error:", error);
    return { success: false, error: "休憩開始に失敗しました" };
  }

  revalidatePath("/today");
  return { success: true, data };
}

/**
 * 休憩終了
 */
export async function endBreak(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "認証が必要です" };
  }

  // 未終了の休憩を取得
  const { data: activeBreak, error: fetchError } = await supabase
    .from("breaks")
    .select("*, work_sessions!inner(user_id)")
    .eq("session_id", sessionId)
    .is("end_at", null)
    .single();

  if (fetchError || !activeBreak) {
    return { success: false, error: "休憩中ではありません" };
  }

  const { data, error } = await supabase
    .from("breaks")
    .update({ end_at: new Date().toISOString() })
    .eq("id", activeBreak.id)
    .select()
    .single();

  if (error) {
    console.error("End break error:", error);
    return { success: false, error: "休憩終了に失敗しました" };
  }

  revalidatePath("/today");
  return { success: true, data };
}

/**
 * 現在の勤務セッションを取得（休憩情報含む）
 */
export async function getCurrentSession(): Promise<WorkSessionWithBreaks | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: session } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("user_id", user.id)
    .is("end_at", null)
    .order("start_at", { ascending: false })
    .maybeSingle();

  if (!session) return null;

  const { data: breaks } = await supabase
    .from("breaks")
    .select("*")
    .eq("session_id", session.id)
    .order("start_at", { ascending: true });

  return {
    ...session,
    breaks: breaks || [],
  };
}

/**
 * 今日の退勤済みセッションを取得（Slack再送用）
 */
export async function getTodayFinishedSession(): Promise<WorkSession | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 今日の開始時刻（JST）
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: session } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("user_id", user.id)
    .not("end_at", "is", null)
    .gte("start_at", today.toISOString())
    .order("start_at", { ascending: false })
    .maybeSingle();

  return session;
}

/**
 * 履歴取得（休憩情報含む）
 */
export async function getWorkHistory(
  limit: number = 30
): Promise<WorkSessionWithBreaks[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: sessions } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("start_at", { ascending: false })
    .limit(limit);

  if (!sessions || sessions.length === 0) return [];

  // 全セッションの休憩を一括取得
  const sessionIds = sessions.map((s) => s.id);
  const { data: allBreaks } = await supabase
    .from("breaks")
    .select("*")
    .in("session_id", sessionIds)
    .order("start_at", { ascending: true });

  // セッションと休憩を結合
  return sessions.map((session) => ({
    ...session,
    breaks: allBreaks?.filter((b) => b.session_id === session.id) || [],
  }));
}

/**
 * Slack再送信（Server Action版）
 */
export async function resendSlack(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "認証が必要です" };
  }

  // セッション確認
  const { data: session } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return { success: false, error: "セッションが見つかりません" };
  }

  if (!session.end_at) {
    return { success: false, error: "退勤済みのセッションのみ再送信できます" };
  }

  if (session.slack_posted_at) {
    return { success: false, error: "既にSlack送信済みです" };
  }

  // ユーザー設定からslack_user_idを取得
  const { data: settings } = await supabase
    .from("user_settings")
    .select("slack_user_id")
    .eq("user_id", user.id)
    .single();

  const slackUserId = settings?.slack_user_id;

  if (!slackUserId) {
    return { success: false, error: "Slack User IDが設定されていません。設定画面で設定してください。" };
  }

  // Slack Workflow ペイロード作成
  const payload: SlackWorkflowPayload = {
    user_id: slackUserId,
    dept: session.dept,
    project_channel: session.project_channel_id,
    start_at: formatDateTimeForSlack(session.start_at),
    end_at: formatDateTimeForSlack(session.end_at),
  };

  // Slack送信
  const result = await sendSlackWorkflow(payload);

  if (!result.success) {
    return { success: false, error: result.error || "Slack送信に失敗しました" };
  }

  // 送信成功: slack_posted_at を更新
  const { error: updateError } = await supabase
    .from("work_sessions")
    .update({ slack_posted_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (updateError) {
    console.error("Failed to update slack_posted_at:", updateError);
    return { success: false, error: "Slack送信は成功しましたが、DB更新に失敗しました" };
  }

  revalidatePath("/today");
  revalidatePath("/history");
  return { success: true };
}
