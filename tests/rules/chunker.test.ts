import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chunkPolicyText, chunkPolicyPages } from "../../lib/rag/chunker";
import type { ExtractedPolicyPage } from "../../lib/rag/pdf-parser";

export function runChunkerVerification() {
  console.log("=== Testing Policy Text Chunker ===");

  // 1. Verify chunkPolicyText against sample expense policy text
  const samplePolicyText = readFileSync("mocks/sample-expense-policy.txt", "utf8");
  const chunks = chunkPolicyText(samplePolicyText);

  console.log(`Parsed ${chunks.length} chunks from sample policy text.`);

  // Verify all 7 pages are represented
  const pageNumbers = chunks.map(c => c.pageNumber);
  for (let p = 1; p <= 7; p++) {
    assert.ok(pageNumbers.includes(p), `Missing page ${p} in chunks`);
  }

  // Verify section detection
  const section14 = chunks.find(c => c.pageNumber === 2);
  assert.equal(section14?.section, "1.4");
  assert.ok(section14?.content.includes("14 calendar days"));

  const section21 = chunks.find(c => c.pageNumber === 3);
  assert.equal(section21?.section, "2.1");
  assert.ok(section21?.content.includes("PKR 5,000"));

  const section31 = chunks.find(c => c.pageNumber === 4);
  assert.equal(section31?.section, "3.1");
  assert.ok(section31?.content.includes("PKR 25,000"));

  const section38 = chunks.find(c => c.pageNumber === 5);
  assert.equal(section38?.section, "3.8");
  assert.ok(section38?.content.includes("vice-presidential pre-approval"));

  const section42 = chunks.find(c => c.pageNumber === 6);
  assert.equal(section42?.section, "4.2");
  assert.ok(section42?.content.includes("PKR 50,000"));

  const section45 = chunks.find(c => c.pageNumber === 7);
  assert.equal(section45?.section, "4.5");
  assert.ok(section45?.content.includes("PKR 100,000"));
  console.log("Test 1 (chunkPolicyText Page & Section Detection): Passed");

  // 2. Verify chunkPolicyPages directly with ExtractedPolicyPage[]
  const mockPages: ExtractedPolicyPage[] = [
    {
      pageNumber: 1,
      text: "Section 1.1 Policy Overview\nAll business travel must be documented.\nSection 1.2 Eligible Employees\nFull-time staff are eligible.",
    },
    {
      pageNumber: 2,
      text: "Section 2.1 Receipt Rules\nReceipts required for claims over PKR 5,000.",
    },
    {
      pageNumber: 3,
      text: "   \n\n  ", // Empty page - should be ignored
    },
  ];

  const pageChunks = chunkPolicyPages(mockPages);

  // Pages must never cross page boundaries
  const page1Chunks = pageChunks.filter(c => c.pageNumber === 1);
  const page2Chunks = pageChunks.filter(c => c.pageNumber === 2);
  const page3Chunks = pageChunks.filter(c => c.pageNumber === 3);

  assert.equal(page1Chunks.length, 2, "Page 1 should have 2 sections");
  assert.equal(page1Chunks[0].section, "1.1");
  assert.equal(page1Chunks[1].section, "1.2");
  assert.equal(page2Chunks.length, 1, "Page 2 should have 1 section");
  assert.equal(page2Chunks[0].section, "2.1");
  assert.equal(page3Chunks.length, 0, "Empty page 3 should produce 0 chunks");

  // Chunks never cross pages
  for (const c of pageChunks) {
    assert.ok(c.content.trim().length > 0, "Chunks must not be empty");
  }
  console.log("Test 2 (chunkPolicyPages Boundary & Empty Isolation): Passed");

  console.log("✅ All chunker tests passed successfully!");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runChunkerVerification();
}
