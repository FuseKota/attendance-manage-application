import { getUserSettings } from "@/app/actions/settings";
import Navigation from "@/app/components/Navigation";
import SettingsClient from "./SettingsClient";
import { Container, Typography } from "@mui/material";

export default async function SettingsPage() {
  const settings = await getUserSettings();

  return (
    <>
      <Navigation />
      <Container maxWidth="sm" sx={{ py: 2, pb: { xs: 10, sm: 3 } }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
          設定
        </Typography>
        <SettingsClient initialSettings={settings} />
      </Container>
    </>
  );
}
