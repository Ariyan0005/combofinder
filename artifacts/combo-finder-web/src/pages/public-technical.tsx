import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, FileText, Image as ImageIcon, SearchX } from "lucide-react";
import { SeoHead } from "@/components/seo-head";

type CompatibilityResponse = {
  model: {
    name: string;
    brandName: string;
    imageUrl?: string | null;
    categoryName?: string | null;
  };
  compatibilities: Array<{
    id: number;
    name: string;
    partType?: string | null;
    comboType: string;
    qualityGrade?: string | null;
    notes?: string | null;
    imageUrl?: string | null;
  }>;
  technicalRecords: Array<{
    id: number;
    title: string;
    slug?: string | null;
    schematicType?: string | null;
    thumbnailUrl?: string | null;
  }>;
  canonicalPath: string;
  seo: { title: string; description: string };
};

type TechnicalResponse = {
  record: {
    id: number;
    title: string;
    slug?: string | null;
    deviceBrand?: string | null;
    deviceModel?: string | null;
    schematicType?: string | null;
    fileUrl?: string | null;
    thumbnailUrl?: string | null;
    tags?: string | null;
    notes?: string | null;
    component?: string | null;
    pinNumber?: string | null;
    pinName?: string | null;
    voltage?: string | null;
    ground?: string | null;
    signalInfo?: string | null;
    testPointInfo?: string | null;
  };
  canonicalPath: string;
  seo: { title: string; description: string };
};

function PageShell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-background text-foreground">{children}</main>;
}

function LoadingState() {
  return <PageShell><div className="mx-auto max-w-5xl px-4 py-20 text-center text-muted-foreground">Loading technical information…</div></PageShell>;
}

function NotFoundState() {
  return (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <SearchX className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Technical page not found</h1>
        <p className="mt-2 text-muted-foreground">This record may be unpublished or the URL may be incorrect.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Return to PosCert</Link>
      </div>
    </PageShell>
  );
}

function Header({ eyebrow, title, description, backHref = "/" }: { eyebrow: string; title: string; description: string; backHref?: string }) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}

export function PublicCompatibilityPage() {
  const { brandSlug = "", modelSlug = "" } = useParams();
  const { data, isLoading } = useQuery<CompatibilityResponse>({
    queryKey: ["public-compatibility", brandSlug, modelSlug],
    queryFn: async () => {
      const response = await fetch(`/api/public/compatibility/${brandSlug}/${modelSlug}`);
      if (!response.ok) throw new Error("Not found");
      return response.json();
    },
  });

  if (isLoading) return <LoadingState />;
  if (!data) return <NotFoundState />;

  const grouped = data.compatibilities.reduce<Record<string, typeof data.compatibilities>>((groups, entry) => {
    const key = entry.partType || "Compatibility";
    (groups[key] ||= []).push(entry);
    return groups;
  }, {});

  return (
    <PageShell>
      <SeoHead
        title={data.seo.title}
        description={data.seo.description}
        canonicalPath={data.canonicalPath}
        schema={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: data.seo.title,
          description: data.seo.description,
          about: `${data.model.brandName} ${data.model.name}`,
        }}
      />
      <Header
        eyebrow={data.model.categoryName || "Device compatibility"}
        title={`${data.model.brandName} ${data.model.name} Compatibility`}
        description={`Published compatibility records and technical resources for the ${data.model.brandName} ${data.model.name}.`}
      />
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span>
          <span>{data.model.brandName}</span><span className="mx-2">/</span><span className="text-foreground">{data.model.name}</span>
        </nav>

        {data.model.imageUrl && (
          <img src={data.model.imageUrl} alt={`${data.model.brandName} ${data.model.name}`} className="h-32 w-full rounded-xl object-contain bg-card p-4" />
        )}

        <section aria-labelledby="compatibility-heading">
          <h2 id="compatibility-heading" className="text-2xl font-bold">Compatible parts and combinations</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {Object.entries(grouped).map(([partType, entries]) => (
              <div key={partType} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold">{partType}</h3>
                <div className="mt-4 divide-y">
                  {entries.map(entry => (
                    <article key={entry.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      {entry.imageUrl && <img src={entry.imageUrl} alt="" className="h-12 w-12 rounded-md object-cover" loading="lazy" />}
                      <div className="min-w-0">
                        <p className="font-medium">{entry.name}</p>
                        <p className="text-sm text-muted-foreground">{entry.comboType}{entry.qualityGrade ? ` · ${entry.qualityGrade}` : ""}</p>
                        {entry.notes && <p className="mt-1 text-sm text-muted-foreground">{entry.notes}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {data.technicalRecords.length > 0 && (
          <section aria-labelledby="resources-heading">
            <h2 id="resources-heading" className="text-2xl font-bold">Technical resources</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {data.technicalRecords.map(record => (
                <Link key={record.id} href={`/${record.schematicType === "ISP Pinout" ? "isp" : "pinout"}/${record.slug}`} className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary">
                  {record.thumbnailUrl ? <img src={record.thumbnailUrl} alt="" className="h-12 w-12 rounded-md object-cover" /> : <FileText className="h-6 w-6 text-primary" />}
                  <span className="min-w-0"><span className="block truncate font-medium">{record.title}</span><span className="text-sm text-muted-foreground">{record.schematicType || "Technical record"}</span></span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

export function PublicTechnicalPage({ kind }: { kind: "isp" | "pinout" }) {
  const { slug = "" } = useParams();
  const { data, isLoading } = useQuery<TechnicalResponse>({
    queryKey: ["public-technical", kind, slug],
    queryFn: async () => {
      const response = await fetch(`/api/public/${kind}/${slug}`);
      if (!response.ok) throw new Error("Not found");
      return response.json();
    },
  });

  if (isLoading) return <LoadingState />;
  if (!data) return <NotFoundState />;
  const record = data.record;
  const technicalRows = [
    ["Component", record.component],
    ["Pin number", record.pinNumber],
    ["Pin name / function", record.pinName],
    ["Voltage", record.voltage],
    ["Ground", record.ground],
    ["Signal information", record.signalInfo],
    ["Test point", record.testPointInfo],
  ].filter(([, value]) => value);

  return (
    <PageShell>
      <SeoHead
        title={data.seo.title}
        description={data.seo.description}
        canonicalPath={data.canonicalPath}
        ogImage={record.thumbnailUrl || record.fileUrl || undefined}
        schema={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: data.seo.title,
          description: data.seo.description,
          keywords: record.tags || undefined,
        }}
      />
      <Header
        eyebrow={record.schematicType || (kind === "isp" ? "ISP / test point" : "Pinout")}
        title={record.title}
        description={`Technical reference for ${[record.deviceBrand, record.deviceModel].filter(Boolean).join(" ") || "this device"}.`}
        backHref={record.deviceBrand && record.deviceModel ? `/compatibility/${record.deviceBrand.toLowerCase().replace(/\s+/g, "-")}/${record.deviceModel.toLowerCase().replace(/\s+/g, "-")}` : "/"}
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-12">
        {(record.fileUrl || record.thumbnailUrl) && (
          <figure className="overflow-hidden rounded-2xl border bg-card">
            <img src={record.fileUrl || record.thumbnailUrl || ""} alt={record.title} className="max-h-[680px] w-full object-contain p-3" />
            {record.fileUrl && <figcaption className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground"><span>Technical diagram</span><a href={record.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary">Open source <ExternalLink className="h-3.5 w-3.5" /></a></figcaption>}
          </figure>
        )}
        {technicalRows.length > 0 && (
          <section aria-labelledby="technical-data-heading">
            <h2 id="technical-data-heading" className="text-2xl font-bold">Technical data</h2>
            <div className="mt-4 overflow-hidden rounded-xl border bg-card">
              {technicalRows.map(([label, value]) => <div key={label} className="grid gap-1 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[200px_1fr]"><dt className="text-sm font-semibold text-muted-foreground">{label}</dt><dd className="text-sm">{value}</dd></div>)}
            </div>
          </section>
        )}
        {record.notes && (
          <section aria-labelledby="notes-heading" className="rounded-xl border bg-card p-5">
            <h2 id="notes-heading" className="text-xl font-bold">Technical notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{record.notes}</p>
          </section>
        )}
        {record.tags && <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ImageIcon className="h-4 w-4" /> {record.tags}</p>}
      </div>
    </PageShell>
  );
}

export function PublicIspPage() {
  return <PublicTechnicalPage kind="isp" />;
}

export function PublicPinoutPage() {
  return <PublicTechnicalPage kind="pinout" />;
}