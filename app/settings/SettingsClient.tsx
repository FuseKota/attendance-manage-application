"use client";

import { useState } from "react";
import {
  Paper,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

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
      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Slack連携設定
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        退勤時にSlack Workflowへ勤怠情報を送信するために、あなたのSlack User
        IDを設定してください。
      </Typography>

      <Divider sx={{ my: 2 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
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
          helperText={
            <span>
              Slackでプロフィールを開き、「...」メニューから「メンバーIDをコピー」で取得できます。
              <br />
              形式: Uで始まる英数字（例: U01234ABCDE）
            </span>
          }
          margin="normal"
          inputProps={{
            style: { fontFamily: "monospace" },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          保存
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        タイムゾーン
      </Typography>
      <Typography variant="body2" color="text.secondary">
        現在のタイムゾーン: <strong>Asia/Tokyo (JST)</strong>
      </Typography>
      <Typography variant="caption" color="text.secondary">
        ※ タイムゾーンは現在固定です
      </Typography>
    </Paper>
  );
}
