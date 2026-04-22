import React, { useEffect, useState } from "react";

const API_URL = "https://jumia-exit-backend.onrender.com";

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <h2>Staff Exit Dashboard</h2>
      {records.length === 0 ? (
        <p>No records found</p>
      ) : (
        <ul>
          {records.map(r => (
            <li key={r.id}>
              {r.name} — {r.department} — {r.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}