import "server-only";
import { extractText } from "unpdf";

export interface ExtractedPolicyPage {
  pageNumber: number; // 1-indexed
  text: string;
}

export class PdfExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfExtractionError";
  }
}

export class UnreadablePdfError extends PdfExtractionError {
  constructor(
    message = "PDF document contains no extractable digital text. Scanned documents or image-only PDFs are not supported."
  ) {
    super(message);
    this.name = "UnreadablePdfError";
  }
}

/**
 * Extracts page-aware digital text from PDF binary bytes.
 *
 * Requirements:
 * - Server-only execution
 * - 1-based exact page numbering
 * - Rejects empty or scanned/unreadable PDFs with UnreadablePdfError
 * - No OCR; parses digital PDF text streams directly
 * - Never fabricates fake page numbers or contents
 */
export async function extractPdfPages(
  pdfBytes: Uint8Array
): Promise<ExtractedPolicyPage[]> {
  if (!pdfBytes || pdfBytes.byteLength === 0) {
    throw new UnreadablePdfError("PDF binary payload is empty (0 bytes).");
  }

  // Ensure data is Uint8Array (handling Buffer wrappers cleanly)
  const uint8Data =
    pdfBytes instanceof Uint8Array
      ? new Uint8Array(pdfBytes.buffer, pdfBytes.byteOffset, pdfBytes.byteLength)
      : new Uint8Array(pdfBytes);

  let extractionResult: { totalPages: number; text: string[] };

  try {
    const result = await extractText(uint8Data, { mergePages: false });
    extractionResult = result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new PdfExtractionError(`Failed to parse PDF binary stream: ${errorMsg}`);
  }

  if (
    !extractionResult ||
    !Array.isArray(extractionResult.text) ||
    extractionResult.totalPages === 0 ||
    extractionResult.text.length === 0
  ) {
    throw new UnreadablePdfError("PDF contains 0 pages or no page stream structure.");
  }

  const pages: ExtractedPolicyPage[] = [];
  let totalNonEmptyLength = 0;

  for (let i = 0; i < extractionResult.text.length; i++) {
    const pageNum = i + 1; // 1-indexed
    const pageText = extractionResult.text[i] ?? "";
    const cleanText = pageText.replace(/\r\n/g, "\n").trim();

    pages.push({
      pageNumber: pageNum,
      text: cleanText,
    });

    totalNonEmptyLength += cleanText.length;
  }

  // If all pages contain zero extractable text (e.g. scanned image-only PDF), fail closed.
  if (totalNonEmptyLength === 0) {
    throw new UnreadablePdfError(
      "PDF document contains no extractable digital text across all pages. Scanned documents or image-only PDFs are not supported."
    );
  }

  return pages;
}
