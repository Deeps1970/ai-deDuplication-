import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownUp,
  ArrowRight,
  Eye,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackendNotice, PageHeading, FileGlyph, StatusBadge } from "@/components/dedupai/shared";
import { useDedupAI } from "@/components/dedupai/DedupAIProvider";
import { formatFileSize } from "@/lib/file-validation";
import { toDemoFile } from "@/services/api";
import type { DemoFile } from "@/types/dedupai";

export const Route = createFileRoute("/files")({
  head: () => ({
    meta: [
      { title: "Files | DedupAI" },
      {
        name: "description",
        content: "Browse, search, and filter files stored by the DedupAI backend.",
      },
      { property: "og:title", content: "Files | DedupAI" },
      { property: "og:description", content: "Search and review backend file records in DedupAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FilesPage,
});

function FilesPage() {
  const { files, apiFiles, isLoading, error, refreshAll, getFile, analyzeFile } = useDedupAI();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(8);
  const [selectedFile, setSelectedFile] = useState<DemoFile | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [analysisLoadingId, setAnalysisLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files
      .filter((file) => file.name.toLowerCase().includes(q))
      .filter((file) => type === "all" || file.type.toLowerCase() === type)
      .filter((file) => status === "all" || file.status.toLowerCase() === status)
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : sort === "size"
            ? b.sizeMb - a.sizeMb
            : new Date(b.createdAt ?? b.uploaded).valueOf() -
              new Date(a.createdAt ?? a.uploaded).valueOf(),
      );
  }, [query, type, status, sort, files]);

  const viewFile = async (file: DemoFile) => {
    setDetailLoading(true);
    setActionError(null);
    try {
      setSelectedFile(await getFile(file.id));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not load file details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const reanalyze = async (file: DemoFile) => {
    setAnalysisLoadingId(file.id);
    setActionError(null);
    try {
      const result = await analyzeFile(file.id);
      setSelectedFile(toDemoFile(result, apiFiles));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not analyze this file.");
    } finally {
      setAnalysisLoadingId(null);
    }
  };

  return (
    <div className="animate-enter-soft">
      <PageHeading
        eyebrow="Workspace / Files"
        title="Files"
        description="Search and review files stored in your workspace."
        action={
          <Button asChild>
            <Link to="/upload">
              <UploadCloud />
              Upload files
            </Link>
          </Button>
        }
      />
      <BackendNotice compact />
      {error && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void refreshAll()}>
            Retry
          </Button>
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          {actionError}
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2.5 rounded-lg border border-border bg-card p-3">
        <div className="relative min-w-[210px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files..."
            aria-label="Filter files by name"
            className="h-9 pl-9 text-xs"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear file search"
              className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
              onClick={() => setQuery("")}
            >
              <X />
            </Button>
          )}
        </div>
        <Select value={type} onValueChange={(value) => value && setType(value)}>
          <SelectTrigger className="h-9 w-[126px] text-xs" aria-label="Filter by file type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {["pdf", "docx", "txt", "jpg", "jpeg", "png", "zip", "pptx"].map((option) => (
              <SelectItem key={option} value={option}>
                {option.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => value && setStatus(value)}>
          <SelectTrigger className="h-9 w-[144px] text-xs" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["unique", "duplicate", "similar", "pending"].map((option) => (
              <SelectItem key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => value && setSort(value)}>
          <SelectTrigger className="h-9 w-[154px] text-xs" aria-label="Sort files">
            <ArrowDownUp className="mr-1 size-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="size">Largest first</SelectItem>
          </SelectContent>
        </Select>
        <span className="px-1 text-[11px] text-muted-foreground">
          {filteredFiles.length} results
        </span>
      </div>
      {selectedFile && (
        <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileGlyph type={selectedFile.type} />
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedFile.type} · {formatFileSize(selectedFile.sizeMb)} ·{" "}
                  {selectedFile.location}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close file details"
              onClick={() => setSelectedFile(null)}
            >
              <X />
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <span>
              Status: <strong className="font-medium">{selectedFile.status}</strong>
            </span>
            <span>
              Similarity:{" "}
              <strong className="font-medium">
                {selectedFile.similarity === null ? "—" : `${selectedFile.similarity}%`}
              </strong>
            </span>
            <span>
              Storage saved:{" "}
              <strong className="font-medium">
                {formatFileSize(selectedFile.potentialSavingMb)}
              </strong>
            </span>
            <span>
              Analysis:{" "}
              <strong className="font-medium">{selectedFile.analysisStatus ?? "pending"}</strong>
            </span>
          </div>
        </div>
      )}
      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {isLoading && files.length === 0 ? (
          <div
            role="status"
            className="grid min-h-64 place-items-center text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              Loading files…
            </span>
          </div>
        ) : filteredFiles.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1020px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Filename</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Size</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Similarity</th>
                    <th className="px-3 py-3 font-medium">Storage location</th>
                    <th className="px-3 py-3 font-medium">Uploaded</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.slice(0, visibleCount).map((file) => (
                    <tr
                      key={file.id}
                      className="border-b border-border/70 last:border-0 hover:bg-secondary/20"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <FileGlyph type={file.type} />
                          <span className="max-w-[220px] truncate font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{file.type}</td>
                      <td className="px-3 py-3 tabular-nums text-muted-foreground">
                        {formatFileSize(file.sizeMb)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={file.status} />
                      </td>
                      <td className="px-3 py-3 tabular-nums text-muted-foreground">
                        {file.similarity === null ? "—" : `${file.similarity}%`}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{file.location}</td>
                      <td className="px-3 py-3 text-muted-foreground">{file.uploaded}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`View ${file.name}`}
                            title="View details"
                            disabled={detailLoading}
                            onClick={() => void viewFile(file)}
                          >
                            {detailLoading ? (
                              <LoaderCircle className="size-3.5 animate-spin" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Analyze ${file.name}`}
                            title="Reanalyze file"
                            disabled={analysisLoadingId !== null}
                            onClick={() => void reanalyze(file)}
                          >
                            {analysisLoadingId === file.id ? (
                              <LoaderCircle className="size-3.5 animate-spin" />
                            ) : (
                              <SlidersHorizontal className="size-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground"
                            aria-label="Delete unavailable"
                            title="Deletion is not supported by the backend API"
                            disabled
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5">
              <span className="text-[11px] text-muted-foreground">
                Showing {Math.min(visibleCount, filteredFiles.length)} of {filteredFiles.length}{" "}
                files
              </span>
              {visibleCount < filteredFiles.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleCount((count) => count + 6)}
                >
                  Load more
                  <ArrowRight />
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="grid min-h-64 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid size-11 place-items-center rounded-md bg-secondary text-muted-foreground">
                <Search className="size-5" />
              </span>
              <p className="mt-3 text-sm font-medium">
                {isLoading ? "Loading files…" : "No files found"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {files.length
                  ? "Try a different search or filter."
                  : "Files uploaded through FastAPI will appear here."}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setQuery("");
                  setType("all");
                  setStatus("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
