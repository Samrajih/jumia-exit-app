/**
 * Firestore Exit Record Repair Script
 * ----------------------------------
 * Purpose:
 * - Repair corrupted or legacy exit records
 * - Normalize workflow status
 * - Remove obsolete fields
 * - Ensure compatibility with current workflow
 *
 * Run manually with:
 *   node repair.js
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json");

// ✅ IMPORTANT: Guard admin initialization
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ✅ CURRENT WORKFLOW (must match server.js)
const WORKFLOW = [
  "HR",
  "LineManager",
  "Finance",
  "IT",
  "HR-Final",
  "Completed",
];

async function repairExitRecords() {
  try {
    console.log("🔧 Starting exit records repair...");

    const snapshot = await db.collection("exits").get();

    let repairedCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      let updates = {};

      // -----------------------------
      // 1️⃣ Normalize status
      // -----------------------------
      if (data.status) {
        const stage = data.status.split("-")[0];

        if (!WORKFLOW.includes(stage)) {
          console.warn(
            `⚠ Invalid stage "${data.status}" in record ${doc.id}, resetting to HR-Pending`
          );
          updates.status = "HR-Pending";
        }
      } else {
        updates.status = "HR-Pending";
      }

      // -----------------------------
      // 2️⃣ Ensure clearance placeholders exist
      // -----------------------------
      if (data.LineManagerClearance === undefined) {
        updates.LineManagerClearance = null;
      }
      if (data.FinanceClearance === undefined) {
        updates.FinanceClearance = null;
      }
      if (data.ITAssets === undefined) {
        updates.ITAssets = null;
      }
      if (data.HRFinalClearance === undefined) {
        updates.HRFinalClearance = null;
      }

      // -----------------------------
      // 3️⃣ Remove legacy / obsolete fields
      // -----------------------------
      if (data.AdminAssets !== undefined) {
        updates.AdminAssets = admin.firestore.FieldValue.delete();
      }
      if (data.SecurityChecks !== undefined) {
        updates.SecurityChecks = admin.firestore.FieldValue.delete();
      }

      // -----------------------------
      // Apply updates if needed
      // -----------------------------
      if (Object.keys(updates).length > 0) {
        await db.collection("exits").doc(doc.id).set(updates, { merge: true });
        repairedCount++;
        console.log(`✅ Repaired record: ${doc.id}`);
      }
    }

    console.log(`✅ Repair complete. ${repairedCount} record(s) updated.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Repair failed:", error);
    process.exit(1);
  }
}

// 🔥 Run manually only
repairExitRecords();