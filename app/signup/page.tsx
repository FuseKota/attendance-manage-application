"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  useTheme,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { signUp } from "@/app/actions/auth";

export default function SignUpPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setLoading(true);

    const result = await signUp(email, password);

    setLoading(false);

    if (!result.success) {
      setError(result.error || "登録に失敗しました");
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Container maxWidth="xs">
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              background: isDark
                ? "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)"
                : "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              backdropFilter: "blur(10px)",
              boxShadow: isDark ? "none" : "0 4px 20px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: isDark
                  ? "linear-gradient(135deg, rgba(74,222,128,0.2) 0%, rgba(34,197,94,0.2) 100%)"
                  : "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.15) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
                boxShadow: isDark ? "0 8px 32px rgba(74,222,128,0.2)" : "0 8px 32px rgba(16,185,129,0.2)",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 40, color: "success.main" }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              登録完了
            </Typography>
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2, textAlign: "left" }}>
              確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。
            </Alert>
            <Button
              component={Link}
              href="/login"
              fullWidth
              variant="contained"
              size="large"
              sx={{ py: 1.5 }}
            >
              ログインページへ
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            background: isDark
              ? "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            backdropFilter: "blur(10px)",
            boxShadow: isDark ? "none" : "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          {/* ロゴ */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 3,
                background: isDark
                  ? "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)"
                  : "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
                boxShadow: isDark ? "0 8px 32px rgba(96,165,250,0.3)" : "0 8px 32px rgba(37,99,235,0.3)",
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 40, color: "#ffffff" }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              勤怠管理
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              新規アカウント登録
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="new-password"
              helperText="6文字以上"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="パスワード（確認）"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="new-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? "登録中..." : "登録"}
            </Button>
          </Box>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              既にアカウントをお持ちの方は{" "}
              <Link
                href="/login"
                style={{
                  color: isDark ? "#60a5fa" : "#2563eb",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                ログイン
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
