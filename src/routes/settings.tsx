import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Cloud, HardDrive, Monitor, Save, ScanSearch, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { PageHeading, DemoNotice } from "@/components/dedupai/shared";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [
    { title: "Settings | DedupAI" }, { name: "description", content: "Adjust local demonstration preferences for the DedupAI sample interface." },
    { property: "og:title", content: "Settings | DedupAI" }, { property: "og:description", content: "Manage local illustrative DedupAI interface preferences." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: SettingsPage,
});

function SettingsPage() {
  const [threshold, setThreshold] = useState([90]);
  const [automaticReference, setAutomaticReference] = useState(true);
  const [analyzeSimilar, setAnalyzeSimilar] = useState(true);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); window.setTimeout(() => setSaved(false), 2600); };

  return <div className="animate-enter-soft max-w-4xl">
    <PageHeading eyebrow="Workspace / Settings" title="Settings" description="Adjust the preferences shown in this local demo." />
    <DemoNotice compact />
    <section className="mt-5 rounded-lg border border-border bg-card"><SettingsSectionHeader icon={ScanSearch} title="Deduplication preferences" description="Illustrative options only; they do not change analysis behavior." />
      <div className="space-y-6 p-5 sm:p-6">
        <div><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><Label htmlFor="similarity-threshold" className="text-xs font-medium">Similarity threshold</Label><span className="rounded-sm border border-border bg-secondary px-2 py-1 text-xs font-semibold tabular-nums">{threshold[0]}%</span></div><Slider id="similarity-threshold" min={50} max={100} step={1} value={threshold} onValueChange={setThreshold} aria-label="Similarity threshold" /><div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>50%</span><span>100%</span></div></div>
        <SettingToggle id="automatic-reference" icon={Cloud} title="Allow automatic duplicate reference" description="Show the suggested reference action in sample results." checked={automaticReference} onChange={setAutomaticReference} />
        <SettingToggle id="analyze-similar" icon={Sparkles} title="Analyze similar files" description="Include similarity examples in the demo interface." checked={analyzeSimilar} onChange={setAnalyzeSimilar} />
      </div>
    </section>
    <section className="mt-4 rounded-lg border border-border bg-card"><SettingsSectionHeader icon={HardDrive} title="Storage" description="Sample provider information for the future integration." />
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md border border-border bg-secondary text-info"><Cloud className="size-4" /></span><div><p className="text-xs font-medium">Storage provider</p><p className="mt-1 text-[11px] text-muted-foreground">Supabase Storage (planned)</p></div></div><span className="rounded-md border border-warning/20 bg-warning/5 px-2.5 py-1.5 text-[10px] text-warning">Not connected</span></div>
    </section>
    <section className="mt-4 rounded-lg border border-border bg-card"><SettingsSectionHeader icon={Monitor} title="Interface" description="Display preferences for this demo." />
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md border border-border bg-secondary text-muted-foreground"><Monitor className="size-4" /></span><div><p className="text-xs font-medium">Theme</p><p className="mt-1 text-[11px] text-muted-foreground">Dark interface</p></div></div><span className="rounded-md border border-border bg-secondary px-2.5 py-1.5 text-[10px] text-muted-foreground">Dark</span></div>
    </section>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5" />Preferences exist only while this page is open.</p><div className="flex items-center gap-3">{saved && <span role="status" className="flex items-center gap-1.5 text-xs text-success"><Check className="size-3.5" />Preferences saved for this view</span>}<Button onClick={save}><Save />Save preferences</Button></div></div>
  </div>;
}

function SettingsSectionHeader({ icon: Icon, title, description }: { icon: typeof Settings2; title: string; description: string }) { return <div className="flex items-start gap-3 border-b border-border px-5 py-4 sm:px-6"><span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="size-4" /></span><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{description}</p></div></div>; }

function SettingToggle({ id, icon: Icon, title, description, checked, onChange }: { id: string; icon: typeof Cloud; title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) { return <div className="flex items-center justify-between gap-4"><div className="flex items-start gap-3"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground"><Icon className="size-3.5" /></span><div><Label htmlFor={id} className="text-xs font-medium">{title}</Label><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{description}</p></div></div><Switch id={id} checked={checked} onCheckedChange={onChange} aria-label={title} /></div>; }