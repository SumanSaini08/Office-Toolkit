import { type CSSProperties, type PointerEvent, type ReactNode, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { ToolPage } from '@/pages/ToolPages';
import { toolFooterColumns } from '@/lib/tools';
import { YouMightAlsoNeed, invoiceToolUseCases } from '@/components/RelatedTools';
import { AdminPage, AdminLoginPage, BlogPage } from '@/pages/ContentPages';
import { professionalSignatureFonts, useOfficeToolkitContent } from '@/lib/content';
import { applyPageMeta } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  ArrowRight, BriefcaseBusiness, Check, ChevronDown, ChevronRight, CircleHelp, Download, FileText,
  Hand, Laptop, Loader2, Mail, MapPin, Menu, PenLine, Plus, ReceiptText,
  RotateCcw, Send, ShieldCheck, Sparkles, Trash2, Upload, X, Zap,
} from 'lucide-react';

const queryClient = new QueryClient();

const ESignatureMaker = lazy(() => import('@/components/ESignatureMaker').then((module) => ({ default: module.ESignatureMaker })));

type ToolId = 'signature' | 'invoice';
const toolMeta: Record<ToolId, { title: string; eyebrow: string; description: string; path: string; icon: typeof PenLine; tint: string }> = {
  signature: { title: 'E-signature maker', eyebrow: 'Sign it, send it, done', description: 'Draw or type a clean signature, then place it on a PDF. Produce a transparent PNG or a signed PDF.', path: '/e-signature-maker', icon: PenLine, tint: 'bg-[hsl(var(--secondary))]' },
  invoice: { title: 'Free invoice generator online', eyebrow: 'Get paid without the fuss', description: 'This free invoice generator online builds a polished GST invoice with line items, tax, and your own logo — everything stays in your browser, with an online invoice generator that needs no account.', path: '/invoice-generator', icon: ReceiptText, tint: 'bg-[hsl(var(--accent)/.22)]' },
};

function setPageMeta(title: string, description: string, image?: string, ogType?: string) {
  applyPageMeta({ title, description, image, ogType });
}

function PageMeta({ title, description, children, image, ogType }: { title: string; description: string; children: ReactNode; image?: string; ogType?: string }) {
  useEffect(() => { setPageMeta(title, description, image, ogType); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [title, description, image, ogType]);
  return <div className="page-in">{children}</div>;
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group" data-testid="link-logo">
      <img src="/logo.png" alt="" className="h-9 w-auto rounded-lg object-contain transition-transform group-hover:rotate-[-5deg]" />
      <span className="font-display text-[1.05rem] font-bold tracking-[-.035em]">Office Toolkit</span>
    </Link>
  );
}

function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!toolsOpen) return;
    const onPointerDown = (e: Event) => { if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false); };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setToolsOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [toolsOpen]);
  const toolLinks = [
    { href: '/e-signature-maker', label: 'E-signature tool' },
    { href: '/invoice-generator', label: 'Invoice generator' },
  ];
  const isToolLinkActive = (href: string) => {
    if (location === href) return true;
    if (href.startsWith('/tools/') && location.startsWith('/tools/')) return location === href;
    return false;
  };
  const pageLinks = [
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ];
  return (
    <header className="no-print sticky top-0 z-40 border-b border-[hsl(var(--border)/.7)] bg-[hsl(var(--background)/.91)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group" data-testid="link-logo"><img src="/logo.png" alt="" className="h-8 w-auto rounded-lg object-contain" /><span className="font-display text-[1.05rem] font-bold tracking-[-.035em]">Office Toolkit</span></Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          <Link href="/" data-testid="link-nav-home" className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[hsl(var(--muted))] ${location === '/' ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}>Home</Link>
          <div className="relative" ref={toolsRef} onMouseEnter={() => setToolsOpen(true)} onMouseLeave={() => setToolsOpen(false)}>
            <button type="button" onClick={() => setToolsOpen((value) => !value)} data-testid="button-nav-tools" className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[hsl(var(--muted))] ${toolLinks.some((l) => location === l.href) ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}>Tools <ChevronDown size={15} className={`transition-transform ${toolsOpen ? 'rotate-180' : ''}`} /></button>
            {toolsOpen && (
              <div className="absolute left-1/2 top-full z-50 w-max min-w-56 -translate-x-1/2 pt-2">
                <div className="nav-menu-in relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-xl">
                  {toolLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setToolsOpen(false)} className={`flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[hsl(var(--muted))] ${isToolLinkActive(link.href) ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid={`link-nav-${link.label.toLowerCase()}`}><span>{link.label}</span><ArrowRight size={14} className="shrink-0 text-[hsl(var(--primary))]" /></Link>)}
                </div>
              </div>
            )}
          </div>
          {pageLinks.map((link) => (
            <Link key={link.href} href={link.href} data-testid={`link-nav-${link.label.toLowerCase().replaceAll(' ', '-')}`} className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[hsl(var(--muted))] ${location === link.href ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
              {link.label}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={() => setOpen(!open)} className="btn-press grid size-11 place-items-center rounded-lg md:hidden" aria-label="Toggle navigation" data-testid="button-toggle-navigation">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-[hsl(var(--border)/.7)] px-5 py-3 md:hidden" aria-label="Mobile navigation">
          <p className="px-3 pb-1 pt-2 font-mono-ui text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]">Tools</p>
          {toolLinks.map((link) => <Link onClick={() => setOpen(false)} key={link.href} href={link.href} className="block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-[hsl(var(--muted))]" data-testid={`link-mobile-${link.label.toLowerCase()}`}>{link.label}</Link>)}
          <p className="px-3 pb-1 pt-3 font-mono-ui text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]">Explore</p>
          {pageLinks.map((link) => <Link onClick={() => setOpen(false)} key={link.href} href={link.href} className="block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-[hsl(var(--muted))]" data-testid={`link-mobile-${link.label.toLowerCase().replaceAll(' ', '-')}`}>{link.label}</Link>)}
        </nav>
      )}
    </header>
  );
}

function FooterFAQ() {
  const [active, setActive] = useState<number | null>(null);
  const items: [string, string][] = [
    ['Do I need an account to use the tools?', 'No. Every tool in Office Toolkit opens in your browser and works immediately. There is no profile to create and no password to forget.'],
    ['Where does my data go?', 'Nowhere you do not send it. Office Toolkit is local-first, which means your documents, signatures, and drafts are processed and stored on your own device. Nothing is uploaded to a server.'],
    ['Are the exported files usable in other apps?', 'Yes. You can download your work as PNG, JPG, or PDF, which work in emails, contracts, presentation software, and most document tools.'],
    ['Do you save my work between visits?', 'The tools keep no account and no server-side history. Some drafts persist in your browser tab while it is open, and the blog can save notes locally if you publish one. Your privacy is the default.'],
    ['Can I request a new tool or feature?', 'Absolutely. We keep a list of the most-requested ideas and genuinely consider every suggestion we receive. Reach out through the Contact page.'],
  ];
  return (
    <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">Frequently asked questions</p>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-[-.035em]">Helpful answers, right here.</h2>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">The things people ask us most often. Still stuck? The Contact page always has a real person on the other end.</p>
          </div>
          <div className="divide-y divide-[hsl(var(--border))] border-y border-[hsl(var(--border))]">
            {items.map(([q, a], i) => <div key={q}><button type="button" onClick={() => setActive(active === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold" data-testid={`button-footer-faq-${i}`}><span>{q}</span><ChevronDown size={16} className={`shrink-0 text-[hsl(var(--primary))] transition-transform ${active === i ? 'rotate-180' : ''}`} /></button>{active === i && <p className="pb-4 pr-6 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{a}</p>}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="no-print">
      <FooterFAQ />
      <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)]">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-8">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm leading-6 text-[hsl(var(--muted-foreground))]">A small, private toolkit for the work hiding between meetings.</p>
            </div>
            <nav aria-label="Footer" className="contents">
              <div>
              <h3 className="font-display text-base font-bold tracking-[-.02em] text-[hsl(var(--foreground))]">Quick Links</h3>
              <ul className="mt-4 space-y-2.5 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                <li><Link href="/e-signature-maker" data-testid="link-footer-signature" className="flex min-h-11 items-center transition-colors hover:text-[hsl(var(--primary))]">E-signature tool</Link></li>
                <li><Link href="/invoice-generator" data-testid="link-footer-invoice" className="flex min-h-11 items-center transition-colors hover:text-[hsl(var(--primary))]">Invoice generator</Link></li>
              </ul>
            </div>
              <div>
              <h3 className="font-display text-base font-bold tracking-[-.02em] text-[hsl(var(--foreground))]">Company</h3>
              <ul className="mt-4 space-y-2.5 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                <li><Link href="/blog" data-testid="link-footer-blog" className="flex min-h-11 items-center transition-colors hover:text-[hsl(var(--primary))]">Blog</Link></li>
                <li><Link href="/about" data-testid="link-footer-about" className="flex min-h-11 items-center transition-colors hover:text-[hsl(var(--primary))]">About</Link></li>
                <li><Link href="/contact" data-testid="link-footer-contact" className="flex min-h-11 items-center transition-colors hover:text-[hsl(var(--primary))]">Contact</Link></li>
                <li><Link href="/privacy" data-testid="link-footer-privacy" className="flex min-h-11 items-center transition-colors hover:text-[hsl(var(--primary))]">Privacy &amp; Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-base font-bold tracking-[-.02em] text-[hsl(var(--foreground))]">Popular Use Cases</h3>
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
                {toolFooterColumns.map((col, c) => (
                  <ul key={c} className="space-y-2">
                    {col.map((tool) => (
                      <li key={tool.slug}>
                        <a
                          href={`/tools/${tool.slug}`}
                          data-testid={`footer-tool-${tool.slug}`}
                          className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]"
                        >
                          <FileText size={13} className="shrink-0 text-[hsl(var(--accent))]" />
                          <span className="border-b border-transparent transition-colors group-hover:border-[hsl(var(--accent))]">{tool.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
            </nav>
          </div>
          <div className="mt-12 border-t border-[hsl(var(--border))] pt-6">
            <p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">No account . No uploads . No noise</p>
          </div>
        </div>
        </div>
      </footer>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="app-noise min-h-[100dvh]"><Header />{children}<Footer /></div>;
}

function Button({ children, onClick, variant = 'primary', type = 'button', className = '', disabled = false, testId }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'quiet' | 'outline' | 'accent'; type?: 'button' | 'submit'; className?: string; disabled?: boolean; testId?: string }) {
  const styles = {
    primary: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110',
    quiet: 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]',
    outline: 'border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/.5)] hover:bg-[hsl(var(--secondary)/.45)]',
    accent: 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:brightness-105',
  };
  return <button type={type} onClick={onClick} disabled={disabled} data-testid={testId} className={`btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-[0_2px_0_hsl(var(--shadow-color)/.12)] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}>{children}</button>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="max-w-2xl"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">{eyebrow}</p><h2 className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-.045em] md:text-4xl">{title}</h2>{description && <p className="mt-4 text-base leading-7 text-[hsl(var(--muted-foreground))]">{description}</p>}</div>;
}

function ToolCard({ id, number }: { id: ToolId; number: string }) {
  const tool = toolMeta[id];
  const Icon = tool.icon;
  return <Link href={tool.path} data-testid={`card-tool-${id}`} className={`tool-card group relative overflow-hidden rounded-[1.35rem] border border-[hsl(var(--border))] ${tool.tint} p-6 md:p-7`}>
    <div className="flex items-start justify-between"><span className="font-mono-ui text-[11px] font-bold text-[hsl(var(--muted-foreground))]">{number}</span><span className="grid size-10 place-items-center rounded-full bg-[hsl(var(--card)/.72)] text-[hsl(var(--primary))]"><Icon size={19} /></span></div>
    <h3 className="mt-8 font-display text-2xl font-bold tracking-[-.035em]">{tool.title}</h3><p className="mt-3 max-w-[17rem] text-sm leading-6 text-[hsl(var(--muted-foreground))]">{tool.description}</p>
    <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-[hsl(var(--primary))]">Open tool <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
    <span className="pointer-events-none absolute -bottom-10 -right-8 size-28 rounded-full border-[14px] border-[hsl(var(--card)/.32)]" />
  </Link>;
}

function Home() {
  const content = useOfficeToolkitContent();
  const latestPosts = content.blogPosts.filter((post) => post.published !== false).slice(0, 3);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return <PageMeta title="Free Invoice and E-signature Tool – Online Office Tools, No Signup" description="A free invoice and e-signature tool that runs in your browser — no signup, no uploads. Draw or type a signature, build a GST invoice, and export instantly. Simple online office tools for a calmer workday." image="/og/home.png">
    <main>
      <JsonLd id="site-website" data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Office Toolkit',
        url: `${origin}/`,
        description: 'Free e-signature and invoice tools that run privately in your browser — no account, no uploads, no data harvesting.',
      }} />
      <JsonLd id="site-organization" data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Office Toolkit',
        url: `${origin}/`,
        logo: `${origin}/logo.png`,
        email: 'hello@officetoolkit.app',
      }} />
      <section className="relative overflow-hidden border-b border-[hsl(var(--border))]">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 pb-16 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/.2)] bg-[hsl(var(--secondary)/.5)] px-3 py-1.5 font-mono-ui text-[10px] font-bold uppercase tracking-[.13em] text-[hsl(var(--primary))]"><span className="size-1.5 rounded-full bg-[hsl(var(--accent))]" /> A calmer workday starts here</div>
            <h1 className="max-w-2xl font-display text-[3.65rem] font-bold leading-[.94] tracking-[-.065em] sm:text-6xl lg:text-[5.7rem]">Free invoice and e-signature tool.<br /><span className="text-[hsl(var(--primary))]">Small tools, clear head.</span></h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[hsl(var(--muted-foreground))]">The useful little things your workday needs — a free invoice and e-signature tool, with no logins, no data harvesting, and no twelve-step tour.</p>
            <p className="mt-4 max-w-lg text-base leading-7 text-[hsl(var(--muted-foreground))]">Sign a document in minutes, or send a clean invoice before the call ends. This free e-signature maker and GST invoice generator run entirely in your browser — no account needed. Every tool opens ready to work, finishes one job properly, and then stays out of your way until you need it again.</p>
            <p className="mt-4 max-w-lg text-base leading-7 text-[hsl(var(--muted-foreground))]">Office Toolkit is built around a simple trade: you give us nothing, and the thing you came for happens fast. No password reset flows, no storage quota, no upgrade pop-ups — just a tool that opens, does the job, and hands you a file you can send, print, or file away.</p>
            <p className="mt-4 max-w-lg text-base leading-7 text-[hsl(var(--muted-foreground))]">The two makers at the heart of the toolkit cover the paperwork that follows almost every piece of work — getting your name on a document and getting your invoice paid. Both are small enough to matter every single day, and simple enough that you never need to look anything up.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/e-signature-maker" data-testid="link-home-start" className="btn-press inline-flex min-h-11 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-[0_3px_0_hsl(var(--shadow-color)/.16)]">Start with a signature <ArrowRight size={17} /></Link><a href="#tools" data-testid="link-home-tools" className="inline-flex min-h-11 items-center px-3 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">See all tools</a></div>
            <div className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-[hsl(var(--muted-foreground))]"><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[hsl(var(--primary))]" /> Private by default</span><span className="flex items-center gap-2"><Zap size={15} className="text-[hsl(var(--accent-foreground))]" /> Instant in your browser</span></div>
          </div>
          <div className="relative">
            <div className="paper-shadow rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-5"><div className="flex gap-1.5"><i className="size-2.5 rounded-full bg-[hsl(var(--accent))]" /><i className="size-2.5 rounded-full bg-[hsl(var(--secondary))]" /><i className="size-2.5 rounded-full bg-[hsl(var(--primary)/.35)]" /></div><span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">How it works</span></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[hsl(var(--secondary)/.5)] p-5"><span className="grid size-9 place-items-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Hand size={16} /></span><h2 className="mt-4 font-display text-lg font-bold leading-tight">Create</h2><p className="mt-1.5 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Draw, type, upload, or fill in your own details.</p></div>
                <div className="rounded-2xl bg-[hsl(var(--secondary)/.5)] p-5"><span className="grid size-9 place-items-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"><Check size={16} /></span><h2 className="mt-4 font-display text-lg font-bold leading-tight">Preview</h2><p className="mt-1.5 text-xs leading-5 text-[hsl(var(--muted-foreground))]">See a live, polished preview that updates as you type.</p></div>
                <div className="rounded-2xl bg-[hsl(var(--secondary)/.5)] p-5"><span className="grid size-9 place-items-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Download size={16} /></span><h2 className="mt-4 font-display text-lg font-bold leading-tight">Export</h2><p className="mt-1.5 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Download a finished PNG, JPG, or PDF in one click.</p></div>
              </div>
              <div className="mt-5 rounded-2xl border border-dashed border-[hsl(var(--primary)/.4)] bg-[hsl(var(--secondary)/.4)] p-5"><div className="flex items-center gap-3"><ShieldCheck className="text-[hsl(var(--primary))]" /><p className="text-sm font-bold">Everything stays on your device.</p></div><p className="mt-1.5 text-xs leading-5 text-[hsl(var(--muted-foreground))]">No accounts, no uploads, no data harvesting. Your work is local-first and leaves your browser only when you choose to save a file.</p></div>
            </div>
          </div>
        </div>
      </section>
      <section id="tools" className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
        <SectionHeading eyebrow="Two things, done well" title="Two free online tools, no signup, done well" description="Built for the in-between moments: a client needs an invoice, and a document needs your name on it." />
        <div className="mt-12 grid gap-6 md:grid-cols-2"><ToolCard id="signature" number="01 / SIGN" /><ToolCard id="invoice" number="02 / BILL" /></div>
        <p className="mt-12 max-w-2xl text-base leading-7 text-[hsl(var(--muted-foreground))]">Both tools were designed together and share one rulebook: open instantly, skip the account screen, keep everything on this device, and end with a finished file. The tools differ in what they make, not in how they treat you — if you can use one, you already know how to use the other.</p>
      </section>
      <section className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-24"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--accent))]">The quiet promise</p><h2 className="mt-4 max-w-md font-display text-4xl font-bold leading-[1] tracking-[-.05em]">Your work stays yours.</h2></div><div className="grid gap-7 sm:grid-cols-3">{[['01', 'No account', 'Open a tool and get to work. There is no profile to create or password to forget.'], ['02', 'Local first', 'Your files and drafts live in this browser. We do not route them through a server.'], ['03', 'Useful output', 'Export a polished file that works outside this tab — PNG, PDF, or JSON.']].map(([n, h, p]) => <div key={n} className="border-l border-[hsl(var(--primary-foreground)/.22)] pl-4"><span className="font-mono-ui text-[10px] text-[hsl(var(--accent))]">{n}</span><h3 className="mt-4 font-display text-xl font-bold">{h}</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--primary-foreground)/.7)]">{p}</p></div>)}</div></div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24"><div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><SectionHeading eyebrow="Made for real life" title="A little less admin. A little more done." description="Small by design: each tool finishes one job and then gets out of the way, whether you run a studio, take on side projects, or simply answer for the paperwork nobody else remembers. Most days that paperwork is a signature or an invoice, and neither needs a heavy application. These tools live in the gap between your work and a finished file — easy to ignore until you need them, and quick enough that using them never feels like a project." /><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><BriefcaseBusiness className="text-[hsl(var(--primary))]" /><h3 className="mt-6 font-display text-xl font-bold">For the one-person office</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">The freelancer, the operator, the person who is both HR and accounts receivable.</p></div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><Laptop className="text-[hsl(var(--primary))]" /><h3 className="mt-6 font-display text-xl font-bold">For the workday in motion</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Use it from a borrowed laptop, a kitchen table, or the last ten minutes before a call.</p></div></div></div></section>
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="The journal" title="Notes worth keeping." description="Short, plainspoken guides on invoices, e-signatures, and the work in between — nothing to sign up for." />
          <Link href="/blog" data-testid="link-home-blog" className="btn-press inline-flex min-h-11 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-[0_3px_0_hsl(var(--shadow-color)/.16)]">Read the blog <ArrowRight size={17} /></Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {latestPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="tool-card group relative flex flex-col rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
              <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--primary))]">{post.category}</span>
              <h3 className="mt-8 font-display text-2xl font-bold leading-tight tracking-[-.04em] group-hover:text-[hsl(var(--primary))]">{post.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{post.excerpt}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-[hsl(var(--primary))]">Read note <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  </PageMeta>;
}

function ToolIntro({ id, children }: { id: ToolId; children?: ReactNode }) {
  const tool = toolMeta[id];
  const Icon = tool.icon;
  return <div className="mx-auto max-w-6xl px-5 pb-8 pt-12 lg:px-8 lg:pt-16"><nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5"><a href="/" className="inline-flex min-h-11 items-center font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]">Home</a><ChevronRight size={13} className="text-[hsl(var(--muted-foreground))] opacity-60" /><span aria-current="page" className="inline-flex min-h-11 items-center font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--primary))]">{tool.title}</span></nav><div className="flex items-center gap-3 text-[hsl(var(--primary))]"><span className="grid size-10 place-items-center rounded-xl bg-[hsl(var(--secondary))]"><Icon size={19} /></span><span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em]">{tool.eyebrow}</span></div><div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h1 className="font-display text-4xl font-bold tracking-[-.055em] md:text-6xl">{tool.title}</h1><p className="mt-4 max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))]">{tool.description}</p><p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Everything runs locally in your browser tab. There is no account to create, no file to upload, and no server round-trip, so your work stays on your device until you choose to export a finished file.</p><p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">You will not find a paywall, a watermark, or a nagging upgrade prompt on the finish line. The maker is there to do one thing well, and when it is done the file is yours — no account required, no marketing email required, no calendar invitation required.</p><p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Everything you type, draw, or upload for this task is processed right here in this tab. That makes the tool fast, offline-friendly, and private. Refreshing the page starts you fresh, so export the file you want to keep before you close the window.</p></div>{children}</div></div>;
}

function Field({ label, value, onChange, placeholder, type = 'text', testId, className = '' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; testId: string; className?: string }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} data-testid={testId} className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm outline-none transition-shadow placeholder:text-[hsl(var(--muted-foreground)/.65)] focus:ring-2 focus:ring-[hsl(var(--ring)/.25)]" /></label>;
}

function FAQ({ items }: { items: [string, string][] }) {
  const [active, setActive] = useState<number | null>(null);
  return <div className="divide-y divide-[hsl(var(--border))] border-y border-[hsl(var(--border))]">{items.map(([q, a], i) => <div key={q}><button type="button" onClick={() => setActive(active === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-bold" data-testid={`button-faq-${i}`}><span>{q}</span><ChevronDown size={17} className={`shrink-0 text-[hsl(var(--primary))] transition-transform ${active === i ? 'rotate-180' : ''}`} /></button>{active === i && <p className="faq-answer max-w-2xl pb-5 pr-8 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{a}</p>}</div>)}</div>;
}

function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 500); }
function downloadText(text: string, filename: string, type = 'text/plain') { downloadBlob(new Blob([text], { type }), filename); }

function createTextPdf(title: string, lines: string[]) {
  const safe = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const visible = [title, '', ...lines].flatMap((line) => line.length > 96 ? [line.slice(0, 96), line.slice(96)] : [line]).slice(0, 46);
  const content = ['BT', '/F1 18 Tf', '50 742 Td', `(${safe(visible[0])}) Tj`, '/F1 10 Tf', ...visible.slice(1).map((line) => `0 -16 Td (${safe(line)}) Tj`), 'ET'].join('\n');
  const objects = [`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`, `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`, `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj`, `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`, `5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`];
  let pdf = '%PDF-1.4\n'; const offsets = [0]; objects.forEach((obj) => { offsets.push(pdf.length); pdf += `${obj}\n`; }); const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`; offsets.slice(1).forEach((o) => { pdf += `${String(o).padStart(10, '0')} 00000 n \n`; }); pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`; return new Blob([pdf], { type: 'application/pdf' });
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 10) {
  const words = text.split(/\s+/);
  let line = '';
  let lineCount = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = word;
      lineCount += 1;
      if (lineCount >= maxLines) return y + lineCount * lineHeight;
    } else {
      line = next;
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, y + lineCount * lineHeight);
    lineCount += 1;
  }
  return y + lineCount * lineHeight;
}

function createImagePdf(canvas: HTMLCanvasElement) {
  const jpeg = canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
  const imageBytes = Uint8Array.from(atob(jpeg), (char) => char.charCodeAt(0));
  const pageWidth = 612;
  const pageHeight = Math.max(792, Math.round(pageWidth * canvas.height / canvas.width));
  const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ`;
  const encoder = new TextEncoder();
  const objectBodies: Array<string | Uint8Array> = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 6 0 R >> >> /Contents 5 0 R >>`,
    '<< /Length 0 >>\nstream\n\nendstream',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    new Uint8Array([...encoder.encode(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`), ...imageBytes]),
  ];
  const parts: Uint8Array[] = [encoder.encode('%PDF-1.4\n')];
  const offsets = [0];
  let length = parts[0].length;
  objectBodies.forEach((body, index) => {
    offsets.push(length);
    const opening = encoder.encode(`${index + 1} 0 obj\n`);
    parts.push(opening);
    length += opening.length;
    if (body instanceof Uint8Array) {
      parts.push(body);
      length += body.length;
      const closing = encoder.encode('\nendstream\nendobj\n');
      parts.push(closing);
      length += closing.length;
    } else {
      const bytes = encoder.encode(`${body}\nendobj\n`);
      parts.push(bytes);
      length += bytes.length;
    }
  });
  const xrefOffset = length;
  const xref = [`xref\n0 ${objectBodies.length + 1}`, '0000000000 65535 f '];
  offsets.slice(1).forEach((offset) => xref.push(`${String(offset).padStart(10, '0')} 00000 n `));
  xref.push(`trailer\n<< /Size ${objectBodies.length + 1} /Root 1 0 R >>`, `startxref\n${xrefOffset}`, '%%EOF');
  parts.push(encoder.encode(`${xref.join('\n')}\n`));
  return new Blob(parts as unknown as BlobPart[], { type: 'application/pdf' });
}

function saveCanvas(canvas: HTMLCanvasElement, name: string, format: 'png' | 'jpg' | 'webp' | 'pdf') {
  if (format === 'pdf') {
    downloadBlob(createImagePdf(canvas), `${name}.pdf`);
    return;
  }
  const extension = format === 'jpg' ? 'jpg' : format;
  const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  canvas.toBlob((blob) => blob && downloadBlob(blob, `${name}.${extension}`), mime, 0.94);
}

function hexRgb(hex: string) {
  const value = hex.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16) || 23,
    g: Number.parseInt(value.slice(2, 4), 16) || 61,
    b: Number.parseInt(value.slice(4, 6), 16) || 58,
  };
}

function processSignatureImage(file: File, color: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 420;
      const ctx = canvas.getContext('2d')!;
      const scale = Math.min(1080 / image.width, 330 / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      ctx.drawImage(image, (1200 - width) / 2, (420 - height) / 2, width, height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const rgb = hexRgb(color);
      for (let index = 0; index < pixels.data.length; index += 4) {
        const luminance = (pixels.data[index] * 0.299) + (pixels.data[index + 1] * 0.587) + (pixels.data[index + 2] * 0.114);
        const ink = Math.max(0, Math.min(255, (255 - luminance) * 2.4));
        pixels.data[index] = rgb.r;
        pixels.data[index + 1] = rgb.g;
        pixels.data[index + 2] = rgb.b;
        pixels.data[index + 3] = Math.round(ink);
      }
      ctx.putImageData(pixels, 0, 0);
      resolve(canvas.toDataURL('image/png'));
      URL.revokeObjectURL(image.src);
    };
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

function saveSignatureDataUrl(dataUrl: string, name: string, format: 'png' | 'jpg' | 'webp' | 'pdf') {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 420;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fffdf8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    saveCanvas(canvas, name, format);
  };
  image.src = dataUrl;
}

function renderInvoiceCanvas(input: { business: string; client: string; email: string; number: string; date: string; due: string; tax: string; notes: string; symbol: string; currencyName: string; items: LineItem[]; subtotal: number; taxAmount: number; total: number }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d')!;
  const money = (value: number) => `${input.symbol}${value.toFixed(2)}`;
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#173d3a';
  ctx.font = '700 46px Arial';
  ctx.fillText(input.business || 'Your business', 90, 120);
  ctx.textAlign = 'right';
  ctx.font = '700 15px monospace';
  ctx.fillText('INVOICE', 1110, 90);
  ctx.font = '700 24px Arial';
  ctx.fillText(input.number || 'INV-000', 1110, 126);
  ctx.textAlign = 'left';
  ctx.fillRect(90, 170, 1020, 4);
  ctx.fillStyle = '#55706b';
  ctx.font = '700 14px monospace';
  ctx.fillText('BILLED TO', 90, 245);
  ctx.fillStyle = '#173d3a';
  ctx.font = '700 23px Arial';
  ctx.fillText(input.client || 'Client name', 90, 280);
  ctx.fillStyle = '#55706b';
  ctx.font = '18px Arial';
  ctx.fillText(input.email, 90, 314);
  ctx.textAlign = 'right';
  ctx.fillText(`Issued  ${input.date}`, 1110, 270);
  ctx.fillText(`Due  ${input.due}`, 1110, 304);
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#b8cbc5';
  ctx.beginPath();
  ctx.moveTo(90, 370);
  ctx.lineTo(1110, 370);
  ctx.stroke();
  ctx.fillStyle = '#55706b';
  ctx.font = '700 14px monospace';
  ctx.fillText('ITEM', 90, 405);
  ctx.fillText('QTY', 860, 405);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', 1110, 405);
  ctx.textAlign = 'left';
  let y = 455;
  input.items.forEach((item) => {
    ctx.strokeStyle = '#dce5e0';
    ctx.beginPath();
    ctx.moveTo(90, y - 28);
    ctx.lineTo(1110, y - 28);
    ctx.stroke();
    ctx.fillStyle = '#173d3a';
    ctx.font = '20px Arial';
    ctx.fillText(item.description || 'Line item', 90, y);
    ctx.fillText(item.qty || '0', 860, y);
    ctx.textAlign = 'right';
    ctx.fillText(money(Number(item.qty || 0) * Number(item.rate || 0)), 1110, y);
    ctx.textAlign = 'left';
    y += 65;
  });
  y += 45;
  ctx.strokeStyle = '#b8cbc5';
  ctx.beginPath();
  ctx.moveTo(760, y - 30);
  ctx.lineTo(1110, y - 30);
  ctx.stroke();
  ctx.fillStyle = '#55706b';
  ctx.font = '18px Arial';
  ctx.fillText('Subtotal', 760, y);
  ctx.textAlign = 'right';
  ctx.fillText(money(input.subtotal), 1110, y);
  ctx.textAlign = 'left';
  ctx.fillText(`Tax (${input.tax || 0}%)`, 760, y + 45);
  ctx.textAlign = 'right';
  ctx.fillText(money(input.taxAmount), 1110, y + 45);
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#173d3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(760, y + 75);
  ctx.lineTo(1110, y + 75);
  ctx.stroke();
  ctx.fillStyle = '#173d3a';
  ctx.font = '700 22px Arial';
  ctx.fillText('Total due', 760, y + 120);
  ctx.textAlign = 'right';
  ctx.fillText(money(input.total), 1110, y + 120);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#55706b';
  ctx.font = '16px Arial';
  drawWrappedText(ctx, input.notes, 90, 1380, 1020, 25, 3);
  return canvas;
}
function SignatureCanvas({ color, canvasRef: externalRef }: { color: string; canvasRef?: React.RefObject<HTMLCanvasElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ref = externalRef ?? canvasRef;
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const clear = () => { const canvas = ref.current; if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); };
  const point = (e: PointerEvent<HTMLCanvasElement>) => { const canvas = ref.current!; const rect = canvas.getBoundingClientRect(); return { x: (e.clientX - rect.left) * canvas.width / rect.width, y: (e.clientY - rect.top) * canvas.height / rect.height }; };
  const down = (e: PointerEvent<HTMLCanvasElement>) => { drawing.current = true; last.current = point(e); ref.current?.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent<HTMLCanvasElement>) => { if (!drawing.current) return; const canvas = ref.current!; const ctx = canvas.getContext('2d')!; const p = point(e); ctx.strokeStyle = color; ctx.lineWidth = 3.1; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last.current = p; };
  const up = () => { drawing.current = false; };
  return <div><div className="grid-paper relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"><canvas ref={ref} width={900} height={340} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} className="signature-canvas block h-[245px] w-full md:h-[315px]" data-testid="canvas-signature" /><span className="pointer-events-none absolute bottom-9 left-8 right-8 border-b border-[hsl(var(--primary)/.3)]" /><span className="pointer-events-none absolute bottom-3 left-8 font-mono-ui text-[9px] uppercase tracking-[.13em] text-[hsl(var(--muted-foreground))]">Sign above</span></div><div className="mt-3"><Button variant="quiet" onClick={clear} testId="button-clear-signature"><RotateCcw size={15} /> Clear</Button></div></div>;
}

type LineItem = { id: number; description: string; qty: string; rate: string };
function InvoiceGeneratorLegacy() {
  const [business, setBusiness] = useState('North Star Studio');
  const [client, setClient] = useState('Harbor & Pine');
  const [email, setEmail] = useState('hello@northstar.studio');
  const [number, setNumber] = useState('INV-2025-014');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [due, setDue] = useState('2025-06-30');
  const [tax, setTax] = useState('8.25');
  const [notes, setNotes] = useState('Thank you for working together.');
  const [template, setTemplate] = useState<'signal' | 'ledger' | 'plain'>('signal');
  const [logo, setLogo] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ id: 1, description: 'Brand strategy sprint', qty: '1', rate: '1250' }, { id: 2, description: 'Design system handoff', qty: '4', rate: '180' }]);
  const subtotal = useMemo(() => items.reduce((sum, x) => sum + Number(x.qty || 0) * Number(x.rate || 0), 0), [items]);
  const taxAmount = subtotal * Number(tax || 0) / 100;
  const total = subtotal + taxAmount;
  const updateItem = (id: number, key: keyof LineItem, value: string) => setItems(items.map((item) => item.id === id ? { ...item, [key]: value } : item));
  const addItem = () => setItems([...items, { id: Date.now(), description: '', qty: '1', rate: '0' }]);
  const exportPdf = () => downloadBlob(createTextPdf(`INVOICE ${number}`, [business, `Bill to: ${client}`, `Email: ${email}`, `Date: ${date}   Due: ${due}`, '', ...items.map((x) => `${x.description || 'Line item'} — ${x.qty} Ã— $${Number(x.rate || 0).toFixed(2)}`), '', `Subtotal: $${subtotal.toFixed(2)}`, `Tax (${tax}%): $${taxAmount.toFixed(2)}`, `Total due: $${total.toFixed(2)}`, '', notes]), `${number || 'invoice'}.pdf`);
  const uploadLogo = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setLogo(String(reader.result)); reader.readAsDataURL(file); };
  return <PageMeta title="Invoice generator" description="Create a polished invoice with line items, tax, logo upload, live preview, and PDF export. Everything stays local."><main><ToolIntro id="invoice"><span className="hidden items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] md:flex"><ShieldCheck size={15} className="text-[hsl(var(--primary))]" /> Local-only draft</span></ToolIntro><div className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-[.93fr_1.07fr] lg:px-8"><section className="space-y-5"><div className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-xl font-bold">GST invoice details</h2><span className="font-mono-ui text-[10px] text-[hsl(var(--muted-foreground))]">01 / 03</span></div><div className="grid gap-4 sm:grid-cols-2"><Field label="From" value={business} onChange={setBusiness} testId="input-invoice-business" /><Field label="Bill to" value={client} onChange={setClient} testId="input-invoice-client" /><Field label="Client email" value={email} onChange={setEmail} type="email" testId="input-invoice-email" /><Field label="Invoice number" value={number} onChange={setNumber} testId="input-invoice-number" /><Field label="Issue date" value={date} onChange={setDate} type="date" testId="input-invoice-date" /><Field label="Due date" value={due} onChange={setDue} type="date" testId="input-invoice-due" /></div><div className="mt-5 flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[hsl(var(--primary)/.4)] px-3 py-2 text-xs font-bold text-[hsl(var(--primary))]"><Upload size={15} /> {logo ? 'Replace logo' : 'Add logo'}<input type="file" accept="image/*" className="sr-only" onChange={(e) => uploadLogo(e.target.files?.[0])} data-testid="input-invoice-logo" /></label>{logo && <button type="button" onClick={() => setLogo('')} className="text-xs font-bold text-[hsl(var(--muted-foreground))]" data-testid="button-remove-logo">Remove</button>}</div></div><div className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Line items</h2><Button variant="quiet" onClick={addItem} testId="button-add-line-item"><Plus size={15} /> Add line</Button></div><div className="hidden grid-cols-[1fr_70px_100px_32px] gap-2 px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] sm:grid"><span>Description</span><span>Qty</span><span>Rate</span><span /></div><div className="space-y-2">{items.map((item, index) => <div key={item.id} className="grid gap-2 rounded-xl bg-[hsl(var(--muted)/.45)] p-2 sm:grid-cols-[1fr_70px_100px_32px] sm:bg-transparent sm:p-0"><input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="What did you do?" className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" data-testid={`input-line-description-${index}`} /><input value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} type="number" min="0" className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" data-testid={`input-line-qty-${index}`} /><input value={item.rate} onChange={(e) => updateItem(item.id, 'rate', e.target.value)} type="number" min="0" className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" data-testid={`input-line-rate-${index}`} /><button type="button" onClick={() => setItems(items.filter((x) => x.id !== item.id))} className="grid size-10 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/.1)] hover:text-[hsl(var(--destructive))]" aria-label="Remove line item" data-testid={`button-remove-line-${index}`}><Trash2 size={15} /></button></div>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-[1fr_120px]"><label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Note</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="h-20 w-full resize-none rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] p-3 text-sm" data-testid="textarea-invoice-notes" /></label><Field label="Tax %" value={tax} onChange={setTax} type="number" testId="input-invoice-tax" /></div></div><div className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6"><h2 className="font-display text-xl font-bold">Choose a look</h2><div className="mt-4 grid grid-cols-3 gap-2">{(['signal', 'ledger', 'plain'] as const).map((x) => <button type="button" key={x} onClick={() => setTemplate(x)} className={`rounded-xl border p-3 text-left ${template === x ? 'border-[hsl(var(--primary))] bg-[hsl(var(--secondary)/.6)]' : 'border-[hsl(var(--border))]'}`} data-testid={`button-template-${x}`}><span className={`mb-3 block h-1.5 rounded-full ${x === 'signal' ? 'bg-[hsl(var(--primary))]' : x === 'ledger' ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--foreground))]'}`} /><span className="text-xs font-bold capitalize">{x}</span></button>)}</div></div></section><section className="lg:sticky lg:top-[96px] lg:self-start"><div className="mb-3 flex items-center justify-between"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Live preview</p><Button variant="outline" onClick={exportPdf} testId="button-download-invoice"><Download size={15} /> Download PDF</Button></div><div className={`paper-shadow min-h-[620px] rounded-[.4rem] border border-[hsl(var(--border))] bg-[#fffdf8] p-7 text-[#173d3a] md:p-10 ${template === 'plain' ? 'font-sans' : ''}`} data-testid="preview-invoice"><div className="flex items-start justify-between border-b-2 border-[#173d3a] pb-9">{logo ? <img src={logo} alt="Uploaded business logo" className="max-h-14 max-w-[130px] object-contain" data-testid="img-invoice-logo" /> : <div><div className="mb-2 h-3 w-28 rounded bg-[#173d3a]" /><p className="text-xs text-[#55706b]">{business || 'Your business'}</p></div>}<div className="text-right"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[#55706b]">Invoice</p><p className="mt-2 text-sm font-bold">{number || 'INV-000'}</p></div></div><div className="flex justify-between gap-5 py-8 text-sm"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#55706b]">Billed to</p><p className="font-bold">{client || 'Client name'}</p><p className="mt-1 text-[#55706b]">{email}</p></div><div className="text-right text-xs"><p><span className="text-[#55706b]">Issued </span>{date}</p><p className="mt-2"><span className="text-[#55706b]">Due </span>{due}</p></div></div><div className="border-t border-[#b8cbc5] pt-3"><div className="mb-2 grid grid-cols-[1fr_55px_85px] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-[#55706b]"><span>Item</span><span>Qty</span><span className="text-right">Amount</span></div>{items.map((item) => <div key={item.id} className="grid grid-cols-[1fr_55px_85px] gap-2 border-t border-[#dce5e0] py-4 text-sm"><span className="font-medium">{item.description || 'Line item'}</span><span>{item.qty || 0}</span><span className="text-right">${(Number(item.qty || 0) * Number(item.rate || 0)).toFixed(2)}</span></div>)}</div><div className="ml-auto mt-8 max-w-[225px] space-y-3 border-t border-[#b8cbc5] pt-4 text-sm"><div className="flex justify-between"><span className="text-[#55706b]">Subtotal</span><span>${subtotal.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-[#55706b]">Tax ({tax || 0}%)</span><span>${taxAmount.toFixed(2)}</span></div><div className="flex justify-between border-t-2 border-[#173d3a] pt-3 text-base font-bold"><span>Total due</span><span>${total.toFixed(2)}</span></div></div><p className="mt-16 border-t border-[#dce5e0] pt-4 text-xs text-[#55706b]">{notes}</p></div></section></div><InfoSection title="A good invoice answers the next question" intro="A clean invoice is less about looking official and more about removing uncertainty. Put the who, what, when, and how much where a client can find them in one glance." bullets={['Give each invoice a simple, memorable number so conversations stay easy.', 'Use a due date rather than "net 30" alone. Specific dates reduce back-and-forth.', 'Keep line items plainspoken. A client should understand what they are paying for without decoding your process.']} faq={[['Does the invoice save automatically?', 'The form lives in the current browser tab. Nothing is sent to a server, and closing the tab clears the draft unless you save the exported PDF yourself.'], ['Can I add a logo?', 'Yes. Choose an image from your device. It is read locally and shown only in the preview and exported file.'], ['How is tax calculated?', 'Tax is applied to the subtotal of quantity multiplied by rate for each line item. You can set the percentage to zero.']]} /></main></PageMeta>;
}

function InvoiceGeneratorLegacyWithCurrency() {
  const content = useOfficeToolkitContent();
  const [business, setBusiness] = useState('North Star Studio');
  const [client, setClient] = useState('Harbor & Pine');
  const [email, setEmail] = useState('hello@northstar.studio');
  const [number, setNumber] = useState('INV-2025-014');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [due, setDue] = useState('2025-06-30');
  const [tax, setTax] = useState('8.25');
  const [notes, setNotes] = useState('Thank you for working together.');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [template, setTemplate] = useState<'signal' | 'ledger' | 'plain'>('signal');
  const [logo, setLogo] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ id: 1, description: 'Brand strategy sprint', qty: '1', rate: '1250' }, { id: 2, description: 'Design system handoff', qty: '4', rate: '180' }]);
  const currency = content.currencies.find((item) => item.code === currencyCode) ?? content.currencies[0];
  const symbol = currency?.symbol ?? 'â‚¹';
  const subtotal = useMemo(() => items.reduce((sum, x) => sum + Number(x.qty || 0) * Number(x.rate || 0), 0), [items]);
  const taxAmount = subtotal * Number(tax || 0) / 100;
  const total = subtotal + taxAmount;
  const updateItem = (id: number, key: keyof LineItem, value: string) => setItems(items.map((item) => item.id === id ? { ...item, [key]: value } : item));
  const addItem = () => setItems([...items, { id: Date.now(), description: '', qty: '1', rate: '0' }]);
  const formatMoney = (value: number) => `${symbol}${value.toFixed(2)}`;
  const exportPdf = () => downloadBlob(createTextPdf(`INVOICE ${number}`, [business, `Bill to: ${client}`, `Email: ${email}`, `Currency: ${currency?.name ?? currencyCode}`, `Date: ${date}   Due: ${due}`, '', ...items.map((x) => `${x.description || 'Line item'} — ${x.qty} Ã— ${formatMoney(Number(x.rate || 0))}`), '', `Subtotal: ${formatMoney(subtotal)}`, `Tax (${tax}%): ${formatMoney(taxAmount)}`, `Total due: ${formatMoney(total)}`, '', notes]), `${number || 'invoice'}.pdf`);
  const uploadLogo = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setLogo(String(reader.result)); reader.readAsDataURL(file); };
  return <PageMeta title="Invoice generator" description="Create a polished invoice with line items, tax, logo upload, live preview, and PDF export. Everything stays local."><main><ToolIntro id="invoice"><span className="hidden items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] md:flex"><ShieldCheck size={15} className="text-[hsl(var(--primary))]" /> Local-only draft</span></ToolIntro><div className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-[.93fr_1.07fr] lg:px-8"><section className="space-y-5"><div className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-xl font-bold">GST invoice details</h2><span className="font-mono-ui text-[10px] text-[hsl(var(--muted-foreground))]">01 / 03</span></div><div className="grid gap-4 sm:grid-cols-2"><Field label="From" value={business} onChange={setBusiness} testId="input-invoice-business" /><Field label="Bill to" value={client} onChange={setClient} testId="input-invoice-client" /><Field label="Client email" value={email} onChange={setEmail} type="email" testId="input-invoice-email" /><Field label="Invoice number" value={number} onChange={setNumber} testId="input-invoice-number" /><Field label="Issue date" value={date} onChange={setDate} type="date" testId="input-invoice-date" /><Field label="Due date" value={due} onChange={setDue} type="date" testId="input-invoice-due" /></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Currency</span><select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" data-testid="select-invoice-currency">{content.currencies.map((item) => <option key={item.code} value={item.code}>{item.symbol} {item.code} · {item.name}</option>)}</select></label><Field label="Tax %" value={tax} onChange={setTax} type="number" testId="input-invoice-tax" /></div><div className="mt-5 flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[hsl(var(--primary)/.4)] px-3 py-2 text-xs font-bold text-[hsl(var(--primary))]"><Upload size={15} /> {logo ? 'Replace logo' : 'Add logo'}<input type="file" accept="image/*" className="sr-only" onChange={(e) => uploadLogo(e.target.files?.[0])} data-testid="input-invoice-logo" /></label>{logo && <button type="button" onClick={() => setLogo('')} className="text-xs font-bold text-[hsl(var(--muted-foreground))]" data-testid="button-remove-logo">Remove</button>}</div></div><div className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Line items</h2><Button variant="quiet" onClick={addItem} testId="button-add-line-item"><Plus size={15} /> Add line</Button></div><div className="hidden grid-cols-[1fr_70px_100px_32px] gap-2 px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] sm:grid"><span>Description</span><span>Qty</span><span>Rate</span><span /></div><div className="space-y-2">{items.map((item, index) => <div key={item.id} className="grid gap-2 rounded-xl bg-[hsl(var(--muted)/.45)] p-2 sm:grid-cols-[1fr_70px_100px_32px] sm:bg-transparent sm:p-0"><input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="What did you do?" className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" data-testid={`input-line-description-${index}`} /><input value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} type="number" min="0" className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" data-testid={`input-line-qty-${index}`} /><input value={item.rate} onChange={(e) => updateItem(item.id, 'rate', e.target.value)} type="number" min="0" className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" data-testid={`input-line-rate-${index}`} /><button type="button" onClick={() => setItems(items.filter((x) => x.id !== item.id))} className="grid size-10 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/.1)] hover:text-[hsl(var(--destructive))]" aria-label="Remove line item" data-testid={`button-remove-line-${index}`}><Trash2 size={15} /></button></div>)}</div><div className="mt-5"><label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Note</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="h-20 w-full resize-none rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] p-3 text-sm" data-testid="textarea-invoice-notes" /></label></div></div><div className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6"><h2 className="font-display text-xl font-bold">Choose a look</h2><div className="mt-4 grid grid-cols-3 gap-2">{(['signal', 'ledger', 'plain'] as const).map((x) => <button type="button" key={x} onClick={() => setTemplate(x)} className={`rounded-xl border p-3 text-left ${template === x ? 'border-[hsl(var(--primary))] bg-[hsl(var(--secondary)/.6)]' : 'border-[hsl(var(--border))]'}`} data-testid={`button-template-${x}`}><span className={`mb-3 block h-1.5 rounded-full ${x === 'signal' ? 'bg-[hsl(var(--primary))]' : x === 'ledger' ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--foreground))]'}`} /><span className="text-xs font-bold capitalize">{x}</span></button>)}</div></div></section><section className="lg:sticky lg:top-[96px] lg:self-start"><div className="mb-3 flex items-center justify-between"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Live preview</p><Button variant="outline" onClick={exportPdf} testId="button-download-invoice"><Download size={15} /> Download PDF</Button></div><div className={`paper-shadow min-h-[620px] rounded-[.4rem] border border-[hsl(var(--border))] bg-[#fffdf8] p-7 text-[#173d3a] md:p-10 ${template === 'plain' ? 'font-sans' : ''}`} data-testid="preview-invoice"><div className="flex items-start justify-between border-b-2 border-[#173d3a] pb-9">{logo ? <img src={logo} alt="Uploaded business logo" className="max-h-14 max-w-[130px] object-contain" data-testid="img-invoice-logo" /> : <div><div className="mb-2 h-3 w-28 rounded bg-[#173d3a]" /><p className="text-xs text-[#55706b]">{business || 'Your business'}</p></div>}<div className="text-right"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[#55706b]">Invoice</p><p className="mt-2 text-sm font-bold">{number || 'INV-000'}</p></div></div><div className="flex justify-between gap-5 py-8 text-sm"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#55706b]">Billed to</p><p className="font-bold">{client || 'Client name'}</p><p className="mt-1 text-[#55706b]">{email}</p></div><div className="text-right text-xs"><p><span className="text-[#55706b]">Issued </span>{date}</p><p className="mt-2"><span className="text-[#55706b]">Due </span>{due}</p></div></div><div className="border-t border-[#b8cbc5] pt-3"><div className="mb-2 grid grid-cols-[1fr_55px_100px] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-[#55706b]"><span>Item</span><span>Qty</span><span className="text-right">Amount</span></div>{items.map((item) => <div key={item.id} className="grid grid-cols-[1fr_55px_100px] gap-2 border-t border-[#dce5e0] py-4 text-sm"><span className="font-medium">{item.description || 'Line item'}</span><span>{item.qty || 0}</span><span className="text-right">{formatMoney(Number(item.qty || 0) * Number(item.rate || 0))}</span></div>)}</div><div className="ml-auto mt-8 max-w-[245px] space-y-3 border-t border-[#b8cbc5] pt-4 text-sm"><div className="flex justify-between"><span className="text-[#55706b]">Subtotal</span><span>{formatMoney(subtotal)}</span></div><div className="flex justify-between"><span className="text-[#55706b]">Tax ({tax || 0}%)</span><span>{formatMoney(taxAmount)}</span></div><div className="flex justify-between border-t-2 border-[#173d3a] pt-3 text-base font-bold"><span>Total due</span><span>{formatMoney(total)}</span></div></div><p className="mt-16 border-t border-[#dce5e0] pt-4 text-xs text-[#55706b]">{notes}</p></div></section></div><InfoSection title="A good invoice answers the next question" intro="A clean invoice is less about looking official and more about removing uncertainty. Put the who, what, when, and how much where a client can find them in one glance." bullets={['Give each invoice a simple, memorable number so conversations stay easy.', 'Use a due date rather than "net 30" alone. Specific dates reduce back-and-forth.', 'Keep line items plainspoken. A client should understand what they are paying for without decoding your process.']} faq={[['Does the invoice save automatically?', 'The form lives in the current browser tab. Nothing is sent to a server, and closing the tab clears the draft unless you save the exported PDF yourself.'], ['Can I add a logo?', 'Yes. Choose an image from your device. It is read locally and shown only in the preview and exported file.'], ['How is tax calculated?', 'Tax is applied to the subtotal of quantity multiplied by rate for each line item. You can set the percentage to zero.']]} /></main></PageMeta>;
}

function InvoiceGenerator() {
  const content = useOfficeToolkitContent();
  const [business, setBusiness] = useState('North Star Studio');
  const [client, setClient] = useState('Harbor & Pine');
  const [email, setEmail] = useState('hello@northstar.studio');
  const [number, setNumber] = useState('INV-2025-014');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [due, setDue] = useState('2025-06-30');
  const [tax, setTax] = useState('8.25');
  const [notes, setNotes] = useState('Thank you for working together.');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [template, setTemplate] = useState<'signal' | 'ledger' | 'plain'>('signal');
  const [logo, setLogo] = useState('');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'pdf'>('pdf');
  const [items, setItems] = useState<LineItem[]>([{ id: 1, description: 'Brand strategy sprint', qty: '1', rate: '1250' }, { id: 2, description: 'Design system handoff', qty: '4', rate: '180' }]);
  const currency = content.currencies.find((item) => item.code === currencyCode) ?? content.currencies[0];
  const symbol = currency?.symbol ?? 'â‚¹';
  const subtotal = useMemo(() => items.reduce((sum, x) => sum + Number(x.qty || 0) * Number(x.rate || 0), 0), [items]);
  const taxAmount = subtotal * Number(tax || 0) / 100;
  const total = subtotal + taxAmount;
  const updateItem = (id: number, key: keyof LineItem, value: string) => setItems(items.map((item) => item.id === id ? { ...item, [key]: value } : item));
  const exportInvoice = () => saveCanvas(renderInvoiceCanvas({ business, client, email, number, date, due, tax, notes, symbol, currencyName: currency?.name ?? currencyCode, items, subtotal, taxAmount, total }), number || 'invoice', exportFormat);
  const uploadLogo = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setLogo(String(reader.result)); reader.readAsDataURL(file); };

  return <PageMeta title="Free Invoice Generator Online – GST Invoice, Tax & PDF Export" description="Free invoice generator online — create and download an invoice online free, with GST, tax, line items and your logo. No signup. Private, in your browser." image="/og/invoice.png"><main><JsonLd id="tool-software-main" data={{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Invoice Generator",
    description: "Free invoice generator online — create and download an invoice online free, with GST, tax, line items and your logo. No signup. Private, in your browser.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web browser",
    url: `${typeof window !== "undefined" ? window.location.origin : ""}/invoice-generator`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  }} /><ToolIntro id="invoice"><span className="hidden items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] md:flex"><ShieldCheck size={15} className="text-[hsl(var(--primary))]" /> Local-only draft</span></ToolIntro><div className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-[.93fr_1.07fr] lg:px-8"><section className="space-y-5"><div className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-xl font-bold">GST invoice details</h2><span className="font-mono-ui text-[10px] text-[hsl(var(--muted-foreground))]">01 / 03</span></div><div className="grid gap-4 sm:grid-cols-2"><Field label="From" value={business} onChange={setBusiness} testId="input-invoice-business" /><Field label="Bill to" value={client} onChange={setClient} testId="input-invoice-client" /><Field label="Client email" value={email} onChange={setEmail} type="email" testId="input-invoice-email" /><Field label="Invoice number" value={number} onChange={setNumber} testId="input-invoice-number" /><Field label="Issue date" value={date} onChange={setDate} type="date" testId="input-invoice-date" /><Field label="Due date" value={due} onChange={setDue} type="date" testId="input-invoice-due" /></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Currency</span><select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" data-testid="select-invoice-currency">{content.currencies.map((item) => <option key={item.code} value={item.code}>{item.symbol} {item.code} · {item.name}</option>)}</select></label><Field label="Tax %" value={tax} onChange={setTax} type="number" testId="input-invoice-tax" /></div><div className="mt-5 flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[hsl(var(--primary)/.4)] px-3 py-2 text-xs font-bold text-[hsl(var(--primary))]"><Upload size={15} /> {logo ? 'Replace logo' : 'Add logo'}<input type="file" accept="image/*" className="sr-only" onChange={(e) => uploadLogo(e.target.files?.[0])} data-testid="input-invoice-logo" /></label>{logo && <button type="button" onClick={() => setLogo('')} className="text-xs font-bold text-[hsl(var(--muted-foreground))]" data-testid="button-remove-logo">Remove</button>}</div></div><div className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Line items</h2><Button variant="quiet" onClick={() => setItems([...items, { id: Date.now(), description: '', qty: '1', rate: '0' }])} testId="button-add-line-item"><Plus size={15} /> Add line</Button></div><div className="space-y-2">{items.map((item, index) => <div key={item.id} className="grid gap-2 rounded-xl bg-[hsl(var(--muted)/.45)] p-2 sm:grid-cols-[1fr_70px_100px_32px] sm:bg-transparent sm:p-0"><input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="What did you do?" className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" data-testid={`input-line-description-${index}`} /><input value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} type="number" min="0" className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" data-testid={`input-line-qty-${index}`} /><input value={item.rate} onChange={(e) => updateItem(item.id, 'rate', e.target.value)} type="number" min="0" className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" data-testid={`input-line-rate-${index}`} /><button type="button" onClick={() => setItems(items.filter((x) => x.id !== item.id))} className="grid size-10 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/.1)] hover:text-[hsl(var(--destructive))]" aria-label="Remove line item" data-testid={`button-remove-line-${index}`}><Trash2 size={15} /></button></div>)}</div><div className="mt-5"><label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Note</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="h-20 w-full resize-none rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] p-3 text-sm" data-testid="textarea-invoice-notes" /></label></div></div><div className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6"><h2 className="font-display text-xl font-bold">Choose a look</h2><div className="mt-4 grid grid-cols-3 gap-2">{(['signal', 'ledger', 'plain'] as const).map((x) => <button type="button" key={x} onClick={() => setTemplate(x)} className={`rounded-xl border p-3 text-left ${template === x ? 'border-[hsl(var(--primary))] bg-[hsl(var(--secondary)/.6)]' : 'border-[hsl(var(--border))]'}`} data-testid={`button-template-${x}`}><span className={`mb-3 block h-1.5 rounded-full ${x === 'signal' ? 'bg-[hsl(var(--primary))]' : x === 'ledger' ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--foreground))]'}`} /><span className="text-xs font-bold capitalize">{x}</span></button>)}</div></div></section><section className="lg:sticky lg:top-[96px] lg:self-start"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Live preview</p><div className="flex items-center gap-2"><select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpg' | 'pdf')} className="h-10 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 text-xs font-bold" data-testid="select-invoice-export-format"><option value="pdf">PDF</option><option value="png">PNG</option><option value="jpg">JPG</option></select><Button variant="outline" onClick={exportInvoice} testId="button-download-invoice"><Download size={15} /> Download</Button></div></div><div className={`paper-shadow min-h-[620px] rounded-[.4rem] border border-[hsl(var(--border))] bg-[#fffdf8] p-7 text-[#173d3a] md:p-10 ${template === 'plain' ? 'font-sans' : ''}`} data-testid="preview-invoice"><div className="flex items-start justify-between border-b-2 border-[#173d3a] pb-9">{logo ? <img src={logo} alt="Uploaded business logo" className="max-h-14 max-w-[130px] object-contain" data-testid="img-invoice-logo" /> : <div><div className="mb-2 h-3 w-28 rounded bg-[#173d3a]" /><p className="text-xs text-[#55706b]">{business || 'Your business'}</p></div>}<div className="text-right"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[#55706b]">Invoice</p><p className="mt-2 text-sm font-bold">{number || 'INV-000'}</p></div></div><div className="flex justify-between gap-5 py-8 text-sm"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#55706b]">Billed to</p><p className="font-bold">{client || 'Client name'}</p><p className="mt-1 text-[#55706b]">{email}</p></div><div className="text-right text-xs"><p><span className="text-[#55706b]">Issued </span>{date}</p><p className="mt-2"><span className="text-[#55706b]">Due </span>{due}</p></div></div><div className="border-t border-[#b8cbc5] pt-3"><div className="mb-2 grid grid-cols-[1fr_55px_100px] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-[#55706b]"><span>Item</span><span>Qty</span><span className="text-right">Amount</span></div>{items.map((item) => <div key={item.id} className="grid grid-cols-[1fr_55px_100px] gap-2 border-t border-[#dce5e0] py-4 text-sm"><span className="font-medium">{item.description || 'Line item'}</span><span>{item.qty || 0}</span><span className="text-right">{`${symbol}${(Number(item.qty || 0) * Number(item.rate || 0)).toFixed(2)}`}</span></div>)}</div><div className="ml-auto mt-8 max-w-[245px] space-y-3 border-t border-[#b8cbc5] pt-4 text-sm"><div className="flex justify-between"><span className="text-[#55706b]">Subtotal</span><span>{`${symbol}${subtotal.toFixed(2)}`}</span></div><div className="flex justify-between"><span className="text-[#55706b]">Tax ({tax || 0}%)</span><span>{`${symbol}${taxAmount.toFixed(2)}`}</span></div><div className="flex justify-between border-t-2 border-[#173d3a] pt-3 text-base font-bold"><span>Total due</span><span>{`${symbol}${total.toFixed(2)}`}</span></div></div><p className="mt-16 border-t border-[#dce5e0] pt-4 text-xs text-[#55706b]">{notes}</p></div></section></div><InfoSection title="A good invoice answers the next question" intro="A clean invoice is less about looking official and more about removing uncertainty. Put the who, what, when, and how much where a client can find them in one glance." bullets={['Give each invoice a simple, memorable number so conversations stay easy.', 'Use a due date rather than "net 30" alone. Specific dates reduce back-and-forth.', 'Keep line items plainspoken. A client should understand what they are paying for without decoding your process.']} faq={[['Does the invoice save automatically?', 'The form lives in the current browser tab. Nothing is sent to a server, and closing the tab clears the draft unless you save the exported PDF yourself.'], ['Can I add a logo?', 'Yes. Choose an image from your device. It is read locally and shown only in the preview and exported file.'], ['Which formats can I download?', 'Use the format selector above the preview to download a visual invoice as PDF, PNG, or JPG.']]} /><YouMightAlsoNeed href="/e-signature-maker" title="E-signature Maker" category="esignature" tools={invoiceToolUseCases} /></main></PageMeta>;
}

function InfoSection({ title, intro, bullets, faq }: { title: string; intro: string; bullets: string[]; faq: [string, string][] }) {
  return <section className="mx-auto mt-16 max-w-6xl border-t border-[hsl(var(--border))] px-5 py-16 lg:px-8"><div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]"><div><SectionHeading eyebrow="A little context" title={title} description={intro} /><ul className="mt-7 space-y-4">{bullets.map((b) => <li key={b} className="flex gap-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]"><Check size={16} className="mt-1 shrink-0 text-[hsl(var(--primary))]" />{b}</li>)}</ul></div><div><div className="mb-4 flex items-center gap-2 text-[hsl(var(--primary))]"><CircleHelp size={17} /><span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em]">Questions, answered</span></div><FAQ items={faq} /></div></div></section>;
}

function About() {
  return <PageMeta title="About Us — Local-First Office Tools" description="Learn why Office Toolkit is a private, browser-first suite of free tools for signatures, invoices, and everyday paperwork. No account, no uploads, local-first." image="/og/default.png"><main><section className="border-b border-[hsl(var(--border))]"><div className="mx-auto max-w-6xl px-5 pb-16 pt-16 lg:px-8 lg:pb-24 lg:pt-24"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">The idea</p><h1 className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-[-.06em] md:text-7xl">Work has enough <span className="text-[hsl(var(--primary))]">friction already.</span></h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">Office Toolkit is a collection of focused, browser-first tools for the jobs that are too important to ignore and too small to deserve a new account.</p><p className="mt-4 max-w-2xl text-base leading-7 text-[hsl(var(--muted-foreground))]">The tools exist for the jobs nobody celebrates: the signature that makes an agreement real, the invoice that turns work into money, the few lines of plain English that make a document feel finished. These are small jobs with big consequences, and they deserve tools that are just as careful as they are quick.</p></div></section><section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24"><SectionHeading eyebrow="Our point of view" title="Useful beats impressive." /><div className="mt-8 max-w-2xl space-y-6 text-base leading-8 text-[hsl(var(--muted-foreground))]"><p>We made Office Toolkit for the edge of the workday: the invoice you forgot to send, the signature waiting at the bottom of a PDF.</p><p>Each tool is intentionally narrow. It does one job, gives you a usable file, and gets out of the way. There are no dashboards to maintain and no upgrade prompts hovering over the finish line.</p><p>It also means we treat your time as the thing that matters most. Screens show one job at a time, ask only for the details that matter, and end with a clear next step. What you do not see — dashboards, upsells, setup flows — is a feature, not something missing. A calmer tool quietly changes how the rest of the day feels.</p><p>We also believe a small team can keep a big tool simple. Office Toolkit is maintained by a deliberately small group of people, which means when you write to us, you are writing to the people who actually shape the product. The person who reads your note is often the person who can ship the fix the same week.</p><p>None of this is decoration. It is how the product behaves: open a tool with no account, finish a document that never leaves your device, export the file you need, and close the tab. The philosophy exists to keep a promise, not to fill a page, and every screen is built to prove it.</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-[hsl(var(--secondary)/.6)] p-6"><ShieldCheck className="text-[hsl(var(--primary))]" /><h3 className="mt-5 font-display text-xl font-bold text-[hsl(var(--foreground))]">Private by architecture</h3><p className="mt-2 text-sm leading-6">Your input is processed on your device. Local-first is not a badge; it is the default.</p></div><div className="rounded-2xl bg-[hsl(var(--accent)/.24)] p-6"><Zap className="text-[hsl(var(--accent-foreground))]" /><h3 className="mt-5 font-display text-xl font-bold text-[hsl(var(--foreground))]">Fast by respect</h3><p className="mt-2 text-sm leading-6">Small tasks deserve small interfaces. We keep the path from blank page to finished file short.</p></div></div></section><section className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><div className="mx-auto max-w-6xl px-5 py-16 lg:px-8"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">Keep in touch with the essentials</p><h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-[1] tracking-[-.05em]">Open a tool. Finish a thing. Keep moving.</h2></div><Link href="/" data-testid="link-about-tools" className="inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--accent))]">Browse the toolkit <ArrowRight size={16} /></Link></div></div></section></main></PageMeta>;
}
const CONTACT_SECTIONS = [
  { heading: 'We are here to help', body: 'At Office Toolkit, we believe every good tool is built on honest conversation. Whether you found a bug, have a feature in mind, need help understanding how a tool works, or simply want to say hello, we would love to hear from you. This contact page is meant to be a straightforward, human way to reach our small team. There is no ticket labyrinth and no chatbot that loops you in circles — just a clear path to a real person who can help.' },
  { heading: 'Support you can rely on', body: 'We answer every message we receive, usually within one to two business days. When you write to us, please include as much helpful detail as you can: the name of the tool you were using, the device and browser, a short description of what you expected to happen, and what you saw instead. Screenshots and step-by-step notes are especially useful. The more context you give us, the faster we can pin down the issue and get you back to work.' },
  { heading: 'The fastest ways to reach us', body: 'Prefer instant help? The fastest way to reach a real person is email. Our main support address is listed on this page, and every email lands directly in a shared inbox that we check throughout the day. If your question is about your account, privacy, or how your data is handled, you can use the same address and mark your subject line with "Privacy" so it reaches the right member of the team. For everything else, do not hesitate to say hello — we read it all.' },
  { heading: 'What you can contact us about', body: 'You are welcome to contact us about anything at all, but a few topics come up more often than others. You can reach out if a tool is not behaving the way you expected, if a download produced a file that looks wrong, if you want to suggest a new tool or a small improvement to an existing one, if you need help understanding a template or setting, or if you have a question about how Office Toolkit keeps your work private. We also love hearing how people are using the tools in their own work, so feel free to share your story.' },
  { heading: 'How quickly can we respond?', body: 'We are a small team, so we keep our promises honest. Most messages receive a first response within one to two business days. During busy stretches, it may take a little longer, and we will always let you know if something needs more time. We do not run an outsourced support line, we do not use automated replies that avoid your question, and we never leave a message unanswered. If you have not heard back within three business days, it may have slipped into spam — feel free to nudge us.' },
  { heading: 'Before you reach out', body: 'A little preparation can save both of us time. If you are reporting a problem with a tool, try refreshing the page, switching to a different browser, or testing in a private window. Many issues are temporary and resolve themselves with a quick reload. If the problem is about a downloaded file or a template, check whether the same behavior happens with the default content. And if your question is about legal, tax, or employment matters, please remember that our tools produce general-purpose templates and are not a substitute for professional advice.' },
  { heading: 'Feedback that shapes the product', body: 'Some of our best improvements have started as a single sentence from a person like you. If you have an idea for a new tool, a currency you need for an invoice, a field you wish the signature maker had, or a small detail that would make your day easier, we want to hear it. We keep a public-facing list of the features our community asks for most, and we genuinely read every suggestion. There is no guarantee every idea ships, but every idea is considered with care.' },
  { heading: 'Partnerships and collaborations', body: 'If you represent a company, a publication, a university, or a creator community and would like to work with us, we are open to thoughtful collaborations. We have partnered on content, tooling experiments, and small educational projects. Please send a short note about who you are, what you have in mind, and roughly when you are hoping to launch. We respond to partnership enquiries within a few business days and would be glad to explore whether there is a fit.' },
  { heading: 'Press and media enquiries', body: 'Journalists and creators who are writing about privacy-friendly productivity tools, local-first software, or thoughtful design for everyday work are welcome to get in touch. We are happy to provide context about why Office Toolkit exists, how it keeps data on your device, and the philosophy behind the design. For interviews, please share a few details about your publication, your audience, and the angle you are exploring so we can prepare a thoughtful response.' },
  { heading: 'Accessibility and inclusive design', body: 'We care deeply about making Office Toolkit usable by as many people as possible. If you use assistive technology and something is difficult or impossible to use, that is a bug in our eyes, and we want to fix it. Please tell us what you were trying to do, what tool or assistive setup you use, and what happened. Offering an accessibility-focused contact path is part of our commitment to building tools that work for everyone, not just for the people who happen to share our exact devices.' },
  { heading: 'Your privacy is always respected', body: 'Anything you include in a message to us is used only to help you and to improve the product. We do not sell your information, we do not add you to marketing lists without your consent, and we do not share your details with third parties. If you ask us to delete a copy of our correspondence, we will honor that request. Because our tools are local-first, most of the content you create never leaves your device at all, and our support team has no way to see the documents you generate.'
 },
  { heading: 'How to get in touch', body: 'The simplest way to reach us is to write to the support address shown on this page. Please include your name so we know how to address you, an email address where we can reply, and a clear message. We aim to reply personally to every message, because to us, support is not a department — it is the way we build trust with the people who use our tools.' },
  { heading: 'A closer look at our support promise', body: 'We want you to feel confident that your message will be read and treated seriously. Every note that reaches us is important, whether it is a tiny spelling fix in a blog post or a request for a brand-new tool. Because we are a small team, we are able to give each message genuine attention rather than routing people through a maze of automated replies. You will get a real answer, written by a human, that addresses what you actually asked. If we cannot solve something immediately, we will tell you honestly what we are doing about it instead of leaving you guessing.' },
  { heading: 'What happens after you send a message', body: 'Once your message is with us, it is seen by at least one member of the team, who will either reply directly or hand it to the right person. You can expect a personal reply within one to two business days. If we need more details, we will ask follow-up questions rather than guessing. If your note leads to a product change or a fix, we may write back with an update even after the initial reply, so you know your feedback made a difference. We close every conversation satisfied that your question has been answered or your issue addressed.' },
  { heading: 'Helpful details that speed things up', body: 'A good message is short and specific, and it saves everyone time. Start with one clear sentence that tells us the outcome you want. Then give the context: which tool you were using, what you were trying to do, and what happened. If you are reporting an error, include your browser name and version and your operating system. A screenshot is often worth a paragraph. If you are suggesting a feature, describe the problem you are trying to solve rather than just the feature name — the underlying need is what helps us design the right solution for everyone.' },
  { heading: 'Common questions, answered quickly', body: 'Many people ask the same handful of questions, and we want to make the answers easy to find. Is the service really free? Yes, the core tools are free to use. Do I need an account? No, you can open a tool and start working immediately. Are my documents stored anywhere? No, Office Toolkit is local-first, so your work stays in your browser. Can I use my outputs commercially? Yes, the documents you create are yours to use in your own work. If your question is not answered here, the email address on this page is always open.' },
  { heading: 'When you might not need to write us', body: 'We are glad to help with anything, but some things you can resolve on your own in seconds. If a tool looks unresponsive, try refreshing the page or reopening it in a private window. If a download seems slow, check your connection and your browser download settings. If a template does not look right, make sure you are on the latest version of the page. For quick lookups, the About page explains our philosophy and the blog answers common practical questions. But if you try these and still need a hand, we are only a message away — never hesitate to reach out.' },
  { heading: 'Suggesting a new tool or improvement', body: 'The most exciting emails we receive are the ones that describe a small frustration we have felt ourselves. Maybe you wish the invoice generator offered a recurring billing option, or that the signature maker let you add a date line. Whatever it is, describe the moment it happens: what are you doing, where does it feel awkward, and what would make it feel effortless? Concrete, real-world detail helps us build tools that genuinely fit the way people work, and your suggestion may well shape what we build next.' },
  { heading: 'Partnering, writing, and sharing', body: 'We are always interested in thoughtful partnerships with people and organizations that care about privacy, thoughtful design, and making everyday work less painful. If you write about productivity tools, run a small-business community, teach design, or manage a workspace that could benefit from lighter admin, we would love to talk. Send a short note describing who you are and what you have in mind, and a member of the team will get back to you. Even a friendly introduction with no immediate plan is welcome — good relationships often start with a simple hello.' },
  { heading: 'Our commitment to accessibility', body: 'We believe useful software should be usable by everyone, including people who rely on assistive technology. If you use a screen reader, keyboard navigation, voice control, or any other assistive setup and something here does not work well for you, that matters to us and we want to fix it. Please reach out with the details: what you were doing, which tools you use, and what happened. Every report helps us remove barriers and build a more inclusive product. Accessibility is not a checklist we finish once; it is a continuous commitment we make to every user.' },
  { heading: 'Respecting your time and privacy', body: 'We will never share your email address, your name, or anything you send us with outside companies, and we will not add you to any mailing list unless you explicitly ask. The content of your messages is used only to help you and to improve the product. If you ever ask us to delete our copy of our correspondence, we will do so. And because our tools are local-first, the documents you create never pass through our servers in the first place. Contacting us is safe, honest, and always private — that is exactly how we want every interaction to feel.' },
  { heading: 'Send us a note today', body: 'Whatever brings you to this page — a question, a bug, an idea, or just curiosity — we are glad you are here. The fastest way to get a helpful reply is to email the address on this page, and to include a few useful details so we can hit the ground running. There is nothing you can send us that we have not seen or that we would find too small to answer. We built Office Toolkit to make your work a little calmer, and we would be delighted to make your experience with us feel that way too. We look forward to hearing from you.'
 }
];

function ContactPage() {
  return <PageMeta title="Contact Us — Help, Feedback & Support" description="Reach the Office Toolkit team with questions, feedback, bug reports, and ideas. We reply personally within one to two business days. Free tools, no account." image="/og/default.png"><main>
    <section className="border-b border-[hsl(var(--border))]">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">Say hello</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-[.96] tracking-[-.06em] md:text-7xl">Talk to a real person.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">Questions, feedback, bug reports, or a good idea — we read every message and reply personally, usually within one to two business days.</p>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[hsl(var(--muted-foreground))]">Whether a tool is misbehaving, a feature is missing, or you simply have a thought worth sharing, a real person reads it. One address, a personal reply, and no automated loop — we keep contact as plainspoken as the rest of the product.</p>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[hsl(var(--muted-foreground))]">If you have never written to a product team before, this is a good place to start. There is no form to master, no account to create, and no expectation that you already know how to describe the problem. A rough sentence and whatever screenshots you have are enough — asking the right questions is our side of the job.</p>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[hsl(var(--muted-foreground))]">We treat every message as the start of a small relationship. You will not be put on a mailing list, your details will not be shared, and we will not reply with a scripted paragraph that ignores what you wrote. If we need more time we will tell you; if we can help immediately we will.</p>
      </div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
      <div className="space-y-8">
        <div className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 md:p-8">
          <div className="flex items-center gap-2 text-[hsl(var(--primary))]"><span className="grid size-10 place-items-center rounded-xl bg-[hsl(var(--secondary))]"><Sparkles size={18} /></span><span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em]">What to include</span></div>
          <p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">A few details help us answer faster — and with a real reply the first time.</p>
          <ul className="mt-5 space-y-3">
            <li className="flex gap-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]"><Check size={16} className="mt-1 shrink-0 text-[hsl(var(--primary))]" />The tool or page you are using, if your note is about something not working.</li>
            <li className="flex gap-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]"><Check size={16} className="mt-1 shrink-0 text-[hsl(var(--primary))]" />Your browser and device name, so we can reproduce the issue.</li>
            <li className="flex gap-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]"><Check size={16} className="mt-1 shrink-0 text-[hsl(var(--primary))]" />Your name and a reply-to email address.</li>
            <li className="flex gap-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]"><Check size={16} className="mt-1 shrink-0 text-[hsl(var(--primary))]" />A screenshot when something looks wrong — it helps more than a long description.</li>
          </ul>
          <p className="mt-5 rounded-xl bg-[hsl(var(--secondary)/.5)] px-4 py-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Reply time: 1â€“2 business days. Write again if you have not heard back in three.</p>
        </div>
      </div>
      <div className="space-y-8">
        <div className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 md:p-8"><div className="flex items-center gap-2 text-[hsl(var(--primary))]"><span className="grid size-10 place-items-center rounded-xl bg-[hsl(var(--secondary))]"><Mail size={18} /></span><span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em]">Direct email</span></div><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">For anything at all, including privacy and partnership notes.</p><a href="mailto:hello@officetoolkit.app" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-contact-email"><Send size={16} /> hello@officetoolkit.app</a></div>
        <div className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 md:p-8"><div className="flex items-center gap-2 text-[hsl(var(--primary))]"><span className="grid size-10 place-items-center rounded-xl bg-[hsl(var(--secondary))]"><CircleHelp size={18} /></span><span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em]">Common help</span></div><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Answers to the questions we hear most often.</p><FAQ items={[
        ['How fast do you reply?', 'Most messages get a first response within one to two business days. If you have not heard back in three, please write again — it may have landed in spam.'],
        ['Do you read feature requests?', 'Yes. We keep a list of the most-requested ideas and genuinely consider every suggestion our community sends us.'],
        ['Do you store my documents?', 'No. Office Toolkit is local-first. Most of the content you create never leaves your device. Nothing you write in a tool is uploaded to us.'],
        ['How do I report a bug?', 'Email us and include the tool name, browser, device, and a short description. Screenshots help a lot.'],
        ['Can I request a new tool?', 'Absolutely. Tell us what you need and we will consider it alongside the rest of our roadmap.'],
      ]} /></div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8"><div className="mx-auto max-w-3xl"><div className="space-y-6">{CONTACT_SECTIONS.map((section) => <div key={section.heading}><h2 className="font-display text-2xl font-bold tracking-[-.03em] text-[hsl(var(--foreground))]">{section.heading}</h2><p className="mt-3 text-[15px] leading-8 text-[hsl(var(--muted-foreground))]">{section.body}</p></div>)}</div></div></section>
  </main></PageMeta>;
}

const PRIVACY_SECTIONS = [
  { heading: 'Our promise in one sentence', body: 'Office Toolkit is local-first. The tools that help you create, edit, and export documents run in your own browser, on your own device, and your content is not uploaded to our servers.' },
  { heading: 'What "local-first" really means', body: 'When you use the e-signature maker or the invoice generator, the actual work happens on your computer. Drawing a signature, typing a name, uploading a signature image, or building an invoice are all processed right inside your browser tab. This means the words you type and the files you upload never travel over the internet to us. They exist only on your screen, and they disappear when you close the tab or refresh unless you choose to export them. We build everything around this principle because we believe your private work should never have to leave your hands just to get a small job done.' },
  { heading: 'Information we collect', body: 'Because our tools are local-first, we have intentionally designed Office Toolkit so that the documents, signatures, invoices, and drafts you create do not need to be collected by us at all. We do not ask for an account, a name, an email address, or any personal details to use any tool. The only places you might voluntarily share information are the contact channels described on our Contact page and the blog notes you choose to publish. In those cases, we use what you share only to respond to you and to improve the product, and we never sell it. There is no analytics spy on your work, no background uploads of your documents, and no hidden data pipeline.' },
  { heading: 'Your documents stay on your device', body: 'Your invoices, signatures, and any uploads you process are handled entirely in your browser. The only time a file leaves your device is when you actively choose to download it, and at that point it goes to your own computer, not to us. We cannot read your drafts, we cannot recover them for you, and we cannot share them, because we never see them in the first place. This is a core part of our design and not a feature we expect to change. If you are handling particularly sensitive material, you can be confident that the tools themselves are not a point of exposure.' },
  { heading: 'Local storage and browser data', body: "To make a few features feel smoother, Office Toolkit may use your browser's local storage. For example, if you publish a blog note, a copy may be kept in your browser so it can appear on your blog listing. This data lives only in your browser's storage on your device. You can clear it at any time through your browser's settings, and clearing it does not affect anything stored elsewhere (because nothing is stored elsewhere). Local storage is simple, private, and entirely under your control — there is no cloud copy to worry about." },
  { heading: 'Files you choose to export', body: "We give you the freedom to download your work in several formats, including PNG, JPG, and PDF for visual documents. These downloads are generated on your device and saved directly to your computer. We do not store copies of them, we do not receive a copy when you download, and we cannot access files after you save them. Exported files are as private as any other file on your computer. If you email a completed invoice or signed document to someone, that sharing is entirely your own action and subject to your own email provider's privacy practices, not ours." },
  { heading: 'Fonts, icons, and third-party resources', body: 'To give the tools a polished look, we load some design resources — such as display fonts for signatures and standard icons — from public web font and icon services. When your browser fetches these resources, those third-party providers may see routine connection information, just as they do for any website that uses their fonts. We choose reputable providers and do not add tracking pixels or fingerprinting scripts. We do not knowingly pass any of your document content to these providers; they only serve the styling resources the page needs to render.' },
  { heading: 'Cookies and cookies policy', body: 'Office Toolkit does not use advertising cookies, did not use tracking cookies to follow you across the web, and does not use cookies to build a profile about you. Because our core tools run locally and need no login, there is very little reason for us to set cookies at all. Where browser storage is used for convenience features, it is functional local storage rather than tracking. If you ever notice a cookie being set, it is almost certainly from a third-party font, icon, or analysis service rather than from us, and we keep those to a minimum.' },
  { heading: 'How we handle your support messages', body: 'When you reach out through the Contact page or our support email, we receive the information you choose to include — such as your name, email address, and message. We use it solely to respond to your question, fix a problem, or consider your feedback. We do not sell it, we do not share it with marketing partners, and we will not add you to any mailing list unless you explicitly ask. We keep support conversations only as long as reasonably needed to resolve your issue, and we will honor a request to delete our copy of our correspondence.' },
  { heading: "Children's privacy", body: "Office Toolkit is a general-purpose productivity toolkit and is not directed at children. We do not knowingly collect personal information from children under the age of 13 (or the relevant minimum age in your jurisdiction). Because the tools are local-first, we generally do not collect personal information at all. If you believe a child has provided us personal information through a contact channel, please reach out and we will promptly delete it and take appropriate steps to protect the child's privacy." },
  { heading: 'Data security', body: 'Because your work stays on your device, most of the confidentiality of your documents is protected by the security of your own computer and browser. We encourage you to keep your operating system and browser up to date, use a strong password or passcode to unlock your device, and be thoughtful about shared or public computers. For the limited contact information we do receive, we apply reasonable administrative, technical, and physical safeguards appropriate to the sensitivity of that information. No method of transmission over the internet is 100% secure, so while we work to protect your information, we cannot guarantee absolute security.' },
  { heading: 'Your choices and control', body: "Because you are in control of your own device and browser, you already have a great deal of control over your data. You can clear your browser's local storage at any time. You can choose exactly which files to export and where to save them. You can decide what to include in a support message. If a jurisdiction's law gives you rights over the limited personal information we might hold — such as access, correction, deletion, or portability — you can exercise those rights by contacting us, and we will respond within the timeframe required by law." },
  { heading: 'Changes to this policy', body: 'We may update this Privacy & Policy page from time to time to reflect changes in our tools, our technology, or applicable law. When we make material changes, we will update the "Last updated" date at the top of this page. We encourage you to review this page occasionally so you stay informed about how we are protecting your information. Your continued use of Office Toolkit after changes are posted means you accept the updated policy. Because our local-first design keeps most data on your device, changes to this policy rarely change how your documents are handled.' },
  { heading: 'Contacting us about privacy', body: 'If you have any questions about this Privacy & Policy, about how your information is handled, or about how our local-first tools work, we would love to help. You can reach us through the Contact page on this website, or email us directly and mark your subject line with "Privacy" so it reaches the right member of the team. We are committed to being transparent and will gladly explain exactly what happens with your data — and more importantly, what does not happen.' },
];

function PrivacyPage() {
  return <PageMeta title="Privacy Policy — Your Documents Stay Yours" description="Learn how Office Toolkit keeps your work private. Our tools are local-first: documents stay on your device and are never uploaded to our servers. No account." image="/og/default.png"><main>
    <section className="border-b border-[hsl(var(--border))]">
      <div className="mx-auto max-w-3xl px-5 pb-16 pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">Privacy & Policy</p>
        <h1 className="mt-5 font-display text-5xl font-bold leading-[.96] tracking-[-.06em] md:text-6xl">Your work stays yours.</h1>
        <p className="mt-6 text-base leading-7 text-[hsl(var(--muted-foreground))]">Last updated: 04 September 2026. This policy explains how Office Toolkit handles your information — and how our local-first design keeps your documents private by default.</p>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8"><div className="grid gap-6 sm:grid-cols-3"><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><span className="grid size-11 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><ShieldCheck size={20} /></span><h2 className="mt-5 font-display text-lg font-bold">Local by design</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Documents are processed in your browser, not on our servers.</p></div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><span className="grid size-11 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><FileText size={20} /></span><h2 className="mt-5 font-display text-lg font-bold">No account needed</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Use any tool immediately, with no profile, password, or personal data.</p></div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><span className="grid size-11 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Zap size={20} /></span><h2 className="mt-5 font-display text-lg font-bold">Nothing to sell</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">There are no ads, no data marketplaces, and no hidden data pipeline.</p></div></div></section>
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8"><div className="mx-auto max-w-3xl"><div className="space-y-6">{PRIVACY_SECTIONS.map((section) => <div key={section.heading}><h2 className="font-display text-2xl font-bold tracking-[-.03em] text-[hsl(var(--foreground))]">{section.heading}</h2><p className="mt-3 text-[15px] leading-8 text-[hsl(var(--muted-foreground))]">{section.body}</p></div>)}</div></div></section>
  </main></PageMeta>;
}

function TrailingSlashGuard() {
  const [location, navigate] = useLocation();
  useEffect(() => {
    if (location.length > 1 && location.endsWith('/')) {
      navigate(location.replace(/\/+$/, ''), { replace: true });
    }
  }, [location, navigate]);
  return null;
}

function Router() {
  return <ErrorBoundary><TrailingSlashGuard /><Switch><Route path="/admin/login" component={AdminLoginPage} /><Route path="/admin/blog/edit/:id" component={AdminPage} /><Route path="/admin/drafts" component={AdminPage} /><Route path="/admin/published" component={AdminPage} /><Route path="/admin/blog" component={AdminPage} /><Route path="/admin/settings" component={AdminPage} /><Route path="/admin" component={AdminPage} /><Route><Shell><Suspense fallback={null}><Switch><Route path="/" component={Home} /><Route path="/e-signature-maker" component={ESignatureMaker} /><Route path="/invoice-generator" component={InvoiceGenerator} /><Route path="/blog/:slug" component={BlogPage} /><Route path="/blog" component={BlogPage} /><Route path="/contact" component={ContactPage} /><Route path="/privacy" component={PrivacyPage} /><Route path="/about" component={About} /><Route path="/tools/:slug" component={ToolPage} /><Route component={NotFound} /></Switch></Suspense></Shell></Route></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;