import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chunkPolicyText } from "../../lib/rag/chunker";

export function runChunkerVerification() {
  console.log("=== Testing Policy Text Chunker ===");

  const samplePolicyText = readFileSync("mocks/sample-expense-policy.txt", "utf8");
  const chunks = chunkPolicyText(samplePolicyText);

  console.log(`Parsed ${chunks.length} chunks from sample policy.`);

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

  console.log("✅ All chunker tests passed successfully!");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runChunkerVerification();
}
