import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, Avatar, Box, IconButton, Menu, MenuItem, Tooltip, Button } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const CLIENT_ID = "437083640575-eqgncvtn6ham29h67rskg8ibaku1jva8.apps.googleusercontent.com"; // Replace with your actual Google Client ID
const API_BASE_URL = "https://noteapp-wnzf.onrender.com"; // Backend API URL

const TopBar = ({ user, setUser, setNotes }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    // Try to get the logged-in user's email from local storage
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) {
      fetchUserByEmail(savedEmail);
    }
  }, []);

  // Fetch user from backend if email exists
  const fetchUserByEmail = async (email) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${email}`);
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("userEmail"); // Remove invalid email from local storage
    }
  };

  // Handle Google Login
  const handleLogin = async (credentialResponse) => {
    try {
      const decodedToken = jwtDecode(credentialResponse.credential);
      const email = decodedToken.email;

      if (!email) {
        console.error("Error: Email not found in token");
        return;
      }

      try {
        // Check if user exists
        const userResponse = await axios.get(`${API_BASE_URL}/users/${email}`);
        setUser(userResponse.data);
        localStorage.setItem("userEmail", email); // Store email for persistence
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // Create user if not found
          const newUser = {
            email,
            name: decodedToken.name,
            profile_pic: decodedToken.picture,
          };
          const createUserResponse = await axios.post(`${API_BASE_URL}/users`, newUser);
          setUser(createUserResponse.data);
          localStorage.setItem("userEmail", email);
        } else {
          console.error("Login error:", error);
        }
      }
    } catch (error) {
      console.error("Error decoding Google JWT:", error);
    }
  };

  // Logout Functionality
  const handleLogout = () => {
    setUser(null); // Clear user state
    setNotes([]);
    localStorage.removeItem("userEmail"); // Remove email from local storage
    setAnchorEl(null);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AppBar position="sticky" sx={{ mb: 2, backgroundColor: "#1976d2", borderRadius: 2, px: 2 }}>
        <Toolbar sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", letterSpacing: 1 }}>
              Note App
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {user ? (
              <>
                {/* Show User Name */}
                <Typography variant="body1" sx={{ color: "white", fontWeight: "bold" }}>
                  {user.name}
                </Typography>
                
                <Tooltip title="User Settings">
                  <IconButton onClick={handleMenuClick} sx={{ p: 0 }}>
                    <Avatar alt={user.name} src={user.profile_pic} sx={{ width: 40, height: 40 }} />
                  </IconButton>
                </Tooltip>

                <Menu anchorEl={anchorEl} open={open} onClose={handleClose} sx={{ mt: 1 }}>
                  <MenuItem onClick={handleClose}>Profile</MenuItem>
                  <MenuItem onClick={handleClose}>Settings</MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <GoogleLogin
                onSuccess={handleLogin}
                onError={() => console.error("Google Login Failed")}
              />
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </GoogleOAuthProvider>
  );
};

export default TopBar;
