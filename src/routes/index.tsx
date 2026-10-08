import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Cloud,
  Files,
  HardDrive,
  Sparkles,
  UploadCloud,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BackendNotice,
  FileGlyph,
  PageHeading,
  SectionTitle,
  StatCard,
  StatusBadge,
} from "@/components/dedupai/shared";
import { useDedupAI } from "@/components/dedupai/DedupAIProvider";
import { formatBytes } from "@/services/api";
import { formatFileSize } from "@/lib/file-validation";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard | DedupAI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { files, analytics, duplicateGroups, isLoading, error } = useDedupAI();
  const recent = [...files]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 5);
  const a = analytics;
  return (
    <div className="animate-enter-soft space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <PageHeading
          eyebrow="Workspace"
          title="Intelligent Storage Overview"
          description="Live storage efficiency and recent file activity from your connected backend."
        />
        <Button asChild className="mb-7">
          <Link to="/upload">
            <UploadCloud />
            Upload Files
          </Link>
        </Button>
      </div>
      <BackendNotice />
      {error && (
        <p role="alert" className="text-xs text-destructive">
          Some dashboard data could not be loaded: {error}
        </p>
      )}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total files"
          value={a?.totalFiles.toLocaleString() ?? (isLoading ? "…" : "—")}
          detail="Backend file records"
          icon={Files}
        />
        <StatCard
          label="Original storage"
          value={a ? formatBytes(a.originalStorageGb * 1024 ** 3) : "—"}
          detail="Uploaded file sizes"
          icon={Cloud}
        />
        <StatCard
          label="Actual storage"
          value={a ? formatBytes(a.optimizedStorageGb * 1024 ** 3) : "—"}
          detail="Backend storage usage"
          icon={HardDrive}
        />
        <StatCard
          label="Storage saved"
          value={a ? formatBytes(a.savedStorageGb * 1024 ** 3) : "—"}
          detail="Reported by backend"
          icon={Zap}
        />
        <StatCard
          label="Deduplication rate"
          value={a ? `${a.deduplicationRate.toFixed(1)}%` : "—"}
          detail="Backend analytics"
          icon={Activity}
        />
      </section>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <SectionTitle title="Storage overview" detail="Current values returned by the backend" />
          {a ? (
            <div className="space-y-5">
              <StorageBar
                label="Original storage"
                value={formatBytes(a.originalStorageGb * 1024 ** 3)}
                percent={100}
              />
              <StorageBar
                label="Actual storage"
                value={formatBytes(a.optimizedStorageGb * 1024 ** 3)}
                percent={
                  a.originalStorageGb
                    ? Math.min(100, (a.optimizedStorageGb / a.originalStorageGb) * 100)
                    : 0
                }
              />
              <div className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                {a.originalStorageGb
                  ? `${((a.savedStorageGb / a.originalStorageGb) * 100).toFixed(1)}%`
                  : "—"}{" "}
                of original storage reported saved
              </div>
            </div>
          ) : (
            <EmptyState loading={isLoading} />
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <SectionTitle
            title="AI deduplication insights"
            detail="Current backend classifications"
          />
          {a ? (
            <div className="divide-y divide-border">
              {[
                ["Unique files", a.classification.unique],
                ["Exact duplicates", a.classification.duplicate],
                ["Similar files", a.classification.similar],
                ["Duplicate groups", duplicateGroups.length],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3 text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState loading={isLoading} />
          )}
        </div>
      </section>
      <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <SectionTitle
          title="Deduplication activity"
          detail="Historical activity is not currently provided by the API."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/analytics">
                View analytics
                <ArrowRight />
              </Link>
            </Button>
          }
        />
        <div className="grid h-48 place-items-center rounded-md border border-dashed border-border text-center text-xs text-muted-foreground">
          No historical activity data available.
          <br />
          Live totals are shown above.
        </div>
      </section>
      <section className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
          <SectionTitle
            title="Recent file analysis"
            detail="Most recently uploaded backend records"
          />
          <Button asChild variant="outline" size="sm">
            <Link to="/files">
              Browse all files
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[790px] text-left text-xs">
            <thead>
              <tr className="border-y border-border bg-secondary/40 text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                {["File", "Type", "Size", "Status", "Similarity", "Storage action", "Date"].map(
                  (x) => (
                    <th key={x} className="px-3 py-3 font-medium">
                      {x}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {recent.map((file) => (
                <tr key={file.id} className="border-b border-border/70 last:border-0">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileGlyph type={file.type} />
                      <span className="max-w-[210px] truncate font-medium">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{file.type}</td>
                  <td className="px-3 py-3 text-muted-foreground">{formatFileSize(file.sizeMb)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={file.status} />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {file.similarity == null ? "—" : `${file.similarity}%`}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {file.status === "Duplicate"
                      ? "Reference existing"
                      : file.status === "Similar"
                        ? "Review"
                        : "Stored"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{file.uploaded}</td>
                </tr>
              ))}
              {!recent.length && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {isLoading ? "Loading files…" : "No files found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function StorageBar({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="grid min-h-32 place-items-center text-xs text-muted-foreground">
      {loading ? "Loading backend data…" : "No data available."}
    </div>
  );
}
