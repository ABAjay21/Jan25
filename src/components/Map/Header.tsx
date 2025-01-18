import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Header.css"; // Ensure you have this CSS for styling

interface HeaderProps {
  onHomeClick?: () => void;
  onLogout: () => void; // Add a prop for handling logout
}

const Header: React.FC<HeaderProps> = ({ onHomeClick, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if the "embedded=true" query parameter exists
  const searchParams = new URLSearchParams(location.search);
  const isEmbedded = searchParams.get("embedded") === "true";

  // If "embedded=true", hide the header
  if (isEmbedded) {
    return null;
  }

  // Logout handler
  const handleLogout = () => {
    // Clear the token from localStorage
    localStorage.removeItem("token");

    // Call the parent logout handler to update the state
    onLogout();

    // Redirect to the login page
    navigate("/login");
  };

  return (
    <header className="header-container">
      {/* App name */}
      <div className="header-title">TerraScope</div>

      {/* Navigation links */}
      <nav className="header-nav">
        <Link to="/" onClick={onHomeClick}>
          Home
        </Link>
        <Link to="/all-notes">Notes</Link>
        <Link to="/soil-map">Soil Map</Link>
        {/* Other links can go here */}

        {/* Logout button */}
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </nav>
    </header>
  );
};

export default Header;
