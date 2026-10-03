import assert from "node:assert/strict";
import { extractPdfPages, UnreadablePdfError } from "../../lib/rag/pdf-parser";

/**
 * Creates a valid multi-page digital PDF in memory without external tools.
 */
function createMinimalPdfFixture(pages: string[]): Uint8Array {
  const fontObjNum = 3 + pages.length * 2;
  const pageObjNums = pages.map((_, i) => 3 + i);
  const contentObjNums = pages.map((_, i) => 3 + pages.length + i);

  let body = `%PDF-1.4\n`;
  body += `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n`;
  body += `2 0 obj << /Type /Pages /Kids [${pageObjNums.map(n => `${n} 0 R`).join(" ")}] /Count ${pages.length} >> endobj\n`;

  for (let i = 0; i < pages.length; i++) {
    body += `${pageObjNums[i]} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjNums[i]} 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> >> endobj\n`;
  }

  for (let i = 0; i < pages.length; i++) {
    const stream = `BT /F1 12 Tf 72 700 Td (${pages[i]}) Tj ET`;
    body += `${contentObjNums[i]} 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj\n`;
  }

  body += `${fontObjNum} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n`;
  body += `xref\n0 1\n0000000000 65535 f \ntrailer << /Root 1 0 R >>\nstartxref\n100\n%%EOF`;

  return new TextEncoder().encode(body);
}

export async function runPdfParserVerification() {
  console.log("=== Testing Server-Only PDF Text Parser ===");

  // 1. Multiple pages & exact 1-based page numbering
  const page1Content = "Corporate Expense Policy Page 1: General rules";
  const page2Content = "Corporate Expense Policy Page 2: Section 1.4 Timeliness 14 days";
  const pdfBytes = createMinimalPdfFixture([page1Content, page2Content]);

  const extracted = await extractPdfPages(pdfBytes);
  assert.equal(extracted.length, 2, "Expected 2 extracted pages");
  assert.equal(extracted[0].pageNumber, 1, "Page numbers must be 1-indexed");
  assert.equal(extracted[1].pageNumber, 2, "Page numbers must be 1-indexed");
  assert.ok(extracted[0].text.includes("General rules"), "Page 1 content must match");
  assert.ok(extracted[1].text.includes("Section 1.4"), "Page 2 content must match");
  console.log("Test 1 (Valid Multi-Page Digital PDF Extraction): Passed");

  // 2. Reject empty PDF buffer
  await assert.rejects(
    async () => {
      await extractPdfPages(new Uint8Array(0));
    },
    UnreadablePdfError,
    "Expected UnreadablePdfError for 0-byte input"
  );
  console.log("Test 2 (Empty Buffer Rejection): Passed");

  // 3. Reject unreadable / empty page content
  const emptyPdf = createMinimalPdfFixture(["   ", ""]);
  await assert.rejects(
    async () => {
      await extractPdfPages(emptyPdf);
    },
    UnreadablePdfError,
    "Expected UnreadablePdfError for PDF with no extractable text"
  );
  console.log("Test 3 (Scanned/Unreadable PDF Fails Closed): Passed");

  console.log("✅ All PDF parser tests passed successfully!");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runPdfParserVerification().catch((err) => {
    console.error("PDF Parser test failed:", err);
    process.exit(1);
  });
}
