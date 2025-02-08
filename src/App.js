import React, { useState, useEffect } from "react";
import "./App.css";
import Editor from "./components/Editor";
import Sidebar from "./components/SideBar";
import TopBar from "./components/TopBar";
import { Box } from "@mui/material";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_BASE_URL = "https://noteapp-wnzf.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    if (user) fetchNotes(user.id);
  }, [user]);

  // Fetch Notes for Logged-in User
  const fetchNotes = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notes/user/${userId}`);
      const fetchedNotes = response.data || [];

      setNotes(fetchedNotes);
      setSelectedNote(fetchedNotes.length > 0 ? fetchedNotes[0] : null);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNotes([]);
      setSelectedNote(null);
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
        const userResponse = await axios.get(`${API_BASE_URL}/users/${email}`);
        setUser(userResponse.data);
        fetchNotes(userResponse.data.id);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          const newUser = {
            email,
            name: decodedToken.name,
            profile_pic: decodedToken.picture,
          };
          const createUserResponse = await axios.post(`${API_BASE_URL}/users`, newUser);
          setUser(createUserResponse.data);
          setNotes([]);
        } else {
          console.error("Login error:", error);
        }
      }
    } catch (error) {
      console.error("Error decoding Google JWT:", error);
    }
  };

  // Add New Note
  const handleAddNote = async () => {
    if (!user) return;

    const newNote = {
      user_id: user.id,
      title: "Untitled",
      content: "",
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/notes`, newNote);
      setNotes((prevNotes) => [...prevNotes, response.data]);
      setSelectedNote(response.data);
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  // Save or Update Note
  const handleSaveNote = async (updatedNote) => {
    if (!user || !updatedNote) return;

    try {
      await axios.put(`${API_BASE_URL}/notes/${updatedNote.id}`, updatedNote);
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === updatedNote.id ? { ...updatedNote } : note
        )
      );
      setSelectedNote(updatedNote);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`${API_BASE_URL}/notes/${noteId}`);
      const updatedNotes = notes.filter((note) => note.id !== noteId);
      setNotes(updatedNotes);
      setSelectedNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#f5f5f5" }}>
      <Sidebar notes={notes} selectedNote={selectedNote} onNoteClick={setSelectedNote} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} />
      <Box sx={{ flexGrow: 1, p: 3, display: "flex", flexDirection: "column" }}>
        <TopBar user={user} setUser={setUser} onLogin={handleLogin} />
        {selectedNote ? (
          <Editor selectedNote={selectedNote} onContentChange={handleSaveNote} />
        ) : (
          <Box sx={{ textAlign: "center", mt: 10 }}>No notes available. Add a new note!</Box>
        )}
      </Box>
    </Box>
  );
}

export default App;
