import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "https://jumia-exit-backend.onrender.com";

export default function LineManagerApproval() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/get-exits`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const found = data.data.find(r => r.id === id);
          setRecord(found);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (action) => {
    setSaving(true);
    try {
      const payload = {
        currentStage: "LineManager-Pending",
        action: action,
        comment: comment || (action === "na" ? "Line Manager approval marked as N/A" : "Line Manager approved"),
      };

      const res = await fetch(`${API_URL}/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Line Manager Approval ${action === "na" ? "marked as N/A" : "submitted"} successfully!`);
        navigate("/");
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Error submitting approval");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/reject/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: comment,
          rejectedBy: "LineManager",
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Exit request rejected successfully!");
        navigate("/");
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Error rejecting request");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (!record) return <p>Record not found</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Line Manager Approval</h2>
      
      <div style={{ background: "#f5f5f5", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3>Employee Details</h3>
        <p><strong>Name:</strong> {record.name}</p>
        <p><strong>Department:</strong> {record.department}</p>
        <p><strong>Employee ID:</strong> {record.employeeId}</p>
        <p><strong>Position:</strong> {record.position}</p>
        <p><strong>Exit Date:</strong> {record.exitDate}</p>
        <p><strong>Reason for Exit:</strong> {record.reason}</p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
          Comments (Optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add any comments or notes..."
          rows={4}
          style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={() => handleSubmit("approve")}
          disabled={saving}
          style={{
            padding: "12px 24px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: "16px"
          }}
        >
          {saving ? "Submitting..." : "Approve"}
        </button>
        
        <button
          onClick={() => handleSubmit("na")}
          disabled={saving}
          style={{
            padding: "12px 24px",
            background: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: "16px"
          }}
        >
          {saving ? "Submitting..." : "Mark as N/A"}
        </button>

        <button
          onClick={handleReject}
          disabled={saving}
          style={{
            padding: "12px 24px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: "16px"
          }}
        >
          {saving ? "Submitting..." : "Reject"}
        </button>

        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 24px",
            background: "#9e9e9e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}