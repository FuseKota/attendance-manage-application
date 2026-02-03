import { getWorkHistory } from "@/app/actions/attendance";
import Navigation from "@/app/components/Navigation";
import HistoryClient from "./HistoryClient";
import { Container, Typography, Box } from "@mui/material";

export default async function HistoryPage() {
  const sessions = await getWorkHistory(30);

  return (
    <>
      <Navigation />
      <Container maxWidth="md" sx={{ py: 2, pb: { xs: 10, sm: 3 } }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
          勤怠履歴
        </Typography>
        <Box>
          <HistoryClient sessions={sessions} />
        </Box>
      </Container>
    </>
  );
}
