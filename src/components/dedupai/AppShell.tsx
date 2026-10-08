import { useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Bell, ChevronDown, Command, Files, LayoutDashboard, Menu, Search, Settings2, ShieldCheck, Sparkles, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_FILES, MOCK_GROUPS } from "@/data/mockData";
import { useDedupAI } from "@/components/dedupai/DedupAIProvider";
import { FileGlyph } from "@/components/dedupai/shared";

const navItems = [
  { to: "/" as const, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/files" as const, label: "Files", icon: Files },
  { to: "/duplicates" as const, label: "Duplicate groups", icon: CopyIcon },
  { to: "/analytics" as const, label: "Analytics", icon: Activity },
  { to: "/settings" as const, label: "Settings", icon: Settings2 },
];

function CopyIcon(props: React.ComponentProps<typeof Files>) {
  return <span className="relative inline-grid size-4 place-items-center"><Files {...props} /><span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border border-sidebar bg-primary" /></span>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { uploadedFiles } = useDedupAI();
  const allFiles = [...uploadedFiles, ...MOCK_FILES];
  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length < 2) return { files: [], groups: [] };
    return {
      files: allFiles.filter((file) => file.name.toLowerCase().includes(query)).slice(0, 5),
      groups: MOCK_GROUPS.filter((group) => `${group.primaryFile} ${group.relatedFiles.map((file) => file.name).join(" ")}`.toLowerCase().includes(query)).slice(0, 3),
    };
  }, [search, uploadedFiles]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Link to="/" className="flex h-[72px] items-center gap-3 border-b border-sidebar-border px-6">
          <BrandMark />
          <div><p className="font-display text-base font-semibold text-foreground">DedupAI</p><p className="mt-0.5 text-[10px] text-muted-foreground">INTELLIGENT STORAGE</p></div>
        </Link>
        <div className="px-4 pt-7"><p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Workspace</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return <Link key={item.to} to={item.to} activeOptions={item.exact ? { exact: true } : {}} onClick={() => setMobileMenuOpen(false)} className={`group flex min-h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"}`}><Icon className={`size-4 ${active ? "text-primary" : ""}`} /><span className="flex-1">{item.label}</span>{item.label === "Duplicate groups" && <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">12</span>}</Link>;
            })}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-md border border-sidebar-border bg-card/70 p-3.5">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium"><ShieldCheck className="size-3.5 text-success" /> Demo workspace</div>
            <p className="text-[11px] leading-5 text-muted-foreground">AI-Powered Storage Optimization</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary"><span className="block h-full w-[66%] rounded-full bg-primary" /></div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>Storage sample</span><span>8.4 / 12.8 GB</span></div>
          </div>
          <div className="mt-4 flex items-center gap-2.5 px-1 text-[11px] text-muted-foreground"><span className="size-1.5 rounded-full bg-success" />Local demo mode</div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[66px] items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X /> : <Menu />}</Button>
            <Link to="/" className="flex items-center gap-2.5 lg:hidden"><BrandMark small /><span className="font-display text-sm font-semibold">DedupAI</span></Link>
            <span className="hidden text-xs text-muted-foreground sm:block">Intelligent Data Deduplication for Cloud Storage</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="relative hidden w-56 md:block xl:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search files and groups" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search files and groups" className="h-9 border-border bg-card pl-9 pr-8 text-xs" />
              {search && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 size-7 -translate-y-1/2" aria-label="Clear search" onClick={() => setSearch("")}><X className="size-3.5" /></Button>}
              {search.trim().length >= 2 && <div className="absolute right-0 top-11 z-50 max-h-96 w-[min(24rem,calc(100vw-2rem))] overflow-auto rounded-lg border border-border bg-popover p-2 shadow-xl">
                {results.files.length === 0 && results.groups.length === 0 ? <p className="px-3 py-6 text-center text-xs text-muted-foreground">No matching files or groups</p> : <>
                  {results.files.length > 0 && <><p className="px-2 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground">Files</p>{results.files.map((file) => <Link key={file.id} to="/files" onClick={() => setSearch("")} className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-accent"><FileGlyph type={file.type} /><span className="min-w-0 flex-1 truncate text-xs">{file.name}</span><span className="text-[10px] text-muted-foreground">{file.status}</span></Link>)}</>}
                  {results.groups.length > 0 && <><p className="mt-2 px-2 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground">Duplicate groups</p>{results.groups.map((group) => <Link key={group.id} to="/duplicates" onClick={() => setSearch("")} className="flex items-center gap-2 rounded-md px-2 py-2 text-xs hover:bg-accent"><CopyIcon className="size-4 text-primary" />Group #{group.id} · {group.primaryFile}</Link>)}</>}
                </>}
              </div>}
            </div>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" /></Button>
            <span className="hidden h-6 w-px bg-border sm:block" />
            <Button variant="ghost" className="h-9 gap-2 px-1.5 sm:px-2"><span className="grid size-7 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">D</span><span className="hidden text-xs sm:block">Demo user</span><ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" /></Button>
          </div>
        </header>

        {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-background lg:hidden" role="dialog" aria-label="Navigation"><div className="flex h-16 items-center justify-between border-b border-border px-5"><div className="flex items-center gap-2.5"><BrandMark small /><span className="font-display font-semibold">DedupAI</span></div><Button variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)}><X /></Button></div><nav className="space-y-1 p-4">{navItems.map((item) => { const Icon = item.icon; const active = item.exact ? pathname === item.to : pathname.startsWith(item.to); return <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className={`flex min-h-12 items-center gap-3 rounded-md px-3 text-sm ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"}`}><Icon className="size-4" />{item.label}</Link>; })}<Link to="/upload" onClick={() => setMobileMenuOpen(false)} className="mt-4 flex min-h-12 items-center gap-3 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"><UploadCloud className="size-4" />Upload files</Link></nav><div className="px-7 pt-3 text-xs text-muted-foreground">AI-Powered Storage Optimization</div></div>}

        <main className="mx-auto min-h-[calc(100vh-66px)] w-full max-w-[1600px] px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:pb-10">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">{navItems.map((item) => { const Icon = item.icon; const active = item.exact ? pathname === item.to : pathname.startsWith(item.to); return <Link key={item.to} to={item.to} activeOptions={item.exact ? { exact: true } : {}} className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}><Icon className="size-[18px]" /><span>{item.label === "Duplicate groups" ? "Groups" : item.label}</span></Link>; })}</nav>
      </div>
    </div>
  );
}

function BrandMark({ small = false }: { small?: boolean }) {
  return <span className={`relative grid shrink-0 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary ${small ? "size-8" : "size-9"}`}><Command className={small ? "size-4" : "size-[18px]"} /><Sparkles className="absolute -right-1 -top-1 size-3 text-success" /></span>;
}