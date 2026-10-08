import { describe, expect, it } from "vitest";
import { MAX_DEMO_FILE_SIZE_BYTES } from "@/data/mockData";
import { validateDemoFile } from "@/lib/file-validation";

describe("demo file validation", () => {
  it("accepts a supported file at the 100 MB limit", () => {
    expect(validateDemoFile({ name: "project.pdf", size: MAX_DEMO_FILE_SIZE_BYTES })).toBeNull();
  });

  it("rejects a supported file over the 100 MB limit", () => {
    expect(validateDemoFile({ name: "project.pdf", size: MAX_DEMO_FILE_SIZE_BYTES + 1 })).toBe("Files must be 100 MB or smaller for this demo.");
  });

  it("rejects file types outside the supported formats", () => {
    expect(validateDemoFile({ name: "project.exe", size: 1024 })).toBe("Choose a PDF, DOCX, TXT, JPG, PNG, or ZIP file.");
  });
});