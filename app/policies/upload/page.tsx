"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadCloud, ArrowLeft, CheckCircle2, Loader2, Sparkles, FileText, Settings, Key, GitMerge } from "lucide-react";
import { useSession } from "@/components/session/SessionProvider";
import { uploadDocument, processDocument, extractRules, generateWorkflow } from "@/lib/client/rulepilot-api";
import { normalizeApiError } from "@/lib/client/error";

export default function PolicyUploadPage() {
  const router = useRouter();
  const { updateSession } = useSession();
  
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { id: 1, label: "Uploading policy", icon: UploadCloud },
    { id: 2, label: "Reading document", icon: FileText },
    { id: 3, label: "Identifying rules", icon: Key },
    { id: 4, label: "Building workflow", icon: GitMerge },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFilePipeline = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    
    // Validate 4 MiB limit (4 * 1024 * 1024 = 4194304 bytes)
    if (file.size > 4194304) {
      setError("Maximum file size is 4 MiB.");
      return;
    }
    
    setFileName(file.name);
    setError(null);
    setCurrentStep(1);
    
    try {
      // Step 1: Upload
      const uploadRes = await uploadDocument(file);
      const documentId = uploadRes.documentId;
      
      updateSession({ documentId, documentName: file.name });
      
      setCurrentStep(2);
      
      // Step 2: Process Document
      await processDocument(documentId);
      
      setCurrentStep(3);
      
      // Step 3: Extract Rules
      const extractRes = await extractRules(documentId);
      updateSession({ rules: extractRes.rules });
      
      setCurrentStep(4);
      
      // Step 4: Generate Workflow
      const workflowRes = await generateWorkflow(documentId);
      updateSession({ workflowId: workflowRes.workflowId, workflow: workflowRes.workflow });
      
      // Done!
      setCurrentStep(5);
    } catch (err: any) {
      setError(normalizeApiError(err));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilePipeline(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFilePipeline(e.target.files[0]);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (currentStep > 0 && currentStep < 5) {
      // If we failed mid-pipeline, for this demo we'll let them upload again.
      // Alternatively, we could attempt to retry the specific step, but a full reset is safer here.
      setCurrentStep(0);
      setFileName(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-200 p-8 relative overflow-hidden flex flex-col">
      <div className="max-w-3xl mx-auto space-y-10 relative z-10 w-full mt-10">
        
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Analyze a Policy
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">
            Upload a corporate policy PDF to identify business rules and create an executable decision workflow.
          </p>
        </div>

        {currentStep === 0 ? (
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-14 text-center flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm overflow-hidden group
              ${isDragging ? "border-indigo-400 bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.2)] scale-[1.02]" : "border-indigo-500/30 bg-[#0d1b2a]/40 hover:bg-[#112538]/60 hover:border-indigo-400/70"}
              cursor-pointer
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,application/pdf" 
              onChange={handleFileChange}
            />
            
            <>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 shadow-lg ${
                isDragging ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 scale-110" : "bg-[#122336] text-indigo-400/80 border border-indigo-500/20 group-hover:text-indigo-400 group-hover:bg-[#162c41]"
              }`}>
                <UploadCloud className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-wide">
                {isDragging ? "Drop PDF to Analyze" : "Click or drag PDF to upload"}
              </h3>
              <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
                Maximum file size 4 MiB.
              </p>
              <div className="group/btn relative flex items-center gap-2 px-8 py-3 rounded-lg bg-indigo-600 text-white text-sm font-bold tracking-wide hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-500/20">
                <span className="relative z-10">Select Policy Document</span>
              </div>
            </>
            
            {error && (
              <div className="absolute bottom-4 bg-rose-500/10 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg text-sm" onClick={(e) => e.stopPropagation()}>
                {error}
              </div>
            )}
          </div>
        ) : currentStep < 5 ? (
          <div className="border border-indigo-500/20 bg-[#0d1b2a]/60 backdrop-blur-md rounded-2xl p-8 flex flex-col shadow-xl relative overflow-hidden">
             <h3 className="text-xl font-bold text-white mb-6">Analyzing {fileName}</h3>
             
             <div className="space-y-6">
                {steps.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  const isPending = currentStep < step.id;
                  const hasError = isActive && error;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className="flex items-center gap-4 relative">
                      {/* Vertical line connector */}
                      {step.id < 4 && (
                        <div className={`absolute top-10 left-5 w-0.5 h-6 -translate-x-1/2 ${isCompleted ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                      )}
                      
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        isCompleted ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' :
                        hasError ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' :
                        isActive ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 
                        'bg-slate-800 text-slate-500'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : 
                         hasError ? <UploadCloud className="w-5 h-5" /> :
                         isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                         <Icon className="w-5 h-5" />}
                      </div>
                      
                      <div>
                        <p className={`font-medium ${isCompleted || isActive ? 'text-white' : 'text-slate-500'}`}>
                          {step.label}
                        </p>
                        {hasError && (
                          <p className="text-sm text-rose-400 mt-1">{error}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
             </div>
             
             {error && (
                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                  <button onClick={handleRetry} className="px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium text-sm transition-colors">
                    Try Again
                  </button>
                </div>
             )}
          </div>
        ) : (
          <div className="border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md rounded-2xl p-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
               <Sparkles className="w-32 h-32 text-emerald-400" />
            </div>
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 tracking-wide">Policy Ready</h3>
            <p className="text-[15px] text-slate-300 max-w-md mb-8 leading-relaxed">
              <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded mr-1">{fileName}</span> 
              has been successfully analyzed and is ready for case evaluation.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
              <Link 
                href="/policies"
                className="group relative w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-3 rounded-lg bg-indigo-600 text-white text-sm font-bold tracking-wide shadow-lg hover:bg-indigo-500 transition-all duration-300"
              >
                <span className="relative z-10">View Rules</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
