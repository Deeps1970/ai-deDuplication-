import type { AnalysisPreset, DemoFile, DuplicateGroup } from "@/types/dedupai";

export interface DedupActivityPoint {
  day: string;
  analyzed: number;
  duplicates: number;
  saved: number;
}

export interface DedupSavingsPoint {
  month: string;
  saved: number;
}

export interface DedupAnalytics {
  totalFiles: number;
  originalStorageGb: number;
  optimizedStorageGb: number;
  savedStorageGb: number;
  deduplicationRate: number;
  classification: {
    unique: number;
    duplicate: number;
    similar: number;
  };
  activity: DedupActivityPoint[];
  savingsTrend: DedupSavingsPoint[];
}

/**
 * Frontend contract for a future FastAPI integration. This file intentionally
 * makes no requests; the current interface remains a local-only demonstration.
 */
export interface DedupApi {
  getHealth(): Promise<{ status: string }>;
  uploadFile(file: File): Promise<DemoFile & { result: AnalysisPreset }>;
  getFiles(): Promise<DemoFile[]>;
  getFile(fileId: string): Promise<DemoFile | null>;
  getDuplicateGroups(): Promise<DuplicateGroup[]>;
  getAnalytics(): Promise<DedupAnalytics>;
}