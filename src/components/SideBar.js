import React, { useState } from "react";
import { Drawer, List, ListItemButton, ListItemText, Button, IconButton, Box, Divider, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { Menu as MenuIcon, Add as AddIcon, Notes as NotesIcon, ChevronLeft, Delete as DeleteIcon } from "@mui/icons-material";

const Sidebar = ({ notes = [], selectedNote, onNoteClick, onAddNote, onDeleteNote }) => {
  const [open, setOpen] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const toggleSidebar = () => {
    setOpen(!open);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (note) => {
    setNoteToDelete(note);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (noteToDelete) {
      onDeleteNote(noteToDelete.id);
    }
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar Toggle Button */}
      <IconButton onClick={toggleSidebar} sx={{ position: "absolute", top: 15, left: open ? 230 : 10, zIndex: 10 }}>
        {open ? <ChevronLeft /> : <MenuIcon />}
      </IconButton>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: open ? 260 : 60,
          flexShrink: 0,
          transition: "width 0.3s",
          [`& .MuiDrawer-paper`]: {
            width: open ? 260 : 60,
            boxSizing: "border-box",
            backgroundColor: "#ffffff",
            borderRight: "2px solid #e0e0e0",
            p: 2,
            transition: "width 0.3s",
          },
        }}
      >
        {/* Add Note Button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddNote}
          sx={{
            backgroundColor: "#1976d2",
            '&:hover': { backgroundColor: "#1565c0" },
            fontWeight: "bold",
            textTransform: "none",
            display: open ? "flex" : "none",
          }}
        >
          Add Note
        </Button>

        <Divider sx={{ my: 2 }} />

        {/* Notes List */}
        <List>
          {notes.length > 0 ? (
            notes.map((note) => (
              <ListItemButton
                key={note.id}
                onClick={() => onNoteClick(note)}
                selected={selectedNote?.id === note.id} // Highlight currently selected note
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  backgroundColor: selectedNote?.id === note.id ? "#E3F2FD" : "transparent",
                  '&:hover': { backgroundColor: "#E3F2FD" },
                  transition: "background-color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
                  <NotesIcon sx={{ mr: open ? 2 : 0, color: "#1976d2" }} />
                  {open && <ListItemText primary={note.title || "Untitled"} />}
                </Box>

                {/* Delete Icon */}
                {open && (
                  <IconButton edge="end" onClick={(e) => { e.stopPropagation(); handleDeleteClick(note); }}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </ListItemButton>
            ))
          ) : (
            <Box sx={{ textAlign: "center", mt: 2, color: "gray" }}>No notes available</Box>
          )}
        </List>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <b>{noteToDelete?.title}</b>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">Cancel</Button>
          <Button onClick={confirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar;
