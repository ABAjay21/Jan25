// client/src/components/Auth/Login.tsx

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css"; // Ensure you have created this CSS file

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
      });

      // Save the token to localStorage
      localStorage.setItem("token", response.data.token);

      // Update authentication state
      onLoginSuccess();

      // Redirect to the dashboard
      navigate("/"); // Redirecting to home, which is protected
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2 className="login-header">Login</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="input-container">
          <label htmlFor="username" className="input-label">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            required
          />
        </div>
        <div className="input-container">
          <label htmlFor="password" className="input-label">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
        </div>
        <button type="submit" className="login-button">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
