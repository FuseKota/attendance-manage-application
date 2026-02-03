"use client";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  Box,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  LinearProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TimerIcon from "@mui/icons-material/Timer";
import CoffeeIcon from "@mui/icons-material/Coffee";
import { format, differenceInMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ja } from "date-fns/locale";

import type { WorkSessionWithBreaks } from "@/lib/types";

interface HistoryClientProps {
  sessions: WorkSessionWithBreaks[];
}

function formatTime(dateString: string): string {
  const date = toZonedTime(new Date(dateString), "Asia/Tokyo");
  return format(date, "HH:mm", { locale: ja });
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分`;
  return `${hours}時間${mins}分`;
}

function calculateBreakMinutes(breaks: WorkSessionWithBreaks["breaks"]): number {
  return breaks.reduce((total, b) => {
    if (!b.end_at) return total;
    return total + differenceInMinutes(new Date(b.end_at), new Date(b.start_at));
  }, 0);
}

function calculateWorkMinutes(session: WorkSessionWithBreaks): number | null {
  if (!session.end_at) return null;

  const totalMinutes = differenceInMinutes(
    new Date(session.end_at),
    new Date(session.start_at)
  );
  const breakMinutes = calculateBreakMinutes(session.breaks);

  return totalMinutes - breakMinutes;
}

// モバイル用カードコンポーネント
function SessionCard({ session, isDark }: { session: WorkSessionWithBreaks; isDark: boolean }) {
  const breakMinutes = calculateBreakMinutes(session.breaks);
  const workMinutes = calculateWorkMinutes(session);
  const workProgress = workMinutes ? Math.min((workMinutes / 480) * 100, 100) : 0;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 0 }}>
        {/* ヘッダー */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            background: isDark
              ? "linear-gradient(135deg, rgba(96,165,250,0.08) 0%, rgba(167,139,250,0.08) 100%)"
              : "linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(124,58,237,0.05) 100%)",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            {format(
              toZonedTime(new Date(session.start_at), "Asia/Tokyo"),
              "M月d日 (E)",
              { locale: ja }
            )}
          </Typography>
          {session.end_at ? (
            session.slack_posted_at ? (
              <Chip
                icon={<CheckCircleIcon />}
                label="送信済"
                size="small"
                color="success"
                variant="outlined"
              />
            ) : (
              <Chip
                icon={<ScheduleIcon />}
                label="未送信"
                size="small"
                color="warning"
                variant="outlined"
              />
            )
          ) : (
            <Chip label="勤務中" size="small" color="success" />
          )}
        </Box>

        {/* コンテンツ */}
        <Box sx={{ px: 2.5, py: 2 }}>
          {/* 時間表示 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccessTimeIcon fontSize="small" color="primary" />
              <Typography variant="body1" fontWeight={500}>
                {formatTime(session.start_at)}
              </Typography>
            </Box>
            <Typography color="text.secondary">→</Typography>
            <Typography variant="body1" fontWeight={500}>
              {session.end_at ? formatTime(session.end_at) : "--:--"}
            </Typography>
          </Box>

          {/* 労働時間バー */}
          {workMinutes !== null && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <TimerIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    労働時間
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={workMinutes >= 480 ? "success.main" : "text.primary"}
                >
                  {formatDuration(workMinutes)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={workProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "rgba(96,165,250,0.15)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    background: workMinutes >= 480
                      ? "linear-gradient(90deg, #4ade80 0%, #22c55e 100%)"
                      : "linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)",
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                {workMinutes >= 480 ? "8時間達成" : `あと ${formatDuration(480 - workMinutes)}`}
              </Typography>
            </Box>
          )}

          {/* 休憩 */}
          {breakMinutes > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <CoffeeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                休憩 {formatDuration(breakMinutes)}
                {session.breaks.length > 1 && ` (${session.breaks.length}回)`}
              </Typography>
            </Box>
          )}

          {/* プロジェクト情報 */}
          <Box
            sx={{
              mt: 1.5,
              pt: 1.5,
              borderTop: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary" noWrap>
              {session.dept} / {session.project_channel_name}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// デスクトップ用テーブルコンポーネント
function SessionTable({ sessions, isDark }: { sessions: WorkSessionWithBreaks[]; isDark: boolean }) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
      <Table>
        <TableHead>
          <TableRow sx={{ background: isDark
            ? "linear-gradient(135deg, rgba(96,165,250,0.08) 0%, rgba(167,139,250,0.08) 100%)"
            : "linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(124,58,237,0.05) 100%)" }}>
            <TableCell sx={{ fontWeight: 600 }}>日付</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>出勤</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>退勤</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>休憩</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>労働時間</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>事業部</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>プロジェクト</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600 }}>Slack</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => {
            const breakMinutes = calculateBreakMinutes(session.breaks);
            const workMinutes = calculateWorkMinutes(session);

            return (
              <TableRow
                key={session.id}
                hover
                sx={{
                  "&:hover": {
                    bgcolor: isDark ? "rgba(96,165,250,0.05)" : "rgba(37,99,235,0.03)",
                  },
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {format(
                      toZonedTime(new Date(session.start_at), "Asia/Tokyo"),
                      "M/d (E)",
                      { locale: ja }
                    )}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatTime(session.start_at)}</Typography>
                </TableCell>
                <TableCell>
                  {session.end_at ? (
                    <Typography variant="body2">{formatTime(session.end_at)}</Typography>
                  ) : (
                    <Chip label="勤務中" size="small" color="success" />
                  )}
                </TableCell>
                <TableCell>
                  {breakMinutes > 0 ? (
                    <Box>
                      <Typography variant="body2">
                        {formatDuration(breakMinutes)}
                      </Typography>
                      {session.breaks.length > 1 && (
                        <Typography variant="caption" color="text.secondary">
                          ({session.breaks.length}回)
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {workMinutes !== null ? (
                    <Chip
                      label={formatDuration(workMinutes)}
                      size="small"
                      color={workMinutes >= 480 ? "success" : "default"}
                      variant={workMinutes >= 480 ? "filled" : "outlined"}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                    {session.dept}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                    {session.project_channel_name}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {session.slack_posted_at ? (
                    <CheckCircleIcon color="success" />
                  ) : session.end_at ? (
                    <ScheduleIcon color="warning" />
                  ) : (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function HistoryClient({ sessions }: HistoryClientProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDark = theme.palette.mode === "dark";

  if (sessions.length === 0) {
    return (
      <Paper
        sx={{
          p: 6,
          textAlign: "center",
          borderRadius: 3,
          background: isDark
            ? "linear-gradient(135deg, rgba(96,165,250,0.05) 0%, rgba(167,139,250,0.05) 100%)"
            : "linear-gradient(135deg, rgba(37,99,235,0.03) 0%, rgba(124,58,237,0.03) 100%)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        }}
      >
        <AccessTimeIcon sx={{ fontSize: 56, color: "text.secondary", mb: 2 }} />
        <Typography color="text.secondary" fontWeight={500}>
          勤怠履歴がありません
        </Typography>
      </Paper>
    );
  }

  if (isMobile) {
    return (
      <Box>
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} isDark={isDark} />
        ))}
      </Box>
    );
  }

  return <SessionTable sessions={sessions} isDark={isDark} />;
}
