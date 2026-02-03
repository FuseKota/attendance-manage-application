"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Stack,
  Divider,
  CircularProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import CoffeeIcon from "@mui/icons-material/Coffee";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ja } from "date-fns/locale";

import type { WorkSession, WorkSessionWithBreaks } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/departments";
import { PROJECT_CHANNELS } from "@/lib/projectChannels";
import {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
} from "@/app/actions/attendance";

interface TodayClientProps {
  initialSession: WorkSessionWithBreaks | null;
  todayFinishedSession: WorkSession | null;
  hasSlackUserId: boolean;
}

type WorkStatus = "not_started" | "working" | "on_break" | "finished";

function getStatus(
  session: WorkSessionWithBreaks | null,
  finishedSession: WorkSession | null
): WorkStatus {
  if (!session) {
    if (finishedSession) return "finished";
    return "not_started";
  }
  if (session.end_at) return "finished";

  const hasOpenBreak = session.breaks.some((b) => !b.end_at);
  if (hasOpenBreak) return "on_break";

  return "working";
}

function formatTime(dateString: string): string {
  const date = toZonedTime(new Date(dateString), "Asia/Tokyo");
  return format(date, "HH:mm", { locale: ja });
}

function formatDateTime(dateString: string): string {
  const date = toZonedTime(new Date(dateString), "Asia/Tokyo");
  return format(date, "M/d (E) HH:mm", { locale: ja });
}

export default function TodayClient({
  initialSession,
  todayFinishedSession,
  hasSlackUserId,
}: TodayClientProps) {
  const [session, setSession] = useState<WorkSessionWithBreaks | null>(
    initialSession
  );
  const [finishedSession, setFinishedSession] = useState<WorkSession | null>(
    todayFinishedSession
  );
  const [dept, setDept] = useState(DEPARTMENTS[0].id);
  const [projectChannel, setProjectChannel] = useState(PROJECT_CHANNELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slackError, setSlackError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const status = getStatus(session, finishedSession);

  // 現在時刻の更新（1秒ごと）
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = async () => {
    setLoading(true);
    setError("");

    const selectedChannel = PROJECT_CHANNELS.find(
      (c) => c.id === projectChannel
    );
    if (!selectedChannel) {
      setError("プロジェクトを選択してください");
      setLoading(false);
      return;
    }

    const selectedDept = DEPARTMENTS.find((d) => d.id === dept);
    if (!selectedDept) {
      setError("事業部を選択してください");
      setLoading(false);
      return;
    }

    const result = await clockIn(
      selectedDept.name,
      selectedChannel.id,
      selectedChannel.name
    );

    if (!result.success) {
      setError(result.error || "出勤処理に失敗しました");
    } else if (result.data) {
      setSession({ ...(result.data as WorkSession), breaks: [] });
      setFinishedSession(null);
    }

    setLoading(false);
  };

  const handleClockOut = async () => {
    if (!session) return;

    setLoading(true);
    setError("");
    setSlackError("");

    const result = await clockOut(session.id);

    if (!result.success) {
      setError(result.error || "退勤処理に失敗しました");
      setLoading(false);
      return;
    }

    const updatedSession = result.data as WorkSession;
    setSession(null);
    setFinishedSession(updatedSession);

    // Slack送信
    if (hasSlackUserId) {
      try {
        const slackResponse = await fetch("/api/slack/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: updatedSession.id }),
        });

        if (!slackResponse.ok) {
          const data = await slackResponse.json();
          setSlackError(data.error || "Slack送信に失敗しました");
        } else {
          // 成功したらslack_posted_atを更新
          setFinishedSession((prev) =>
            prev ? { ...prev, slack_posted_at: new Date().toISOString() } : null
          );
        }
      } catch {
        setSlackError("Slack送信でエラーが発生しました");
      }
    }

    setLoading(false);
  };

  const handleStartBreak = async () => {
    if (!session) return;

    setLoading(true);
    setError("");

    const result = await startBreak(session.id);

    if (!result.success) {
      setError(result.error || "休憩開始に失敗しました");
    } else if (result.data) {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              breaks: [...prev.breaks, result.data as WorkSessionWithBreaks["breaks"][0]],
            }
          : null
      );
    }

    setLoading(false);
  };

  const handleEndBreak = async () => {
    if (!session) return;

    setLoading(true);
    setError("");

    const result = await endBreak(session.id);

    if (!result.success) {
      setError(result.error || "休憩終了に失敗しました");
    } else {
      // 休憩終了を反映
      setSession((prev) => {
        if (!prev) return null;
        const updatedBreaks = prev.breaks.map((b) =>
          !b.end_at ? { ...b, end_at: new Date().toISOString() } : b
        );
        return { ...prev, breaks: updatedBreaks };
      });
    }

    setLoading(false);
  };

  const handleResendSlack = async () => {
    if (!finishedSession) return;

    setLoading(true);
    setSlackError("");

    try {
      const response = await fetch("/api/slack/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: finishedSession.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        setSlackError(data.error || "Slack再送信に失敗しました");
      } else {
        setFinishedSession((prev) =>
          prev ? { ...prev, slack_posted_at: new Date().toISOString() } : null
        );
        setSlackError("");
      }
    } catch {
      setSlackError("Slack再送信でエラーが発生しました");
    }

    setLoading(false);
  };

  const statusConfig = {
    not_started: { label: "未出勤", color: "default" as const },
    working: { label: "勤務中", color: "success" as const },
    on_break: { label: "休憩中", color: "warning" as const },
    finished: { label: "退勤済み", color: "info" as const },
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* 現在時刻 */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h3" component="div">
          {format(toZonedTime(currentTime, "Asia/Tokyo"), "HH:mm:ss")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {format(toZonedTime(currentTime, "Asia/Tokyo"), "yyyy年M月d日 (E)", {
            locale: ja,
          })}
        </Typography>
      </Box>

      {/* ステータス */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Chip
          label={statusConfig[status].label}
          color={statusConfig[status].color}
          size="medium"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {slackError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {slackError}
          {finishedSession && !finishedSession.slack_posted_at && (
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleResendSlack}
              disabled={loading}
              sx={{ ml: 1 }}
            >
              再送信
            </Button>
          )}
        </Alert>
      )}

      {/* 勤務情報 */}
      {(session || finishedSession) && (
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>出勤:</strong>{" "}
              {formatDateTime((session || finishedSession)!.start_at)}
            </Typography>
            {(session || finishedSession)!.end_at && (
              <Typography variant="body2">
                <strong>退勤:</strong>{" "}
                {formatDateTime((session || finishedSession)!.end_at!)}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>事業部:</strong> {(session || finishedSession)!.dept}
            </Typography>
            <Typography variant="body2">
              <strong>プロジェクト:</strong>{" "}
              {(session || finishedSession)!.project_channel_name}
            </Typography>
            {session && session.breaks.length > 0 && (
              <Typography variant="body2">
                <strong>休憩:</strong>{" "}
                {session.breaks.map((b, i) => (
                  <span key={b.id}>
                    {i > 0 && ", "}
                    {formatTime(b.start_at)}-{b.end_at ? formatTime(b.end_at) : ""}
                  </span>
                ))}
              </Typography>
            )}
          </Stack>
          <Divider sx={{ mt: 2 }} />
        </Box>
      )}

      {/* 未出勤時・退勤済み時：事業部・プロジェクト選択 */}
      {(status === "not_started" || status === "finished") && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>事業部</InputLabel>
            <Select
              value={dept}
              label="事業部"
              onChange={(e) => setDept(e.target.value)}
            >
              {DEPARTMENTS.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>プロジェクト</InputLabel>
            <Select
              value={projectChannel}
              label="プロジェクト"
              onChange={(e) => setProjectChannel(e.target.value)}
            >
              {PROJECT_CHANNELS.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* アクションボタン */}
      <Stack spacing={2}>
        {(status === "not_started" || status === "finished") && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            onClick={handleClockIn}
            disabled={loading}
          >
            {status === "finished" ? "再出勤" : "出勤"}
          </Button>
        )}

        {status === "working" && (
          <>
            <Button
              variant="outlined"
              color="warning"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} /> : <CoffeeIcon />}
              onClick={handleStartBreak}
              disabled={loading}
            >
              休憩開始
            </Button>
            <Button
              variant="contained"
              color="error"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} /> : <StopIcon />}
              onClick={handleClockOut}
              disabled={loading}
            >
              退勤
            </Button>
          </>
        )}

        {status === "on_break" && (
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            onClick={handleEndBreak}
            disabled={loading}
          >
            休憩終了
          </Button>
        )}

        {status === "finished" && finishedSession && !finishedSession.slack_posted_at && hasSlackUserId && (
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            fullWidth
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            onClick={handleResendSlack}
            disabled={loading}
          >
            Slackに再送信
          </Button>
        )}

        {status === "finished" && finishedSession?.slack_posted_at && (
          <Alert severity="success">Slack送信済み</Alert>
        )}
      </Stack>
    </Paper>
  );
}
