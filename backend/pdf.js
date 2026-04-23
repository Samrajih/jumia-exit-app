const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const db = admin.firestore();

/* ========== Helpers ========== */

function safe(v, fallback = "N/A") {
  if (v === undefined || v === null || v === "") return fallback;
  return String(v);
}

function approvalState(stage, currentStatus) {
  const flow = [
    "HR-Pending",
    "LineManager-Pending",
    "Finance-Pending",
    "IT-Pending",
    "HR-Final",
    "Completed",
    "Rejected",
  ];

  if (!currentStatus || !flow.includes(currentStatus)) {
    return "Pending";
  }

  const currentIndex = flow.indexOf(currentStatus);
  const stageIndex = flow.indexOf(stage);

  if (currentIndex > stageIndex) return "Completed";
  if (currentIndex === stageIndex) return "In Progress";
  return "Pending";
}

/* ========== PDF Handler ========== */

async function generateClearancePDF(req, res) {
  try {
    let id = null;

    if (req.params && req.params.id) {
      id = req.params.id;
    } else if (req.originalUrl) {
      const parts = req.originalUrl.split("/");
      id = parts[parts.length - 1];
    }

    if (!id) {
      res.status(400).send("Missing exit ID");
      return;
    }

    const snap = await db.collection("exits").doc(id).get();
    if (!snap.exists) {
      res.status(404).send("Exit not found");
      return;
    }

    const data = snap.data();

    /* QR before streaming */
    let qrBuffer = null;
    try {
      // Use the actual deployed backend URL for QR code verification
      const verifyURL = `https://jumia-exit-backend.onrender.com/clearance/${id}`;
      const qrData = await QRCode.toDataURL(verifyURL);
      qrBuffer = Buffer.from(qrData.split(",")[1], "base64");
    } catch {}

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=Exit-${id}.pdf`
    );

    doc.pipe(res);

    /* Logo */
    const logoPath = path.join(__dirname, "assets", "jumia-logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 20, { width: 90 });
    }

    /* Title */
    doc.fontSize(18)
      .text("Staff Exit Clearance", 0, 40, { align: "center" });

    doc.moveTo(40, 75)
      .lineTo(doc.page.width - 40, 75)
      .stroke();

    let y = 90;
    doc.fontSize(11);

    /* Details */
    doc.text(`Exit ID: ${id}`, 40, y); y += 14;
    doc.text(`Name: ${safe(data.name)}`, 40, y); y += 14;
    doc.text(`Employee ID: ${safe(data.employeeId)}`, 40, y); y += 14;
    doc.text(`Department: ${safe(data.department)}`, 40, y); y += 14;
    doc.text(`Position: ${safe(data.position)}`, 40, y); y += 14;
    doc.text(`Status: ${safe(data.status)}`, 40, y);

    if (qrBuffer) {
      doc.image(qrBuffer, doc.page.width - 130, 90, { width: 90 });
    }

    y += 25;

    /* Approval Status */
    doc.fontSize(13)
      .text("Approval Status", 40, y, { underline: true });
    y += 18;

    doc.fontSize(11);
    doc.text(`HR Initiation: ${approvalState("HR-Pending", data.status)}`, 40, y); y += 14;
    doc.text(`Line Manager: ${approvalState("LineManager-Pending", data.status)}`, 40, y); y += 14;
    doc.text(`Finance: ${approvalState("Finance-Pending", data.status)}`, 40, y); y += 14;
    doc.text(`IT: ${approvalState("IT-Pending", data.status)}`, 40, y); y += 14;
    doc.text(`HR Final: ${approvalState("HR-Final", data.status)}`, 40, y);

    y += 30;

doc.fontSize(13).text("Signatures", 40, y, { underline: true });
y += 20;

const drawSignatureBox = (label, x, y) => {
  doc.rect(x, y, 200, 40).stroke();
  doc.fontSize(10).text(label, x + 5, y + 45);
};

// Left column
drawSignatureBox("Line Manager Signature & Date", 40, y);
drawSignatureBox("Finance Signature & Date", 40, y + 70);

// Right column
drawSignatureBox("IT Signature & Date", 300, y);
drawSignatureBox("HR Final Signature & Date", 300, y + 70);

y += 150;

/* ---------- Watermark / Final Stamp ---------- */
if (data.status === "Completed") {
  // FINAL APPROVAL STAMP
  doc.save()
    .rotate(-20, { origin: [300, 400] })
    .fontSize(42)
    .opacity(0.15)
    .fillColor("green")
    .text("FINAL APPROVED", 150, 330)
    .restore();
} else {
  // DRAFT watermark
  doc.save()
    .rotate(-45, { origin: [300, 400] })
    .fontSize(60)
    .opacity(0.1)
    .fillColor("gray")
    .text("DRAFT", 150, 350)
    .restore();
}

if (Array.isArray(data.history) && data.history.length > 0) {
  doc.addPage();

  doc.fontSize(16).text("Audit History", 40, 40, { align: "center" });
  doc.moveTo(40, 65).lineTo(doc.page.width - 40, 65).stroke();

  let tableY = 90;
  doc.fontSize(11);

  // Table headers
  doc.text("Stage", 40, tableY);
  doc.text("Action", 140, tableY);
  doc.text("By", 260, tableY);
  doc.text("Date / Time", 400, tableY);

  tableY += 12;
  doc.moveTo(40, tableY).lineTo(doc.page.width - 40, tableY).stroke();
  tableY += 10;

  // Table rows
  data.history.forEach((h) => {
    doc.text(safe(h.stage), 40, tableY);
    doc.text(safe(h.action), 140, tableY);
    doc.text(safe(h.by), 260, tableY);
    doc.text(safe(h.date), 400, tableY);
    tableY += 16;
  });
}

    /* Footer */
    doc.fontSize(9)
      .opacity(1)
      .fillColor("gray")
      .text(
        `Generated on ${new Date().toLocaleString()} | Ref: ${id}`,
        40,
        doc.page.height - 40
      );

    doc.end();
  } catch (err) {
    console.error("PDF ERROR:", err);
  }
}

module.exports = generateClearancePDF;