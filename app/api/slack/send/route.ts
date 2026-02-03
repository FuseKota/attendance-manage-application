import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendSlackWorkflow,
  formatDateTimeForSlack,
} from "@/lib/slackWorkflow";
import type { SlackWorkflowPayload } from "@/lib/types";

interface SendSlackRequest {
  sessionId: string;
}

/**
 * POST /api/slack/send
 *
 * セッションIDを受け取り、Slack Workflowに送信する
 * 二重送信防止: slack_posted_at が null の場合のみ送信
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendSlackRequest = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 認証確認
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // セッション取得
    const { data: session, error: sessionError } = await supabase
      .from("work_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // 二重送信防止チェック
    if (session.slack_posted_at) {
      return NextResponse.json(
        { error: "Already posted to Slack", alreadyPosted: true },
        { status: 400 }
      );
    }

    // 退勤済みチェック
    if (!session.end_at) {
      return NextResponse.json(
        { error: "Session is not ended yet" },
        { status: 400 }
      );
    }

    // ユーザー設定からslack_user_idを取得
    const { data: settings } = await supabase
      .from("user_settings")
      .select("slack_user_id")
      .eq("user_id", user.id)
      .single();

    const slackUserId = settings?.slack_user_id;

    if (!slackUserId) {
      return NextResponse.json(
        { error: "Slack User ID is not configured. Please set it in Settings." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: result.error, slackError: true },
        { status: 500 }
      );
    }

    // 送信成功: slack_posted_at を更新
    const { error: updateError } = await supabase
      .from("work_sessions")
      .update({ slack_posted_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (updateError) {
      // Slackには送信済みだがDB更新失敗
      console.error("Failed to update slack_posted_at:", updateError);
      return NextResponse.json(
        {
          error: "Slack送信は成功しましたが、DB更新に失敗しました",
          slackSent: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Slack send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
