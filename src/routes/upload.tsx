import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Check, FilePlus2, FileUp, LoaderCircle, RotateCcw, Sparkles, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DemoNotice, FileGlyph, PageHeading, StatusBadge } from "@/components/dedupai/shared";
import { useDedupAI } from "@/components/dedupai/DedupAIProvider";
import { MOCK_ANALYSIS_PRESETS } from "@/data/mockData";
import { formatFileSize, validateDemoFile } from "@/lib/file-validation";
import type { AnalysisPreset, DemoFile } from "@/types/dedupai";

export const Route = createFileRoute("/upload")({
  head: () => ({ meta: [
    { title: "Upload Files | DedupAI" }, { name: "description", content: "Select files for a local DedupAI interface demo with illustrative analysis results." },
    { property: "og:title", content: "Upload Files | DedupAI" }, { property: "og:description", content: "A local-only sample upload and illustrative analysis flow for DedupAI." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: UploadPage,
});

interface UploadItem { id: string; name: string; type: string; sizeMb: number; progress: number; state: "queued" | "uploading" | "complete" | "error"; error?: string; file?: File }

function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<(DemoFile & { result: AnalysisPreset })[]>([]);
  const [busy, setBusy] = useState(false);
  const { addUploadedFile } = useDedupAI();

  const addFiles = useCallback((selected: FileList | File[]) => {
    const additions: UploadItem[] = Array.from(selected).map((file, index) => {
      const error = validateDemoFile(file);
      const sizeMb = file.size / (1024 * 1024);
      return { id: `${Date.now()}-${index}-${file.name}`, name: file.name, type: file.name.split(".").pop()?.toUpperCase() ?? "FILE", sizeMb, progress: 0, state: error ? "error" as const : "queued" as const, ...(error ? { error } : {}), file };
    });
    setItems((current) => [...current, ...additions]);
    setResults([]);
  }, []);

  const runDemo = () => {
    const queue = items.filter((item) => item.state === "queued" && item.file);
    if (queue.length === 0 || busy) return;
    setBusy(true);
    setResults([]);
    setItems((current) => current.map((item) => item.state === "queued" ? { ...item, state: "uploading", progress: 4 } : item));
    let progress = 4;
    const timer = window.setInterval(() => {
      progress = Math.min(100, progress + 19);
      setItems((current) => current.map((item) => item.state === "uploading" ? { ...item, progress } : item));
      if (progress >= 100) {
        window.clearInterval(timer);
        const completed = queue.map((item, index) => {
          const file = item.file;
          if (!file) return null;
          const result = getPreset(item.name, index);
          const record: DemoFile = {
            id: item.id,
            name: item.name,
            type: item.type,
            sizeMb: item.sizeMb,
            status: result.status,
            similarity: result.similarity,
            location: "This session / Demo uploads",
            uploaded: "Just now",
            potentialSavingMb: result.status === "Unique" ? 0 : Math.min(item.sizeMb, result.potentialSavingMb),
          };
          return { ...record, result: { ...result, potentialSavingMb: record.potentialSavingMb } };
        }).filter((item): item is DemoFile & { result: AnalysisPreset } => item !== null);
        completed.forEach((item) => addUploadedFile(item));
        setResults(completed);
        setItems((current) => current.map((item) => {
          if (item.state !== "uploading") return item;
          const { file: _file, ...completedItem } = item;
          return { ...completedItem, state: "complete", progress: 100 };
        }));
        setBusy(false);
      }
    }, 180);
  };

  const removeItem = (id: string) => setItems((current) => current.filter((item) => item.id !== id));
  const clearQueue = () => { if (!busy) { setItems([]); setResults([]); } };

  return <div className="animate-enter-soft">
    <PageHeading eyebrow="Workspace / Upload files" title="Upload files" description="Select local files to preview a sample upload flow. File contents stay on your device." />
    <DemoNotice />
    <input ref={inputRef} className="sr-only" type="file" multiple accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.zip" aria-label="Choose files" onChange={(event) => { if (event.currentTarget.files) addFiles(event.currentTarget.files); event.currentTarget.value = ""; }} />
    <div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }} className={`mt-5 grid min-h-[250px] place-items-center rounded-lg border border-dashed p-6 text-center transition-colors sm:min-h-[290px] ${dragging ? "border-primary bg-primary/10" : "border-border bg-card/50 hover:border-primary/40 hover:bg-card"}`}>
      <div><span className="mx-auto grid size-12 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><UploadCloud className="size-5" /></span><h2 className="mt-4 font-display text-lg font-semibold">Drop files here</h2><p className="mt-1 text-xs text-muted-foreground">or browse from your computer</p><Button className="mt-4" onClick={() => inputRef.current?.click()}><FilePlus2 />Select files</Button><p className="mt-4 text-[10px] text-muted-foreground">PDF · DOCX · TXT · JPG · PNG · ZIP <span className="mx-1.5">·</span> Up to 100 MB per file</p></div>
    </div>

    {items.length > 0 && <section className="mt-6 rounded-lg border border-border bg-card"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6"><div><h2 className="text-sm font-semibold">Upload queue <span className="ml-1 text-muted-foreground">({items.length})</span></h2><p className="mt-1 text-[11px] text-muted-foreground">Only filenames and sizes are used for this local demo.</p></div><div className="flex gap-2"><Button variant="ghost" size="sm" disabled={busy} onClick={clearQueue}>Clear</Button><Button size="sm" disabled={busy || !items.some((item) => item.state === "queued")} onClick={runDemo}><Sparkles />Run demo analysis</Button></div></div>
      <div className="divide-y divide-border">{items.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:px-6"><FileGlyph type={item.type} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{item.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{formatFileSize(item.sizeMb)}</p>{item.state === "uploading" && <Progress value={item.progress} className="mt-2 h-1.5" />}</div><QueueStatus item={item} /><Button variant="ghost" size="icon" className="size-8" aria-label={`Remove ${item.name} from queue`} disabled={busy} onClick={() => removeItem(item.id)}><X className="size-3.5" /></Button></div>)}</div></section>}

    {results.length > 0 && <section className="mt-6" aria-live="polite"><div className="mb-4 flex items-start gap-3 rounded-lg border border-success/20 bg-success/5 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-success/10 text-success"><Check className="size-4" /></span><div><h2 className="text-sm font-semibold">Demo analysis complete</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">These illustrative results were selected locally for the demonstration. No AI service or file processing was used.</p></div></div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{results.map((file) => <AnalysisResult key={file.id} file={file} />)}</div>
      <div className="mt-4 flex flex-wrap gap-2"><Button asChild><Link to="/">Return to dashboard<ArrowRight /></Link></Button><Button variant="outline" onClick={() => setResults([])}><RotateCcw />Upload more files</Button></div></section>}
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3"><FormatNote icon="PDF" label="Documents" detail="PDF, DOCX, TXT" /><FormatNote icon="JPG" label="Images" detail="JPG, PNG" /><FormatNote icon="ZIP" label="Archives" detail="ZIP files" /></div>
  </div>;
}

function getPreset(name: string, index: number): AnalysisPreset {
  const normalized = name.toLowerCase();
  const preset = normalized.includes("copy") || normalized.includes("duplicate") || normalized.includes("backup")
    ? MOCK_ANALYSIS_PRESETS.find((item) => item.status === "Duplicate")
    : normalized.includes("final") || normalized.includes("similar") || normalized.includes("version")
      ? MOCK_ANALYSIS_PRESETS.find((item) => item.status === "Similar")
      : normalized.includes("unique")
        ? MOCK_ANALYSIS_PRESETS.find((item) => item.status === "Unique")
        : MOCK_ANALYSIS_PRESETS[index % MOCK_ANALYSIS_PRESETS.length];
  return preset ?? { status: "Unique", similarity: null, matchedFile: null, recommendation: "This file appears unique in the demo dataset.", potentialSavingMb: 0 };
}

function QueueStatus({ item }: { item: UploadItem }) {
  if (item.state === "error") return <span className="flex max-w-[190px] items-center gap-1.5 text-[10px] text-destructive"><AlertCircle className="size-3.5 shrink-0" />{item.error}</span>;
  if (item.state === "uploading") return <span className="flex items-center gap-1.5 text-[10px] text-primary"><LoaderCircle className="size-3.5 animate-spin" />Preparing demo… {item.progress}%</span>;
  if (item.state === "complete") return <span className="flex items-center gap-1.5 text-[10px] text-success"><Check className="size-3.5" />Demo complete</span>;
  return <span className="text-[10px] text-muted-foreground">Ready</span>;
}

function AnalysisResult({ file }: { file: DemoFile & { result: AnalysisPreset } }) {
  return <article className="rounded-lg border border-border bg-card p-5"><div className="flex items-start gap-3"><FileGlyph type={file.type} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{file.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{formatFileSize(file.sizeMb)} · Illustrative sample</p></div><StatusBadge status={file.result.status} /></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-md bg-secondary/70 p-3"><p className="text-[10px] text-muted-foreground">Similarity</p><p className="mt-1 text-lg font-semibold tabular-nums">{file.result.similarity === null ? "—" : `${file.result.similarity}%`}</p></div><div className="rounded-md bg-secondary/70 p-3"><p className="text-[10px] text-muted-foreground">Potential saving</p><p className="mt-1 text-lg font-semibold tabular-nums">{formatFileSize(file.result.potentialSavingMb)}</p></div></div><div className="mt-3 border-t border-border pt-3"><p className="text-[10px] text-muted-foreground">{file.result.status === "Duplicate" || file.result.status === "Similar" ? "Sample matched file" : "Result"}</p><p className="mt-1 text-xs font-medium">{file.result.matchedFile ?? "No match in sample"}</p><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{file.result.recommendation}</p></div></article>;
}

function FormatNote({ icon, label, detail }: { icon: string; label: string; detail: string }) { return <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3"><span className="grid size-8 place-items-center rounded-md bg-secondary text-[9px] font-semibold text-muted-foreground">{icon}</span><div><p className="text-xs font-medium">{label}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{detail}</p></div></div>; }