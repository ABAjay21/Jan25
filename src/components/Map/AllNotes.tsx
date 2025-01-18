import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./AllNotes.css";

// Define the interface for NoteHistoryEntry
interface NoteHistoryEntry {
  id: number;
  field_id: number;
  date: string;
  edited_by: string;
  action: string;
  note: string;
}

// Use the environment variable for backend URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
console.log("Using BACKEND_URL:", BACKEND_URL);

const AllNotesPage: React.FC = () => {
  const [notes, setNotes] = useState<NoteHistoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Use React Router's `useLocation` to read search params
  const location = useLocation();

  useEffect(() => {
    // Read the URL parameters
    const searchParams = new URLSearchParams(location.search);
    const fieldIdParam = searchParams.get("field_id");
    const parcelIdParam = searchParams.get("parcel_id");

    // Build your fetch URL accordingly
    let url = `${BACKEND_URL}/api/all_notes`;
    if (fieldIdParam) {
      url += `?field_id=${fieldIdParam}`;
    } else if (parcelIdParam) {
      url += `?parcel_id=${parcelIdParam}`;
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setNotes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching notes:", err);
        setError("Failed to fetch notes. Please try again later.");
        setLoading(false);
      });
  }, [location.search]);

  // Filter notes based on the selected column and value
  const filteredNotes = notes
    .filter((note) => {
      if (!selectedColumn || !selectedValue) return true;
      return note[selectedColumn as keyof NoteHistoryEntry]
        .toString()
        .toLowerCase()
        .includes(selectedValue.toLowerCase());
    })
    .sort((a, b) => {
      const valueA = a[sortColumn as keyof NoteHistoryEntry];
      const valueB = b[sortColumn as keyof NoteHistoryEntry];

      if (typeof valueA === "string" && typeof valueB === "string") {
        if (sortOrder === "asc") {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      }
      return 0;
    });

  // Check whether we're in embedded mode
  const isEmbedded = new URLSearchParams(location.search).get("embedded") === "true";

  if (loading) {
    return (
      <div className="all-notes-page">
        {/* Show header only if NOT embedded */}
        {!isEmbedded && <h2>All Notes</h2>}
        <p>Loading notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="all-notes-page">
        {!isEmbedded && <h2>All Notes</h2>}
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="all-notes-page">
      {/* Only show heading & intro if not embedded */}
      {!isEmbedded && (
        <>
          <h2>All Notes</h2>
          <p>
            View all notes across all fields (or for a specific field/parcel if specified).
          </p>
        </>
      )}

      <div className="filter-dropdowns">
        {/* Column Selection Dropdown */}
        <label htmlFor="column-dropdown">Select Column:</label>
        <select
          id="column-dropdown"
          value={selectedColumn}
          onChange={(e) => {
            setSelectedColumn(e.target.value);
            setSelectedValue(""); // Reset value when column changes
          }}
        >
          <option value="">Select Column</option>
          <option value="field_id">Field ID</option>
          <option value="date">Date</option>
          <option value="edited_by">Edited By</option>
          <option value="action">Action</option>
          <option value="note">Note</option>
        </select>

        {/* Value Selection Dropdown */}
        <label htmlFor="value-dropdown">Select Value:</label>
        <select
          id="value-dropdown"
          value={selectedValue}
          onChange={(e) => setSelectedValue(e.target.value)}
          disabled={!selectedColumn}
        >
          <option value="">Select Value</option>
          {selectedColumn &&
            notes
              .map((note) => note[selectedColumn as keyof NoteHistoryEntry])
              .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
              .map((value, index) => (
                <option key={index} value={value}>
                  {value}
                </option>
              ))}
        </select>
      </div>

      <div className="sort-options">
        {/* Sorting Dropdown */}
        <label htmlFor="sort-column">Sort By:</label>
        <select
          id="sort-column"
          value={sortColumn}
          onChange={(e) => setSortColumn(e.target.value)}
        >
          <option value="date">Date</option>
          <option value="field_id">Field ID</option>
          <option value="edited_by">Edited By</option>
          <option value="action">Action</option>
          <option value="note">Note</option>
        </select>

        <label htmlFor="sort-order">Sort Order:</label>
        <select
          id="sort-order"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      <table className="notes-table">
        <thead>
          <tr>
            <th>Field ID</th>
            <th>Date</th>
            <th>Edited By</th>
            <th>Action</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <tr key={note.id}>
                <td>{note.field_id}</td>
                <td>{new Date(note.date).toLocaleString()}</td>
                <td>{note.edited_by}</td>
                <td>{note.action}</td>
                <td>{note.note}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="no-notes">
                No notes found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AllNotesPage;
