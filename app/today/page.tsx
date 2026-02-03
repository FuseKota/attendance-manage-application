import { getCurrentSession, getTodayFinishedSession } from "@/app/actions/attendance";
import { getUserSettings } from "@/app/actions/settings";
import Navigation from "@/app/components/Navigation";
import TodayClient from "./TodayClient";
import { Container, Alert, Box } from "@mui/material";

export default async function TodayPage() {
  const [currentSession, todayFinished, settings] = await Promise.all([
    getCurrentSession(),
    getTodayFinishedSession(),
    getUserSettings(),
  ]);

  const needsSlackSetup = !settings?.slack_user_id;

  return (
    <>
      <Navigation />
      <Container maxWidth="sm" sx={{ py: 2, pb: { xs: 10, sm: 3 } }}>
        {needsSlackSetup && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Slack User IDが設定されていません。設定画面で設定してください。
          </Alert>
        )}
        <Box>
          <TodayClient
            initialSession={currentSession}
            todayFinishedSession={todayFinished}
            hasSlackUserId={!needsSlackSetup}
          />
        </Box>
      </Container>
    </>
  );
}
