import { type CSSProperties, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Calendar, Check, ChevronRight, FileText, Hand, Lock, MessageSquare, PenLine, ReceiptText } from 'lucide-react';
import NotFound from '@/pages/not-found';
import { toolUseCases, findToolUseCase, type ToolCategory, type ToolUseCase } from '@/lib/tools';
import { applyPageMeta } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

const ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

const categoryLabel: Record<ToolCategory, string> = {
  esignature: 'E-signature',
  invoice: 'Invoice',
};

function hexToHslTriplet(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
      case g: h = (b - r) / delta + 2; break;
      default: h = (r - g) / delta + 4;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function useToolMeta(tool: ToolUseCase | undefined) {
  useEffect(() => {
    if (!tool) return;
    applyPageMeta({
      title: tool.metaTitle,
      description: tool.metaDescription,
      canonical: `/tools/${tool.slug}`,
      includeBrand: true,
      image: tool.category === "invoice" ? "/og/invoice.png" : "/og/e-signature.png",
      ogType: "website",
    });
  }, [tool]);
}

function ToolCrumbNav({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5" aria-label="Breadcrumb">
      <a href="/" className="inline-flex min-h-11 items-center font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]">Home</a>
      <ChevronRight size={13} className="text-[hsl(var(--muted-foreground))] opacity-60" />
      <a href="/tools" className="inline-flex min-h-11 items-center font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]">Tools</a>
      <ChevronRight size={13} className="text-[hsl(var(--muted-foreground))] opacity-60" />
      <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--primary))]">{current}</span>
    </nav>
  );
}

function RelatedGroup({ title, tools, currentSlug }: { title: string; tools: ToolUseCase[]; currentSlug: string }) {
  const items = tools.filter((tool) => tool.slug !== currentSlug);
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-bold tracking-[-.02em] text-[hsl(var(--foreground))]">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((tool) => (
          <a key={tool.slug} href={`/tools/${tool.slug}`} data-testid={`related-${tool.slug}`} className="group flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 transition-colors hover:border-[hsl(var(--primary)/.5)]">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">{tool.category === 'esignature' ? <PenLine size={16} /> : <ReceiptText size={16} />}</span>
            <span className="min-w-0 flex-1 text-sm font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]">{tool.title}</span>
            <ArrowRight size={15} className="shrink-0 text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1 group-hover:text-[hsl(var(--primary))]" />
          </a>
        ))}
      </div>
    </section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-t border-[hsl(var(--border))]">
      <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8 lg:py-24">{children}</div>
    </section>
  );
}

export function ToolPage() {
  const [location] = useLocation();
  const slug = location.startsWith('/tools/') ? decodeURIComponent(location.slice('/tools/'.length)) : '';
  const tool = findToolUseCase(slug);
  useToolMeta(tool);

  if (!tool) return <NotFound />;

  const esignatureTools = toolUseCases.filter((item) => item.category === 'esignature');
  const invoiceTools = toolUseCases.filter((item) => item.category === 'invoice');
  const themeVars = {
    '--primary': hexToHslTriplet(tool.theme.primary),
    '--accent': hexToHslTriplet(tool.theme.primary),
    '--ring': hexToHslTriplet(tool.theme.primary),
  } as CSSProperties;

  return (
    <main style={themeVars}>
      <JsonLd id="tool-faq" data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: tool.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }} />
      <JsonLd id="tool-software" data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: tool.title,
        description: tool.metaDescription,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web browser',
        url: `${ORIGIN}/tools/${tool.slug}`,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      }} />
      <JsonLd id="tool-breadcrumb" data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Tools', item: `${ORIGIN}/tools` },
          { '@type': 'ListItem', position: 3, name: tool.title, item: `${ORIGIN}/tools/${tool.slug}` },
        ],
      }} />
      <section className="border-b border-[hsl(var(--border))]" style={{ backgroundColor: tool.theme.bg }}>
        <div className="mx-auto max-w-4xl px-5 pb-12 pt-12 lg:px-8 lg:pb-16 lg:pt-16">
          <ToolCrumbNav current={tool.title} />
          <p className="mt-10 font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">{categoryLabel[tool.category]} use case</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1] tracking-[-.055em] text-[hsl(var(--foreground))] md:text-5xl">{tool.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">{tool.intro}</p>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[hsl(var(--foreground))]"><strong>What is {tool.title}?</strong> {tool.whatIs}</p>
          <div className="mt-6 max-w-3xl space-y-3">
            <h3 className="font-semibold text-[hsl(var(--foreground))]">Why use this tool?</h3>
            <ul className="list-disc pl-5 space-y-1 text-base leading-7 text-[hsl(var(--muted-foreground))]">
              {tool.whyUse.map((reason, i) => <li key={i}>{reason}</li>)}
            </ul>
          </div>
          <div className="mt-6 max-w-3xl space-y-3">
            <h3 className="font-semibold text-[hsl(var(--foreground))]">Free vs paid alternatives</h3>
            <p className="text-base leading-7 text-[hsl(var(--muted-foreground))]">{tool.comparison}</p>
          </div>
          {tool.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="mt-4 max-w-3xl text-base leading-8 text-[hsl(var(--muted-foreground))]">{paragraph}</p>
          ))}
          <a href={tool.relatedTool.href} data-testid="tool-cta-open" className="btn-press mt-9 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[hsl(var(--primary))] px-7 text-base font-bold text-[hsl(var(--primary-foreground))] shadow-[0_10px_30px_-18px_hsl(var(--primary))] transition-colors hover:brightness-110">
            {tool.relatedTool.label} <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <Section>
        <h2 className="font-display text-3xl font-bold tracking-[-.04em] text-[hsl(var(--foreground))]">{tool.stepsHeading ?? 'How it works'}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Plain steps, no training needed. Everything stays in the browser.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {tool.steps.map((step, index) => (
            <div key={step} className="flex gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[hsl(var(--primary)/.1)] font-mono-ui text-sm font-bold text-[hsl(var(--primary))]">{String(index + 1).padStart(2, '0')}</span>
              <p className="pt-1 text-sm font-semibold leading-6 text-[hsl(var(--foreground))]">{step}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="font-display text-3xl font-bold tracking-[-.04em] text-[hsl(var(--foreground))]">Real-world use cases</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">The everyday situations where people reach for this tool.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {tool.useCases.map((item, index) => (
            <div key={item.title} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[hsl(var(--primary)/.1)] font-mono-ui text-xs font-bold text-[hsl(var(--primary))]">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="font-display text-3xl font-bold tracking-[-.04em] text-[hsl(var(--foreground))]">Quick tips and common mistakes</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Small habits that keep the output clean and the workflow fast.</p>
        <div className="mt-8 space-y-3">
          {tool.tips.map((tip) => (
            <div key={tip} className="flex gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]"><Check size={14} /></span>
              <p className="pt-0.5 text-sm leading-6 text-[hsl(var(--foreground))]">{tip}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="font-display text-3xl font-bold tracking-[-.04em] text-[hsl(var(--foreground))]">Common questions</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Straight answers to the questions that come up most.</p>
        <div className="mt-8 space-y-3">
          {tool.faq.map((item) => (
            <div key={item.q} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--foreground))]"><span className="text-[hsl(var(--primary))]"><FileText size={15} /></span> {item.q}</h3>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.a}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="font-display text-3xl font-bold tracking-[-.04em] text-[hsl(var(--foreground))]">Related Tools &amp; Formats</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Same tools, other everyday use cases — grouped by category.</p>
        <div className="mt-8 space-y-10">

      <div className="mt-8 flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Calendar size={16} /></span>
        <p className="text-sm font-medium text-[hsl(var(--foreground))]">Last updated: {tool.lastUpdated}</p>
      </div>

      {tool.faqAI && tool.faqAI.length > 0 && (
        <Section>
          <h2 className="font-display text-3xl font-bold tracking-[-.04em] text-[hsl(var(--foreground))]">Questions people ask AI assistants</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Direct, factual answers for common AI queries.</p>
          <div className="mt-8 space-y-3">
            {tool.faqAI.map((item) => (
              <div key={item.q} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--foreground))]"><span className="text-[hsl(var(--primary))]"><MessageSquare size={15} /></span> {item.q}</h3>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.a}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
          <RelatedGroup title="E-signature" tools={esignatureTools} currentSlug={tool.slug} />
          <RelatedGroup title="Invoice &amp; formats" tools={invoiceTools} currentSlug={tool.slug} />
        </div>
        <a href="/tools" data-testid="link-all-tools" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))]">Browse all free tools <ArrowRight size={15} /></a>
        <div className="mt-12 flex flex-wrap items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.35)] p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Lock size={20} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[hsl(var(--foreground))]">Private by design</p>
            <p className="mt-0.5 text-xs leading-5 text-[hsl(var(--muted-foreground))]">No account, no uploads, nothing leaves your device until you export.</p>
          </div>
          <span className="hidden items-center gap-1.5 text-xs font-bold text-[hsl(var(--primary))] sm:inline-flex"><Hand size={13} /> Free to use</span>
        </div>
      </Section>
    </main>
  );
}

export function ToolsIndexPage() {
  useEffect(() => {
    applyPageMeta({
      title: 'Free Online Office Tools - All in One Place',
      description: 'Browse every free Office Toolkit tool in one place — e-signatures for PDF, Word, Excel and contracts, plus invoice, GST, quotation and freelance billing tools. No signup.',
      canonical: '/tools',
      includeBrand: true,
      image: '/og/default.png',
      ogType: 'website',
    });
  }, []);

  const esignatureTools = toolUseCases.filter((item) => item.category === 'esignature');
  const invoiceTools = toolUseCases.filter((item) => item.category === 'invoice');

  const renderGroup = (tools: ToolUseCase[], eyebrow: string, linkToMain: string, mainLabel: string) => (
    <section className="border-t border-[hsl(var(--border))]">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">{eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-[-.04em]">{eyebrow}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {tools.map((tool) => (
            <a key={tool.slug} href={`/tools/${tool.slug}`} data-testid={`tools-index-${tool.slug}`} className="group flex flex-col rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 transition-colors hover:border-[hsl(var(--primary)/.5)]">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">{tool.category === 'esignature' ? <PenLine size={18} /> : <ReceiptText size={18} />}</span>
                <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--primary))]">{tool.category === 'esignature' ? 'E-signature' : 'Invoice'}</span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold leading-tight tracking-[-.03em] group-hover:text-[hsl(var(--primary))]">{tool.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{tool.intro}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-[hsl(var(--primary))]">Open tool <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
            </a>
          ))}
        </div>
        <a href={linkToMain} data-testid="tools-index-main" className="mt-10 inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-3 text-sm font-bold text-[hsl(var(--foreground))] transition-colors hover:border-[hsl(var(--primary)/.5)]">{mainLabel} <ArrowRight size={15} /></a>
      </div>
    </section>
  );

  return (
    <main>
      <section className="border-b border-[hsl(var(--border))]">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-14 lg:px-8 lg:pb-20 lg:pt-20">
          <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">All free tools, one page</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-[1] tracking-[-.055em] md:text-6xl">Every Office Toolkit tool, in one place.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">Sign documents, build invoices and send quotations — each tool opens ready to work, keeps your details on your device, and exports a finished file. No accounts, no uploads, no noise.</p>
        </div>
      </section>
      {renderGroup(esignatureTools, 'E-signature tools', '/e-signature-maker', 'Open the main e-signature maker')}
      {renderGroup(invoiceTools, 'Invoice tools & formats', '/invoice-generator', 'Open the invoice generator')}
    </main>
  );
}