import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "https://jumia-exit-backend.onrender.com";

// IT Asset items with quantities
const IT_ASSET_ITEMS = [
  { id: "laptop", label: "Laptop", type: "number", defaultValue: 0 },
  { id: "accessCard", label: "Access Cards", type: "number", defaultValue: 0 },
  { id: "mifi", label: "Mifi", type: "number", defaultValue: 0 },
  { id: "flashDrive", label: "Flash Drive", type: "number", defaultValue: 0 },
  { id: "headset", label: "Headset", type: "number", defaultValue: 0 },
  { id: "mouse", label: "Mouse", type: "number", defaultValue: 0 },
  { id: "mobilePickingDevice", label: "Mobile Picking Device", type: "number", defaultValue: 0 },
  { id: "a4Printer", label: "A4 Printer", type: "number", defaultValue: 0 },
  { id: "barcodePrinter", label: "Barcode Printer", type: "number", defaultValue: 0 },
  { id: "desktopComputer", label: "Desktop Computer", type: "number", defaultValue: 0 },
  { id: "trueinTab", label: "True-in Tab", type: "number", defaultValue: 0 },
  { id: "other", label: "Other", type: "text", defaultValue: "" },
];

export default function ITClearance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNA, setIsNA] = useState(false);
  const [assets, setAssets] = useState({});

  useEffect(() => {
    fetch(`${API_URL}/get-exits`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const found = data.data.find(r => r.id === id);
          setRecord(found);
          if (found?.ITAssets) {
            setAssets(found.ITAssets);
            if (found.ITAssets.isNA) {
              setIsNA(true);
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (itemId, value) => {
    setAssets(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = async (action) => {
    setSaving(true);
    try {
      const payload = {
        currentStage: "IT-Pending",
        action: action,
        comment: action === "na" ? "IT Clearance marked as N/A" : "IT Clearance completed",
        clearance: isNA ? { isNA: true } : assets,
      };

      const res = await fetch(`${API_URL}/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert(`IT Clearance ${action === "na" ? "marked as N/A" : "submitted"} successfully!`);
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
      <h2>IT Asset Clearance</h2>
      
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
          Check this if the employee has no IT assets to return
        </p>
      </div>

      {!isNA && (
        <div style={{ marginBottom: "20px" }}>
          <h3>IT Assets to Return</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px" }}>
            {IT_ASSET_ITEMS.map(item => (
              <div key={item.id} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  {item.label}
                </label>
                {item.type === "number" ? (
                  <input
                    type="number"
                    min="0"
                    value={assets[item.id] || item.defaultValue}
                    onChange={(e) => handleChange(item.id, parseInt(e.target.value) || 0)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                ) : (
                  <input
                    type="text"
                    value={assets[item.id] || item.defaultValue}
                    onChange={(e) => handleChange(item.id, e.target.value)}
                    placeholder="Specify details"
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                )}
              </div>
            ))}
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