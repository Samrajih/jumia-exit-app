import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!role) {
      alert("Please select a role");
      return;
    }
    setLoading(true);
    
    // Store role in sessionStorage for the session
    sessionStorage.setItem("userRole", role);
    
    // Navigate based on role
    switch (role) {
      case "admin":
        navigate("/admin");
        break;
      case "hr":
        navigate("/");
        break;
      case "lineManager":
        navigate("/");
        break;
      case "finance":
        navigate("/");
        break;
      case "it":
        navigate("/");
        break;
      default:
        navigate("/");
    }
  };

  const roles = [
    { value: "admin", label: "Administrator" },
    { value: "hr", label: "HR" },
    { value: "lineManager", label: "Line Manager" },
    { value: "finance", label: "Finance" },
    { value: "it", label: "IT" },
  ];

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <div style={{ 
        background: "white", 
        padding: "40px", 
        borderRadius: "10px", 
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        width: "400px",
        textAlign: "center"
      }}>
        <h1 style={{ color: "#333", marginBottom: "10px" }}>Jumia Exit App</h1>
        <p style={{ color: "#666", marginBottom: "30px" }}>Staff Exit Clearance System</p>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold", textAlign: "left" }}>
            Select Your Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "16px"
            }}
          >
            <option value="">-- Select Role --</option>
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !role}
          style={{
            width: "100%",
            padding: "14px",
            background: role ? "#4CAF50" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: role ? "pointer" : "not-allowed",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={{ marginTop: "20px", color: "#999", fontSize: "12px" }}>
          Select your role to access the appropriate clearance workflow
        </p>
      </div>
    </div>
  );
}