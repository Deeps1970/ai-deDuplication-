import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Copy, Files, HardDrive, ScanSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackendNotice, PageHeading } from "@/components/dedupai/shared";
import { useDedupAI } from "@/components/dedupai/DedupAIProvider";
import { formatFileSize } from "@/lib/file-validation";

export const Route = createFileRoute("/duplicates")({
  head: () => ({ meta: [{ title: "Duplicate Groups | DedupAI" }] }),
  component: DuplicateGroupsPage,
});

function DuplicateGroupsPage() {
  const { duplicateGroups, isLoading, error } = useDedupAI();
  const relatedCount = duplicateGroups.reduce((n, group) => n + group.relatedFiles.length, 0);
  const savings = duplicateGroups.reduce((n, group) => n + group.potentialSavingMb, 0);
  return (
    <div className="animate-enter-soft">
      <PageHeading
        eyebrow="Workspace / Duplicate groups"
        title="Duplicate groups"
        description="Review exact duplicate groups returned by the backend."
        action={
          <Button asChild variant="outline">
            <Link to="/analytics">
              <ScanSearch />
              View analytics
            </Link>
          </Button>
        }
      />
      <BackendNotice compact />
      {error && (
        <p role="alert" className="mt-3 text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GroupSummary
          icon={Copy}
          value={String(duplicateGroups.length)}
          label="Exact duplicate groups"
        />
        <GroupSummary icon={Files} value={String(relatedCount)} label="Duplicate files" />
        <GroupSummary
          icon={HardDrive}
          value={formatFileSize(savings)}
          label="Estimated duplicate bytes"
        />
      </div>
      {isLoading && !duplicateGroups.length ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading duplicate groups…</p>
      ) : !duplicateGroups.length ? (
        <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No exact duplicate groups were returned by the backend.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {duplicateGroups.map((group) => (
            <section
              key={group.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-md border border-info/20 bg-info/10 text-info">
                    <Copy className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold">Duplicate group</h2>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {group.relatedFiles.length + 1} files
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-md border border-info/20 bg-info/5 px-2 py-1 text-[10px] text-info">
                  <Sparkles className="size-3" />
                  Exact match
                </span>
              </div>
              <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_230px]">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Primary file
                  </p>
                  <div className="flex items-center gap-3 rounded-md border border-success/20 bg-success/5 p-3">
                    <Files className="size-4 text-success" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{group.primaryFile}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">Reference file</p>
                    </div>
                    <span className="ml-auto rounded-sm bg-success/10 px-2 py-1 text-[10px] text-success">
                      Primary
                    </span>
                  </div>
                  <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Duplicate files
                  </p>
                  <div className="space-y-2">
                    {group.relatedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2.5"
                      >
                        <Files className="size-3.5 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-xs">{file.name}</span>
                        <span className="rounded-sm bg-info/10 px-2 py-1 text-[10px] tabular-nums text-info">
                          {file.similarity == null ? "—" : `${file.similarity}%`} match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-4 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                    <GroupMetric
                      value={`${group.relatedFiles.length + 1} files`}
                      label="In this group"
                    />
                    <GroupMetric value={formatFileSize(group.totalSizeMb)} label="Combined size" />
                    <GroupMetric
                      value={formatFileSize(group.potentialSavingMb)}
                      label="Duplicate file sizes"
                    />
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to="/files">
                      Browse files
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
function GroupSummary({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Copy;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
function GroupMetric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
