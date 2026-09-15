import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Battery,
  ChevronRight,
  Cpu,
  ExternalLink,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lock,
  Phone,
  Search,
  SearchX,
  Share2,
  ShieldCheck,
  Smartphone,
  Tag,
  Wrench,
  Zap,
  ChevronDown,
  Check,
  Copy,
} from "lucide-react";
import { SeoHead } from "@/components/seo-head";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CompatibilityResponse = {
  model: {
    id: number;
    name: string;
    brandName: string;
    imageUrl?: string | null;
    categoryName?: string | null;
    categorySlug?: string | null;
  };
  compatibilities: Array<{
    id: number;
    name: string;
    brandName: string;
    modelName: string;
    brandSlug: string;
    modelSlug: string;
    slugUrl: string;
    partType?: string | null;
    comboType: string;
    qualityGrade?: string | null;
    notes?: string | null;
    imageUrl?: string | null;
  }>;
  allCompatibleSlugs: Array<{
    name: string;
    brandName: string;
    modelName: string;
    url: string;
  }>;
  technicalRecords: Array<{
    id: number;
    title: string;
    slug?: string | null;
    slugUrl?: string | null;
    schematicType?: string | null;
    thumbnailUrl?: string | null;
    fileUrl?: string | null;
  }>;
  batteryRecords: Array<{
    batteryModelId: number;
    modelNumber: string;
    brandName: string;
    capacity?: string | null;
    voltage?: string | null;
    notes?: string | null;
    slug: string;
    slugUrl: string;
  }>;
  canonicalPath: string;
  canonicalUrl: string;
  seo: { title: string; description: string; keywords?: string };
  seoTags?: string[];
  faqs?: Array<{ question: string; answer: string }>;
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
  canonicalUrl: string;
  compatibilityUrl?: string | null;
  seo: { title: string; description: string };
};

type BatteryDirectoryResponse = {
  batteries: Array<{
    id: number;
    modelNumber: string;
    slug: string;
    slugUrl: string;
    capacity: string | null;
    voltage: string | null;
    notes: string | null;
    brandName: string;
    devices: Array<{
      id: number;
      name: string;
      slug: string;
      slugUrl: string;
      notes: string | null;
    }>;
  }>;
  totalCount: number;
  seo: { title: string; description: string };
};

type BatteryDetailResponse = {
  type: "battery" | "device";
  battery: {
    id: number;
    modelNumber: string;
    capacity?: string | null;
    voltage?: string | null;
    notes?: string | null;
    brandName: string;
    slug: string;
    slugUrl?: string;
  };
  device?: {
    name: string;
    slug: string;
  };
  devices?: Array<{
    id: number;
    name: string;
    slug: string;
    notes?: string | null;
    batteryUrl: string;
    displayCompatibilityUrl: string;
  }>;
  compatibleDevices?: Array<{
    id: number;
    name: string;
    slug: string;
    isCurrent?: boolean;
    batteryUrl: string;
    displayCompatibilityUrl: string;
  }>;
  canonicalPath: string;
  canonicalUrl: string;
  seo: { title: string; description: string };
};

type SchematicsDirectoryResponse = {
  schematics: Array<{
    id: number;
    title: string;
    slug: string;
    slugUrl: string;
    deviceBrand?: string | null;
    deviceModel?: string | null;
    schematicType?: string | null;
    fileUrl?: string | null;
    thumbnailUrl?: string | null;
    tags?: string | null;
    notes?: string | null;
    compatibilityUrl?: string | null;
  }>;
  totalCount: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared Navigation & Shell
// ─────────────────────────────────────────────────────────────────────────────

export function PublicTechnicalNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground text-sm">
              PC
            </span>
            <div className="flex flex-col">
              <span className="leading-tight text-base font-extrabold tracking-tight">PosCert</span>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Tech Database</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <Link href="/compatibility" className="rounded-md px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground">
              Parts Compatibility
            </Link>
            <Link href="/battery-compatibility" className="rounded-md px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground">
              Battery Codes
            </Link>
            <Link href="/isp-pinout" className="rounded-md px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground">
              ISP Pinouts
            </Link>
            <Link href="/test-point" className="rounded-md px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground">
              EDL Test Points
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/compatibility"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground shadow-sm transition-colors"
          >
            <Search className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Search Database</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity"
          >
            <Lock className="h-3 w-3" />
            <span>POS / ERP Login</span>
          </Link>
        </div>
      </div>
      <div className="flex md:hidden overflow-x-auto border-t border-border/60 px-4 py-2 text-xs font-medium text-muted-foreground gap-2 no-scrollbar">
        <Link href="/compatibility" className="whitespace-nowrap px-2 py-1 rounded bg-muted/50">Compatibility</Link>
        <Link href="/battery-compatibility" className="whitespace-nowrap px-2 py-1 rounded bg-muted/50">Battery Codes</Link>
        <Link href="/isp-pinout" className="whitespace-nowrap px-2 py-1 rounded bg-muted/50">ISP Pinout</Link>
        <Link href="/test-point" className="whitespace-nowrap px-2 py-1 rounded bg-muted/50">Test Points</Link>
      </div>
    </header>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicTechnicalNavbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/80 bg-card py-8 text-center text-xs text-muted-foreground mt-16">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PosCert Technical Hub. Verified phone repair schematics, compatibility lists & pinouts.</p>
          <div className="flex gap-4">
            <Link href="/compatibility" className="hover:underline">Compatibility</Link>
            <Link href="/battery-compatibility" className="hover:underline">Batteries</Link>
            <Link href="/isp-pinout" className="hover:underline">ISP Pinouts</Link>
            <Link href="/test-point" className="hover:underline">Test Points</Link>
            <Link href="/login" className="hover:underline font-semibold text-primary">ERP Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LoadingState() {
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-28 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-sm text-muted-foreground">Loading technical database record…</p>
      </div>
    </PageShell>
  );
}

function NotFoundState({ message = "This technical record may be unpublished or the URL may be incorrect." }: { message?: string }) {
  return (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Record Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/compatibility"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
          >
            <Smartphone className="h-4 w-4" /> Browse Compatibility
          </Link>
          <Link
            href="/battery-compatibility"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <Battery className="h-4 w-4" /> Battery Finder
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

// Helper component for interactive FAQ accordion
function FaqAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-3.5 border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 text-left font-medium text-sm sm:text-base text-foreground hover:text-primary transition-colors py-1"
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`} />
      </button>
      {isOpen && (
        <div className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed pr-6 bg-muted/20 p-3 rounded-lg border border-border/40">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Dedicated Compatibility Page (/compatibility/:brandSlug/:modelSlug)
// ─────────────────────────────────────────────────────────────────────────────

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
  if (!data) return <NotFoundState message={`No published compatibility records found for ${brandSlug}/${modelSlug}.`} />;

  // Group compatibilities by part type
  const grouped = data.compatibilities.reduce<Record<string, typeof data.compatibilities>>((groups, entry) => {
    const key = entry.partType || "Display Combo";
    (groups[key] ||= []).push(entry);
    return groups;
  }, {});

  const totalCompatCount = data.compatibilities.length;

  return (
    <PageShell>
      <SeoHead
        title={data.seo.title}
        description={data.seo.description}
        keywords={data.seo.keywords}
        canonicalPath={data.canonicalPath}
        schema={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://poscert.com/" },
                { "@type": "ListItem", "position": 2, "name": "Parts Compatibility", "item": "https://poscert.com/compatibility" },
                { "@type": "ListItem", "position": 3, "name": data.model.brandName, "item": `https://poscert.com/compatibility?brand=${data.model.brandName.toLowerCase()}` },
                { "@type": "ListItem", "position": 4, "name": `${data.model.brandName} ${data.model.name} LCD Combo`, "item": `https://poscert.com${data.canonicalPath}` },
              ]
            },
            {
              "@type": "TechArticle",
              "headline": data.seo.title,
              "description": data.seo.description,
              "about": `${data.model.brandName} ${data.model.name} LCD Combo & Screen Compatibility`,
              "keywords": (data.seoTags || []).join(", "),
            },
            ...(data.faqs && data.faqs.length > 0 ? [{
              "@type": "FAQPage",
              "mainEntity": data.faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer,
                }
              }))
            }] : [])
          ]
        }}
      />

      {/* Hero Header */}
      <div className="border-b bg-gradient-to-b from-card/90 to-background py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/compatibility" className="hover:text-foreground">Parts Compatibility</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{data.model.brandName}</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{data.model.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Hardware Compatibility</span>
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                {data.model.brandName} {data.model.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed">
                Complete hardware, display folder, and screen replacement compatibility list for{" "}
                <strong className="text-foreground">{data.model.brandName} {data.model.name}</strong>.
                Verified compatible with {totalCompatCount} phone {totalCompatCount === 1 ? "model" : "models"}.
              </p>
            </div>

            {data.model.imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={data.model.imageUrl}
                  alt={`${data.model.brandName} ${data.model.name}`}
                  className="h-28 w-28 rounded-xl border border-border bg-card object-contain p-2 shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Quick-Jump Slugs Bar: Every single model has an active indexable page */}
          {data.allCompatibleSlugs.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                Direct Model Links ({data.allCompatibleSlugs.length} indexable pages):
              </p>
              <div className="flex flex-wrap gap-2">
                {data.allCompatibleSlugs.map((slugItem, idx) => (
                  <Link
                    key={idx}
                    href={slugItem.url}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Smartphone className="h-3 w-3 text-muted-foreground" />
                    <span>{slugItem.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* SEO Search Intent & Repair Tags Section */}
          {data.seoTags && data.seoTags.length > 0 && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2.5">
                <Tag className="h-3.5 w-3.5" />
                <span>Search Intent & Repair Keywords:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.seoTags.map((tagText, idx) => (
                  <Link
                    key={idx}
                    href={`/compatibility?q=${encodeURIComponent(tagText)}`}
                    className="inline-flex items-center gap-1 rounded-md bg-card/90 border border-border/80 px-2.5 py-1 text-xs text-muted-foreground hover:text-primary hover:border-primary transition-colors shadow-xs"
                  >
                    <span>#{tagText}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6">
        {/* Compatible Parts Section */}
        <section aria-labelledby="compatibility-heading">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 id="compatibility-heading" className="text-2xl font-bold tracking-tight">
                Compatible Models & Assemblies
              </h2>
              <p className="text-sm text-muted-foreground">
                All models sharing identical display combos, connectors, and mounting brackets with {data.model.name}.
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {totalCompatCount} {totalCompatCount === 1 ? "Match" : "Matches"}
            </span>
          </div>

          {totalCompatCount === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No direct part combinations logged yet for this model.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {Object.entries(grouped).map(([partType, entries]) => (
                <div key={partType} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <span>{partType}</span>
                    </h3>
                    <span className="text-xs font-medium text-muted-foreground">
                      {entries.length} {entries.length === 1 ? "model" : "models"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {entries.map((entry) => (
                      <article
                        key={entry.id}
                        className="group rounded-xl border border-border/60 bg-background/50 p-3 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            {/* Every compatible model has an active slug URL */}
                            <Link
                              href={entry.slugUrl}
                              className="font-semibold text-sm text-foreground hover:text-primary inline-flex items-center gap-1.5 transition-colors"
                            >
                              <span>{entry.name}</span>
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>

                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="rounded bg-muted px-1.5 py-0.5 font-medium">{entry.comboType}</span>
                              {entry.qualityGrade && (
                                <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 font-medium">
                                  {entry.qualityGrade}
                                </span>
                              )}
                            </div>

                            {entry.notes && (
                              <p className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded p-2 border border-border/40">
                                {entry.notes}
                              </p>
                            )}
                          </div>

                          {entry.imageUrl && (
                            <img
                              src={entry.imageUrl}
                              alt={entry.name}
                              className="h-14 w-14 rounded-lg border object-cover bg-card flex-shrink-0"
                              loading="lazy"
                            />
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Battery Compatibility Section */}
        {data.batteryRecords && data.batteryRecords.length > 0 && (
          <section aria-labelledby="battery-heading" className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Battery className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="battery-heading" className="text-xl font-bold">
                    Battery Model & Compatibility
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Replacement battery part number and capacity for {data.model.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {data.batteryRecords.map((batt) => (
                <Link
                  key={batt.batteryModelId}
                  href={batt.slugUrl}
                  className="group block rounded-xl border border-border bg-background p-4 hover:border-emerald-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-foreground group-hover:text-emerald-600 transition-colors">
                      {batt.modelNumber}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 rounded bg-emerald-500/10 px-2 py-0.5">
                      {batt.capacity || "Original"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{batt.brandName} Battery</p>
                  {batt.voltage && <p className="text-xs text-muted-foreground">Voltage: {batt.voltage}</p>}
                  {batt.notes && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{batt.notes}</p>}
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    View Compatible Phones <ChevronRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Schematics / ISP Pinout / Test Point Section */}
        {data.technicalRecords.length > 0 && (
          <section aria-labelledby="technical-resources-heading">
            <div className="mb-4">
              <h2 id="technical-resources-heading" className="text-xl font-bold">
                ISP Pinouts & Test Points
              </h2>
              <p className="text-xs text-muted-foreground">
                Hardware pinouts, eMMC/UFS ISP connection diagrams, and EDL 9008 test points for {data.model.name}.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {data.technicalRecords.map((tech) => (
                <Link
                  key={tech.id}
                  href={tech.slugUrl || `/isp-pinout/${tech.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors"
                >
                  {tech.thumbnailUrl || tech.fileUrl ? (
                    <img
                      src={tech.thumbnailUrl || tech.fileUrl || ""}
                      alt={tech.title}
                      className="h-16 w-16 rounded-lg object-cover border bg-muted flex-shrink-0"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                      <Cpu className="h-7 w-7" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[11px] font-semibold text-primary uppercase tracking-wider">
                      {tech.schematicType || "Technical Diagram"}
                    </span>
                    <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {tech.title}
                    </h3>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      View full diagram <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ Accordion Section for Google Rich Snippets */}
        {data.faqs && data.faqs.length > 0 && (
          <section aria-labelledby="faq-heading" className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 id="faq-heading" className="text-xl font-bold">
                  Frequently Asked Questions (FAQ)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Verified answers for {data.model.brandName} {data.model.name} LCD combo, display folder & hardware compatibility
                </p>
              </div>
            </div>

            <div className="divide-y divide-border/60 border-t border-border/60">
              {data.faqs.map((faq, idx) => (
                <FaqAccordionItem key={idx} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Compatibility Directory Page (/compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export function PublicCompatibilityDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("q") || "";
    }
    return "";
  });
  const [selectedBrand, setSelectedBrand] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("brand") || "all";
    }
    return "all";
  });

  const { data, isLoading } = useQuery<{
    brands: Array<{ id: number; name: string; slug: string }>;
    categories: Array<{ id: number; name: string; slug: string }>;
    models: Array<{
      id: number;
      name: string;
      brandName: string;
      brandSlug: string;
      modelSlug: string;
      slugUrl: string;
      imageUrl?: string | null;
      categoryName?: string | null;
      compatCount: number;
    }>;
    totalCount: number;
  }>({
    queryKey: ["public-compatibility-directory"],
    queryFn: async () => {
      const response = await fetch("/api/public/compatibility");
      if (!response.ok) throw new Error("Failed to load directory");
      return response.json();
    },
  });

  // The public directory is also the cross-resource finder. Keep the
  // directory response for the empty state, but use the API search contract
  // once a visitor enters a model token such as "A12".
  const { data: unifiedSearch, isFetching: isSearching } = useQuery<{
    models?: Array<{ id: number; name: string; brandName: string; imageUrl?: string | null }>;
    combos?: Array<{ id: number; modelId: number; modelName: string; brandName: string; name: string; comboType?: string | null }>;
    batteryModels?: Array<{ id: number; modelNumber: string; brandName: string; capacity?: string | null; voltage?: string | null; slugUrl: string }>;
    technicalRecords?: Array<{
      id: number;
      title: string;
      slugUrl: string;
      schematicType?: string | null;
      deviceBrand?: string | null;
      deviceModel?: string | null;
      thumbnailUrl?: string | null;
    }>;
  }>({
    queryKey: ["public-unified-search", searchTerm.trim().toLowerCase()],
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm.trim())}`);
      if (!response.ok) throw new Error("Failed to search technical database");
      return response.json();
    },
    enabled: searchTerm.trim().length >= 2,
  });

  const filteredModels = useMemo(() => {
    if (!data?.models) return [];
    if (!searchTerm.trim()) {
      return data.models.filter((m) => selectedBrand === "all" || m.brandSlug === selectedBrand);
    }

    const lowerQ = searchTerm.toLowerCase().trim();
    // Strip common repair terms so queries like "a12 lcd combo" or "a12 combo" easily match "Samsung Galaxy A12"
    const stopWords = new Set(["lcd", "combo", "folder", "display", "screen", "compatibility", "compatible", "phone", "mobile", "glass", "touch", "price", "replacement", "assembly"]);
    const rawTokens = lowerQ.split(/[\s\-_\/]+/).filter(Boolean);
    const searchTokens = rawTokens.filter(t => !stopWords.has(t));
    const effectiveTokens = searchTokens.length > 0 ? searchTokens : rawTokens;

    return data.models.filter((m) => {
      const matchesBrand = selectedBrand === "all" || m.brandSlug === selectedBrand;
      if (!matchesBrand) return false;

      const full = `${m.brandName} ${m.name}`.toLowerCase();
      const modelName = m.name.toLowerCase();

      if (full.includes(lowerQ) || modelName.includes(lowerQ)) return true;
      return effectiveTokens.every(token => full.includes(token));
    });
  }, [data?.models, searchTerm, selectedBrand]);

  if (isLoading) return <LoadingState />;

  return (
    <PageShell>
      <SeoHead
        title="Mobile Display Combo & Hardware Compatibility Database | PosCert"
        description="Search 100% verified mobile phone LCD combo, touch screen, and hardware part compatibility across Samsung, Xiaomi, Vivo, Oppo, Apple, and Infinix."
        canonicalPath="/compatibility"
      />

      {/* Directory Hero */}
      <div className="border-b bg-card py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Wrench className="h-3.5 w-3.5" />
            <span>Mobile Hardware Engineering Database</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Phone Parts & Combo Compatibility
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Find which mobile phones share the exact same LCD screens, touch digitizers, and replacement modules.
          </p>

          {/* Search Bar */}
          <div className="mt-8 mx-auto max-w-xl relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search phone model (e.g. Galaxy A12, Redmi Note 10...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background py-3.5 pl-12 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>

          {/* Brand Pills */}
          {data?.brands && data.brands.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedBrand("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  selectedBrand === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All Brands ({data.models.length})
              </button>
              {data.brands.slice(0, 10).map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBrand(b.slug)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    selectedBrand === b.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Models Grid */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">
            Showing {filteredModels.length} {filteredModels.length === 1 ? "Model" : "Models"}
          </h2>
        </div>

        {searchTerm.trim().length >= 2 ? (
          isSearching ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              Searching display, battery, ISP and test-point records…
            </div>
          ) : (
            <div className="space-y-8">
              {(unifiedSearch?.models?.length ?? 0) > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Phone Models</h2>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {unifiedSearch?.models?.map((m) => (
                      <Link
                        key={m.id}
                        href={`/compatibility/${m.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}/${m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                        className="rounded-2xl border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{m.brandName}</span>
                        <h3 className="mt-1 font-bold">{m.name}</h3>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">View compatibility <ChevronRight className="h-3.5 w-3.5" /></span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {(unifiedSearch?.combos?.length ?? 0) > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Display Compatibility</h2>
                  <div className="divide-y overflow-hidden rounded-2xl border bg-card">
                    {unifiedSearch?.combos?.map((combo) => (
                      <Link key={combo.id} href={`/compatibility/${combo.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}/${combo.modelName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                        <span className="min-w-0">
                          <strong className="block truncate text-sm">{combo.name}</strong>
                          <span className="block truncate text-xs text-muted-foreground">{combo.brandName} {combo.modelName}{combo.comboType ? ` · ${combo.comboType}` : ""}</span>
                        </span>
                        <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {(unifiedSearch?.batteryModels?.length ?? 0) > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Battery Compatibility</h2>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {unifiedSearch?.batteryModels?.map((battery) => (
                      <Link key={battery.id} href={battery.slugUrl} className="rounded-2xl border bg-card p-4 transition-all hover:border-emerald-500 hover:shadow-md">
                        <div className="flex items-center gap-2 text-emerald-600"><Battery className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wider">Battery</span></div>
                        <h3 className="mt-2 font-bold">{battery.modelNumber}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{battery.brandName}{battery.capacity ? ` · ${battery.capacity}` : ""}{battery.voltage ? ` · ${battery.voltage}` : ""}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {(unifiedSearch?.technicalRecords?.length ?? 0) > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">ISP Pinouts & Test Points</h2>
                  <div className="divide-y overflow-hidden rounded-2xl border bg-card">
                    {unifiedSearch?.technicalRecords?.map((record) => (
                      <Link key={`${record.schematicType}-${record.id}`} href={record.slugUrl} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                        <span className="flex min-w-0 items-center gap-3">
                          <Wrench className="h-4 w-4 shrink-0 text-primary" />
                          <span className="min-w-0">
                            <strong className="block truncate text-sm">{record.title}</strong>
                            <span className="block truncate text-xs text-muted-foreground">{record.schematicType === "ISP Pinout" ? "ISP Pinout" : "Test Point"}{record.deviceBrand || record.deviceModel ? ` · ${record.deviceBrand ?? ""} ${record.deviceModel ?? ""}` : ""}</span>
                          </span>
                        </span>
                        <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {(unifiedSearch?.models?.length ?? 0) === 0 &&
                (unifiedSearch?.combos?.length ?? 0) === 0 &&
                (unifiedSearch?.batteryModels?.length ?? 0) === 0 &&
                (unifiedSearch?.technicalRecords?.length ?? 0) === 0 && (
                  <div className="rounded-2xl border border-dashed p-12 text-center">
                    <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 font-semibold text-foreground">No technical records found</p>
                    <p className="mt-1 text-xs text-muted-foreground">Try a model number, battery code, or brand name.</p>
                  </div>
                )}
            </div>
          )
        ) : filteredModels.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <Smartphone className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">No matching models found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search query or reset the brand filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredModels.map((m) => (
              <Link
                key={m.id}
                href={m.slugUrl}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 hover:border-primary hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="font-semibold uppercase tracking-wider">{m.brandName}</span>
                    <span className="rounded bg-primary/10 text-primary px-2 py-0.5 font-bold text-[11px]">
                      {m.compatCount} {m.compatCount === 1 ? "Compat" : "Compats"}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                    {m.name}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>View Compatibility</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Public Battery Directory Page (/battery-compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export function PublicBatteryDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery<BatteryDirectoryResponse>({
    queryKey: ["public-battery-directory"],
    queryFn: async () => {
      const response = await fetch("/api/public/battery-compatibility");
      if (!response.ok) throw new Error("Failed to load battery list");
      return response.json();
    },
  });

  const filteredBatteries = useMemo(() => {
    if (!data?.batteries) return [];
    if (!searchTerm.trim()) return data.batteries;
    const term = searchTerm.toLowerCase().trim();

    return data.batteries.filter((b) => {
      const matchBattery =
        b.modelNumber.toLowerCase().includes(term) ||
        b.brandName.toLowerCase().includes(term);
      const matchDevice = b.devices.some((d) => d.name.toLowerCase().includes(term));
      return matchBattery || matchDevice;
    });
  }, [data?.batteries, searchTerm]);

  if (isLoading) return <LoadingState />;

  return (
    <PageShell>
      <SeoHead
        title="Mobile Battery Model & Phone Compatibility Finder | PosCert"
        description="Search phone battery compatibility by Battery Model Code (BN59, BL-5C, EB-BA125ABY...) or Mobile Phone Model. Find exact capacity and shared batteries."
        canonicalPath="/battery-compatibility"
      />

      {/* Battery Hero */}
      <div className="border-b bg-gradient-to-b from-card to-background py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
            <Battery className="h-3.5 w-3.5" />
            <span>Battery Model & Phone Cross-Reference</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Phone Battery Compatibility Finder
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Search by <strong className="text-foreground">Battery Model Code</strong> (e.g. BN59, EB-BA125ABY, BL-5C) or by <strong className="text-foreground">Phone Model Name</strong> (e.g. Redmi Note 10, Galaxy A12).
          </p>

          <div className="mt-8 mx-auto max-w-xl relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search battery code or phone model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background py-3.5 pl-12 pr-4 text-sm placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">
            Showing {filteredBatteries.length} Battery {filteredBatteries.length === 1 ? "Model" : "Models"}
          </h2>
        </div>

        {filteredBatteries.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <Battery className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">No battery records found</p>
            <p className="text-xs text-muted-foreground mt-1">Try searching by partial battery code or phone name.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBatteries.map((batt) => (
              <div
                key={batt.id}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 hover:border-emerald-500/80 transition-colors shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {batt.brandName}
                      </span>
                      <Link
                        href={batt.slugUrl}
                        className="block text-xl font-extrabold text-foreground group-hover:text-emerald-600 transition-colors mt-0.5"
                      >
                        {batt.modelNumber}
                      </Link>
                    </div>
                    {batt.capacity && (
                      <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-bold">
                        {batt.capacity}
                      </span>
                    )}
                  </div>

                  {batt.voltage && (
                    <p className="mt-1 text-xs text-muted-foreground font-medium">
                      Rated Voltage: {batt.voltage}
                    </p>
                  )}

                  {batt.notes && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 bg-muted/40 p-2 rounded">
                      {batt.notes}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-border/60">
                    <p className="text-xs font-semibold text-foreground mb-2">
                      Compatible Devices ({batt.devices.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {batt.devices.map((dev) => (
                        <Link
                          key={dev.id}
                          href={dev.slugUrl}
                          className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-xs text-foreground hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                        >
                          {dev.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border/60">
                  <Link
                    href={batt.slugUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    View Full Battery Compatibility Page <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Dedicated Battery Page (/battery-compatibility/:slug)
// ─────────────────────────────────────────────────────────────────────────────

export function PublicBatteryDetailPage() {
  const { slug = "" } = useParams();
  const { data, isLoading } = useQuery<BatteryDetailResponse>({
    queryKey: ["public-battery-detail", slug],
    queryFn: async () => {
      const response = await fetch(`/api/public/battery-compatibility/${slug}`);
      if (!response.ok) throw new Error("Not found");
      return response.json();
    },
  });

  if (isLoading) return <LoadingState />;
  if (!data) return <NotFoundState message={`No battery compatibility records found for ${slug}.`} />;

  const isDeviceLookup = data.type === "device";
  const devicesList = isDeviceLookup ? data.compatibleDevices ?? [] : data.devices ?? [];

  return (
    <PageShell>
      <SeoHead
        title={data.seo.title}
        description={data.seo.description}
        canonicalPath={data.canonicalPath}
        schema={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: isDeviceLookup
            ? `${data.device?.name} Battery (${data.battery.modelNumber})`
            : `${data.battery.brandName} ${data.battery.modelNumber} Mobile Battery`,
          description: data.seo.description,
        }}
      />

      <div className="border-b bg-gradient-to-b from-card to-background py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/battery-compatibility" className="hover:text-foreground">Battery Finder</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">
              {isDeviceLookup ? data.device?.name : data.battery.modelNumber}
            </span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-600">
                <Battery className="h-3.5 w-3.5" />
                <span>Verified Battery Model</span>
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {isDeviceLookup ? `${data.device?.name} Battery` : `${data.battery.brandName} ${data.battery.modelNumber}`}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
                {isDeviceLookup ? (
                  <>
                    <strong className="text-foreground">{data.device?.name}</strong> uses battery model{" "}
                    <strong className="text-emerald-600">{data.battery.modelNumber}</strong> ({data.battery.capacity ?? "Original"}).
                  </>
                ) : (
                  <>
                    Replacement battery <strong className="text-foreground">{data.battery.modelNumber}</strong> ({data.battery.capacity ?? ""}) specifications & compatible phone models.
                  </>
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col items-center justify-center min-w-[180px]">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Battery Code</span>
              <span className="text-2xl font-black text-emerald-600 mt-1">{data.battery.modelNumber}</span>
              {data.battery.capacity && (
                <span className="text-xs font-bold text-muted-foreground mt-0.5">{data.battery.capacity}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6">
        {/* Battery Specs Table */}
        <section aria-labelledby="specs-heading" className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 id="specs-heading" className="text-xl font-bold mb-4">
            Technical Battery Specifications
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-3.5">
              <span className="text-xs text-muted-foreground font-medium">Battery Model</span>
              <p className="font-bold text-base text-foreground mt-0.5">{data.battery.modelNumber}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3.5">
              <span className="text-xs text-muted-foreground font-medium">Brand</span>
              <p className="font-bold text-base text-foreground mt-0.5">{data.battery.brandName}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3.5">
              <span className="text-xs text-muted-foreground font-medium">Rated Capacity</span>
              <p className="font-bold text-base text-foreground mt-0.5">{data.battery.capacity || "Standard OEM"}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3.5">
              <span className="text-xs text-muted-foreground font-medium">Nominal Voltage</span>
              <p className="font-bold text-base text-foreground mt-0.5">{data.battery.voltage || "3.85V / 4.4V"}</p>
            </div>
            {data.battery.notes && (
              <div className="rounded-xl border border-border bg-background p-3.5 sm:col-span-2">
                <span className="text-xs text-muted-foreground font-medium">Special Notes</span>
                <p className="text-sm text-foreground mt-0.5">{data.battery.notes}</p>
              </div>
            )}
          </div>
        </section>

        {/* Compatible Devices */}
        <section aria-labelledby="devices-heading">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="devices-heading" className="text-xl font-bold">
                Compatible Phone Models ({devicesList.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                All phones that physically and electronically accept the {data.battery.modelNumber} battery.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {devicesList.map((dev) => (
              <div
                key={dev.id}
                className="group rounded-xl border border-border bg-card p-4 hover:border-emerald-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground group-hover:text-emerald-600 transition-colors">
                    {dev.name}
                  </span>
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <Link href={dev.batteryUrl} className="text-emerald-600 font-semibold hover:underline">
                    Battery page
                  </Link>
                  <Link href={dev.displayCompatibilityUrl} className="text-primary font-semibold hover:underline">
                    Parts compat →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Public ISP Pinout Directory & Detail Pages
// ─────────────────────────────────────────────────────────────────────────────

export function PublicIspDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery<SchematicsDirectoryResponse>({
    queryKey: ["public-isp-directory"],
    queryFn: async () => {
      const response = await fetch("/api/public/schematics?type=ISP Pinout");
      if (!response.ok) throw new Error("Failed to load ISP pinouts");
      return response.json();
    },
  });

  const filtered = useMemo(() => {
    if (!data?.schematics) return [];
    if (!searchTerm.trim()) return data.schematics;
    const term = searchTerm.toLowerCase();
    return data.schematics.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        (s.deviceBrand ?? "").toLowerCase().includes(term) ||
        (s.deviceModel ?? "").toLowerCase().includes(term)
    );
  }, [data?.schematics, searchTerm]);

  if (isLoading) return <LoadingState />;

  return (
    <PageShell>
      <SeoHead
        title="Mobile ISP Pinout Database (eMMC / UFS) | PosCert"
        description="High-resolution ISP pinout diagrams for Samsung, Xiaomi, Vivo, Oppo, Realme, and Huawei. Clear CLK, CMD, DAT0, VCC, and VCCQ connection points."
        canonicalPath="/isp-pinout"
      />

      <div className="border-b bg-card py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Cpu className="h-3.5 w-3.5" />
            <span>Hardware Repair Pinouts</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            eMMC & UFS ISP Pinout Database
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Direct connection jumper points for dead boot repair, FRP unlock, and partition flashing with EasyJTAG, UFI Box, and Medusa Pro.
          </p>

          <div className="mt-8 mx-auto max-w-xl relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search phone model or chipset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background py-3.5 pl-12 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">
            Showing {filtered.length} Pinout {filtered.length === 1 ? "Diagram" : "Diagrams"}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <Cpu className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">No ISP pinouts found</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {filtered.map((s) => (
              <Link
                key={s.id}
                href={s.slugUrl}
                className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-primary transition-colors shadow-sm"
              >
                <div className="h-44 bg-muted flex items-center justify-center overflow-hidden">
                  {s.thumbnailUrl || s.fileUrl ? (
                    <img
                      src={s.thumbnailUrl || s.fileUrl || ""}
                      alt={s.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Cpu className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {s.deviceBrand || "Mobile Device"}
                    </span>
                    <h3 className="font-bold text-base text-foreground mt-1 group-hover:text-primary transition-colors">
                      {s.title}
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
                    <span>View Pinout Image</span>
                    <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Public EDL Test Point Directory Page (/test-point)
// ─────────────────────────────────────────────────────────────────────────────

export function PublicTestPointDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery<SchematicsDirectoryResponse>({
    queryKey: ["public-testpoint-directory"],
    queryFn: async () => {
      const response = await fetch("/api/public/schematics?type=Test Point");
      if (!response.ok) throw new Error("Failed to load test points");
      return response.json();
    },
  });

  const filtered = useMemo(() => {
    if (!data?.schematics) return [];
    if (!searchTerm.trim()) return data.schematics;
    const term = searchTerm.toLowerCase();
    return data.schematics.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        (s.deviceBrand ?? "").toLowerCase().includes(term) ||
        (s.deviceModel ?? "").toLowerCase().includes(term)
    );
  }, [data?.schematics, searchTerm]);

  if (isLoading) return <LoadingState />;

  return (
    <PageShell>
      <SeoHead
        title="Mobile EDL 9008 & BROM Test Point Database | PosCert"
        description="Emergency Download EDL 9008 Mode and MTK BROM hardware test points. Unbrick, bypass authorization, and flash dead phones."
        canonicalPath="/test-point"
      />

      <div className="border-b bg-card py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
            <Zap className="h-3.5 w-3.5" />
            <span>Emergency Download & Hardware Jumper</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            EDL 9008 & BROM Test Points
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            High-precision test point jumpers to force Qualcomm Emergency Download (EDL 9008) or MediaTek BROM mode for unbricking and flashing.
          </p>

          <div className="mt-8 mx-auto max-w-xl relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search phone model (e.g. Redmi 9, Realme C21...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background py-3.5 pl-12 pr-4 text-sm placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">
            Showing {filtered.length} Test Point {filtered.length === 1 ? "Image" : "Images"}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <Zap className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">No test point records found</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {filtered.map((s) => (
              <Link
                key={s.id}
                href={s.slugUrl}
                className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-amber-500 transition-colors shadow-sm"
              >
                <div className="h-44 bg-muted flex items-center justify-center overflow-hidden">
                  {s.thumbnailUrl || s.fileUrl ? (
                    <img
                      src={s.thumbnailUrl || s.fileUrl || ""}
                      alt={s.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Zap className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                      {s.deviceBrand || "Hardware Test Point"}
                    </span>
                    <h3 className="font-bold text-base text-foreground mt-1 group-hover:text-amber-600 transition-colors">
                      {s.title}
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-amber-600">
                    <span>View Test Point Image</span>
                    <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Dedicated Technical Page for ISP Pinout & Test Point
// ─────────────────────────────────────────────────────────────────────────────

export function PublicTechnicalPage({ kind }: { kind: "isp" | "pinout" }) {
  const { slug = "" } = useParams();
  const endpoint = kind === "isp" ? `/api/public/isp/${slug}` : `/api/public/test-point/${slug}`;

  const { data, isLoading } = useQuery<TechnicalResponse>({
    queryKey: ["public-technical", kind, slug],
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Not found");
      return response.json();
    },
  });

  if (isLoading) return <LoadingState />;
  if (!data) return <NotFoundState message={`No ${kind === "isp" ? "ISP pinout" : "test point"} diagram found for ${slug}.`} />;

  const record = data.record;
  const technicalRows = [
    ["Component", record.component],
    ["Pin number", record.pinNumber],
    ["Pin name / function", record.pinName],
    ["Voltage", record.voltage],
    ["Ground", record.ground],
    ["Signal information", record.signalInfo],
    ["Test point location", record.testPointInfo],
  ].filter(([, value]) => Boolean(value));

  const isIsp = kind === "isp" || record.schematicType === "ISP Pinout";

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

      <div className="border-b bg-card py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={isIsp ? "/isp-pinout" : "/test-point"} className="hover:text-foreground">
              {isIsp ? "ISP Pinouts" : "EDL Test Points"}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{record.title}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {record.schematicType || (isIsp ? "ISP Pinout" : "Hardware Test Point")}
              </span>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {record.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Technical reference for {record.deviceBrand} {record.deviceModel || "mobile hardware"}.
              </p>
            </div>

            {data.compatibilityUrl && (
              <Link
                href={data.compatibilityUrl}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors self-start sm:self-auto"
              >
                <Smartphone className="h-4 w-4" />
                <span>Phone Compatibility →</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6">
        {/* Main High-Res Image Figure */}
        {(record.fileUrl || record.thumbnailUrl) && (
          <figure className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="p-4 bg-muted/20 flex justify-center">
              <img
                src={record.fileUrl || record.thumbnailUrl || ""}
                alt={record.title}
                className="max-h-[750px] w-full object-contain rounded-lg"
              />
            </div>
            {record.fileUrl && (
              <figcaption className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground bg-card">
                <span>High-resolution hardware schematic</span>
                <a
                  href={record.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  Open Original High-Res Image <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </figcaption>
            )}
          </figure>
        )}

        {/* Technical Data Table */}
        {technicalRows.length > 0 && (
          <section aria-labelledby="pinout-data-heading" className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 id="pinout-data-heading" className="text-xl font-bold mb-4">
              Pin Details & Connection Matrix
            </h2>
            <div className="overflow-hidden rounded-xl border">
              {technicalRows.map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-1 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[220px_1fr] text-sm"
                >
                  <dt className="font-semibold text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notes */}
        {record.notes && (
          <section aria-labelledby="notes-heading" className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 id="notes-heading" className="text-xl font-bold mb-2">
              Jumper & Connection Instructions
            </h2>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
              {record.notes}
            </p>
          </section>
        )}
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
