import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import Editor from "./components/Editor";
import Sidebar from "./components/SideBar";
import TopBar from "./components/TopBar";
import { Box } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { debounce } from "lodash";

// ✅ Corrected gRPC imports based on your generation path
import { NoteServiceClient } from "./generated/noteapp_grpc_web_pb";
import { UserServiceClient } from "./generated/noteapp_grpc_web_pb";
import {
  GetNotesByUserIDRequest,
  CreateNoteRequest,
  UpdateNoteRequest,
  DeleteNoteRequest,
} from "./generated/noteapp_pb";
import {
  GetUserByEmailRequest,
  CreateUserRequest,
} from "./generated/noteapp_pb";

const API_BASE_URL = "http://localhost:9000"; // gRPC-Web via Envoy

const notesClient = new NoteServiceClient(API_BASE_URL);
const usersClient = new UserServiceClient(API_BASE_URL);

function App() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    if (user) fetchNotes(user.id);
  }, [user]);

  // ✅ Fetch Notes for Logged-in User using gRPC
  const fetchNotes = async (userId) => {
    const request = new GetNotesByUserIDRequest();
    request.setUserId(userId);

    notesClient.getNotesByUserID(request, {}, (err, response) => {
      if (err) {
        console.error("Error fetching notes:", err);
        setNotes([]);
        setSelectedNote(null);
        return;
      }

      const fetchedNotes = response.getNotesList().map((note) => ({
        id: note.getId(),
        title: note.getTitle(),
        content: note.getContent(),
      }));

      setNotes(fetchedNotes);
      setSelectedNote(fetchedNotes.length > 0 ? fetchedNotes[0] : null);
    });
  };

  // ✅ Handle Google Login using gRPC
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
            // User not found, create a new one
            const newUser = new CreateUserRequest();
            newUser.setEmail(email);
            newUser.setName(decodedToken.name);
            newUser.setProfilePic(decodedToken.picture);

            usersClient.createUser(newUser, {}, (err, createUserResponse) => {
              if (err) {
                console.error("Error creating user:", err);
                return;
              }

              // ✅ Corrected setting user from gRPC response
              const newUserResponse = createUserResponse.getUser();
              setUser({
                id: newUserResponse.getId(),
                email: newUserResponse.getEmail(),
                name: newUserResponse.getName(),
                profile_pic: newUserResponse.getProfilePic(),
              });
              fetchNotes(newUserResponse.getId()); // Fetch notes after creating user
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

        fetchNotes(userResponse.getId());
      });
    } catch (error) {
      console.error("Error decoding Google JWT:", error);
    }
  };

  // ✅ Add New Note using gRPC
  const handleAddNote = async () => {
    if (!user) return;

    const request = new CreateNoteRequest();
    request.setUserId(user.id);
    request.setTitle("Untitled");
    request.setContent("");

    notesClient.createNote(request, {}, (err, response) => {
      if (err) {
        console.error("Error creating note:", err);
        return;
      }

      const newNoteResponse = response.getNote();
      const newNote = {
        id: newNoteResponse.getId(),
        title: newNoteResponse.getTitle(),
        content: newNoteResponse.getContent(),
      };

      setNotes((prevNotes) => [...prevNotes, newNote]);
      setSelectedNote(newNote);
    });
  };

  // ✅ Debounced Save Note using gRPC
  const debouncedSave = useCallback(
    debounce(async (updatedNote) => {
      if (!user || !updatedNote) return;

      const request = new UpdateNoteRequest();
      request.setId(updatedNote.id);
      request.setTitle(updatedNote.title);
      request.setContent(updatedNote.content);

      notesClient.updateNote(request, {}, (err, response) => {
        if (err) {
          console.error("Error saving note:", err);
        }
      });
    }, 500),
    [user]
  );

  // ✅ Save or Update Note using gRPC
  const handleSaveNote = async (updatedNote) => {
    setSelectedNote(updatedNote);
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === updatedNote.id ? { ...updatedNote } : note
      )
    );
    debouncedSave(updatedNote);
  };

  // ✅ Delete Note using gRPC
  const handleDeleteNote = async (noteId) => {
    const request = new DeleteNoteRequest();
    request.setId(noteId);

    notesClient.deleteNote(request, {}, (err, response) => {
      if (err) {
        console.error("Error deleting note:", err);
        return;
      }

      const updatedNotes = notes.filter((note) => note.id !== noteId);
      setNotes(updatedNotes);
      setSelectedNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
    });
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#f5f5f5" }}>
      <Sidebar
        notes={notes}
        selectedNote={selectedNote}
        onNoteClick={setSelectedNote}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
      />
      <Box sx={{ flexGrow: 1, p: 3, display: "flex", flexDirection: "column" }}>
        <TopBar user={user} setUser={setUser} setNotes={setNotes} onLogin={handleLogin} />

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