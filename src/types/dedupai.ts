export type FileStatus = "Unique" | "Duplicate" | "Similar";

export interface DemoFile {
  id: string;
  name: string;
  type: string;
  sizeMb: number;
  status: FileStatus;
  similarity: number | null;
  location: string;
  uploaded: string;
  potentialSavingMb: number;
}

export interface DuplicateGroup {
  id: string;
  primaryFile: string;
  relatedFiles: { name: string; similarity: number }[];
  totalSizeMb: number;
  potentialSavingMb: number;
}

export interface AnalysisPreset {
  status: FileStatus;
  similarity: number | null;
  matchedFile: string | null;
  recommendation: string;
  potentialSavingMb: number;
}