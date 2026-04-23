import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://jumia-exit-backend.onrender.com";

// Workflow stages
const WORKFLOW = [
  { key: "HR-Pending", label: "HR Pending", color: "#ff9800" },
  { key: "LineManager-Pending", label: "Line Manager Pending", color: "#2196F3" },
  { key: "Finance-Pending", label: "Finance Pending", color: "#9C27B0" },
  { key: "IT-Pending", label: "IT Pending", color: "#00BCD4" },
  { key: "HR-Final", label: "HR Final", color: "#FF5722" },
  { key: "Completed", label: "Completed", color: "#4CAF50" },
  { key: "Rejected", label: "Rejected", color: "#f44336" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const role = sessionStorage.getItem("userRole");

  useEffect(() => {
    fetch(`${API_URL}/get-exits`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRecords(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter records based on role
  const getFilteredRecords = () => {
    if (role === "admin") {
      return filter === "all" ? records : records.filter(r => r.status === filter);
    }
    
    // Role-based filtering for non-admin users
    const roleStageMap = {
      "hr": ["HR-Pending", "HR-Final"],
      "lineManager": ["LineManager-Pending"],
      "finance": ["Finance-Pending"],
      "it": ["IT-Pending"],
    };
    
    const allowedStages = roleStageMap[role] || [];
    return records.filter(r => allowedStages.includes(r.status));
  };

  const filteredRecords = getFilteredRecords();

  const getStatusColor = (status) => {
    const stage = WORKFLOW.find(w => w.key === status);
    return stage ? stage.color : "#999";
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userRole");
    navigate("/login");
  };

  const handleView = (id, status) => {
    // Navigate to the appropriate page based on status
    if (status === "LineManager-Pending") {
      navigate(`/line-manager/${id}`);
    } else if (status === "HR-Pending") {
      navigate(`/hr/${id}`);
    } else if (status === "Finance-Pending") {
      navigate(`/finance/${id}`);
    } else if (status === "IT-Pending") {
      navigate(`/it/${id}`);
    } else if (status === "HR-Final") {
      navigate(`/hr/${id}`);
    } else {
      // View only for completed/rejected
      navigate(`/view/${id}`);
    }
  };

  const handleGeneratePDF = async (id) => {
    try {
      const res = await fetch(`${API_URL}/generate-pdf/${id}`);
      const data = await res.json();
      if (data.success) {
        window.open(data.pdfUrl, '_blank');
      } else {
        alert("Error generating PDF: " + data.message);
      }
    } catch (err) {
      alert("Error generating PDF");
    }
  };

  const getRoleLabel = () => {
    const labels = {
      "admin": "Administrator",
      "hr": "HR",
      "lineManager": "Line Manager",
      "finance": "Finance",
      "it": "IT",
    };
    return labels[role] || "User";
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div style={{ padding: "20px" }}>
      {/* Header with navigation */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px",
        padding: "15px",
        background: "#f5f5f5",
        borderRadius: "8px"
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Staff Exit Dashboard</h2>
          <p style={{ margin: "5px 0 0 0", color: "#666" }}>Logged in as: <strong>{getRoleLabel()}</strong></p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              style={{
                padding: "10px 20px",
                background: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Admin Panel
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Filter for admin */}
      {role === "admin" && (
        <div style={{ marginBottom: "20px" }}>
          <label style={{ marginRight: "10px" }}>Filter by Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            <option value="all">All Records</option>
            {WORKFLOW.map(w => (
              <option key={w.key} value={w.key}>{w.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
        {WORKFLOW.slice(0, -1).map(w => {
          const count = records.filter(r => r.status === w.key).length;
          return (
            <div key={w.key} style={{ 
              padding: "15px", 
              background: w.color, 
              color: "white", 
              borderRadius: "8px",
              minWidth: "100px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{count}</div>
              <div style={{ fontSize: "11px" }}>{w.label}</div>
            </div>
          );
        })}
      </div>

      {filteredRecords.length === 0 ? (
        <p>No records found for your role.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Employee ID</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Department</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Exit Date</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(r => (
              <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px" }}>{r.name}</td>
                <td style={{ padding: "12px" }}>{r.employeeId}</td>
                <td style={{ padding: "12px" }}>{r.department}</td>
                <td style={{ padding: "12px" }}>{r.exitDate}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{ 
                    padding: "4px 8px", 
                    background: getStatusColor(r.status), 
                    color: "white", 
                    borderRadius: "4px",
                    fontSize: "12px"
                  }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <button
                    onClick={() => handleView(r.id, r.status)}
                    style={{
                      padding: "6px 12px",
                      background: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      marginRight: "5px"
                    }}
                  >
                    {["Completed", "Rejected"].includes(r.status) ? "View" : "Process"}
                  </button>
                  <button
                    onClick={() => handleGeneratePDF(r.id)}
                    style={{
                      padding: "6px 12px",
                      background: "#4CAF50",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}