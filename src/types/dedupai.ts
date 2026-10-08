export type FileStatus = "Unique" | "Duplicate" | "Similar" | "Pending";

export interface DemoFile {
  id: string;
  name: string;
  type: string;
  sizeMb: number;
  status: FileStatus;
  similarity: number | null;
  location: string;
  uploaded: string;
  createdAt?: string;
  potentialSavingMb: number;
  analysisStatus?: "pending" | "completed" | "unsupported" | "failed" | null;
  duplicateOf?: string | null;
}

export interface DuplicateGroup {
  id: string;
  primaryFileId?: string;
  primaryFile: string;
  relatedFiles: { id?: string; name: string; similarity: number | null; sizeMb?: number }[];
  totalSizeMb: number;
  potentialSavingMb: number;
}

export interface AnalysisPreset {
  status: FileStatus;
  similarity: number | null;
  matchedFile: string | null;
  recommendation: string;
  potentialSavingMb: number;
  storageSaved?: boolean;
}
