import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "https://jumia-exit-backend.onrender.com";

export default function HRClearance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNA, setIsNA] = useState(false);
  const [clearance, setClearance] = useState({
    exitInterview: false,
    documentsSubmitted: false,
    idCardReturned: false,
    companyProperty: false,
    clearanceForm: false,
    remarks: "",
  });

  useEffect(() => {
    fetch(`${API_URL}/get-exits`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const found = data.data.find(r => r.id === id);
          setRecord(found);
          if (found?.HRFinalClearance) {
            setClearance(found.HRFinalClearance);
            if (found.HRFinalClearance.isNA) {
              setIsNA(true);
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Determine if this is HR Initiation or HR Final
  const isHRFinal = record?.status === "HR-Final" || record?.status === "HR-Final-Pending";
  const currentStage = isHRFinal ? "HR-Final" : "HR-Pending";

  const handleCheckbox = (field) => {
    setClearance(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (field, value) => {
    setClearance(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (action) => {
    setSaving(true);
    try {
      const payload = {
        currentStage: currentStage,
        action: action,
        comment: action === "na" 
          ? `${isHRFinal ? "HR Final" : "HR Initiation"} marked as N/A` 
          : `${isHRFinal ? "HR Final" : "HR Initiation"} completed`,
        clearance: isNA ? { isNA: true } : clearance,
      };

      const res = await fetch(`${API_URL}/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert(`${isHRFinal ? "HR Final" : "HR Initiation"} ${action === "na" ? "marked as N/A" : "submitted"} successfully!`);
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
      <h2>{isHRFinal ? "HR Final Clearance" : "HR Initiation"}</h2>
      
      <div style={{ background: "#f5f5f5", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3>Employee Details</h3>
        <p><strong>Name:</strong> {record.name}</p>
        <p><strong>Department:</strong> {record.department}</p>
        <p><strong>Employee ID:</strong> {record.employeeId}</p>
        <p><strong>Exit Date:</strong> {record.exitDate}</p>
        {!isHRFinal && (
          <>
            <p><strong>Position:</strong> {record.position}</p>
            <p><strong>Reason for Exit:</strong> {record.reason}</p>
          </>
        )}
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
          Check this if {isHRFinal ? "HR final" : "HR initiation"} clearance is not required
        </p>
      </div>

      {!isNA && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Clearance Checklist</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={clearance.exitInterview}
                onChange={() => handleCheckbox("exitInterview")}
                style={{ marginRight: "10px", transform: "scale(1.2)" }}
              />
              Exit Interview Completed
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={clearance.documentsSubmitted}
                onChange={() => handleCheckbox("documentsSubmitted")}
                style={{ marginRight: "10px", transform: "scale(1.2)" }}
              />
              All Documents Submitted
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={clearance.idCardReturned}
                onChange={() => handleCheckbox("idCardReturned")}
                style={{ marginRight: "10px", transform: "scale(1.2)" }}
              />
              ID Card Returned
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={clearance.companyProperty}
                onChange={() => handleCheckbox("companyProperty")}
                style={{ marginRight: "10px", transform: "scale(1.2)" }}
              />
              All Company Property Returned
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={clearance.clearanceForm}
                onChange={() => handleCheckbox("clearanceForm")}
                style={{ marginRight: "10px", transform: "scale(1.2)" }}
              />
              Clearance Form Signed
            </label>
          </div>

          <div style={{ marginTop: "20px" }}>
            <label>Remarks</label>
            <textarea
              value={clearance.remarks}
              onChange={(e) => handleChange("remarks", e.target.value)}
              placeholder="Any additional remarks"
              rows={4}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
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