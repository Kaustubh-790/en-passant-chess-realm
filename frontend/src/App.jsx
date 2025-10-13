import React, { useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase.js";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api/auth";

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user_data"))
  );

  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [idToken, setIdToken] = useState(null);
  const [additionalData, setAdditionalData] = useState({
    branch: "",
    year: "",
  });

  const [error, setError] = useState("");

  const handleBackendSignIn = async (token, extraData = null) => {
    try {
      setError("");
      const payload = { idToken: token };
      if (extraData) {
        payload.additionalData = extraData;
      }

      const res = await axios.post(`${API_URL}/google-signin`, payload);

      if (res.data.success) {
        localStorage.setItem("user_data", JSON.stringify(res.data.data));
        setUser(res.data.data);
        setShowAdditionalFields(false);
      }
    } catch (err) {
      const res = err.response;

      if (
        res &&
        res.status === 400 &&
        res.data.message.includes("Branch and Year are required")
      ) {
        setShowAdditionalFields(true);
        setIdToken(token);
        setError(
          "Welcome! Please provide your branch and year to complete registration."
        );
      } else {
        setError(
          res?.data?.message ||
            "An unknown error occurred during backend sign-in."
        );
      }
    }
  };

  const handleFirebaseSignIn = async () => {
    try {
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseIdToken = await result.user.getIdToken();

      handleBackendSignIn(firebaseIdToken);
    } catch (error) {
      setError("Google login failed. Please try again.");
      console.error("Firebase sign-in error:", error);
    }
  };

  const handleAdditionalInfoSubmit = (e) => {
    e.preventDefault();
    if (!additionalData.branch || !additionalData.year) {
      setError("Please fill out both branch and year.");
      return;
    }

    handleBackendSignIn(idToken);
  };

  const handleLogout = async () => {
    try {
      const refreshToken = user.tokens.refreshToken;
      await axios.post(`${API_URL}/logout`, { refreshToken });
    } catch (err) {
      console.error(
        "Logout failed on backend, clearing client session anyway."
      );
    } finally {
      await signOut(auth);
      localStorage.removeItem("user_data");
      setUser(null);
      setShowAdditionalFields(false);
      setError("");
    }
  };

  return (
    <div className="container">
      <h1>User Authentication</h1>

      {!user ? (
        <div className="card">
          <h2>Login or Register</h2>
          {error && <p className="error-message">{error}</p>}

          {showAdditionalFields ? (
            <form
              onSubmit={handleAdditionalInfoSubmit}
              className="additional-form"
            >
              <div className="form-group">
                <label htmlFor="branch">Branch</label>
                <input
                  type="text"
                  id="branch"
                  value={additionalData.branch}
                  onChange={(e) =>
                    setAdditionalData({
                      ...additionalData,
                      branch: e.target.value,
                    })
                  }
                  placeholder="e.g., CSE, ECE"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="year">Year</label>
                <input
                  type="number"
                  id="year"
                  value={additionalData.year}
                  onChange={(e) =>
                    setAdditionalData({
                      ...additionalData,
                      year: e.target.value,
                    })
                  }
                  placeholder="e.g., 1, 2"
                  min="1"
                  max="5"
                  required
                />
              </div>
              <button type="submit">Complete Registration</button>
            </form>
          ) : (
            <div className="google-login-container">
              <p>Sign in with your Google account to continue.</p>
              <button
                onClick={handleFirebaseSignIn}
                className="google-signin-button"
              >
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <h2>Welcome, {user.user.username}!</h2>
          <p>You have successfully logged in.</p>
          <div className="user-data">
            <p>
              <strong>Your Backend Data:</strong>
            </p>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
