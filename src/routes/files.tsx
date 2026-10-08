import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownUp, ArrowRight, Check, Eye, Search, SlidersHorizontal, Trash2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeading, FileGlyph, StatusBadge, DemoNotice } from "@/components/dedupai/shared";
import { useDedupAI } from "@/components/dedupai/DedupAIProvider";
import { MOCK_FILES } from "@/data/mockData";
import { formatFileSize } from "@/lib/file-validation";
import type { DemoFile } from "@/types/dedupai";

export const Route = createFileRoute("/files")({
  head: () => ({ meta: [
    { title: "Files | DedupAI" }, { name: "description", content: "Browse, search, and filter DedupAI sample files and their illustrative storage status." },
    { property: "og:title", content: "Files | DedupAI" }, { property: "og:description", content: "Search and review sample files in the DedupAI demo workspace." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: FilesPage,
});

function FilesPage() {
  const { uploadedFiles } = useDedupAI();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(8);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<DemoFile | null>(null);
  const [notice, setNotice] = useState("");

  const files = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = [...uploadedFiles, ...MOCK_FILES].filter((file) => !removedIds.includes(file.id)).filter((file) => file.name.toLowerCase().includes(q)).filter((file) => type === "all" || file.type.toLowerCase() === type).filter((file) => status === "all" || file.status.toLowerCase() === status);
    return filtered.sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "size" ? b.sizeMb - a.sizeMb : a.uploaded.localeCompare(b.uploaded));
  }, [query, type, status, sort, uploadedFiles, removedIds]);

  function removeFile(file: DemoFile) {
    setRemovedIds((current) => [...current, file.id]);
    setNotice(`${file.name} was removed from this demo view.`);
    if (selectedFile?.id === file.id) setSelectedFile(null);
  }

  return <div className="animate-enter-soft">
    <PageHeading eyebrow="Workspace / Files" title="Files" description="Search and review the sample files in your workspace." action={<Button asChild><Link to="/upload"><UploadCloud />Upload files</Link></Button>} />
    <DemoNotice compact />
    <div className="mt-5 flex flex-wrap items-center gap-2.5 rounded-lg border border-border bg-card p-3">
      <div className="relative min-w-[210px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files..." aria-label="Filter files by name" className="h-9 pl-9 text-xs" />{query && <Button variant="ghost" size="icon" aria-label="Clear file search" className="absolute right-1 top-1/2 size-7 -translate-y-1/2" onClick={() => setQuery("")}><X /></Button>}</div>
      <Select value={type} onValueChange={(value) => value && setType(value)}><SelectTrigger className="h-9 w-[126px] text-xs" aria-label="Filter by file type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{["pdf", "docx", "txt", "jpg", "png", "zip", "pptx"].map((option) => <SelectItem key={option} value={option}>{option.toUpperCase()}</SelectItem>)}</SelectContent></Select>
      <Select value={status} onValueChange={(value) => value && setStatus(value)}><SelectTrigger className="h-9 w-[144px] text-xs" aria-label="Filter by status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="unique">Unique</SelectItem><SelectItem value="duplicate">Duplicate</SelectItem><SelectItem value="similar">Similar</SelectItem></SelectContent></Select>
      <Select value={sort} onValueChange={(value) => value && setSort(value)}><SelectTrigger className="h-9 w-[154px] text-xs" aria-label="Sort files"><ArrowDownUp className="mr-1 size-3.5" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest first</SelectItem><SelectItem value="name">Name A–Z</SelectItem><SelectItem value="size">Largest first</SelectItem></SelectContent></Select>
      <span className="px-1 text-[11px] text-muted-foreground">{files.length} results</span>
    </div>
    {notice && <div role="status" className="mt-3 flex items-center justify-between gap-3 rounded-md border border-success/20 bg-success/5 px-3 py-2 text-xs text-success"><span className="flex items-center gap-2"><Check className="size-4" />{notice}</span><Button variant="ghost" size="icon" aria-label="Dismiss message" className="size-7" onClick={() => setNotice("")}><X className="size-3.5" /></Button></div>}
    {selectedFile && <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 p-4"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><FileGlyph type={selectedFile.type} /><div><p className="text-sm font-medium">{selectedFile.name}</p><p className="mt-1 text-xs text-muted-foreground">{selectedFile.type} · {formatFileSize(selectedFile.sizeMb)} · {selectedFile.location}</p></div></div><Button variant="ghost" size="icon" aria-label="Close file details" onClick={() => setSelectedFile(null)}><X /></Button></div><div className="mt-4 flex flex-wrap gap-4 text-xs"><span>Status: <strong className="font-medium">{selectedFile.status}</strong></span><span>Similarity: <strong className="font-medium">{selectedFile.similarity === null ? "—" : `${selectedFile.similarity}%`}</strong></span><span>Potential saving: <strong className="font-medium">{formatFileSize(selectedFile.potentialSavingMb)}</strong></span></div></div>}
    <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
      {files.length > 0 ? <><div className="overflow-x-auto"><table className="w-full min-w-[1020px] text-left text-xs"><thead><tr className="border-b border-border bg-secondary/40 text-[10px] uppercase tracking-[0.06em] text-muted-foreground"><th className="px-5 py-3 font-medium">Filename</th><th className="px-3 py-3 font-medium">Type</th><th className="px-3 py-3 font-medium">Size</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Similarity</th><th className="px-3 py-3 font-medium">Storage location</th><th className="px-3 py-3 font-medium">Uploaded</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead><tbody>{files.slice(0, visibleCount).map((file) => <tr key={file.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/20"><td className="px-5 py-3"><div className="flex items-center gap-2.5"><FileGlyph type={file.type} /><span className="max-w-[220px] truncate font-medium">{file.name}</span></div></td><td className="px-3 py-3 text-muted-foreground">{file.type}</td><td className="px-3 py-3 tabular-nums text-muted-foreground">{formatFileSize(file.sizeMb)}</td><td className="px-3 py-3"><StatusBadge status={file.status} /></td><td className="px-3 py-3 tabular-nums text-muted-foreground">{file.similarity === null ? "—" : `${file.similarity}%`}</td><td className="px-3 py-3 text-muted-foreground">{file.location}</td><td className="px-3 py-3 text-muted-foreground">{file.uploaded}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="size-8" aria-label={`View ${file.name}`} title="View details" onClick={() => setSelectedFile(file)}><Eye className="size-3.5" /></Button><Button variant="ghost" size="icon" className="size-8" aria-label={`Analyze ${file.name}`} title="Show demo analysis" onClick={() => { setSelectedFile(file); setNotice(`Illustrative sample result shown for ${file.name}.`); }}><SlidersHorizontal className="size-3.5" /></Button><Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" aria-label={`Remove ${file.name}`} title="Remove from this view" onClick={() => removeFile(file)}><Trash2 className="size-3.5" /></Button></div></td></tr>)}</tbody></table></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5"><span className="text-[11px] text-muted-foreground">Showing {Math.min(visibleCount, files.length)} of {files.length} sample files</span>{visibleCount < files.length && <Button variant="outline" size="sm" onClick={() => setVisibleCount((count) => count + 6)}>Load more<ArrowRight /></Button>}</div></> : <div className="grid min-h-64 place-items-center p-8 text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-md bg-secondary text-muted-foreground"><Search className="size-5" /></span><p className="mt-3 text-sm font-medium">No files found</p><p className="mt-1 text-xs text-muted-foreground">Try a different search or filter.</p><Button variant="ghost" size="sm" className="mt-2" onClick={() => { setQuery(""); setType("all"); setStatus("all"); }}>Clear filters</Button></div></div>}
    </div>
  </div>;
}