import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Check, FileText, LockKeyhole, LogIn, LogOut, Plus, Save, Trash2 } from "lucide-react";
import {
  fallbackContent,
  fetchOfficeToolkitContent,
  saveOfficeToolkitContent,
  type BlogPost,
  type CurrencyOption,
  type OfficeToolkitContent,
  type ResumeTemplate,
  type SignatureTemplate,
} from "@/lib/content";

function ContentMeta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} — Office Toolkit`;
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute("content", description);
  }, [title, description]);
  return null;
}

function ContentHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="border-b border-[hsl(var(--border))]">
      <div className="mx-auto max-w-6xl px-5 pb-14 pt-14 lg:px-8 lg:pb-20 lg:pt-20">
        <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-[.96] tracking-[-.06em] md:text-7xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">{description}</p>
      </div>
    </section>
  );
}

function BlogPage() {
  const [location] = useLocation();
  const content = useContent();
  const slug = location.startsWith("/blog/") ? decodeURIComponent(location.slice("/blog/".length)) : "";
  const post = content.blogPosts.find((item) => item.slug === slug);

  if (post) {
    return (
      <>
        <ContentMeta title={post.title} description={post.excerpt} />
        <main>
          <ContentHeader eyebrow={`${post.category} · ${post.readTime}`} title={post.title} description={post.excerpt} />
          <article className="mx-auto max-w-3xl px-5 py-14 lg:px-8 lg:py-20">
            <p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">{formatDate(post.publishedAt)}</p>
            <div className="mt-10 space-y-6 text-base leading-8 text-[hsl(var(--muted-foreground))]">
              {post.content.split(/\n\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <Link href="/blog" className="mt-12 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))]"><ArrowLeft size={16} /> Back to the journal</Link>
          </article>
        </main>
      </>
    );
  }

  return (
    <>
      <ContentMeta title="Office Toolkit Journal" description="Practical notes on signatures, invoices, resumes, and calmer workdays." />
      <main>
        <ContentHeader eyebrow="The journal" title="Useful notes for the work between meetings." description="Practical, plainspoken guidance for making documents, applications, and everyday office work a little easier." />
        <section className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
          <div className="grid gap-4 md:grid-cols-3">
            {content.blogPosts.map((item) => (
              <Link key={item.id} href={`/blog/${item.slug}`} className="tool-card group rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--primary))]">{item.category}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{item.readTime}</span></div>
                <h2 className="mt-12 font-display text-2xl font-bold leading-tight tracking-[-.04em] group-hover:text-[hsl(var(--primary))]">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.excerpt}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))]">Read note <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [content, setContent] = useState<OfficeToolkitContent>(fallbackContent);
  const [activeTab, setActiveTab] = useState<"blog" | "signature" | "resume" | "currency">("blog");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
      .then((response) => response.json() as Promise<{ authenticated: boolean }>)
      .then((session) => setAuthenticated(session.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    setLoading(true);
    fetchOfficeToolkitContent()
      .then((remote) => setContent({ ...fallbackContent, ...remote }))
      .catch(() => setStatus("Using local defaults. Save after the API is available."))
      .finally(() => setLoading(false));
  }, [authenticated]);

  const update = <K extends keyof OfficeToolkitContent>(key: K, value: OfficeToolkitContent[K]) => setContent((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setStatus("Saving to Supabase…");
    try {
      const saved = await saveOfficeToolkitContent(content);
      setContent(saved);
      setStatus("Saved. Public pages will use the new content on refresh.");
    } catch {
      setStatus("Could not save. Check that the content service is running.");
    }
  };
  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthenticated(false);
    setStatus("");
  };
  const tabs = [
    ["blog", "Blog posts"],
    ["signature", "Signature styles"],
    ["resume", "Resume templates"],
    ["currency", "Currencies"],
  ] as const;

  if (!authChecked) {
    return <><ContentMeta title="Admin panel" description="Manage Office Toolkit content." /><main className="grid min-h-[70vh] place-items-center px-5"><p className="text-sm text-[hsl(var(--muted-foreground))]">Checking admin access…</p></main></>;
  }

  if (!authenticated) {
    return <AdminLogin onAuthenticated={() => setAuthenticated(true)} />;
  }

  return (
    <>
      <ContentMeta title="Admin panel" description="Manage Office Toolkit content." />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="flex flex-col justify-between gap-6 border-b border-[hsl(var(--border))] pb-8 md:flex-row md:items-end">
          <div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">Workbench admin</p><h1 className="mt-3 font-display text-5xl font-bold tracking-[-.06em]">Shape the useful bits.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Manage the journal and the reusable templates that power your tools. Changes are stored in your connected Supabase workspace.</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={logout} className="btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] px-4 text-sm font-bold"><LogOut size={16} /> Log out</button><button type="button" onClick={save} className="btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 text-sm font-bold text-[hsl(var(--primary-foreground))]"><Save size={16} /> Save changes</button></div>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map(([id, label]) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${activeTab === id ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"}`}>{label}</button>)}
        </div>
        {status && <p className="mt-5 rounded-xl bg-[hsl(var(--secondary)/.45)] px-4 py-3 text-sm font-medium text-[hsl(var(--primary))]" role="status">{status}</p>}
        {loading ? <p className="py-12 text-sm text-[hsl(var(--muted-foreground))]">Loading saved content…</p> : (
          <div className="mt-8">
            {activeTab === "blog" && <BlogEditor posts={content.blogPosts} onChange={(value) => update("blogPosts", value)} />}
            {activeTab === "signature" && <SignatureEditor templates={content.signatureTemplates} onChange={(value) => update("signatureTemplates", value)} />}
            {activeTab === "resume" && <ResumeEditor templates={content.resumeTemplates} onChange={(value) => update("resumeTemplates", value)} />}
            {activeTab === "currency" && <CurrencyEditor currencies={content.currencies} onChange={(value) => update("currencies", value)} />}
          </div>
        )}
      </main>
    </>
  );
}

function AdminLogin({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not sign in.");
        return;
      }
      setPassword("");
      onAuthenticated();
    } catch {
      setError("Could not reach the admin service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <><ContentMeta title="Admin login" description="Sign in to manage Office Toolkit content." /><main className="grid min-h-[76vh] place-items-center px-5 py-12"><section className="w-full max-w-md rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7 shadow-sm md:p-9"><div className="grid size-12 place-items-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><LockKeyhole size={21} /></div><p className="mt-7 font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">Restricted workspace</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em]">Admin sign in</h1><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Sign in to edit journal posts, signature styles, resume templates, and invoice currencies.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Admin password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.25)]" data-testid="input-admin-password" /></label>{error && <p className="rounded-xl bg-[hsl(var(--destructive)/.1)] px-3 py-2.5 text-sm text-[hsl(var(--destructive))]" role="alert">{error}</p>}<button type="submit" disabled={submitting} className="btn-press inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] text-sm font-bold text-[hsl(var(--primary-foreground))] disabled:cursor-wait disabled:opacity-60" data-testid="button-admin-login"><LogIn size={16} /> {submitting ? "Signing in…" : "Sign in"}</button></form><p className="mt-6 text-center text-xs leading-5 text-[hsl(var(--muted-foreground))]">Your session stays active for 8 hours on this device.</p></section></main></>;
}

function EditorFrame({ children, title, onAdd }: { children: React.ReactNode; title: string; onAdd: () => void }) {
  return <section className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-7"><div className="flex items-center justify-between gap-4"><h2 className="font-display text-2xl font-bold">{title}</h2><button type="button" onClick={onAdd} className="btn-press inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--muted))] px-3 py-2 text-xs font-bold"><Plus size={14} /> Add</button></div><div className="mt-6 space-y-4">{children}</div></section>;
}

function AdminInput({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  const className = "w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.25)]";
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">{label}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${className} min-h-24 resize-y`} /> : <input value={value} onChange={(event) => onChange(event.target.value)} className={className} />}</label>;
}

function BlogEditor({ posts, onChange }: { posts: BlogPost[]; onChange: (posts: BlogPost[]) => void }) {
  const blank = (): BlogPost => ({ id: `post-${Date.now()}`, slug: `new-note-${Date.now()}`, title: "New note", excerpt: "", category: "Work habits", readTime: "4 min read", publishedAt: new Date().toISOString().slice(0, 10), content: "" });
  return <EditorFrame title="Journal posts" onAdd={() => onChange([...posts, blank()])}>{posts.map((post, index) => <div key={post.id} className="rounded-2xl border border-[hsl(var(--border))] p-4"><div className="flex items-start justify-between gap-3"><div className="grid flex-1 gap-3 md:grid-cols-2"><AdminInput label="Title" value={post.title} onChange={(value) => updateArray(posts, onChange, index, { title: value })} /><AdminInput label="Slug" value={post.slug} onChange={(value) => updateArray(posts, onChange, index, { slug: value })} /><AdminInput label="Category" value={post.category} onChange={(value) => updateArray(posts, onChange, index, { category: value })} /><AdminInput label="Read time" value={post.readTime} onChange={(value) => updateArray(posts, onChange, index, { readTime: value })} /><AdminInput label="Excerpt" value={post.excerpt} onChange={(value) => updateArray(posts, onChange, index, { excerpt: value })} /><AdminInput label="Published date" value={post.publishedAt} onChange={(value) => updateArray(posts, onChange, index, { publishedAt: value })} /></div><button type="button" aria-label="Delete post" onClick={() => onChange(posts.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/.1)] hover:text-[hsl(var(--destructive))]"><Trash2 size={16} /></button></div><div className="mt-3"><AdminInput label="Article content" value={post.content} multiline onChange={(value) => updateArray(posts, onChange, index, { content: value })} /></div></div>)}</EditorFrame>;
}

function SignatureEditor({ templates, onChange }: { templates: SignatureTemplate[]; onChange: (templates: SignatureTemplate[]) => void }) {
  const blank = (): SignatureTemplate => ({ id: `signature-${Date.now()}`, name: "New style", font: "cursive", description: "" });
  return <EditorFrame title="Signature templates" onAdd={() => onChange([...templates, blank()])}>{templates.map((template, index) => <div key={template.id} className="grid gap-3 rounded-2xl border border-[hsl(var(--border))] p-4 md:grid-cols-[1fr_1fr_1.5fr_auto] md:items-end"><AdminInput label="Name" value={template.name} onChange={(value) => updateArray(templates, onChange, index, { name: value })} /><AdminInput label="Font key" value={template.font} onChange={(value) => updateArray(templates, onChange, index, { font: value })} /><AdminInput label="Description" value={template.description} onChange={(value) => updateArray(templates, onChange, index, { description: value })} /><button type="button" aria-label="Delete signature template" onClick={() => onChange(templates.filter((_, itemIndex) => itemIndex !== index))} className="mb-0.5 rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"><Trash2 size={16} /></button></div>)}</EditorFrame>;
}

function ResumeEditor({ templates, onChange }: { templates: ResumeTemplate[]; onChange: (templates: ResumeTemplate[]) => void }) {
  const blank = (): ResumeTemplate => ({ id: `resume-${Date.now()}`, name: "New template", description: "", accent: "#174f4a" });
  return <EditorFrame title="Resume templates" onAdd={() => onChange([...templates, blank()])}>{templates.map((template, index) => <div key={template.id} className="grid gap-3 rounded-2xl border border-[hsl(var(--border))] p-4 md:grid-cols-[1fr_1.5fr_120px_auto] md:items-end"><AdminInput label="Name" value={template.name} onChange={(value) => updateArray(templates, onChange, index, { name: value })} /><AdminInput label="Description" value={template.description} onChange={(value) => updateArray(templates, onChange, index, { description: value })} /><AdminInput label="Accent color" value={template.accent} onChange={(value) => updateArray(templates, onChange, index, { accent: value })} /><button type="button" aria-label="Delete resume template" onClick={() => onChange(templates.filter((_, itemIndex) => itemIndex !== index))} className="mb-0.5 rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"><Trash2 size={16} /></button></div>)}</EditorFrame>;
}

function CurrencyEditor({ currencies, onChange }: { currencies: CurrencyOption[]; onChange: (currencies: CurrencyOption[]) => void }) {
  const blank = (): CurrencyOption => ({ code: "NEW", symbol: "¤", name: "New currency" });
  return <EditorFrame title="Currency options" onAdd={() => onChange([...currencies, blank()])}>{currencies.map((currency, index) => <div key={`${currency.code}-${index}`} className="grid gap-3 rounded-2xl border border-[hsl(var(--border))] p-4 md:grid-cols-[100px_100px_1fr_auto] md:items-end"><AdminInput label="Code" value={currency.code} onChange={(value) => updateArray(currencies, onChange, index, { code: value.toUpperCase() })} /><AdminInput label="Symbol" value={currency.symbol} onChange={(value) => updateArray(currencies, onChange, index, { symbol: value })} /><AdminInput label="Name" value={currency.name} onChange={(value) => updateArray(currencies, onChange, index, { name: value })} /><button type="button" aria-label="Delete currency" onClick={() => onChange(currencies.filter((_, itemIndex) => itemIndex !== index))} className="mb-0.5 rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"><Trash2 size={16} /></button></div>)}</EditorFrame>;
}

function updateArray<T>(items: T[], onChange: (items: T[]) => void, index: number, patch: Partial<T>) {
  onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
}

function useContent() {
  const [content, setContent] = useState(fallbackContent);
  useEffect(() => {
    fetchOfficeToolkitContent().then((remote) => setContent({ ...fallbackContent, ...remote })).catch(() => undefined);
  }, []);
  return content;
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export { AdminPage, BlogPage };