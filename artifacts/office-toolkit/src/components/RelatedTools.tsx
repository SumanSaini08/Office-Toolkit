import { ArrowRight, PenLine, ReceiptText } from 'lucide-react';
import { Link } from 'wouter';
import { toolUseCases, type ToolUseCase } from '@/lib/tools';

function iconFor(category: 'esignature' | 'invoice') {
  return category === 'esignature' ? <PenLine size={16} /> : <ReceiptText size={16} />;
}

export function ToolCardLink({ href, title, category, testId }: { href: string; title: string; category: 'esignature' | 'invoice'; testId?: string }) {
  return (
    <Link href={href} data-testid={testId} className="group flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 transition-colors hover:border-[hsl(var(--primary)/.5)]">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">{iconFor(category)}</span>
      <span className="min-w-0 flex-1 text-sm font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]">{title}</span>
      <ArrowRight size={15} className="shrink-0 text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1 group-hover:text-[hsl(var(--primary))]" />
    </Link>
  );
}

export function YouMightAlsoNeed({ href, title, category, tools, excludeSlug }: { href: string; title: string; category: 'esignature' | 'invoice'; tools?: ToolUseCase[]; excludeSlug?: string }) {
  return (
    <section className="border-t border-[hsl(var(--border))]">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--primary))]">Keep going</p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-[-.03em]">You might also need</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCardLink href={href} title={title} category={category} testId="related-main-tool" />
          {(tools ?? []).filter((tool) => tool.slug !== excludeSlug).map((tool) => (
            <ToolCardLink key={tool.slug} href={`/tools/${tool.slug}`} title={tool.title} category={tool.category} testId={`related-${tool.slug}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export const esignatureToolUseCases = toolUseCases.filter((tool) => tool.category === 'esignature');
export const invoiceToolUseCases = toolUseCases.filter((tool) => tool.category === 'invoice');