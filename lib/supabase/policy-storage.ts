import "server-only";
import { getAdminSupabase } from "./admin";

const POLICY_BUCKET = "policies";

export class PolicyStorageError extends Error {
  constructor(message = "Could not read the stored policy document.", options?: ErrorOptions) {
    super(message, options);
    this.name = "PolicyStorageError";
  }
}

export async function downloadPolicyPdf(storagePath: string): Promise<Uint8Array> {
  const { data, error } = await getAdminSupabase().storage
    .from(POLICY_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new PolicyStorageError(undefined, { cause: error });
  }

  return new Uint8Array(await data.arrayBuffer());
}
