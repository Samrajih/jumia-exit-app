import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "https://jumia-exit-backend.onrender.com";

export default function FinanceClearance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNA, setIsNA] = useState(false);
  const [clearance, setClearance] = useState({
    finalSalary: "",
    noticePay: "",
    leaveEncashment: "",
    otherDeductions: "",
    totalDeductions: "",
    remarks: "",
  });

  useEffect(() => {
    fetch(`${API_URL}/get-exits`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const found = data.data.find(r => r.id === id);
          setRecord(found);
          if (found?.FinanceClearance) {
            setClearance(found.FinanceClearance);
            if (found.FinanceClearance.isNA) {
              setIsNA(true);
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field, value) => {
    setClearance(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (action) => {
    setSaving(true);
    try {
      const payload = {
        currentStage: "Finance-Pending",
        action: action,
        comment: action === "na" ? "Finance Clearance marked as N/A" : "Finance Clearance completed",
        clearance: isNA ? { isNA: true } : clearance,
      };

      const res = await fetch(`${API_URL}/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Finance Clearance ${action === "na" ? "marked as N/A" : "submitted"} successfully!`);
        navigate("/");
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Error submitting clearance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (!record) return <p>Record not found</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Finance Clearance</h2>
      
      <div style={{ background: "#f5f5f5", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3>Employee Details</h3>
        <p><strong>Name:</strong> {record.name}</p>
        <p><strong>Department:</strong> {record.department}</p>
        <p><strong>Employee ID:</strong> {record.employeeId}</p>
        <p><strong>Exit Date:</strong> {record.exitDate}</p>
      </div>

      {/* N/A Option */}
      <div style={{ marginBottom: "20px", padding: "15px", border: "2px solid #ff9800", borderRadius: "8px" }}>
        <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isNA}
            onChange={(e) => setIsNA(e.target.checked)}
            style={{ marginRight: "10px", transform: "scale(1.5)" }}
          />
          <strong>Mark as N/A (Not Applicable)</strong>
        </label>
        <p style={{ color: "#666", marginTop: "5px" }}>
          Check this if finance clearance is not required for this employee
        </p>
      </div>

      {!isNA && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Financial Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label>Final Salary</label>
              <input
                type="text"
                value={clearance.finalSalary}
                onChange={(e) => handleChange("finalSalary", e.target.value)}
                placeholder="Enter amount"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div>
              <label>Notice Pay</label>
              <input
                type="text"
                value={clearance.noticePay}
                onChange={(e) => handleChange("noticePay", e.target.value)}
                placeholder="Enter amount"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div>
              <label>Leave Encashment</label>
              <input
                type="text"
                value={clearance.leaveEncashment}
                onChange={(e) => handleChange("leaveEncashment", e.target.value)}
                placeholder="Enter amount"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div>
              <label>Other Deductions</label>
              <input
                type="text"
                value={clearance.otherDeductions}
                onChange={(e) => handleChange("otherDeductions", e.target.value)}
                placeholder="Enter amount"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div>
              <label>Total Deductions</label>
              <input
                type="text"
                value={clearance.totalDeductions}
                onChange={(e) => handleChange("totalDeductions", e.target.value)}
                placeholder="Enter total"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div>
              <label>Remarks</label>
              <input
                type="text"
                value={clearance.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
                placeholder="Any remarks"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
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
          {saving ? "Submitting..." : "Approve & Submit"}
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