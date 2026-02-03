"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import TodayIcon from "@mui/icons-material/Today";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import { signOut } from "@/app/actions/auth";

const menuItems = [
  { text: "今日", href: "/today", icon: <TodayIcon /> },
  { text: "履歴", href: "/history", icon: <HistoryIcon /> },
  { text: "設定", href: "/settings", icon: <SettingsIcon /> },
];

export default function Navigation() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSignOut = async () => {
    await signOut();
  };

  const currentIndex = menuItems.findIndex((item) => item.href === pathname);

  return (
    <>
      {/* トップAppBar */}
      <AppBar position="static">
        <Toolbar>
          {!isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, textAlign: isMobile ? "center" : "left" }}
          >
            勤怠管理
          </Typography>
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={handleSignOut}
              aria-label="logout"
            >
              <LogoutIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* サイドドロワー（デスクトップ用） */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">メニュー</Typography>
          </Box>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  selected={pathname === item.href}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleSignOut}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="ログアウト" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* ボトムナビゲーション（モバイル用） */}
      {isMobile && (
        <Paper
          sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000 }}
          elevation={3}
        >
          <BottomNavigation
            value={currentIndex >= 0 ? currentIndex : 0}
            onChange={(_, newValue) => {
              router.push(menuItems[newValue].href);
            }}
            showLabels
          >
            {menuItems.map((item) => (
              <BottomNavigationAction
                key={item.href}
                label={item.text}
                icon={item.icon}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </>
  );
}
