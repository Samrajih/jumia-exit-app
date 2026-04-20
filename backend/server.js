// ==============================
// BASIC SETUP (MUST BE FIRST)
// ==============================
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// ✅ CREATE EXPRESS APP FIRST
const app = express();

// ==============================
// MIDDLEWARE
// ==============================
app.use(cors());          // allow all origins (dev-safe)
app.use(express.json());  // parse JSON bodies

// ==============================
// FIREBASE ADMIN (HYBRID MODE)
// ==============================
const admin = require("firebase-admin");

let serviceAccount;

if (process.env.NODE_ENV === "production") {
  // ✅ Render / production: ONLY use env var
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("FIREBASE_SERVICE_ACCOUNT is missing in production");
    process.exit(1);
  }

  console.log("NODE_ENV =", process.env.NODE_ENV);
console.log(
  "FIREBASE_SERVICE_ACCOUNT length =",
  process.env.FIREBASE_SERVICE_ACCOUNT
    ? process.env.FIREBASE_SERVICE_ACCOUNT.length
    : "MISSING"
);


  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

console.log(
  "FIREBASE ENV CHECK:",
  process.env.FIREBASE_SERVICE_ACCOUNT?.slice(0, 50)
);

} else {
  // ✅ Local development only
  serviceAccount = require("./serviceAccount.json");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();


// other imports
const generateClearancePDF = require("./pdf");
const sendEmail = require("./graphEmail");

// workflow
const WORKFLOW = [
  "HR",
  "LineManager",
  "Finance",
  "IT",
  "HR-Final",
  "Completed"
];

// ✅ ROUTES START HERE (NO middleware below!)



// ==============================
// SUBMIT EXIT REQUEST (ENFORCED)
// ==============================
app.post("/submit-exit", async (req, res) => {
  try {
    const data = req.body;

    const docRef = await db.collection("exits").add({
      ...data,

      // ✅ HARD RULE: ALL cases MUST start here
      status: "HR-Pending",

      createdAt: new Date(),

      // ✅ Clearance placeholders (remain null until used)
      ITAssets: null,
      FinanceClearance: null,
      LineManagerClearance: null,
      HRFinalClearance: null,
    });

    res.json({
      success: true,
      message: "Exit submitted successfully",
      id: docRef.id,
    });
  } catch (err) {
    console.error("SUBMIT EXIT ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================================
// GET ALL
// ==================================
app.get("/get-exits", async (req, res) => {
  try {
    const snap = await db.collection("exits").orderBy("createdAt", "desc").get();

    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================================
// APPROVE WITH OPTIONAL COMMENT
// ==================================
app.post("/approve/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { currentStage, comment } = req.body;

    if (!currentStage) {
      return res.status(400).json({
        success: false,
        message: "Missing currentStage",
      });
    }

    // Determine exact stage name safely
    let stageName;

    if (currentStage.startsWith("HR-Final")) {
    stageName = "HR-Final";
    } else {
    stageName = currentStage.split("-")[0];
    }

    const WORKFLOW = [
      "HR",
      "LineManager",
      "Finance",
      "IT",
      "HR-Final",
      "Completed",
    ];

    if (stageName === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Request already completed",
      });
    }

    const index = WORKFLOW.indexOf(stageName);
    if (index === -1) {
      return res.status(400).json({
        success: false,
        message: "Invalid stage",
      });
    }

    const nextStageName = WORKFLOW[index + 1];
    const nextStatus =
      nextStageName === "Completed"
        ? "Completed"
        : `${nextStageName}-Pending`;

    await db.collection("exits").doc(id).set(
      {
        status: nextStatus,
        approvalComments: admin.firestore.FieldValue.arrayUnion({
          by: stageName,
          comment: comment || null,
          at: new Date().toISOString(),
        }),
      },
      { merge: true }
    );

    res.json({
      success: true,
      message: `Stage moved to ${nextStatus}`,
      nextStatus,
    });

  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ==================================
// FINANCE CLEARANCE ROUTE
// ==================================
app.post("/update-assets/Finance/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    await db.collection("exits").doc(id).set(
      {
        FinanceClearance: data,
      },
      { merge: true }
    );

    res.json({
      success: true,
      message: "Finance clearance saved",
    });
  } catch (error) {
    console.error("Finance error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================================
// IT CLEARANCE ROUTE
// ==================================
app.post("/update-assets/IT/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    await db.collection("exits").doc(id).set(
      {
        ITAssets: data,
      },
      { merge: true }
    );

    res.json({
      success: true,
      message: "IT clearance saved",
    });
  } catch (error) {
    console.error("IT error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


// ==================================
// HR FINAL CLEARANCE ROUTE
// ==================================
app.post("/update-assets/HRFinal/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    await db.collection("exits").doc(id).set(
      {
        HRFinalClearance: data,
      },
      { merge: true }
    );

    res.json({
      success: true,
      message: "HR-Final clearance saved",
    });
  } catch (error) {
    console.error("HR-Final error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ===============================
// FINANCE CLEARANCE ROUTE
// ===============================
app.post("/update-assets/Finance/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    // Save Finance clearance into the nested field
    await db.collection("exits").doc(id).update({
      FinanceClearance: data,
    });

    res.json({ success: true, message: "Finance clearance saved" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ===============================
// HR FINAL CLEARANCE ROUTE
// ===============================
app.post("/update-assets/HRFinal/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    // Save HR Final clearance inside nested field
    await db.collection("exits").doc(id).update({
      HRFinalClearance: data,
    });

    res.json({ success: true, message: "HR-Final clearance saved" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});




// ==================================
// REJECT EXIT REQUEST
// ==================================
app.post("/reject/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { reason, rejectedBy } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    await db.collection("exits").doc(id).set(
      {
        status: "Rejected",
        rejection: {
          by: rejectedBy || "HR",
          reason,
          at: new Date().toISOString(),
        },
      },
      { merge: true }
    );

    res.json({
      success: true,
      message: "Exit request rejected successfully",
    });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================================
// GET EXIT RECORDS (WITH DATE RANGE)
// ==================================
app.get("/exits", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = db.collection("exits");

    if (startDate && endDate) {
      query = query
        .where("createdAt", ">=", new Date(startDate))
        .where("createdAt", "<=", new Date(endDate));
    }

    const snapshot = await query.get();

    const records = snapshot.docs.map(doc => ({
  id: doc.id,          // ✅ ADD THIS
  ...doc.data(),
}));

    res.json(records);
  } catch (err) {
    console.error("Fetch exits error:", err);
    res.status(500).json({ error: err.message });
  }
});


// ==================================
// VERIFY ROUTE (QR CODE)
// ==================================
app.get("/verify/:id", async (req, res) => {
  try {
    const snap = await db.collection("exits").doc(req.params.id).get();

    if (!snap.exists)
      return res.status(404).json({ success: false, message: "Record not found" });

    const data = snap.data();

    // HR-Final can only approve if all previous stages are completed
if (stageName === "HR-Final") {
  if (
    !data.LineManagerClearance ||
    !data.FinanceClearance ||
    !data.ITAssets
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Cannot complete exit. Line Manager, Finance, and IT must be cleared first.",
    });
  }
}

    res.json({
      success: true,
      id: snap.id,
      ...data,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================================
// REPORTING: EXIT SUMMARY
// ==================================
app.get("/reports/exits", async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;

    let start, end;
    const now = new Date();

    if (range === "week") {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      end = now;
    }

    if (range === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
    }

    if (range === "year") {
      start = new Date(now.getFullYear(), 0, 1);
      end = now;
    }

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    }

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range",
      });
    }

    const snapshot = await db
      .collection("exits")
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .get();

    const summary = {
      total: 0,
      completed: 0,
      rejected: 0,
      pending: 0,
    };

    snapshot.forEach((doc) => {
      const data = doc.data();
      summary.total++;

      if (data.status === "Completed") summary.completed++;
      else if (data.status === "Rejected") summary.rejected++;
      else summary.pending++;
    });

    res.json({
      success: true,
      range: { start, end },
      summary,
    });
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


// ==================================
// REPORTING: EXPORT EXIT REPORT (CSV)
// ==================================
app.get("/reports/exits/export", async (req, res) => {
  try {
    const { range, startDate, endDate, status } = req.query;

    let start = null;
    let end = null;
    const now = new Date();

    // Preset ranges
    if (range === "week") {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      end = now;
    } else if (range === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
    } else if (range === "year") {
      start = new Date(now.getFullYear(), 0, 1);
      end = now;
    }

    // Custom date range
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    }

    // Base query
    let query = db.collection("exits");

    // Apply date filter ONLY if supplied
    if (start && end) {
      query = query
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end);
    }

    // Apply status filter ONLY if supplied
    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();

    // Build CSV
    let csv =
      "Employee Name,Employee ID,Department,Position,Status,Created At\n";

    snapshot.forEach((doc) => {
      const d = doc.data();
      csv += `"${d.name}","${d.employeeId}","${d.department}","${d.position}","${d.status}","${d.createdAt?.toDate()}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=exit-report.csv"
    );

    res.send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).send("Error generating CSV");
  }
});
// ==============================
// CLEARANCE PDF ROUTE
// ==============================
app.get("/clearance/:id", generateClearancePDF);

// ==============================
// START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});