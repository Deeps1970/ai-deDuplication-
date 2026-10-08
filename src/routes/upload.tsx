import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  FilePlus2,
  FileUp,
  LoaderCircle,
  RotateCcw,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackendNotice, FileGlyph, PageHeading, StatusBadge } from "@/components/dedupai/shared";
import { useDedupAI } from "@/components/dedupai/DedupAIProvider";
import { formatFileSize, validateDemoFile } from "@/lib/file-validation";
import { toAnalysisPreset, toUploadDemoFile, type ApiFileResult } from "@/services/api";
import type { AnalysisPreset, DemoFile } from "@/types/dedupai";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Files | DedupAI" },
      {
        name: "description",
        content: "Upload files to the DedupAI backend for deduplication analysis.",
      },
      { property: "og:title", content: "Upload Files | DedupAI" },
      { property: "og:description", content: "Upload files for backend deduplication analysis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UploadPage,
});

interface UploadItem {
  id: string;
  name: string;
  type: string;
  sizeMb: number;
  state: "queued" | "uploading" | "complete" | "error";
  error?: string;
  file?: File;
}

type UploadResult = DemoFile & { result: AnalysisPreset };

function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [busy, setBusy] = useState(false);
  const { uploadFile, getFile, refreshAll } = useDedupAI();

  const addFiles = useCallback((selected: FileList | File[]) => {
    const additions: UploadItem[] = Array.from(selected).map((file, index) => {
      const error = validateDemoFile(file);
      const sizeMb = file.size / (1024 * 1024);
      return {
        id: `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        type: file.name.split(".").pop()?.toUpperCase() ?? "FILE",
        sizeMb,
        state: error ? ("error" as const) : ("queued" as const),
        ...(error ? { error } : {}),
        file,
      };
    });
    setItems((current) => [...current, ...additions]);
    setResults([]);
  }, []);

  const runUpload = async () => {
    const queue = items.filter((item) => item.state === "queued" && item.file);
    if (queue.length === 0 || busy) return;
    setBusy(true);
    setResults([]);

    for (const item of queue) {
      const file = item.file;
      if (!file) continue;
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, state: "uploading" } : entry)),
      );
      try {
        const response = await uploadFile(file);
        const matchedFile = response.duplicate_of
          ? await getFile(response.duplicate_of).catch(() => null)
          : null;
        const demoFile = toUploadDemoFile(response);
        setResults((current) => [
          {
            ...demoFile,
            result: toAnalysisPreset(response, matchedFile?.name ?? null),
          },
          ...current,
        ]);
        setItems((current) =>
          current.map((entry) => {
            if (entry.id !== item.id) return entry;
            const { file: _file, error: _error, ...complete } = entry;
            return { ...complete, state: "complete" };
          }),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id ? { ...entry, state: "error", error: message } : entry,
          ),
        );
      }
    }

    await refreshAll();
    setBusy(false);
  };

  const removeItem = (id: string) =>
    setItems((current) => current.filter((item) => item.id !== id));
  const clearQueue = () => {
    if (!busy) {
      setItems([]);
      setResults([]);
    }
  };

  return (
    <div className="animate-enter-soft">
      <PageHeading
        eyebrow="Workspace / Upload files"
        title="Upload files"
        description="Select files to upload to the DedupAI backend for analysis."
      />
      <BackendNotice />
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.zip"
        aria-label="Choose files"
        onChange={(event) => {
          if (event.currentTarget.files) addFiles(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={`mt-5 grid min-h-[250px] place-items-center rounded-lg border border-dashed p-6 text-center transition-colors sm:min-h-[290px] ${dragging ? "border-primary bg-primary/10" : "border-border bg-card/50 hover:border-primary/40 hover:bg-card"}`}
      >
        <div>
          <span className="mx-auto grid size-12 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <UploadCloud className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold">Drop files here</h2>
          <p className="mt-1 text-xs text-muted-foreground">or browse from your computer</p>
          <Button className="mt-4" onClick={() => inputRef.current?.click()}>
            <FilePlus2 />
            Select files
          </Button>
          <p className="mt-4 text-[10px] text-muted-foreground">
            PDF · DOCX · TXT · JPG · PNG · ZIP <span className="mx-1.5">·</span> Up to 50 MiB per
            file
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <section className="mt-6 rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold">
                Upload queue <span className="ml-1 text-muted-foreground">({items.length})</span>
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Selected files are sent to FastAPI when you upload.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={busy} onClick={clearQueue}>
                Clear
              </Button>
              <Button
                size="sm"
                disabled={busy || !items.some((item) => item.state === "queued")}
                onClick={() => void runUpload()}
              >
                <FileUp />
                Upload files
              </Button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:px-6">
                <FileGlyph type={item.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{item.name}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatFileSize(item.sizeMb)}
                  </p>
                  {item.error && (
                    <p
                      role="alert"
                      className="mt-2 flex items-center gap-1.5 text-[10px] text-destructive"
                    >
                      <AlertCircle className="size-3.5 shrink-0" />
                      {item.error}
                    </p>
                  )}
                </div>
                <QueueStatus item={item} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Remove ${item.name} from queue`}
                  disabled={busy}
                  onClick={() => removeItem(item.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {results.length > 0 && (
        <section className="mt-6" aria-live="polite">
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-success/20 bg-success/5 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-success/10 text-success">
              <Check className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Backend analysis complete</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Results below are returned by FastAPI.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {results.map((file) => (
              <AnalysisResult key={file.id} file={file} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/">
                Return to dashboard
                <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setResults([])}>
              <RotateCcw />
              Upload more files
            </Button>
          </div>
        </section>
      )}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormatNote icon="PDF" label="Documents" detail="PDF, DOCX, TXT" />
        <FormatNote icon="JPG" label="Images" detail="JPG, PNG" />
        <FormatNote icon="ZIP" label="Archives" detail="ZIP files" />
      </div>
    </div>
  );
}

function QueueStatus({ item }: { item: UploadItem }) {
  if (item.state === "error")
    return (
      <span className="flex max-w-[190px] items-center gap-1.5 text-[10px] text-destructive">
        <AlertCircle className="size-3.5 shrink-0" />
        Upload failed
      </span>
    );
  if (item.state === "uploading")
    return (
      <span className="flex items-center gap-1.5 text-[10px] text-primary">
        <LoaderCircle className="size-3.5 animate-spin" />
        Uploading and analyzing…
      </span>
    );
  if (item.state === "complete")
    return (
      <span className="flex items-center gap-1.5 text-[10px] text-success">
        <Check className="size-3.5" />
        Uploaded and analyzed
      </span>
    );
  return <span className="text-[10px] text-muted-foreground">Ready</span>;
}

function AnalysisResult({ file }: { file: UploadResult }) {
  const result = file.result;
  const matchLabel =
    result.matchedFile ??
    (result.similarity === null ? "No eligible comparison" : "Below classification threshold");
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <FileGlyph type={file.type} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{file.name}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{formatFileSize(file.sizeMb)}</p>
        </div>
        <StatusBadge status={result.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-md bg-secondary/70 p-3">
          <p className="text-[10px] text-muted-foreground">Similarity</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {result.similarity === null ? "—" : `${result.similarity}%`}
          </p>
        </div>
        <div className="rounded-md bg-secondary/70 p-3">
          <p className="text-[10px] text-muted-foreground">Storage saved</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {result.storageSaved ? formatFileSize(result.potentialSavingMb) : "No"}
          </p>
        </div>
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <p className="text-[10px] text-muted-foreground">Matched file</p>
        <p className="mt-1 text-xs font-medium">{matchLabel}</p>
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{result.recommendation}</p>
      </div>
    </article>
  );
}

function FormatNote({ icon, label, detail }: { icon: string; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
      <span className="grid size-8 place-items-center rounded-md bg-secondary text-[9px] font-semibold text-muted-foreground">
        {icon}
      </span>
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
