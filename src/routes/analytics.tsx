import { createFileRoute } from "@tanstack/react-router";
import { Activity, Files, HardDrive, Zap } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { BackendNotice, PageHeading, SectionTitle, StatCard } from "@/components/dedupai/shared";
import { useDedupAI } from "@/components/dedupai/DedupAIProvider";
import { formatBytes } from "@/services/api";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics | DedupAI" }] }),
  component: AnalyticsPage,
});
const colors = {
  Unique: "var(--color-success)",
  Duplicate: "var(--color-info)",
  Similar: "var(--color-warning)",
};
function AnalyticsPage() {
  const { analytics, isLoading, error } = useDedupAI();
  const data = analytics
    ? [
        { name: "Unique", value: analytics.classification.unique, color: colors.Unique },
        { name: "Duplicate", value: analytics.classification.duplicate, color: colors.Duplicate },
        { name: "Similar", value: analytics.classification.similar, color: colors.Similar },
      ]
    : [];
  const totalClassified = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="animate-enter-soft">
      <PageHeading
        eyebrow="Workspace / Analytics"
        title="Analytics"
        description="Storage and file classification totals reported by the backend."
      />
      <BackendNotice compact />
      {error && (
        <p role="alert" className="mt-3 text-xs text-destructive">
          {error}
        </p>
      )}
      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Original storage"
          value={analytics ? formatBytes(analytics.originalStorageGb * 1024 ** 3) : "—"}
          detail="Backend reported"
          icon={HardDrive}
        />
        <StatCard
          label="Actual storage"
          value={analytics ? formatBytes(analytics.optimizedStorageGb * 1024 ** 3) : "—"}
          detail="Backend reported"
          icon={Zap}
        />
        <StatCard
          label="Files analyzed"
          value={analytics?.totalFiles.toLocaleString() ?? (isLoading ? "…" : "—")}
          detail="Backend file records"
          icon={Files}
        />
        <StatCard
          label="Estimated savings"
          value={analytics ? formatBytes(analytics.savedStorageGb * 1024 ** 3) : "—"}
          detail="Backend reported"
          icon={Activity}
        />
      </section>
      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <SectionTitle title="Storage efficiency" detail="Current storage totals" />
          {analytics ? (
            <div className="mt-6 space-y-5">
              <EfficiencyBar
                label="Original storage"
                value={formatBytes(analytics.originalStorageGb * 1024 ** 3)}
                percent={100}
              />
              <EfficiencyBar
                label="Actual storage"
                value={formatBytes(analytics.optimizedStorageGb * 1024 ** 3)}
                percent={
                  analytics.originalStorageGb
                    ? Math.min(
                        100,
                        (analytics.optimizedStorageGb / analytics.originalStorageGb) * 100,
                      )
                    : 0
                }
              />
              <EfficiencyBar
                label="Estimated savings"
                value={formatBytes(analytics.savedStorageGb * 1024 ** 3)}
                percent={
                  analytics.originalStorageGb
                    ? Math.min(100, (analytics.savedStorageGb / analytics.originalStorageGb) * 100)
                    : 0
                }
              />
              <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                Deduplication rate: {analytics.deduplicationRate.toFixed(1)}%
              </p>
            </div>
          ) : (
            <Empty loading={isLoading} />
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <SectionTitle
            title="File classification"
            detail="Current backend classification totals"
          />
          {analytics && totalClassified > 0 ? (
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
              <div className="h-[220px] w-full max-w-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={66}
                      outerRadius={92}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {data.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full max-w-[220px] space-y-3">
                {data.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </span>
                    <span className="font-medium tabular-nums">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Empty loading={isLoading} />
          )}
        </div>
      </section>
      <section className="mt-4 rounded-lg border border-border bg-card p-5 sm:p-6">
        <SectionTitle
          title="Storage savings over time"
          detail="Historical time series is not included in the current API."
        />
        <Empty loading={false} message="No historical storage data available." />
      </section>
      <section className="mt-4 rounded-lg border border-border bg-card p-5 sm:p-6">
        <SectionTitle
          title="Activity breakdown"
          detail="The current API provides aggregate totals only."
        />
        <Empty loading={false} message="No historical activity data available." />
      </section>
    </div>
  );
}
function EfficiencyBar({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
function Empty({ loading, message }: { loading: boolean; message?: string }) {
  return (
    <div className="grid min-h-32 place-items-center text-center text-xs text-muted-foreground">
      {loading ? "Loading analytics…" : (message ?? "No classification data available.")}
    </div>
  );
}
