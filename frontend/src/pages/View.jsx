import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "https://jumia-exit-backend.onrender.com";

export default function View() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/get-exits`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const found = data.data.find(r => r.id === id);
          setRecord(found || null);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleGeneratePDF = async () => {
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

  const handleBack = () => {
    navigate("/");
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;
  if (!record) return <p style={{ padding: "20px" }}>Record not found.</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <button
        onClick={handleBack}
        style={{
          padding: "8px 16px",
          background: "#666",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        ← Back to Dashboard
      </button>

      <div style={{ 
        background: record.status === "Completed" ? "#e8f5e9" : "#ffebee",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        <h2 style={{ margin: "0 0 10px 0" }}>
          Exit Clearance {record.status}
        </h2>
        <p><strong>Exit ID:</strong> {record.exitId || "N/A"}</p>
        <p><strong>Employee:</strong> {record.name}</p>
        <p><strong>Employee ID:</strong> {record.employeeId}</p>
        <p><strong>Department:</strong> {record.department}</p>
        <p><strong>Position:</strong> {record.position}</p>
        <p><strong>Last Working Day:</strong> {record.lastWorkingDay}</p>
      </div>

      <button
        onClick={handleGeneratePDF}
        style={{
          padding: "12px 24px",
          background: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "16px"
        }}
      >
        📄 Download Clearance Certificate (PDF)
      </button>

      <h3 style={{ marginTop: "30px" }}>Clearance History</h3>
      {record.approvalComments && record.approvalComments.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Stage</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Action</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Comment</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {record.approvalComments.map((c, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px" }}>{c.by}</td>
                <td style={{ padding: "10px" }}>
                  <span style={{ 
                    color: c.action === "reject" ? "red" : "green",
                    fontWeight: "bold"
                  }}>
                    {c.action === "na" ? "N/A" : c.action === "reject" ? "Rejected" : "Approved"}
                  </span>
                </td>
                <td style={{ padding: "10px" }}>{c.comment || "-"}</td>
                <td style={{ padding: "10px" }}>
                  {c.at ? new Date(c.at).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No clearance history available.</p>
      )}
    </div>
  );
}