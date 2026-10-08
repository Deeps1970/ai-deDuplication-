import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AnalysisPreset, DemoFile } from "@/types/dedupai";

interface UploadedDemoFile extends DemoFile {
  result: AnalysisPreset;
}

interface DedupAIContextValue {
  uploadedFiles: UploadedDemoFile[];
  addUploadedFile: (file: UploadedDemoFile) => void;
}

const DedupAIContext = createContext<DedupAIContextValue | null>(null);

export function DedupAIProvider({ children }: { children: ReactNode }) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDemoFile[]>([]);
  const value = useMemo(
    () => ({
      uploadedFiles,
      addUploadedFile: (file: UploadedDemoFile) => setUploadedFiles((current) => [file, ...current]),
    }),
    [uploadedFiles],
  );

  return <DedupAIContext.Provider value={value}>{children}</DedupAIContext.Provider>;
}

export function useDedupAI() {
  const context = useContext(DedupAIContext);
  if (!context) throw new Error("useDedupAI must be used inside DedupAIProvider");
  return context;
}