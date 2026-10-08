import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Activity, ArrowRight, ArrowUpRight, Cloud, Files, HardDrive, Sparkles, UploadCloud, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { DemoNotice, FileGlyph, PageHeading, SectionTitle, StatCard, StatusBadge } from "@/components/dedupai/shared";
import { useDedupAI } from "@/components/dedupai/DedupAIProvider";
import { DEMO_INSIGHTS, MOCK_ACTIVITY, MOCK_FILES, MOCK_STORAGE } from "@/data/mockData";
import { formatFileSize } from "@/lib/file-validation";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Dashboard | DedupAI" },
    { name: "description", content: "Explore the DedupAI sample storage overview, file activity, and illustrative deduplication insights." },
    { property: "og:title", content: "Dashboard | DedupAI" },
    { property: "og:description", content: "An illustrative storage overview for DedupAI, intelligent data deduplication for cloud storage." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { uploadedFiles } = useDedupAI();
  const recentFiles = useMemo(() => [...uploadedFiles, ...MOCK_FILES].slice(0, 5), [uploadedFiles]);
  const uploadedSavings = uploadedFiles.reduce((sum, file) => sum + file.potentialSavingMb, 0) / 1024;
  const saved = MOCK_STORAGE.savedGb + uploadedSavings;
  const optimized = Math.max(0, MOCK_STORAGE.originalGb - saved);
  const totalCount = MOCK_STORAGE.totalFiles + uploadedFiles.length;

  return <div className="animate-enter-soft space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <PageHeading eyebrow="Thursday, October 8, 2026" title="Intelligent Storage Overview" description="Good afternoon. Here’s a clear view of your storage efficiency and recent file activity." />
      <Button asChild className="mb-7"><Link to="/upload"><UploadCloud />Upload Files</Link></Button>
    </div>
    <DemoNotice />

    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total files" value={totalCount.toLocaleString()} detail="Across your demo workspace" icon={Files} trend="up" />
      <StatCard label="Original storage" value={`${MOCK_STORAGE.originalGb.toFixed(1)} GB`} detail="Before optimization" icon={Cloud} />
      <StatCard label="Actual storage" value={`${optimized.toFixed(1)} GB`} detail="Sample optimized size" icon={HardDrive} />
      <StatCard label="Storage saved" value={`${saved.toFixed(1)} GB`} detail="Illustrative potential savings" icon={Zap} trend="up" />
      <StatCard label="Deduplication rate" value={`${MOCK_STORAGE.deduplicationRate}%`} detail="Based on sample records" icon={Activity} trend="up" />
    </section>

    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <SectionTitle title="Storage overview" detail="Sample storage footprint and estimated savings" />
        <div className="grid gap-7 md:grid-cols-[1fr_0.82fr] md:items-center">
          <div className="space-y-5">
            <StorageBar label="Original storage" value={`${MOCK_STORAGE.originalGb.toFixed(1)} GB`} percent={100} tone="primary" />
            <StorageBar label="Optimized storage" value={`${optimized.toFixed(1)} GB`} percent={Math.max(0, (optimized / MOCK_STORAGE.originalGb) * 100)} tone="mint" />
            <div className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><Sparkles className="size-3.5 text-primary" />Sample data shows <strong className="font-semibold text-foreground">{((saved / MOCK_STORAGE.originalGb) * 100).toFixed(1)}%</strong> potential reduction</div>
          </div>
          <div className="flex items-center justify-center border-t border-border pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div className="relative grid size-40 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-primary) 0 ${(optimized / MOCK_STORAGE.originalGb) * 100}%, var(--color-success) ${(optimized / MOCK_STORAGE.originalGb) * 100}% 100%)` }}>
              <div className="grid size-[124px] place-content-center rounded-full bg-card text-center"><p className="font-display text-3xl font-semibold tabular-nums">{((saved / MOCK_STORAGE.originalGb) * 100).toFixed(0)}%</p><p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">potential saved</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <SectionTitle title="AI deduplication insights" detail="Illustrative findings from the sample dataset" />
        <div className="divide-y divide-border">
          {DEMO_INSIGHTS.map((insight) => <div key={insight.value} className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-0"><div className="flex min-w-0 items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Sparkles className="size-4" /></span><p className="text-xs leading-5 text-muted-foreground">{insight.label}</p></div><span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{insight.value}</span></div>)}
        </div>
      </div>
    </section>

    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <SectionTitle title="Deduplication activity" detail="Last 7 days · sample records" action={<Button asChild variant="ghost" size="sm"><Link to="/analytics">View analytics<ArrowRight /></Link></Button>} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_210px] lg:items-center">
        <div className="h-64 min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={MOCK_ACTIVITY} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.26} /><stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.01} /></linearGradient></defs>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickMargin={10} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "12px" }} />
            <Area type="monotone" dataKey="analyzed" name="Files processed" stroke="var(--color-primary)" strokeWidth={2} fill="url(#activityFill)" />
            <Area type="monotone" dataKey="duplicates" name="Duplicates detected" stroke="var(--color-success)" strokeWidth={2} fill="transparent" />
          </AreaChart></ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <MiniMetric value="1,150" label="Files processed" trend="+12.8% this week" />
          <MiniMetric value="332" label="Duplicates detected" trend="28.9% of sample" />
          <MiniMetric value="3.6 GB" label="Potentially saved" trend="Across 7 days" />
          <MiniMetric value="93.4%" label="Avg. match score" trend="For similar files" />
        </div>
      </div>
    </section>

    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6"><div><SectionTitle title="Recent file analysis" detail="Most recently updated sample records" /></div><Button asChild variant="outline" size="sm"><Link to="/files">Browse all files<ArrowRight /></Link></Button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[790px] text-left text-xs"><thead><tr className="border-y border-border bg-secondary/40 text-[10px] uppercase tracking-[0.06em] text-muted-foreground"><th className="px-5 py-3 font-medium sm:px-6">File</th><th className="px-3 py-3 font-medium">Type</th><th className="px-3 py-3 font-medium">Size</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Similarity</th><th className="px-3 py-3 font-medium">Storage action</th><th className="px-5 py-3 font-medium sm:px-6">Date</th></tr></thead><tbody>{recentFiles.map((file) => <tr key={file.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/20"><td className="px-5 py-3 sm:px-6"><div className="flex items-center gap-2.5"><FileGlyph type={file.type} /><span className="max-w-[210px] truncate font-medium text-foreground">{file.name}</span></div></td><td className="px-3 py-3 text-muted-foreground">{file.type}</td><td className="px-3 py-3 tabular-nums text-muted-foreground">{formatFileSize(file.sizeMb)}</td><td className="px-3 py-3"><StatusBadge status={file.status} /></td><td className="px-3 py-3 tabular-nums text-muted-foreground">{file.similarity === null ? "—" : `${file.similarity}%`}</td><td className="px-3 py-3 text-muted-foreground">{file.status === "Duplicate" ? "Reference existing" : file.status === "Similar" ? "Review" : "Stored"}</td><td className="px-5 py-3 text-muted-foreground sm:px-6">{file.uploaded}</td></tr>)}</tbody></table></div>
    </section>
    <div className="flex items-start gap-2 px-1 text-[11px] text-muted-foreground"><ArrowUpRight className="mt-0.5 size-3.5 shrink-0" />All statistics and analysis on this page are illustrative sample values, not live storage measurements.</div>
  </div>;
}

function StorageBar({ label, value, percent, tone }: { label: string; value: string; percent: number; tone: "primary" | "mint" }) {
  return <div><div className="mb-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-semibold tabular-nums">{value}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full transition-all duration-500 ${tone === "primary" ? "bg-primary" : "bg-success"}`} style={{ width: `${percent}%` }} /></div></div>;
}

function MiniMetric({ value, label, trend }: { value: string; label: string; trend: string }) {
  return <div className="border-l border-border pl-3"><p className="font-display text-lg font-semibold tabular-nums">{value}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-[10px] text-success">{trend}</p></div>;
}