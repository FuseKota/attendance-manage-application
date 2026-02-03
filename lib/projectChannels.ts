import type { ProjectChannel } from "./types";

// 仮データ：後でSlack API取得に差し替え可能
// getProjectChannels() を使うことで、将来的にAPI取得に変更しやすい設計
export const PROJECT_CHANNELS: ProjectChannel[] = [
  { id: "C0123ABCDE", name: "#20_プロダクト開発本部" },
  { id: "C0456FGHIJ", name: "#03_hp制作" },
  { id: "C0789KLMNO", name: "#41_hr-agent-os" },
  { id: "C1234PQRST", name: "#10_地域イベント" },
  { id: "C5678UVWXY", name: "#50_新規事業検討" },
];

// 将来的にSlack API取得に差し替える場合はこの関数を変更
export async function getProjectChannels(): Promise<ProjectChannel[]> {
  // TODO: Slack API から取得する場合はここを変更
  // const response = await fetch('/api/slack/channels');
  // return response.json();
  return PROJECT_CHANNELS;
}

export function getProjectChannelById(id: string): ProjectChannel | undefined {
  return PROJECT_CHANNELS.find((channel) => channel.id === id);
}
