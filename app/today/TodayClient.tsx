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
  CircularProgress,
  Card,
  CardContent,
  alpha,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import CoffeeIcon from "@mui/icons-material/Coffee";
import SendIcon from "@mui/icons-material/Send";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import BusinessIcon from "@mui/icons-material/Business";
import FolderIcon from "@mui/icons-material/Folder";
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
    not_started: { label: "未出勤", color: "default" as const, bgColor: "#f1f5f9" },
    working: { label: "勤務中", color: "success" as const, bgColor: "#dcfce7" },
    on_break: { label: "休憩中", color: "warning" as const, bgColor: "#fef3c7" },
    finished: { label: "退勤済み", color: "info" as const, bgColor: "#dbeafe" },
  };

  const currentSession = session || finishedSession;

  return (
    <Box>
      {/* 時計カード */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 2,
          textAlign: "center",
          background: `linear-gradient(135deg, ${alpha("#2563eb", 0.05)} 0%, ${alpha("#7c3aed", 0.05)} 100%)`,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h3"
          component="div"
          sx={{
            fontSize: { xs: "3rem", sm: "3.5rem" },
            fontWeight: 700,
            fontFamily: "monospace",
            color: "primary.main",
            letterSpacing: 2,
          }}
        >
          {format(toZonedTime(currentTime, "Asia/Tokyo"), "HH:mm:ss")}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          {format(toZonedTime(currentTime, "Asia/Tokyo"), "yyyy年M月d日 (EEEE)", {
            locale: ja,
          })}
        </Typography>
      </Paper>

      {/* ステータスバッジ */}
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Chip
          label={statusConfig[status].label}
          color={statusConfig[status].color}
          sx={{
            px: 2,
            py: 2.5,
            fontSize: "0.95rem",
            fontWeight: 600,
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {slackError && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            finishedSession && !finishedSession.slack_posted_at && (
              <Button
                color="inherit"
                size="small"
                onClick={handleResendSlack}
                disabled={loading}
              >
                再送信
              </Button>
            )
          }
        >
          {slackError}
        </Alert>
      )}

      {/* 勤務情報カード */}
      {currentSession && (
        <Card sx={{ mb: 2, overflow: "visible" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ flex: "1 1 45%", minWidth: 120 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    出勤
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={600}>
                  {formatTime(currentSession.start_at)}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 45%", minWidth: 120 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <WorkOutlineIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    退勤
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={600}>
                  {currentSession.end_at ? formatTime(currentSession.end_at) : "--:--"}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 45%", minWidth: 120 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <BusinessIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    事業部
                  </Typography>
                </Box>
                <Typography variant="body2" noWrap>
                  {currentSession.dept}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 45%", minWidth: 120 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <FolderIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    プロジェクト
                  </Typography>
                </Box>
                <Typography variant="body2" noWrap>
                  {currentSession.project_channel_name}
                </Typography>
              </Box>
            </Box>

            {session && session.breaks.length > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                  <CoffeeIcon fontSize="small" /> 休憩
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {session.breaks.map((b) => (
                    <Chip
                      key={b.id}
                      label={`${formatTime(b.start_at)} - ${b.end_at ? formatTime(b.end_at) : "..."}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* 事業部・プロジェクト選択 */}
      {(status === "not_started" || status === "finished") && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              次の勤務情報を選択
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
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

              <FormControl fullWidth size="small">
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
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* アクションボタン */}
      <Stack spacing={1.5}>
        {(status === "not_started" || status === "finished") && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleClockIn}
            disabled={loading}
            sx={{ py: 1.5 }}
          >
            {status === "finished" ? "再出勤" : "出勤する"}
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
              sx={{ py: 1.5 }}
            >
              休憩開始
            </Button>
            <Button
              variant="contained"
              color="error"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <StopIcon />}
              onClick={handleClockOut}
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              退勤する
            </Button>
          </>
        )}

        {status === "on_break" && (
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleEndBreak}
            disabled={loading}
            sx={{ py: 1.5 }}
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
            sx={{ py: 1.5 }}
          >
            Slackに送信
          </Button>
        )}

        {status === "finished" && finishedSession?.slack_posted_at && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            Slack送信完了
          </Alert>
        )}
      </Stack>
    </Box>
  );
}
