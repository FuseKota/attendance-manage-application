// Database types
export interface WorkSession {
  id: string;
  user_id: string;
  dept: string;
  project_channel_id: string;
  project_channel_name: string;
  start_at: string;
  end_at: string | null;
  note: string | null;
  slack_posted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Break {
  id: string;
  session_id: string;
  start_at: string;
  end_at: string | null;
}

export interface UserSettings {
  user_id: string;
  timezone: string;
  slack_user_id: string | null;
}

// UI types
export type WorkStatus = "not_started" | "working" | "on_break" | "finished";

export interface ProjectChannel {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
}

// Slack Workflow payload (flat structure required)
export interface SlackWorkflowPayload {
  user_id: string;
  dept: string;
  project_channel: string;
  start_at: string;
  end_at: string;
}

// Session with breaks for display
export interface WorkSessionWithBreaks extends WorkSession {
  breaks: Break[];
}
