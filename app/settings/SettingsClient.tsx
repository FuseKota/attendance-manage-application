"use client";

import { useState } from "react";
import {
  Paper,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  InputAdornment,
  alpha,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import PersonIcon from "@mui/icons-material/Person";
import PublicIcon from "@mui/icons-material/Public";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import type { UserSettings } from "@/lib/types";
import { saveUserSettings } from "@/app/actions/settings";

interface SettingsClientProps {
  initialSettings: UserSettings | null;
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [slackUserId, setSlackUserId] = useState(
    initialSettings?.slack_user_id || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const result = await saveUserSettings(slackUserId);

    setLoading(false);

    if (!result.success) {
      setError(result.error || "保存に失敗しました");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <Box>
      {/* Slack連携設定カード */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {/* ヘッダー */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: alpha("#2563eb", 0.03),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PersonIcon sx={{ color: "white" }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Slack連携
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  退勤時にSlackへ勤怠情報を送信
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* コンテンツ */}
          <Box sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                設定を保存しました
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Slack User ID"
                value={slackUserId}
                onChange={(e) => setSlackUserId(e.target.value.toUpperCase())}
                placeholder="U01234ABCDE"
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { fontFamily: "monospace" },
                }}
              />

              {/* ヘルプテキスト */}
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: alpha("#2563eb", 0.04),
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <InfoOutlinedIcon fontSize="small" color="primary" sx={{ mt: 0.25 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                      Slack User IDの取得方法
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="div">
                      1. Slackでプロフィールを開く<br />
                      2. 「...」メニューをクリック<br />
                      3. 「メンバーIDをコピー」を選択
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      形式: Uで始まる英数字（例: U01234ABCDE）
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={loading}
                sx={{ mt: 3 }}
                size="large"
              >
                保存
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* タイムゾーン設定カード */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {/* ヘッダー */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: alpha("#2563eb", 0.03),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: "secondary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PublicIcon sx={{ color: "white" }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  タイムゾーン
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  時刻の表示設定
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* コンテンツ */}
          <Box sx={{ p: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: alpha("#7c3aed", 0.04),
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  現在のタイムゾーン
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  すべての時刻はこのタイムゾーンで表示されます
                </Typography>
              </Box>
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{
                  px: 2,
                  py: 0.75,
                  bgcolor: "white",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                Asia/Tokyo (JST)
              </Typography>
            </Paper>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
              ※ タイムゾーンの変更は現在サポートされていません
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
