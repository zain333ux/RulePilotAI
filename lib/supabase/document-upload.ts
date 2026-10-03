import "server-only";
import type {
  DocumentInsert,
  DocumentUploadPersistence,
  PersistedDocument,
} from "@/lib/documents/upload";
import { createRepositoryStore } from "@/lib/repositories/repositories";
import { getAdminSupabase } from "./admin";

const POLICY_BUCKET = "policies";

export function createSupabaseDocumentUploadPersistence(): DocumentUploadPersistence {
  const supabase = getAdminSupabase();
  const documents = createRepositoryStore(supabase);

  return {
    async upload(storagePath, file) {
      const { error } = await supabase.storage
        .from(POLICY_BUCKET)
        .upload(storagePath, file, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (error) throw new Error("Supabase Storage upload failed.", { cause: error });
    },

    async insertDocument(input: DocumentInsert): Promise<PersistedDocument> {
      const document = await documents.createDocument(input);
      if (document.status !== "uploaded" || !document.storagePath) {
        throw new Error("Document repository returned an invalid upload record.");
      }

      return {
        id: document.id,
        name: document.name,
        storagePath: document.storagePath,
        status: document.status,
        createdAt: document.createdAt,
      };
    },

    async remove(storagePath) {
      const { error } = await supabase.storage.from(POLICY_BUCKET).remove([storagePath]);
      if (error) throw new Error("Supabase Storage cleanup failed.", { cause: error });
    },
  };
}
