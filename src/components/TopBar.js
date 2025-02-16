import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { GetUserByEmailRequest, CreateUserRequest } from "../generated/noteapp_pb"; // Import gRPC messages
import { UserServiceClient } from "../generated/noteapp_grpc_web_pb";

const CLIENT_ID = "437083640575-eqgncvtn6ham29h67rskg8ibaku1jva8.apps.googleusercontent.com";
const GRPC_SERVER_URL = "http://localhost:9000"; // Envoy proxy for gRPC-web

const usersClient = new UserServiceClient(GRPC_SERVER_URL); // gRPC client instance

const TopBar = ({ user, setUser, setNotes }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) {
      fetchUserByEmail(savedEmail);
    }
  }, []);

  // Fetch user using gRPC
  const fetchUserByEmail = async (email) => {
    const request = new GetUserByEmailRequest();
    request.setEmail(email);

    usersClient.getUserByEmail(request, {}, (err, response) => {
      if (err) {
        console.error("Error fetching user:", err);
        localStorage.removeItem("userEmail");
        return;
      }

      const userResponse = response.getUser();
      setUser({
        id: userResponse.getId(),
        email: userResponse.getEmail(),
        name: userResponse.getName(),
        profile_pic: userResponse.getProfilePic(),
      });
    });
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

      const request = new GetUserByEmailRequest();
      request.setEmail(email);

      usersClient.getUserByEmail(request, {}, async (err, response) => {
        if (err) {
          if (err.code === 5) {
            // User not found, create new user
            const createUserRequest = new CreateUserRequest();
            createUserRequest.setEmail(email);
            createUserRequest.setName(decodedToken.name);
            createUserRequest.setProfilePic(decodedToken.picture);

            usersClient.createUser(createUserRequest, {}, (createErr, createRes) => {
              if (createErr) {
                console.error("Error creating user:", createErr);
                return;
              }

              const newUserResponse = createRes.getUser();
              setUser({
                id: newUserResponse.getId(),
                email: newUserResponse.getEmail(),
                name: newUserResponse.getName(),
                profile_pic: newUserResponse.getProfilePic(),
              });
              localStorage.setItem("userEmail", email);
            });
          } else {
            console.error("Login error:", err);
          }
          return;
        }

        const userResponse = response.getUser();
        setUser({
          id: userResponse.getId(),
          email: userResponse.getEmail(),
          name: userResponse.getName(),
          profile_pic: userResponse.getProfilePic(),
        });
        localStorage.setItem("userEmail", email);
      });
    } catch (error) {
      console.error("Error decoding Google JWT:", error);
    }
  };

  // Logout Functionality
  const handleLogout = () => {
    setUser(null);
    setNotes([]);
    localStorage.removeItem("userEmail");
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