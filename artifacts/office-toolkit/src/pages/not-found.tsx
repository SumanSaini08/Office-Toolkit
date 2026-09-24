import { useEffect } from 'react';
import { Link } from 'wouter';
import { AlertCircle } from 'lucide-react';

import { applyPageMeta } from '@/lib/seo';

const toolLinks = [
  { href: '/e-signature-maker', label: 'E-signature maker' },
  { href: '/invoice-generator', label: 'Invoice generator' },
  { href: '/tools/gst-invoice-generator', label: 'GST invoice generator' },
];

export default function NotFound() {
  useEffect(() => {
    applyPageMeta({
      title: 'Page Not Found (404)',
      description: 'The page you are looking for does not exist or was moved. Visit Office Toolkit for free e-signature and invoice tools.',
      robots: 'noindex, nofollow',
    });
  }, []);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><AlertCircle size={22} /></span>
      <h1 className="mt-6 font-display text-5xl font-bold tracking-[-.045em] md:text-6xl">Page nahi mila.</h1>
      <p className="mt-4 max-w-md text-base leading-7 text-[hsl(var(--muted-foreground))]">Yeh page move ho gaya hai ya exist nahi karta. Neeche se wahi kaam pakad lo jiske liye aaye the.</p>
      <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
        {toolLinks.map((tool) => (
          <Link key={tool.href} href={tool.href} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-sm font-bold transition-colors hover:bg-[hsl(var(--secondary)/.5)]">{tool.label}</Link>
        ))}
      </div>
      <nav aria-label="Missing page help" className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-bold text-[hsl(var(--muted-foreground))]">
        <Link href="/" className="inline-flex min-h-11 items-center transition-colors hover:text-[hsl(var(--primary))]">Home</Link>
        <Link href="/blog" className="inline-flex min-h-11 items-center transition-colors hover:text-[hsl(var(--primary))]">Blog</Link>
        <Link href="/contact" className="inline-flex min-h-11 items-center transition-colors hover:text-[hsl(var(--primary))]">Contact</Link>
      </nav>
    </main>
  );
}