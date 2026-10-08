import type { AnalysisPreset, DemoFile, DuplicateGroup, FileStatus } from "@/types/dedupai";

const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"]?.replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 30_000;

export interface ApiHealth {
  status: string;
  service: string;
}

export interface ApiFile {
  id: string;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  file_hash: string | null;
  deduplication_status: "unique" | "duplicate" | "similar" | "pending" | null;
  similarity_score: number | null;
  duplicate_of: string | null;
  analysis_status: "pending" | "completed" | "unsupported" | "failed" | null;
  analyzed_at: string | null;
}

export interface ApiFileResult extends ApiFile {
  storage_saved: boolean;
}

export interface ApiFileResponse {
  success: boolean;
  file: ApiFile | ApiFileResult;
}

export interface ApiFileListResponse {
  success: boolean;
  files: ApiFile[];
}

export interface ApiDuplicateGroup {
  primary_file: { id: string; filename: string };
  duplicates: { id: string; filename: string; similarity_score: number | null }[];
}

export interface ApiDuplicateGroupsResponse {
  success: boolean;
  groups: ApiDuplicateGroup[];
}

export interface ApiAnalytics {
  total_files: number;
  unique_files: number;
  duplicate_files: number;
  similar_files: number;
  original_storage_bytes: number;
  actual_storage_bytes: number;
  estimated_storage_saved_bytes: number;
  deduplication_rate: number;
}

export interface DedupAnalytics {
  totalFiles: number;
  originalStorageGb: number;
  optimizedStorageGb: number;
  savedStorageGb: number;
  deduplicationRate: number;
  classification: { unique: number; duplicate: number; similar: number };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("VITE_API_BASE_URL is not configured.", 0);
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { Accept: "application/json", ...init?.headers },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { detail?: unknown } | null;
      const message =
        typeof body?.detail === "string" ? body.detail : `Request failed (${response.status}).`;
      throw new ApiError(message, response.status);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The request timed out. Please try again.", 0);
    }
    throw new ApiError("Unable to connect to deduplication backend.", 0);
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function healthCheck(): Promise<ApiHealth> {
  return request<ApiHealth>("/api/health");
}

export async function uploadFile(file: File): Promise<ApiFileResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await request<ApiFileResponse>("/api/files/upload", {
    method: "POST",
    body: formData,
  });
  return response.file as ApiFileResult;
}

export async function getFiles(): Promise<ApiFile[]> {
  const response = await request<ApiFileListResponse>("/api/files");
  return response.files;
}

export async function getFile(fileId: string): Promise<ApiFile> {
  const response = await request<{ success: boolean; file: ApiFile }>(
    `/api/files/${encodeURIComponent(fileId)}`,
  );
  return response.file;
}

export async function analyzeFile(fileId: string): Promise<ApiFileResult> {
  const response = await request<ApiFileResponse>(
    `/api/files/${encodeURIComponent(fileId)}/analyze`,
    { method: "POST" },
  );
  return response.file as ApiFileResult;
}

export async function getDuplicateGroups(): Promise<ApiDuplicateGroup[]> {
  const response = await request<ApiDuplicateGroupsResponse>("/api/files/duplicates");
  return response.groups;
}

export async function getAnalytics(): Promise<ApiAnalytics> {
  return request<ApiAnalytics>("/api/analytics");
}

function asFileStatus(status: ApiFile["deduplication_status"]): FileStatus {
  if (status === "duplicate") return "Duplicate";
  if (status === "similar") return "Similar";
  if (status === "unique") return "Unique";
  return "Pending";
}

function percent(score: number | null): number | null {
  return score === null ? null : Math.round(score * 1000) / 10;
}

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function fileType(file: ApiFile): string {
  return (
    file.original_filename.split(".").pop()?.toUpperCase() ||
    file.mime_type.split("/").pop()?.toUpperCase() ||
    "FILE"
  );
}

export function toDemoFile(file: ApiFile, allFiles: ApiFile[] = []): DemoFile {
  const sizeMb = file.file_size / (1024 * 1024);
  const primary = allFiles.find((candidate) => candidate.id === file.duplicate_of);
  const physicallySaved =
    file.deduplication_status === "duplicate" &&
    (primary ? primary.storage_path === file.storage_path : true);

  return {
    id: file.id,
    name: file.original_filename,
    type: fileType(file),
    sizeMb,
    status: asFileStatus(file.deduplication_status),
    similarity: percent(file.similarity_score),
    location: file.storage_path,
    uploaded: displayDate(file.created_at),
    createdAt: file.created_at,
    potentialSavingMb: physicallySaved ? sizeMb : 0,
    analysisStatus: file.analysis_status,
    duplicateOf: file.duplicate_of,
  };
}

export function toUploadDemoFile(file: ApiFileResult): DemoFile {
  const sizeMb = file.file_size / (1024 * 1024);
  return {
    id: file.id,
    name: file.original_filename,
    type: fileType(file),
    sizeMb,
    status: asFileStatus(file.deduplication_status),
    similarity: percent(file.similarity_score),
    location: file.storage_path,
    uploaded: displayDate(file.created_at),
    createdAt: file.created_at,
    potentialSavingMb: file.storage_saved ? sizeMb : 0,
    analysisStatus: file.analysis_status,
    duplicateOf: file.duplicate_of,
  };
}

export function toAnalysisPreset(file: ApiFileResult, matchedFile: string | null): AnalysisPreset {
  let recommendation = "No sufficiently similar text was found among analyzed files.";
  if (file.deduplication_status === "duplicate") {
    recommendation = "The exact duplicate reuses an existing stored object.";
  } else if (file.deduplication_status === "similar") {
    recommendation = "Text similarity found; review the matched file before taking action.";
  } else if (file.analysis_status === "unsupported") {
    recommendation = "The file was stored, but its format is not supported for text analysis.";
  } else if (file.analysis_status === "failed") {
    recommendation = "The file was stored, but text analysis could not be completed.";
  }

  return {
    status: asFileStatus(file.deduplication_status),
    similarity: percent(file.similarity_score),
    matchedFile,
    recommendation,
    potentialSavingMb: file.storage_saved ? file.file_size / (1024 * 1024) : 0,
    storageSaved: file.storage_saved,
  };
}

export function toDuplicateGroups(groups: ApiDuplicateGroup[], files: ApiFile[]): DuplicateGroup[] {
  const filesById = new Map(files.map((file) => [file.id, file]));
  return groups.map((group) => {
    const primary = filesById.get(group.primary_file.id);
    const relatedFiles = group.duplicates.map((duplicate) => ({
      id: duplicate.id,
      name: duplicate.filename,
      similarity: percent(duplicate.similarity_score),
      sizeMb: (filesById.get(duplicate.id)?.file_size ?? 0) / (1024 * 1024),
    }));
    const primarySizeMb = (primary?.file_size ?? 0) / (1024 * 1024);
    const totalSizeMb = primarySizeMb + relatedFiles.reduce((sum, file) => sum + file.sizeMb, 0);
    return {
      id: group.primary_file.id,
      primaryFileId: group.primary_file.id,
      primaryFile: group.primary_file.filename,
      relatedFiles,
      totalSizeMb,
      potentialSavingMb: relatedFiles.reduce((sum, file) => sum + (file.sizeMb ?? 0), 0),
    };
  });
}

function gigabytes(bytes: number): number {
  return bytes / 1024 ** 3;
}

export function toDedupAnalytics(data: ApiAnalytics): DedupAnalytics {
  return {
    totalFiles: data.total_files,
    originalStorageGb: gigabytes(data.original_storage_bytes),
    optimizedStorageGb: gigabytes(data.actual_storage_bytes),
    savedStorageGb: gigabytes(data.estimated_storage_saved_bytes),
    deduplicationRate: data.deduplication_rate,
    classification: {
      unique: data.unique_files,
      duplicate: data.duplicate_files,
      similar: data.similar_files,
    },
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = -1;
  do {
    value /= 1024;
    unit += 1;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value.toFixed(1)} ${units[unit]}`;
}
