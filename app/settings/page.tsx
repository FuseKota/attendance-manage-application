import { getUserSettings } from "@/app/actions/settings";
import Navigation from "@/app/components/Navigation";
import SettingsClient from "./SettingsClient";
import { Container, Typography } from "@mui/material";

export default async function SettingsPage() {
  const settings = await getUserSettings();

  return (
    <>
      <Navigation />
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          設定
        </Typography>
        <SettingsClient initialSettings={settings} />
      </Container>
    </>
  );
}
