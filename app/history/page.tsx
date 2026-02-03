import { getWorkHistory } from "@/app/actions/attendance";
import Navigation from "@/app/components/Navigation";
import HistoryClient from "./HistoryClient";
import { Container, Typography, Box } from "@mui/material";

export default async function HistoryPage() {
  const sessions = await getWorkHistory(30);

  return (
    <>
      <Navigation />
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          勤怠履歴
        </Typography>
        <Box>
          <HistoryClient sessions={sessions} />
        </Box>
      </Container>
    </>
  );
}
