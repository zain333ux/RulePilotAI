/**
 * Page-Aware Policy Text Chunker
 * Owned by Member 2 (AI / RAG / Rule Engine).
 *
 * Chunks policy text while preserving exact page numbers, section identifiers,
 * and text boundaries. Never fabricates page numbers or sections.
 */

export interface PolicyChunk {
  pageNumber: number; // 1-indexed
  section?: string;
  content: string;
}

/**
 * Parses raw or extracted policy text into page-aware chunks.
 * Handles page markers (e.g., "=== Demo Page X ===", "=== Page X ===", "\f"),
 * detects section headers (e.g. "Section 1.4"), and trims clean text.
 */
export function chunkPolicyText(rawText: string): PolicyChunk[] {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const normalized = rawText.replace(/\r\n/g, "\n");
  const chunks: PolicyChunk[] = [];

  // Check for explicit page delimiter patterns: "=== Demo Page X ===" or "=== Page X ==="
  const pageMarkerRegex = /===\s*(?:Demo\s+)?Page\s+(\d+)\s*===/gi;
  const pageMatches = Array.from(normalized.matchAll(pageMarkerRegex));

  if (pageMatches.length > 0) {
    for (let i = 0; i < pageMatches.length; i++) {
      const match = pageMatches[i];
      const pageNum = parseInt(match[1], 10);
      const startIndex = (match.index ?? 0) + match[0].length;
      const endIndex = i + 1 < pageMatches.length ? (pageMatches[i + 1].index ?? normalized.length) : normalized.length;
      const pageBody = normalized.slice(startIndex, endIndex).trim();

      if (pageBody.length > 0) {
        parsePageContentIntoChunks(pageNum, pageBody, chunks);
      }
    }
    return chunks;
  }

  // Check for form feed character '\f' (standard PDF page separator)
  if (normalized.includes("\f")) {
    const pages = normalized.split("\f");
    pages.forEach((pageContent, idx) => {
      const pageNum = idx + 1;
      const trimmed = pageContent.trim();
      if (trimmed.length > 0) {
        parsePageContentIntoChunks(pageNum, trimmed, chunks);
      }
    });
    return chunks;
  }

  // Single page or unstructured fallback
  parsePageContentIntoChunks(1, normalized.trim(), chunks);
  return chunks;
}

/**
 * Extracts sections within a page's content, associating them with the page number.
 */
function parsePageContentIntoChunks(pageNumber: number, text: string, output: PolicyChunk[]) {
  // Regex to detect "Section X.Y" or "Section X"
  const sectionHeaderRegex = /(?:^|\n)(?:Section\s+)?(\d+(?:\.\d+)+|\bSection\s+\d+\b)[^\n]*/gi;
  const sectionMatches = Array.from(text.matchAll(sectionHeaderRegex));

  if (sectionMatches.length === 0) {
    output.push({
      pageNumber,
      content: text,
    });
    return;
  }

  // If there is preamble before first section
  const firstMatchIndex = sectionMatches[0].index ?? 0;
  if (firstMatchIndex > 0) {
    const preamble = text.slice(0, firstMatchIndex).trim();
    if (preamble.length > 0) {
      output.push({
        pageNumber,
        content: preamble,
      });
    }
  }

  for (let i = 0; i < sectionMatches.length; i++) {
    const match = sectionMatches[i];
    const rawSectionHeader = match[0].trim();
    const sectionNumMatch = rawSectionHeader.match(/(\d+(?:\.\d+)*)/);
    const section = sectionNumMatch ? sectionNumMatch[1] : undefined;

    const startIdx = (match.index ?? 0) + match[0].length;
    const endIdx = i + 1 < sectionMatches.length ? (sectionMatches[i + 1].index ?? text.length) : text.length;
    const content = text.slice(startIdx, endIdx).trim();

    output.push({
      pageNumber,
      section,
      content: content.length > 0 ? content : rawSectionHeader,
    });
  }
}
