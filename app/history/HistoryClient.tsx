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
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
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

export default function HistoryClient({ sessions }: HistoryClientProps) {
  if (sessions.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          勤怠履歴がありません
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>日付</TableCell>
            <TableCell>出勤</TableCell>
            <TableCell>退勤</TableCell>
            <TableCell>休憩</TableCell>
            <TableCell>労働時間</TableCell>
            <TableCell>事業部</TableCell>
            <TableCell>プロジェクト</TableCell>
            <TableCell align="center">Slack</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => {
            const breakMinutes = calculateBreakMinutes(session.breaks);
            const workMinutes = calculateWorkMinutes(session);

            return (
              <TableRow key={session.id} hover>
                <TableCell>
                  {format(
                    toZonedTime(new Date(session.start_at), "Asia/Tokyo"),
                    "M/d (E)",
                    { locale: ja }
                  )}
                </TableCell>
                <TableCell>{formatTime(session.start_at)}</TableCell>
                <TableCell>
                  {session.end_at ? (
                    formatTime(session.end_at)
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
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {workMinutes !== null ? (
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      color={workMinutes >= 480 ? "success.main" : "inherit"}
                    >
                      {formatDuration(workMinutes)}
                    </Typography>
                  ) : (
                    "-"
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
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : session.end_at ? (
                    <ScheduleIcon color="warning" fontSize="small" />
                  ) : (
                    "-"
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
