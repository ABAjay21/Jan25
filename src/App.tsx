import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import MapView from "./components/Map/MapView";
import SoilMapView from "./components/Map/SoilMapView";
import BoundingBoxVisualizer from "./components/Map/BoundingBoxVisualizer";
import BoundingBoxWFSVisualizer from "./components/Map/BoundingBoxWFSVisualizer";
import SoilLayer from "./components/Map/SoilLayer";
import NotesPage from "./components/Map/NotesPage";
import AllNotesPage from "./components/Map/AllNotes";
import Header from "./components/Map/Header";
import Login from "./components/Auth/login";

// ProtectedRoute Component
const ProtectedRoute = ({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: JSX.Element;
}) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isEmbedded = searchParams.get("embedded") === "true";

  // Allow access for embedded views without authentication
  if (isEmbedded) return children;

  // Standard authentication logic
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check for token on mount to persist login state
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle login success
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear token from localStorage
    setIsAuthenticated(false); // Update authentication state
  };

  return (
    <Router>
      {/* Pass the logout handler to Header */}
      {isAuthenticated && <Header onLogout={handleLogout} />}
      <Routes>
        {/* Public route for login */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MapView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/soil-map"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <SoilMapView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bounding-box"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <BoundingBoxVisualizer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bounding-box-wfs"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <BoundingBoxWFSVisualizer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/soil-layer"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <SoilLayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <NotesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/all-notes"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AllNotesPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
};

export default App;
