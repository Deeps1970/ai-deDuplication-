import { ACCEPTED_FILE_TYPES, MAX_DEMO_FILE_SIZE_BYTES } from "@/data/mockData";

export function validateDemoFile(file: Pick<File, "name" | "size">): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ACCEPTED_FILE_TYPES.includes(extension)) {
    return "Choose a PDF, DOCX, TXT, JPG, PNG, or ZIP file.";
  }
  if (file.size > MAX_DEMO_FILE_SIZE_BYTES) {
    return "Files must be 50 MiB or smaller.";
  }
  return null;
}

export function formatFileSize(sizeMb: number): string {
  if (sizeMb < 1) return `${Math.round(sizeMb * 1024)} KB`;
  return `${sizeMb.toFixed(1)} MB`;
}
