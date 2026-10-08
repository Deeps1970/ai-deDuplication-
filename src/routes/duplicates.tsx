import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Copy, Files, HardDrive, ScanSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, DemoNotice } from "@/components/dedupai/shared";
import { MOCK_GROUPS } from "@/data/mockData";
import { formatFileSize } from "@/lib/file-validation";

export const Route = createFileRoute("/duplicates")({
  head: () => ({ meta: [
    { title: "Duplicate Groups | DedupAI" }, { name: "description", content: "Review illustrative duplicate and similar file groups in the DedupAI sample workspace." },
    { property: "og:title", content: "Duplicate Groups | DedupAI" }, { property: "og:description", content: "Explore related sample files and potential storage savings in DedupAI." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: DuplicateGroupsPage,
});

function DuplicateGroupsPage() {
  return <div className="animate-enter-soft">
    <PageHeading eyebrow="Workspace / Duplicate groups" title="Duplicate groups" description="Review sample files with exact or high-similarity matches." action={<Button asChild variant="outline"><Link to="/analytics"><ScanSearch />View analytics</Link></Button>} />
    <DemoNotice compact />
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3"><GroupSummary icon={Copy} value="12" label="Sample groups" /><GroupSummary icon={Files} value="38" label="Related files" /><GroupSummary icon={HardDrive} value="9.2 GB" label="Potential savings" /></div>
    <div className="mt-6 space-y-4">{MOCK_GROUPS.map((group) => <section key={group.id} className="overflow-hidden rounded-lg border border-border bg-card"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md border border-info/20 bg-info/10 text-info"><Copy className="size-4" /></span><div><h2 className="text-sm font-semibold">Group #{group.id}</h2><p className="mt-0.5 text-[11px] text-muted-foreground">{group.relatedFiles.length + 1} related files</p></div></div><span className="flex items-center gap-1.5 rounded-md border border-warning/20 bg-warning/5 px-2 py-1 text-[10px] text-warning"><Sparkles className="size-3" />Similarity review</span></div>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_230px]"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Primary file</p><div className="flex items-center gap-3 rounded-md border border-success/20 bg-success/5 p-3"><span className="grid size-8 place-items-center rounded-md bg-success/10 text-success"><Files className="size-4" /></span><div className="min-w-0"><p className="truncate text-xs font-medium">{group.primaryFile}</p><p className="mt-0.5 text-[10px] text-muted-foreground">Reference file · {formatFileSize(group.totalSizeMb / (group.relatedFiles.length + 1))}</p></div><span className="ml-auto shrink-0 rounded-sm bg-success/10 px-2 py-1 text-[10px] text-success">Primary</span></div><p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Related files</p><div className="space-y-2">{group.relatedFiles.map((file) => <div key={file.name} className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2.5"><span className="grid size-7 place-items-center rounded-md bg-secondary text-muted-foreground"><Files className="size-3.5" /></span><span className="min-w-0 flex-1 truncate text-xs">{file.name}</span><span className={`rounded-sm px-2 py-1 text-[10px] tabular-nums ${file.similarity === 100 ? "bg-info/10 text-info" : "bg-warning/10 text-warning"}`}>{file.similarity}% match</span></div>)}</div></div>
      <div className="flex flex-col justify-between gap-4 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><div className="grid grid-cols-2 gap-3 lg:grid-cols-1"><GroupMetric value={`${group.relatedFiles.length + 1} files`} label="In this group" /><GroupMetric value={formatFileSize(group.totalSizeMb)} label="Combined size" /><GroupMetric value={formatFileSize(group.potentialSavingMb)} label="Potential saving" /></div><Button asChild variant="outline" size="sm" className="w-full"><Link to="/files">Browse files<ArrowRight /></Link></Button></div>
      </div></section>)}</div>
    <p className="mt-5 flex items-start gap-2 text-[11px] text-muted-foreground"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />Groups and similarity values are fixed illustrative examples for the demo.</p>
  </div>;
}

function GroupSummary({ icon: Icon, value, label }: { icon: typeof Copy; value: string; label: string }) { return <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"><span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="size-4" /></span><div><p className="font-display text-xl font-semibold tabular-nums">{value}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p></div></div>; }
function GroupMetric({ value, label }: { value: string; label: string }) { return <div><p className="text-sm font-semibold tabular-nums">{value}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p></div>; }