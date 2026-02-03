"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserSettings } from "@/lib/types";

export interface SettingsActionResult {
  success: boolean;
  error?: string;
  data?: UserSettings;
}

/**
 * ユーザー設定を取得
 */
export async function getUserSettings(): Promise<UserSettings | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // 設定がなければデフォルト値を返す
  if (!settings) {
    return {
      user_id: user.id,
      timezone: "Asia/Tokyo",
      slack_user_id: null,
    };
  }

  return settings;
}

/**
 * ユーザー設定を保存（upsert）
 */
export async function saveUserSettings(
  slackUserId: string
): Promise<SettingsActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "認証が必要です" };
  }

  // Slack User IDの形式チェック（Uで始まる）
  if (slackUserId && !slackUserId.match(/^U[A-Z0-9]+$/)) {
    return {
      success: false,
      error: "Slack User IDはUで始まる形式（例: U01234ABCD）で入力してください",
    };
  }

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        slack_user_id: slackUserId || null,
        timezone: "Asia/Tokyo",
      },
      {
        onConflict: "user_id",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Save settings error:", error);
    return { success: false, error: "設定の保存に失敗しました" };
  }

  revalidatePath("/settings");
  revalidatePath("/today");
  return { success: true, data };
}
