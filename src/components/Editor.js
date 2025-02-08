import React from "react";
import { TextField, Paper } from "@mui/material";

const Editor = ({ selectedNote, onContentChange }) => {
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    onContentChange({ ...selectedNote, title: newTitle === "" ? "Untitled" : newTitle });
  };

  const handleContentChange = (e) => {
    onContentChange({ ...selectedNote, content: e.target.value });
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        fullWidth
        value={selectedNote?.title === "Untitled" ? "" : selectedNote?.title || ""}
        onChange={handleTitleChange}
        variant="standard"
        placeholder="Title..."
      />
      <TextField fullWidth multiline rows={10} value={selectedNote?.content || ""} onChange={handleContentChange} variant="outlined" placeholder="Start writing..." />
    </Paper>
  );
};

export default Editor;
