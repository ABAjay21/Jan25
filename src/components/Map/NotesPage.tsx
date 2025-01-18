import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./NotesPage.css"; // Ensure this CSS file exists

interface FieldNotes {
  field_id: number;
  farmer_name: string;
  farmer_note: string;
  field_note: string;
}

interface NoteHistoryEntry {
  id: number;
  date: string;
  edited_by: string;
  action: string;
  note: string;
}

// Use the environment variable for backend URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
console.log("Using BACKEND_URL:", BACKEND_URL);

const NotesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [notes, setNotes] = useState<FieldNotes[]>([]);
  const [history, setHistory] = useState<NoteHistoryEntry[]>([]);
  const [editingNote, setEditingNote] = useState<NoteHistoryEntry | null>(null);
  const [newNote, setNewNote] = useState<string>("");

  // Check if we're in "embedded" mode via ?embedded=true
  const isEmbedded = searchParams.get("embedded") === "true";

  // Fetch all field notes
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/field_notes`)
      .then((res) => res.json())
      .then((data) => setNotes(data))
      .catch((err) => console.error("Error fetching field notes:", err));
  }, []);

  // Fetch note history whenever a field is selected
  useEffect(() => {
    if (fieldId) {
      fetchNoteHistory(fieldId);
    }
  }, [fieldId]);

  // Pre-select field if field_id is in the URL query
  useEffect(() => {
    const selectedFieldId = searchParams.get("field_id");
    if (selectedFieldId) {
      setFieldId(selectedFieldId);
    }
  }, [searchParams]);

  const fetchNoteHistory = (fieldId: string) => {
    fetch(`${BACKEND_URL}/api/notes_history/${fieldId}`)
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch((err) => console.error("Error fetching note history:", err));
  };

  const handleFieldSelection = (id: string) => {
    setFieldId(id);
  };

  const handleAddNote = () => {
    const newNoteData = {
      field_id: fieldId,
      edited_by: "Admin", // Replace with a dynamic user if needed
      action: "Added",
      note: newNote,
    };

    fetch(`${BACKEND_URL}/api/notes_history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newNoteData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Note added successfully!");
          fetchNoteHistory(fieldId!); // Refresh the history
          setNewNote("");
        }
      })
      .catch((err) => console.error("Error adding note:", err));
  };

  const handleEditNote = (note: NoteHistoryEntry) => {
    setEditingNote(note);
  };

  const handleSaveEdit = () => {
    if (editingNote) {
      const updatedNote = {
        ...editingNote,
        action: "Updated",
      };

      fetch(`${BACKEND_URL}/api/notes_history/${editingNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedNote),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            alert("Note updated successfully!");
            fetchNoteHistory(fieldId!); // Refresh the history
            setEditingNote(null);
          }
        })
        .catch((err) => console.error("Error updating note:", err));
    }
  };

  const handleDeleteNote = (noteId: number) => {
    fetch(`${BACKEND_URL}/api/notes_history/${noteId}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Note deleted successfully!");
          fetchNoteHistory(fieldId!); // Refresh the history
        }
      })
      .catch((err) => console.error("Error deleting note:", err));
  };

  const handleExportNotes = () => {
    alert("Export Notes button clicked!"); // Implement export if needed
  };

  return (
    <div className="notes-page">
      {/* Hide the header & paragraph in embedded mode */}
      {!isEmbedded && (
        <>
          <h2>Field Notes</h2>
          <p>Select a field to view and manage its details and note history.</p>
        </>
      )}

      {/* Field Selection Dropdown */}
      <div className="field-select-card">
        <label htmlFor="field-dropdown">Select Field:</label>
        <select
          id="field-dropdown"
          value={fieldId || ""}
          onChange={(e) => {
            setFieldId(e.target.value);
            handleFieldSelection(e.target.value);
          }}
        >
          <option value="">Select Field</option>
          {notes.map((note) => (
            <option key={note.field_id} value={note.field_id}>
              {`Field ${note.field_id} - ${note.farmer_name}`}
            </option>
          ))}
        </select>
      </div>

      {/* Note History */}
      <div className="note-history">
        <h3>Note History</h3>
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Edited By</th>
              <th>Action</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.date).toLocaleString()}</td>
                  <td>{entry.edited_by}</td>
                  <td>{entry.action}</td>
                  <td>{entry.note}</td>
                  <td>
                    <button onClick={() => handleEditNote(entry)}>Edit</button>
                    <button onClick={() => handleDeleteNote(entry.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No history available for this field.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="actions">
          {/* Add Note Input */}
          <label htmlFor="new-note-input">New Note:</label>
          <input
            id="new-note-input"
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter a new note"
            title="Enter a new note here"
          />
          <button onClick={handleAddNote}>Add Note</button>
          <button onClick={handleExportNotes}>Export Notes</button>
        </div>

        {/* Edit Note */}
        {editingNote && (
          <div className="edit-note">
            <h3>Edit Note</h3>
            <label htmlFor="edit-note-textarea">Edit Note Content:</label>
            <textarea
              id="edit-note-textarea"
              value={editingNote.note}
              onChange={(e) =>
                setEditingNote({ ...editingNote, note: e.target.value })
              }
              placeholder="Enter your updated note here"
              title="Update the note content here"
            />
            <button onClick={handleSaveEdit}>Save</button>
            <button onClick={() => setEditingNote(null)}>Cancel</button>
          </div>
        )}
      </div>

      {/* "View All Notes" Button */}
      <button
        onClick={() => {
          // Redirect to /all-notes with embedded=true
          window.location.href = "/all-notes?embedded=true";
        }}
      >
        View All Notes
      </button>

    </div>
  );
};

export default NotesPage;
