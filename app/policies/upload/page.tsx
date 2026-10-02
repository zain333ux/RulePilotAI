import Link from "next/link";
import { UploadCloud, ArrowLeft } from "lucide-react";

export default function PolicyUploadPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Upload Policy or SOP</h1>
          <p className="text-sm text-zinc-400">
            Upload a corporate policy PDF to extract business rules, citations, and visual
            execution flows.
          </p>
          <p className="mt-2 text-xs text-amber-400/90 font-medium">
            Upload API returns HTTP 501 until Member 1 connects Supabase Storage.
          </p>
        </div>

        <div className="border-2 border-dashed border-zinc-800 bg-zinc-900/30 rounded-2xl p-12 text-center flex flex-col items-center justify-center opacity-80">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">PDF upload unavailable</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-6">
            Dropzone UI owned by Member 3. Storage pipeline owned by Member 1. Use mock fixtures
            in <code className="text-zinc-300">/mocks</code> until both are wired.
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="POST /api/documents/upload is not implemented yet"
            className="px-5 py-2.5 rounded-lg bg-zinc-800 text-zinc-500 font-medium text-sm cursor-not-allowed border border-zinc-700"
          >
            Select PDF Document (unavailable)
          </button>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 text-xs text-zinc-500">
          Module ownership: PDF storage upload pipeline is owned by{" "}
          <span className="text-zinc-300">Member 1</span>; Upload dropzone UI and loading states
          are owned by <span className="text-zinc-300">Member 3</span>.
        </div>
      </div>
    </div>
  );
}
