import type { ApiError, UploadResponse } from "@/types/api";

export const MAX_POLICY_PDF_BYTES = 4 * 1024 * 1024;

export interface DocumentInsert {
  id: string;
  name: string;
  storagePath: string;
  status: "uploaded";
}

export interface PersistedDocument extends DocumentInsert {
  createdAt: string;
}

export interface DocumentUploadPersistence {
  upload(storagePath: string, file: File): Promise<void>;
  insertDocument(input: DocumentInsert): Promise<PersistedDocument>;
  remove(storagePath: string): Promise<void>;
}

interface UploadOptions {
  createId?: () => string;
  logger?: Pick<Console, "error">;
}

class UploadInputError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

function errorResponse(status: number, code: string, error: string): Response {
  const body: ApiError = { success: false, code, error };
  return Response.json(body, { status });
}

function originalFileName(name: string): string {
  const baseName = name.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return baseName?.slice(0, 255) || "policy.pdf";
}

function safePdfFileName(name: string): string {
  const baseName = originalFileName(name).replace(/\.pdf$/i, "");
  const safeStem = baseName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return `${safeStem || "policy"}.pdf`;
}

async function validatePdf(file: File): Promise<void> {
  if (file.size === 0) {
    throw new UploadInputError(400, "EMPTY_FILE", "The uploaded PDF is empty.");
  }
  if (file.size > MAX_POLICY_PDF_BYTES) {
    throw new UploadInputError(
      413,
      "FILE_TOO_LARGE",
      "The PDF must not exceed 4 MiB."
    );
  }
  if (file.type.toLowerCase() !== "application/pdf") {
    throw new UploadInputError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Only PDF files are accepted."
    );
  }

  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const isPdf = signature.length === 5
    && signature[0] === 0x25
    && signature[1] === 0x50
    && signature[2] === 0x44
    && signature[3] === 0x46
    && signature[4] === 0x2d;
  if (!isPdf) {
    throw new UploadInputError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "The file content is not a valid PDF."
    );
  }
}

function getSingleFile(formData: FormData): File {
  const files = [...formData.values()].filter((value): value is File => value instanceof File);
  const fileEntries = formData.getAll("file");
  if (files.length !== 1 || fileEntries.length !== 1 || !(fileEntries[0] instanceof File)) {
    throw new UploadInputError(
      400,
      "FILE_REQUIRED",
      "Provide exactly one PDF in the file field."
    );
  }
  return fileEntries[0];
}

export async function handleDocumentUpload(
  request: Request,
  createPersistence: () => DocumentUploadPersistence,
  options: UploadOptions = {}
): Promise<Response> {
  const logger = options.logger ?? console;
  let file: File;

  try {
    file = getSingleFile(await request.formData());
    await validatePdf(file);
  } catch (error) {
    if (error instanceof UploadInputError) {
      return errorResponse(error.status, error.code, error.message);
    }
    return errorResponse(400, "INVALID_MULTIPART", "Expected multipart/form-data with one PDF.");
  }

  let persistence: DocumentUploadPersistence;
  try {
    persistence = createPersistence();
  } catch (error) {
    logger.error("Document upload configuration failed.", error);
    return errorResponse(503, "SERVICE_UNAVAILABLE", "Document storage is not configured.");
  }

  const documentId = options.createId?.() ?? crypto.randomUUID();
  const fileName = originalFileName(file.name);
  const storagePath = `${documentId}/${safePdfFileName(fileName)}`;

  try {
    await persistence.upload(storagePath, file);
  } catch (error) {
    logger.error("Document storage upload failed.", error);
    return errorResponse(500, "PERSISTENCE_FAILED", "The document could not be saved.");
  }

  let document: PersistedDocument;
  try {
    document = await persistence.insertDocument({
      id: documentId,
      name: fileName,
      storagePath,
      status: "uploaded",
    });
  } catch (error) {
    logger.error("Document database insert failed.", error);
    try {
      await persistence.remove(storagePath);
    } catch (cleanupError) {
      logger.error("Document upload rollback failed.", cleanupError);
    }
    return errorResponse(500, "PERSISTENCE_FAILED", "The document could not be saved.");
  }

  const body: UploadResponse = {
    success: true,
    documentId: document.id,
    storagePath: document.storagePath,
    document: {
      id: document.id,
      name: document.name,
      status: document.status,
      createdAt: document.createdAt,
    },
  };
  return Response.json(body, { status: 201 });
}
