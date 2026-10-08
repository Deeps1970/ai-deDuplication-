import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Copy, FileArchive, FileImage, FileText, ScanSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import type { FileStatus } from "@/types/dedupai";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-primary">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold tracking-normal text-foreground">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: FileStatus }) {
  const classes = status === "Unique" ? "border-success/20 bg-success/10 text-success" : status === "Duplicate" ? "border-info/20 bg-info/10 text-info" : "border-warning/20 bg-warning/10 text-warning";
  return <Badge variant="outline" className={`gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${classes}`}><span className={`size-1.5 rounded-full ${status === "Unique" ? "bg-success" : status === "Duplicate" ? "bg-info" : "bg-warning"}`} />{status}</Badge>;
}

export function FileGlyph({ type }: { type: string }) {
  const Icon = type === "ZIP" ? FileArchive : ["JPG", "JPEG", "PNG"].includes(type) ? FileImage : FileText;
  return <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-secondary text-muted-foreground"><Icon className="size-4" /></span>;
}

export function StatCard({ label, value, detail, icon: Icon, trend, className = "" }: { label: string; value: string; detail: string; icon: typeof Check; trend?: "up" | "down"; className?: string }) {
  return (
    <section className={`rounded-lg border border-border bg-card p-4 sm:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-3 truncate font-display text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-secondary text-primary"><Icon className="size-4" /></span>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        {trend === "up" ? <ArrowUpRight className="size-3.5 text-success" /> : trend === "down" ? <ArrowDownRight className="size-3.5 text-info" /> : <span className="size-3.5" />}
        <span>{detail}</span>
      </div>
    </section>
  );
}

export function DemoNotice({ compact = false }: { compact?: boolean }) {
  return <div className={`flex items-start gap-2.5 border border-info/20 bg-info/5 text-info ${compact ? "rounded-md px-3 py-2 text-xs" : "rounded-lg px-4 py-3 text-sm"}`}><ScanSearch className="mt-0.5 size-4 shrink-0" /><p>{compact ? "Demo data · results are illustrative only" : "Demo environment — sample data and simulated results only. No files are sent or analyzed."}</p></div>;
}

export function SectionTitle({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-base font-semibold text-foreground">{title}</h2>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>{action}</div>;
}

export function LinkButton({ to, children }: { to: "/files" | "/upload" | "/duplicates" | "/analytics"; children: ReactNode }) {
  return <Button asChild variant="outline" size="sm"><Link to={to}>{children}<Copy className="size-3.5" /></Link></Button>;
}