import type { SlackWorkflowPayload } from "./types";

export interface SlackSendResult {
  success: boolean;
  error?: string;
}

/**
 * Slack Workflow Webhook にペイロードを送信
 *
 * 注意: Slack Workflow Builder の "From a webhook" トリガーはフラットなJSONのみ受け付ける
 */
export async function sendSlackWorkflow(
  payload: SlackWorkflowPayload
): Promise<SlackSendResult> {
  const webhookUrl = process.env.SLACK_WORKFLOW_TRIGGER_URL;

  if (!webhookUrl) {
    return {
      success: false,
      error: "SLACK_WORKFLOW_TRIGGER_URL が設定されていません",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        success: false,
        error: `Slack送信失敗: ${response.status} ${response.statusText} - ${errorText}`,
      };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Slack送信エラー: ${message}`,
    };
  }
}

/**
 * 日時を Slack Workflow 用フォーマットに変換
 * 形式: YYYY/MM/DD HH:mm:ss (Asia/Tokyo)
 */
export function formatDateTimeForSlack(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  // Asia/Tokyo でフォーマット
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";

  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}
