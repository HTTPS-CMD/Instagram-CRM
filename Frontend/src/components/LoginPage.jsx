// frontend/src/components/LoginPage.jsx
import React, { useState, useContext } from "react"; // <-- useContext اضافه شد
import { loginUser } from "../api";
import {
  Container, Box, Typography, TextField, Button,
  CircularProgress, Alert, Avatar,
} from "@mui/material";
import { LockOutlined as LockOutlinedIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App"; // <-- ✅ ایمپورت Context
import { jwtDecode } from 'jwt-decode'; // <-- ✅ ایمپورت jwt-decode

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext); // <-- ✅ دریافت تابع setUser

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginUser(username, password);
      const { access, refresh } = response.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      // --- ✅ دیکد کردن توکن و ذخیره کاربر در Context ---
      const decodedToken = jwtDecode(access);
      setUser({
          id: decodedToken.user_id,
          role: decodedToken.is_superuser ? 'admin' : (decodedToken.role || 'client')
      });
      // ---

      navigate("/dashboard");
    } catch (err) {
      console.error("Login Failed:", err);
      setError("نام کاربری یا رمز عبور اشتباه است.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          ورود به پنل مدیریت
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="نام کاربری"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="رمز عبور"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "ورود"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default LoginPage;