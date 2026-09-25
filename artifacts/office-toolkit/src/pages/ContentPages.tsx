import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { AlignCenter, AlignLeft, AlignRight, ArrowLeft, ArrowRight, Bold, Check, ChevronRight, Eye, EyeOff, FileText, Globe, HelpCircle, Image as ImageIcon, Info, Italic, KeyRound, LayoutDashboard, LockKeyhole, LogIn, LogOut, Menu, PenLine, Plus, ReceiptText, RefreshCcw, Save, Search, Settings, Sparkles, Tag, Trash2, Upload, Users, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  fallbackContent,
  fetchOfficeToolkitContent,
  saveOfficeToolkitContent,
  type BlogFaq,
  type BlogPost,
  type OfficeToolkitContent,
} from "@/lib/content";
import { applyPageMeta } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";
const PAGE_SIZE = 12;

function ContentMeta({ title, description, robots, image, canonical, ogType, article, prevUrl, nextUrl }: { title: string; description: string; robots?: string; image?: string; canonical?: string; ogType?: string; article?: { publishedTime: string; modifiedTime?: string; author?: string }; prevUrl?: string; nextUrl?: string }) {
  useEffect(() => {
    applyPageMeta({ title, description, robots, image, canonical, ogType, article, prevUrl, nextUrl });
  }, [title, description, robots, image, canonical, ogType, article, prevUrl, nextUrl]);
  return null;
}

function ContentHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="border-b border-[hsl(var(--border))]">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-[.96] tracking-[-.06em] md:text-7xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">{description}</p>
      </div>
    </section>
  );
}

function CoverImage({ post, className }: { post: BlogPost; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [post.imageUrl]);
  if (post.coverEnabled === false) return null;
  if (post.imageUrl && !failed) {
    return <img loading="lazy" src={post.imageUrl} alt={post.imageAlt || post.title} className={className} onError={() => setFailed(true)} />;
  }
  return (
    <div className={`flex w-full items-center justify-center bg-[linear-gradient(135deg,hsl(var(--primary)/.22),hsl(var(--primary)/.05)_45%,hsl(var(--secondary)/.5))] ${className ?? ""}`} data-testid="cover-placeholder">
      <span className="font-display text-5xl font-bold tracking-[-.04em] text-[hsl(var(--primary)/.35)]">{(post.title ?? "OT").charAt(0).toUpperCase()}</span>
    </div>
  );
}

function addHeadingIds(html: string): { html: string; headings: { id: string; text: string }[] } {
  const headings: { id: string; text: string }[] = [];
  const htmlWithIds = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_match, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const id = `section-${headings.length}`;
    headings.push({ id, text });
    const marker = /class=/i.test(attrs as string) ? "" : ' class="scroll-mt-28"';
    return `<h2${attrs} id="${id}"${marker}>${inner}</h2>`;
  });
  return { html: htmlWithIds, headings };
}

function BlogPage() {
  const [location] = useLocation();
  const content = useContent();
  const { posts, localPosts, addPost, deletePost } = useLocalBlogPosts(content.blogPosts);
  const visiblePosts = useMemo(() => posts.filter((item) => item.published !== false), [posts]);
  const pageMatch = location.match(/^\/blog\/page\/(\d+)\/?$/);
  const page = pageMatch ? Math.max(1, parseInt(pageMatch[1], 10)) : 1;
  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagePosts = visiblePosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const listingCanonical = safePage === 1 ? "/blog" : `/blog/page/${safePage}`;
  const prevUrl = safePage > 1 ? (safePage - 1 === 1 ? "/blog" : `/blog/page/${safePage - 1}`) : undefined;
  const nextUrl = safePage < totalPages ? `/blog/page/${safePage + 1}` : undefined;
  const slug = location.startsWith("/blog/") && !/^\/blog\/page\/?$/.test(location) ? decodeURIComponent(location.slice("/blog/".length)) : "";
  const post = visiblePosts.find((item) => item.slug === slug);
  const relatedPosts = visiblePosts.filter((item) => item.slug !== slug).slice(0, 3);

  if (post) {
    const toolCta = toolCtaForPost(post);
    const isLocal = localPosts.some((p) => p.slug === post.slug);
    const { html: postBody, headings } = addHeadingIds(post.content ? healContentHtml(post.content) : "");
    const hasHtml = /<\/?[a-z][^>]*>/i.test(postBody);
    const coverOn = post.coverEnabled !== false;
    return (
      <>
        <ContentMeta title={post.seo?.metaTitle || post.title} description={post.seo?.metaDescription || post.excerpt} image={post.imageUrl || "/og/default.png"} canonical={`/blog/${post.slug}`} ogType="article" article={{ publishedTime: post.publishedAt, modifiedTime: post.publishedAt, author: post.author }} />
        <main>
          <JsonLd id="blog-post" data={{
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.seo?.metaTitle || post.title,
            description: post.excerpt,
            image: post.imageUrl,
            url: `${ORIGIN}/blog/${post.slug}`,
            datePublished: post.publishedAt,
            dateModified: post.publishedAt,
            author: post.author ? { "@type": "Person", name: post.author } : { "@type": "Organization", name: "Office Toolkit" },
            publisher: { "@type": "Organization", name: "Office Toolkit", logo: { "@type": "ImageObject", url: `${ORIGIN}/logo.png` } },
            mainEntityOfPage: `${ORIGIN}/blog/${post.slug}`,
          }} />
          {!!post.faq?.length && <JsonLd id="blog-faq" data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: post.faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }} />}
          <ContentHeader eyebrow={`${post.category} · ${post.readTime}`} title={post.title} description={post.excerpt} />
          <nav aria-label="Breadcrumb" className="border-b border-[hsl(var(--border))]">
            <div className="mx-auto max-w-3xl px-5 lg:px-8">
              <ol className="flex flex-wrap items-center gap-1.5 py-2.5 text-sm">
                <li><Link href="/" className="inline-flex min-h-11 items-center font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]">Home</Link></li>
                <li aria-hidden="true" className="hidden h-11 items-center text-[hsl(var(--muted-foreground))] opacity-60 sm:inline-flex"><ChevronRight size={13} /></li>
                <li><Link href="/blog" className="inline-flex min-h-11 items-center font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]">Blog</Link></li>
                <li aria-hidden="true" className="hidden h-11 items-center text-[hsl(var(--muted-foreground))] opacity-60 sm:inline-flex"><ChevronRight size={13} /></li>
                <li aria-current="page" className="inline-flex min-h-11 max-w-full items-center truncate font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--primary))]"><span className="truncate">{post.title}</span></li>
              </ol>
            </div>
          </nav>
          <article className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
            {post.imageUrl && coverOn && <img src={post.imageUrl} alt={post.imageAlt || post.title} width={1280} height={720} className="aspect-video w-full rounded-[1.35rem] border border-[hsl(var(--border))] object-cover" />}
            <p className={`font-mono-ui text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))] ${post.imageUrl && coverOn ? "mt-8" : ""}`}>{formatDate(post.publishedAt)}{post.author ? ` · By ${post.author}` : ""}</p>
            {headings.length >= 3 && (
              <nav aria-label="In this article" className="mt-10 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
                <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--primary))]">In this article</p>
                <ol className="mt-3 space-y-2">
                  {headings.map((heading, index) => (
                    <li key={heading.id} className="flex items-baseline gap-3 text-sm">
                      <span className="font-mono-ui text-[11px] font-bold text-[hsl(var(--muted-foreground))]">{String(index + 1).padStart(2, "0")}</span>
                      <a href={`#${heading.id}`} className="min-h-6 py-1 font-bold leading-6 text-[hsl(var(--foreground))] transition-colors hover:text-[hsl(var(--primary))]">{heading.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            <div className="mt-10 text-base leading-8 text-[hsl(var(--muted-foreground))]">
              {hasHtml ? (
                <div className="space-y-4 [&_div]:mb-1 [&_div]:leading-8 [&_p]:leading-8 [&_li]:leading-8 [&_strong]:font-bold [&_h1]:mt-10 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-[-.03em] [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-[1.65rem] [&_h2]:font-bold [&_h2]:tracking-[-.03em] [&_h2]:first:mt-0 [&_h3]:mt-9 [&_h3]:font-display [&_h3]:text-[1.35rem] [&_h3]:font-bold [&_h3]:tracking-[-.02em] [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-7 [&_ol]:pl-7 [&_ul]:space-y-1.5 [&_ol]:space-y-1.5 [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[hsl(var(--border))] [&_th]:bg-[hsl(var(--secondary)/.4)] [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-[hsl(var(--border))] [&_td]:p-2 [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-[hsl(var(--primary))] [&_blockquote]:pl-4 [&_blockquote]:italic" dangerouslySetInnerHTML={{ __html: postBody }} />
              ) : (
                <div className="space-y-6">{post.content.split(/\n\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
              )}
            </div>
            {toolCta && (
              <div className="mt-10 flex flex-wrap items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">{toolCta.icon === "invoice" ? <ReceiptText size={20} /> : <PenLine size={20} />}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">{toolCta.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Free, private, and no account needed — it runs entirely in your browser.</p>
                </div>
                <Link href={toolCta.href} className="btn-press inline-flex min-h-11 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-6 text-sm font-bold text-[hsl(var(--primary-foreground))]">{toolCta.label} <ArrowRight size={15} /></Link>
              </div>
            )}
            {!!post.tags?.length && (
              <div className="mt-10 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--secondary)/.6)] px-3 py-1 text-xs font-bold text-[hsl(var(--primary))]"><Tag size={12} /> {tag}</span>
                ))}
              </div>
            )}
            {!!post.faq?.length && (
              <section className="mt-12 border-t border-[hsl(var(--border))] pt-8">
                <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--primary))]">Frequently asked</p>
                <div className="mt-5 space-y-3">
                  {post.faq.map((item, index) => (
                    <details key={`${item.question}-${index}`} className="group overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                      <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left text-[15px] font-bold leading-6 text-[hsl(var(--foreground))] [&::-webkit-details-marker]:hidden">
                        <span>{item.question}</span>
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] transition-transform duration-200 group-open:rotate-45">+</span>
                      </summary>
                      {item.answer && <p className="border-t border-[hsl(var(--border))] px-4 py-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{item.answer}</p>}
                    </details>
                  ))}
                </div>
              </section>
            )}
            {post.pdfUrl && <a href={post.pdfUrl} target="_blank" rel="noreferrer" className="btn-press mt-10 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))]"><FileText size={16} /> Open attached PDF</a>}
            <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-[hsl(var(--border))] pt-6">
              <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[hsl(var(--primary))]"><ArrowLeft size={16} /> Back to the journal</Link>
              {isLocal && <button type="button" onClick={() => { deletePost(post.slug); window.location.href = "/blog"; }} className="inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--destructive))]"><Trash2 size={16} /> Delete this note</button>}
            </div>
            {relatedPosts.length > 0 && (
              <section className="mt-12 border-t border-[hsl(var(--border))] pt-8">
                <h2 className="font-display text-2xl font-bold tracking-[-.03em] text-[hsl(var(--foreground))]">Read next</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {relatedPosts.map((item) => (
                    <Link key={item.id} href={`/blog/${item.slug}`} className="tool-card group relative flex flex-col rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
                      <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--primary))]">{item.category}</span>
                      <h3 className="mt-3 font-display text-lg font-bold leading-snug tracking-[-.03em] group-hover:text-[hsl(var(--primary))]">{item.title}</h3>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{item.excerpt}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--primary))]">Read note <ArrowRight size={13} /></span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>
        </main>
      </>
    );
  }

  return (
    <>
      <ContentMeta title="Blog & Guides — Invoice & Signature Tips" description="Practical, ad-free notes on e-signatures, invoices, GST, resumes, and calmer workdays. Fresh guides from the Office Toolkit team, free to read." canonical={listingCanonical} image="/og/default.png" prevUrl={prevUrl} nextUrl={nextUrl} />
      <main>
        <JsonLd id="blog-listing" data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Office Toolkit Blog & Guides",
          url: `${ORIGIN}/blog`,
          description: "Practical, ad-free notes on e-signatures, invoices, GST, resumes, and calmer workdays.",
          blogPost: pagePosts.map((item) => ({
            "@type": "BlogPosting",
            headline: item.seo?.metaTitle || item.title,
            url: `${ORIGIN}/blog/${item.slug}`,
            datePublished: item.publishedAt,
            author: item.author ? { "@type": "Person", name: item.author } : { "@type": "Organization", name: "Office Toolkit" },
          })),
        }} />
        <ContentHeader eyebrow="The journal" title="Useful notes for the work between meetings." description="Practical, plainspoken guidance for making documents, applications, and everyday office work a little easier." />
        <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <p className="mb-8 max-w-3xl text-base leading-7 text-[hsl(var(--muted-foreground))]">The journal is short by design. Each note answers one practical question — how to sign a document cleanly, write an invoice that gets paid, or make an application easier to read — in plain language you can use immediately. New notes appear here as they are published.</p>
          <p className="mb-8 max-w-3xl text-base leading-7 text-[hsl(var(--muted-foreground))]">If you are short on time, read the first paragraph of any note — that is where the practical answer lives. The rest of the post is for when you want the reasoning, the examples, and the small details that make the advice stick. Posts are written in the same spirit as the tools: straightforward, specific, and free of padding.</p>
          <p className="mb-8 max-w-3xl text-base leading-7 text-[hsl(var(--muted-foreground))]">You can also contribute to this page. The publish option behind the scenes lets you add your own notes, which appear here alongside the articles. Everything published follows the same rules as the toolkit: it stays on your device, shows no ads, and is never sold.</p>
  
          <div className="grid gap-4 md:grid-cols-3">
            {pagePosts.map((item) => (
              <Link key={item.id} href={`/blog/${item.slug}`} className="tool-card group relative flex flex-col rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <CoverImage post={item} className="mb-5 aspect-video w-full rounded-xl object-cover" />
                <div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--primary))]">{item.category}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{[formatDate(item.publishedAt), item.readTime].filter(Boolean).join(" · ")}</span></div>
                {localPosts.some((p) => p.slug === item.slug) && <span className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-[hsl(var(--secondary)/.6)] px-2 py-0.5 text-[10px] font-bold text-[hsl(var(--primary))]"><PenLine size={11} /> Yours</span>}
                <h2 className="mt-8 font-display text-2xl font-bold leading-tight tracking-[-.04em] group-hover:text-[hsl(var(--primary))]">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.excerpt}</p>
                <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-bold text-[hsl(var(--primary))]">Read note <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <nav aria-label="Blog pages" className="mt-12 flex flex-wrap items-center justify-center gap-4">
              {prevUrl ? <Link href={prevUrl} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 text-sm font-bold transition-colors hover:bg-[hsl(var(--secondary)/.5)]"><ArrowLeft size={15} /> Newer</Link> : null}
              <span className="text-sm font-bold text-[hsl(var(--muted-foreground))]">Page {safePage} of {totalPages}</span>
              {nextUrl ? <Link href={nextUrl} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 text-sm font-bold transition-colors hover:bg-[hsl(var(--secondary)/.5)]">Older <ArrowRight size={15} /></Link> : null}
            </nav>
          )}
        </section>
      </main>
    </>
  );
}

function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [content, setContent] = useState<OfficeToolkitContent>(fallbackContent);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ text: string; kind: "success" | "error" } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = (text: string, kind: "success" | "error") => {
    setToast({ text, kind });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

useEffect(() => {
    applyPageMeta({ title: "Admin Dashboard", description: "Manage Office Toolkit blog posts, drafts, and settings.", robots: "noindex, nofollow" });
  }, []);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
      .then((response) => response.json() as Promise<{ authenticated: boolean }>)
      .then((session) => setAuthenticated(session.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!authenticated) {
      window.location.href = "/admin/login";
      return;
    }
    setLoading(true);
    fetchOfficeToolkitContent()
      .then((remote) => {
        const next = { ...fallbackContent, ...remote };
        setContent(next);
        setSelectedId((current) => (current && next.blogPosts.some((p) => p.id === current) ? current : next.blogPosts[0]?.id ?? ""));
      })
      .catch(() => setStatus("Using local defaults. Save after the API is available."))
      .finally(() => setLoading(false));
  }, [authChecked, authenticated]);

  const posts = content.blogPosts;
  const selected = useMemo(() => posts.find((p) => p.id === selectedId) ?? null, [posts, selectedId]);
  const publishedPosts = useMemo(() => posts.filter((p) => p.published !== false), [posts]);
  const draftPosts = useMemo(() => posts.filter((p) => p.published === false), [posts]);
  const categories = useMemo(() => Array.from(new Set(posts.map((p) => p.category).filter(Boolean))), [posts]);

  const isBlogList = location === "/admin/blog";
  const isDrafts = location === "/admin/drafts";
  const isPublished = location === "/admin/published";
  const isSettings = location === "/admin/settings";
  const isEditor = /^\/admin\/blog\/edit\//.test(location);
  const editId = isEditor ? location.replace(/^\/admin\/blog\/edit\//, "") : "";
  const adminView: AdminView = isSettings ? "settings" : isBlogList || isDrafts || isPublished || isEditor ? "blog" : "dashboard";
  const viewPosts = isDrafts ? draftPosts : isPublished ? publishedPosts : posts;
  const heading = isSettings ? "Settings" : isBlogList ? "Blog" : isDrafts ? "Draft blogs" : isPublished ? "Published blogs" : isEditor ? (selected?.title || "Edit post") : "Dashboard";
  const listPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return viewPosts;
    return viewPosts.filter((post) => `${post.title ?? ""}\n${post.excerpt ?? ""}\n${post.content ?? ""}\n${(post.tags ?? []).join(" ")}`.toLowerCase().includes(query));
  }, [viewPosts, searchQuery]);

  useEffect(() => {
    if (isEditor && editId && posts.some((p) => p.id === editId)) setSelectedId(editId);
  }, [isEditor, editId, posts]);

  const cleanSlugText = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const updatePost = (id: string, patch: Partial<BlogPost>) =>
    setContent((current) => ({ ...current, blogPosts: current.blogPosts.map((p) => (p.id === id ? { ...p, ...patch, ...(typeof patch.slug === "string" ? { slug: cleanSlugText(patch.slug) } : {}) } : p)) }));

  const removePost = (id: string) => {
    const next = content.blogPosts.filter((p) => p.id !== id);
    const nextContent = { ...content, blogPosts: next };
    setContent(nextContent);
    setSelectedId(next[0]?.id ?? "");
    void persist(nextContent, "publish");
  };

  const addPost = () => {
    const blank: BlogPost = {
      id: `post-${Date.now()}`,
      slug: `new-note-${Date.now()}`,
      title: "New post",
      excerpt: "",
      category: "Work habits",
      readTime: "4 min read",
      publishedAt: new Date().toISOString().slice(0, 10),
      content: "",
      author: "",
      tags: [],
      coverEnabled: true,
      faq: [],
      seo: { metaTitle: "", metaDescription: "" },
      published: false,
    };
    setContent((current) => ({ ...current, blogPosts: [blank, ...current.blogPosts] }));
    setSelectedId(blank.id);
    return blank;
  };

  const togglePostPublished = (id: string) => {
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    const nextContent = {
      ...content,
      blogPosts: content.blogPosts.map((p) => (p.id === id ? { ...p, published: post.published === false } : p)),
    };
    setContent(nextContent);
    void persist(nextContent, "publish");
  };

  const openEditor = (id: string) => {
    setSelectedId(id);
    setSidebarOpen(false);
    navigate(`/admin/blog/edit/${id}`);
  };

  const handleAddNew = () => {
    const blank = addPost();
    openEditor(blank.id);
  };

  const handleNavigate = (next: AdminView) => navigate(viewPath[next]);

  const persist = async (payload: OfficeToolkitContent, kind: "draft" | "publish" = "publish") => {
    setStatus("Savingâ€¦");
    try {
      const healedPayload: OfficeToolkitContent = {
        ...payload,
        blogPosts: (payload.blogPosts ?? []).map((p) => (p && p.content ? { ...p, content: healContentHtml(p.content) } : p)),
      };
      const saved = await saveOfficeToolkitContent(healedPayload);
      setContent(saved);
      setStatus(kind === "draft" ? "Draft saved. Find it under Draft Blogs." : "Saved. Public journal uses the new content on refresh.");
      showToast(kind === "draft" ? "Draft save ho gaya hai" : "Changes save ho gaye hain", "success");
    } catch {
      setStatus("Could not save. Check that the content service is running.");
      showToast("Save nahi ho paya, dobara try karein", "error");
    }
  };
  const saveAll = () => void persist(content, "publish");
  const saveDraft = () => {
    if (!selected) return;
    const next: OfficeToolkitContent = { ...content, blogPosts: content.blogPosts.map((p) => (p.id === selected.id ? { ...p, published: false } : p)) };
    setContent(next);
    void persist(next, "draft");
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    window.location.href = "/admin/login";
  };

  if (!authChecked) {
    return <div className="grid min-h-screen place-items-center bg-[hsl(var(--muted))]"><p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">Checking admin accessâ€¦</p></div>;
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-[hsl(var(--muted))]">
      <AdminSidebar view={adminView} onNavigate={handleNavigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={logout} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-[hsl(var(--border))] bg-[hsl(var(--card)/.9))] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSidebarOpen(true)} className="btn-press grid size-11 place-items-center rounded-lg lg:hidden" aria-label="Open menu" data-testid="button-admin-menu"><Menu size={20} /></button>
              <div>
                <h1 className="font-display text-xl font-bold tracking-[-.03em] lg:text-2xl">{heading}</h1>
                <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Office Toolkit control room</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={saveAll} className="btn-press inline-flex min-h-10 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-admin-save-top"><Save size={15} /> Save changes</button>
              {adminView === "dashboard" && (
                <button type="button" onClick={handleAddNew} className="btn-press inline-flex min-h-10 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-admin-add-top"><Plus size={15} /> Add New Blog</button>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">
          {status && <p className="mb-4 rounded-xl bg-[hsl(var(--secondary)/.5)] px-4 py-3 text-sm font-medium text-[hsl(var(--primary))]" role="status">{status}</p>}
          {loading ? (
            <p className="py-12 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Loading saved contentâ€¦</p>
          ) : isEditor ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">{selected ? "Edit post" : "Post not found"}</h2>
                  <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Use the Save changes button in the top bar to publish your edits.</p>
                </div>
                <button type="button" onClick={() => navigate("/admin/blog")} className="btn-press inline-flex min-h-10 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-sm font-bold" data-testid="button-close-editor"><ArrowLeft size={15} /> Back to blog list</button>
              </div>
              {selected ? (
                <PostEditor
                  key={selected.id}
                  post={selected}
                  categories={categories}
                  update={(patch) => updatePost(selected.id, patch)}
                  onSave={saveAll}
                  onSaveDraft={saveDraft}
                  onDelete={() => { removePost(selected.id); navigate("/admin/blog"); }}
                />
              ) : (
                <div className="rounded-[1.35rem] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 text-center text-sm font-semibold text-[hsl(var(--muted-foreground))]">This post could not be found. Go back to the blog list and pick another post.</div>
              )}
            </div>
          ) : adminView === "blog" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">{isDrafts ? `${listPosts.length} drafts` : isPublished ? `${listPosts.length} published` : `${listPosts.length} blogs`}</h2>
                  <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{isDrafts ? "Posts you have not published yet. Flip a switch ON to publish it to the site." : isPublished ? "Live posts readers can see on the website. Flip a switch OFF to hide a post." : "All your journal posts. Click Edit to open a post in a separate page."}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                    <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-9 w-48 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.25)]" placeholder={`Search ${isDrafts ? "drafts" : isPublished ? "published" : "blogs"}â€¦`} data-testid="admin-search-posts" />
                    {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="button-clear-search"><X size={13} /></button>}
                  </div>
                  <button type="button" onClick={handleAddNew} className="btn-press inline-flex min-h-9 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-admin-new-post"><Plus size={16} /> Add New Blog</button>
                </div>
              </div>
              {listPosts.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 text-center text-sm font-semibold text-[hsl(var(--muted-foreground))]">{searchQuery ? "Nothing matches your search." : isDrafts ? "No drafts yet. Click \"Add New Blog\" to start writing." : isPublished ? "No published posts yet. Flip a draft ON to publish it." : "Nothing here yet."}</div>
              ) : (
                <BlogsTable posts={listPosts} onEdit={openEditor} onDelete={removePost} onTogglePublish={togglePostPublished} />
              )}
            </div>
          ) : adminView === "settings" ? (
            <SettingsPanel />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <button type="button" onClick={() => handleNavigate("blog")} className="btn-press group rounded-[1.25rem] bg-[hsl(var(--primary))] p-6 text-left text-[hsl(var(--primary-foreground))]" data-testid="dashboard-total-card">
                  <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] opacity-80">Total Blogs</p>
                  <p className="mt-3 font-display text-6xl font-bold tracking-[-.05em]">{posts.length}</p>
                  <p className="mt-1 text-sm font-semibold opacity-85">{publishedPosts.length} published / {draftPosts.length} drafts</p>
                  <p className="mt-3 text-sm font-bold opacity-90">Open blog list <span aria-hidden="true">-&gt;</span></p>
                </button>
                <button type="button" onClick={() => navigate("/admin/drafts")} className="btn-press group rounded-[1.25rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-left" data-testid="dashboard-drafts-card">
                  <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Draft Blogs</p>
                  <p className="mt-3 font-display text-3xl font-bold tracking-[-.04em]">{draftPosts.length} draft{draftPosts.length === 1 ? "" : "s"}</p>
                  <p className="mt-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Unpublished posts waiting to go live.</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))]">Open drafts <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
                </button>
                <button type="button" onClick={() => navigate("/admin/published")} className="btn-press group rounded-[1.25rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-left" data-testid="dashboard-published-card">
                  <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Published Blogs</p>
                  <p className="mt-3 font-display text-3xl font-bold tracking-[-.04em]">{publishedPosts.length} published</p>
                  <p className="mt-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Live posts currently visible on the site.</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))]">Open published <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
                </button>
                <button type="button" onClick={() => handleNavigate("blog")} className="btn-press group rounded-[1.25rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-left" data-testid="dashboard-simple-blog">
                  <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Simple Blog</p>
                  <p className="mt-3 font-display text-3xl font-bold tracking-[-.04em]">Open blog section</p>
                  <p className="mt-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Manage, edit and publish your posts.</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))]">Blog <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
      {toast && (
        <div data-testid="admin-toast" role="status" className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-2 rounded-xl border bg-[hsl(var(--card))] px-4 py-3 text-sm font-bold shadow-lg ${toast.kind === "success" ? "border-[hsl(var(--primary)/.4)] text-[hsl(var(--primary))]" : "border-[hsl(var(--destructive)/.4)] text-[hsl(var(--destructive))]"}`}>
          {toast.kind === "success" ? <Check size={16} /> : <Info size={16} />}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}

function BlogsTable({ posts, onEdit, onDelete, onTogglePublish }: { posts: BlogPost[]; onEdit: (id: string) => void; onDelete: (id: string) => void; onTogglePublish: (id: string) => void }) {
  const confirmDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title || "Untitled post"}"? This cannot be undone.`)) onDelete(id);
  };
  return (
    <div className="overflow-x-auto rounded-[1.25rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-[hsl(var(--border))]">
            <th className="px-4 py-3 font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">SN</th>
            <th className="px-4 py-3 font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Title</th>
            <th className="px-4 py-3 font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Author</th>
            <th className="px-4 py-3 font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Status</th>
            <th className="px-4 py-3 text-right font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Action</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, index) => {
            const published = post.published !== false;
            return (
              <tr key={post.id} className="border-b border-[hsl(var(--border)/.6)] last:border-0 hover:bg-[hsl(var(--secondary)/.4)]">
                <td className="px-4 py-3 font-mono-ui text-xs text-[hsl(var(--muted-foreground))]">{String(index + 1).padStart(2, "0")}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onEdit(post.id)} className="text-left text-sm font-bold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]" data-testid={`table-title-${post.id}`}>{post.title || "Untitled post"}</button>
                  <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{post.category || "Uncategorized"}{!!post.tags?.length ? ` ${post.tags.length} tags` : ""}</p>
                </td>
                <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">{post.author || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${published ? "bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"}`}><span className={`size-1.5 rounded-full ${published ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--muted-foreground))]"}`} />{published ? "Published" : "Draft"}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button type="button" onClick={() => onEdit(post.id)} data-testid={`table-edit-${post.id}`} className="btn-press inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[hsl(var(--secondary)/.6)] px-3 text-xs font-bold"><PenLine size={13} /> Edit</button>
                    <label className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--secondary)/.6)] px-2 py-1.5">
                      <span className={`text-[10px] font-bold ${published ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"}`}>{published ? "ON" : "OFF"}</span>
                      <Switch checked={published} onCheckedChange={() => onTogglePublish(post.id)} data-testid={`table-switch-${post.id}`} aria-label={`${published ? "Unpublish" : "Publish"} ${post.title}`} />
                    </label>
                    <button type="button" onClick={() => confirmDelete(post.id, post.title)} data-testid={`table-delete-${post.id}`} aria-label={`Delete ${post.title}`} className="btn-press inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[hsl(var(--destructive)/.1)] px-3 text-xs font-bold text-[hsl(var(--destructive))]"><Trash2 size={13} /> Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
          {posts.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-sm font-semibold text-[hsl(var(--muted-foreground))]">No blogs yet. Click "Add New Blog" to create one.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SettingsPanel() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  const changePassword = async () => {
    setError("");
    setMessage("");
    if (next.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("The new password and confirmation do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError((body as { error?: string }).error ?? "Could not change the password.");
        return;
      }
      setMessage("Password changed. Use the new password next time you sign in.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setError("Could not reach the admin service.");
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setError("");
    setMessage("");
    setTempPassword("");
    setResetting(true);
    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        credentials: "include",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError((body as { error?: string }).error ?? "Could not reset the password.");
        return;
      }
      const temp = (body as { tempPassword?: string }).tempPassword ?? "";
      setTempPassword(temp);
      setMessage("A temporary password was created. Copy it now, it will not be shown again.");
    } catch {
      setError("Could not reach the admin service.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="max-w-2xl rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><KeyRound size={20} /></span>
          <div>
            <h2 className="font-display text-lg font-bold tracking-[-.02em]">Change password</h2>
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Set a new password for the admin account.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div>
            <label htmlFor="settings-current" className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Current password</label>
            <input id="settings-current" type="password" value={current} onChange={(event) => setCurrent(event.target.value)} className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm font-semibold outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.3)]" data-testid="settings-current-password" />
          </div>
          <div>
            <label htmlFor="settings-next" className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">New password</label>
            <input id="settings-next" type="password" value={next} onChange={(event) => setNext(event.target.value)} className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm font-semibold outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.3)]" data-testid="settings-new-password" />
          </div>
          <div>
            <label htmlFor="settings-confirm" className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Confirm new password</label>
            <input id="settings-confirm" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm font-semibold outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.3)]" data-testid="settings-confirm-password" />
          </div>
          {error && <p className="rounded-xl bg-[hsl(var(--destructive)/.1)] px-4 py-3 text-sm font-semibold text-[hsl(var(--destructive))]" role="alert">{error}</p>}
          {message && <p className="rounded-xl bg-[hsl(var(--secondary)/.5)] px-4 py-3 text-sm font-semibold text-[hsl(var(--primary))]" role="status">{message}</p>}
          <button type="button" onClick={changePassword} disabled={busy} className="btn-press inline-flex min-h-10 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 text-sm font-bold text-[hsl(var(--primary-foreground))] disabled:opacity-60" data-testid="button-change-password">{busy ? "Saving..." : "Change password"}</button>
        </div>
      </section>

      <section className="max-w-2xl rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><RefreshCcw size={20} /></span>
          <div>
            <h2 className="font-display text-lg font-bold tracking-[-.02em]">Forgot password</h2>
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Cannot sign in? Generate a one-time temporary password.</p>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-[hsl(var(--muted-foreground))]">&Acirc;&middot; Anyone who visits this page can replace the current password with a temporary one, as long as nothing else ever changed here.</p>
        <button type="button" onClick={resetPassword} disabled={resetting} className="btn-press mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[hsl(var(--destructive)/.1)] px-5 text-sm font-bold text-[hsl(var(--destructive))] disabled:opacity-60" data-testid="button-reset-password">{resetting ? "Generating..." : "Generate temporary password"}</button>
        {tempPassword && (
          <div className="mt-4 rounded-xl border border-dashed border-[hsl(var(--primary)/.5)] bg-[hsl(var(--secondary)/.4)] p-4">
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Temporary password</p>
            <p className="mt-2 break-all font-mono text-lg font-bold tracking-tight text-[hsl(var(--primary))]" data-testid="temp-password">{tempPassword}</p>
            <p className="mt-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">Copy this and use it on the sign-in page. It will not be shown again.</p>
          </div>
        )}
      </section>
    </div>
  );
}

type AdminView = "dashboard" | "blog" | "settings";

const viewPath: Record<AdminView, string> = {
  dashboard: "/admin",
  blog: "/admin/blog",
  settings: "/admin/settings",
};

const adminNav: { id: AdminView; label: string; icon: typeof FileText }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "blog", label: "Blog", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

function AdminSidebar({ view, onNavigate, open, onClose, onLogout }: { view: AdminView; onNavigate: (view: AdminView) => void; open: boolean; onClose: () => void; onLogout: () => void }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[hsl(var(--sidebar-border))] px-5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><FileText size={16} strokeWidth={2.4} /></span>
            <div>
              <p className="font-display text-sm font-bold leading-tight tracking-[-.02em]">Office Toolkit</p>
              <p className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.55)]">Admin panel</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10 lg:hidden" aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-2 pb-1 font-mono-ui text-[9px] font-bold uppercase tracking-[.16em] text-[hsl(var(--sidebar-foreground)/.45)]">Menu</p>
          {adminNav.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button key={item.id} type="button" onClick={() => { onNavigate(item.id); onClose(); }} data-testid={`admin-nav-${item.id}`} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${active ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "text-[hsl(var(--sidebar-foreground)/.78)] hover:bg-white/10 hover:text-[hsl(var(--sidebar-foreground))]"}`}>
                <Icon size={17} />
                <span>{item.label}</span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-[hsl(var(--primary-foreground))]" />}
              </button>
            );
          })}
        </nav>
        <div className="shrink-0 space-y-2 border-t border-[hsl(var(--sidebar-border))] px-4 py-4">
          <a href="/blog" target="_blank" rel="noreferrer" className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-bold text-[hsl(var(--sidebar-foreground))] transition-colors hover:bg-white/10" data-testid="button-view-site"><Eye size={16} /> View site</a>
          <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-bold text-[hsl(var(--destructive))] transition-colors hover:bg-white/10" data-testid="button-admin-logout"><LogOut size={16} /> Log out</button>
          <div className="pt-1">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-[hsl(var(--sidebar-foreground)/.45)]">Signed in</p>
            <p className="mt-1 text-xs font-bold">Admin</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function StatCard({ label, value, hint, active, onClick, dataTest }: { label: string; value: number; hint: string; active: boolean; onClick: () => void; dataTest: string }) {
  return (
    <button type="button" data-testid={dataTest} onClick={onClick} className={`btn-press rounded-[1.25rem] border p-4 text-left transition-colors ${active ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.08)]" : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/.4)]"}`}>
      <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className="mt-1.5 font-display text-4xl font-bold tracking-[-.04em] text-[hsl(var(--foreground))]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{hint}</p>
    </button>
  );
}

function PostList({ title, posts, selectedId, onSelect, onDelete, onTogglePublish }: { title: string; posts: BlogPost[]; selectedId: string; onSelect: (id: string) => void; onDelete: (id: string) => void; onTogglePublish: (id: string) => void }) {
  return (
    <section className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">{title} · {posts.length}</h2>
      </div>
      <div className="mt-3 space-y-2">
        {posts.length === 0 && <p className="px-1 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">Nothing here yet.</p>}
        {posts.map((post) => {
          const published = post.published !== false;
          return (
            <div key={post.id} className={`group flex flex-col gap-2 rounded-xl border px-3 py-2.5 transition-colors ${selectedId === post.id ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.08)]" : "border-transparent hover:bg-[hsl(var(--secondary))]"}`}>
              <div className="flex cursor-pointer items-center justify-between gap-2" onClick={() => onSelect(post.id)} data-testid={`admin-post-item-${post.id}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[hsl(var(--foreground))]">{post.title || "Untitled post"}</p>
                  <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{post.publishedAt} · {post.category || "Uncategorized"}{!!post.tags?.length ? ` · ${post.tags.length} tags` : ""}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${published ? "bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"}`}>{published ? <Eye size={11} /> : <EyeOff size={11} />} {published ? "Published" : "Draft"}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 border-t border-[hsl(var(--border)/.6)] pt-2">
                <button type="button" onClick={() => onSelect(post.id)} className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[hsl(var(--secondary)/.5)] px-2 text-xs font-bold" data-testid={`admin-post-edit-${post.id}`}><PenLine size={12} /> Edit</button>
                <label className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--secondary)/.6)] px-2 py-1.5">
                  <span className={`text-[10px] font-bold ${published ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"}`}>{published ? "ON" : "OFF"}</span>
                  <Switch checked={published} onCheckedChange={() => onTogglePublish(post.id)} data-testid={`admin-post-switch-${post.id}`} aria-label={`${published ? "Unpublish" : "Publish"} ${post.title}`} />
                </label>
                <button type="button" aria-label={`Delete ${post.title}`} onClick={() => onDelete(post.id)} className="btn-press inline-flex min-h-7 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[hsl(var(--destructive)/.1)] px-2 text-xs font-bold text-[hsl(var(--destructive))]" data-testid={`admin-post-delete-${post.id}`}><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PostEditor({ post, categories, update, onSave, onSaveDraft, onDelete }: {
  post: BlogPost;
  categories: string[];
  update: (patch: Partial<BlogPost>) => void;
  onSave: () => void;
  onSaveDraft: () => void;
  onDelete: () => void;
}) {
  const [tagText, setTagText] = useState("");
  const [pasteInfo, setPasteInfo] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [imageStatus, setImageStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [aiTagsBusy, setAiTagsBusy] = useState(false);
  const [aiTagsError, setAiTagsError] = useState("");
  const [aiFaqBusy, setAiFaqBusy] = useState(false);
  const [aiFaqError, setAiFaqError] = useState("");
  const [seoBusy, setSeoBusy] = useState(false);
  const [seoError, setSeoError] = useState("");
  const [seoOptions, setSeoOptions] = useState<{ meta_titles: string[]; meta_descriptions: string[] } | null>(null);

  useEffect(() => {
    if (post.imageUrl) {
      if (imageStatus === "idle") setImageStatus("loading");
    } else {
      setImageStatus("idle");
    }
  }, [post.imageUrl, imageStatus]);

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: string[] = [];
    for (const category of [...CATEGORY_OPTIONS, ...categories, post.category]) {
      const clean = category.trim();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        options.push(clean);
      }
    }
    return options;
  }, [categories, post.category]);

  const patchTagList = (tags: string[]) => update({ tags: tags.slice(0, 12) });
  const addTag = (raw: string) => {
    const value = raw.trim().replace(/^#/, "");
    if (!value) return;
    const current = post.tags ?? [];
    if (current.some((t) => t.toLowerCase() === value.toLowerCase())) return;
    patchTagList([...current, value]);
  };
  const generateTags = async () => {
    setAiTagsError("");
    setAiTagsBusy(true);
    try {
      const result = await runAi({ kind: "tags", title: post.title, content: post.content, excerpt: post.excerpt });
      if (!Array.isArray(result) || !result.every(isString)) throw new Error("invalid response");
      const list = (result as string[]).map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
      if (!list.length) throw new Error("empty tags");
      const merged = [...(post.tags ?? [])];
      for (const tag of list) {
        if (!merged.some((t) => t.toLowerCase() === tag.toLowerCase())) merged.push(tag);
      }
      patchTagList(merged);
    } catch {
      setAiTagsError("Tags generate nahi ho paye, dobara try karein.");
    } finally {
      setAiTagsBusy(false);
    }
  };
  const generateFaq = async () => {
    setAiFaqError("");
    setAiFaqBusy(true);
    try {
      const result = await runAi({ kind: "faq", title: post.title, content: post.content, excerpt: post.excerpt });
      if (!Array.isArray(result) || !result.every((item) => item && isString((item as BlogFaq).question) && isString((item as BlogFaq).answer))) throw new Error("invalid response");
      const list = (result as BlogFaq[]).slice(0, 6);
      update({ faq: list });
    } catch {
      setAiFaqError("FAQ generate nahi ho paya, dobara try karein.");
    } finally {
      setAiFaqBusy(false);
    }
  };
  const generateSeo = async () => {
    setSeoError("");
    setSeoBusy(true);
    try {
      const result = await runAi({ kind: "seo", title: post.title, content: post.content, excerpt: post.excerpt });
      const shaped = result as { meta_titles?: unknown; meta_descriptions?: unknown };
      if (!shaped || !Array.isArray(shaped.meta_titles) || !shaped.meta_titles.every(isString) || !Array.isArray(shaped.meta_descriptions) || !shaped.meta_descriptions.every(isString)) throw new Error("invalid response");
      setSeoOptions({ meta_titles: shaped.meta_titles.slice(0, 3), meta_descriptions: shaped.meta_descriptions.slice(0, 3) });
    } catch {
      setSeoError("SEO options generate nahi ho paye, dobara try karein.");
    } finally {
      setSeoBusy(false);
    }
  };
  const convertPaste = (raw: string) => {
    const draft = blogDraftFromPaste(raw);
    const freshTitle = !post.title || post.title === "New post" || post.title === "Untitled post";
    const freshSlug = !post.slug || post.slug.startsWith("new-note-") || post.slug.startsWith("untitled-");
    update({
      title: freshTitle ? draft.title : post.title,
      slug: freshSlug ? draft.slug : post.slug,
      excerpt: post.excerpt ? post.excerpt : draft.excerpt,
      readTime: draft.readTime,
    });
    setPasteInfo("Paste converted - clean blog format applied below. Title and slug auto-filled.");
  };

  const inputClass = "w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.25)]";
  const labelClass = "mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]";

  return (
    <section className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--primary))]">Edit post</p>
          <h2 className="mt-1 font-display text-xl font-bold">{post.title || "Untitled post"}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${post.published !== false ? "bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"}`}>{post.published !== false ? <Eye size={13} /> : <EyeOff size={13} />} {post.published !== false ? "Published" : "Draft"}</span>
          <button type="button" onClick={onDelete} className="btn-press inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.05)] px-3 text-xs font-bold text-[hsl(var(--destructive))]"><Trash2 size={13} /> Delete</button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="order-2 space-y-5 lg:order-1">
          <label className="block">
            <span className={labelClass}>Title</span>
            <input value={post.title} onChange={(event) => update({ title: event.target.value })} className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.25)]" data-testid="admin-input-title" />
          </label>

          <label className="block">
            <span className={labelClass}>URL Slug</span>
            <div className="flex gap-2">
              <input value={post.slug} onChange={(event) => update({ slug: event.target.value })} className={inputClass} data-testid="admin-input-slug" />
              <button type="button" onClick={() => update({ slug: slugify(post.title) })} className="btn-press shrink-0 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-xs font-bold">From title</button>
            </div>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Category</span>
              <select value={post.category} onChange={(event) => update({ category: event.target.value })} className={inputClass} data-testid="admin-select-category">{categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select>
            </label>
            <label className="block">
              <span className={labelClass}>Author</span>
              <input value={post.author ?? ""} onChange={(event) => update({ author: event.target.value })} className={inputClass} placeholder="e.g. Alex Morgan" data-testid="admin-input-author" />
            </label>
          </div>

          <div className="rounded-xl border border-dashed border-[hsl(var(--border))] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={labelClass + " mb-0"}>Cover page</span>
              <label className="flex items-center gap-2 text-xs font-bold text-[hsl(var(--muted-foreground))]">
                <Switch checked={post.coverEnabled !== false} onCheckedChange={(checked) => update({ coverEnabled: checked })} data-testid="switch-cover-enabled" />
                {post.coverEnabled !== false ? "Active" : "Inactive"}
              </label>
            </div>
            {post.coverEnabled !== false && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <AdminUpload accept="image/*" label="Upload cover image" onUploaded={(url) => { setImageStatus("loading"); update({ imageUrl: url }); }} />
                  <input value={post.imageUrl ?? ""} onChange={(event) => { setImageStatus("loading"); update({ imageUrl: event.target.value }); }} className={inputClass} placeholder="https://... image URL" data-testid="admin-input-image-url" />
                </div>
                <label className="block">
                  <span className={labelClass}>Alt Text <span className="font-normal">(read aloud by screen readers; shown if the image fails)</span></span>
                  <input value={post.imageAlt ?? ""} onChange={(event) => update({ imageAlt: event.target.value })} className={inputClass} placeholder={post.title || "Describe the cover image"} data-testid="admin-input-alt-text" />
                </label>
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-[hsl(var(--border))]">
                  {post.imageUrl && imageStatus !== "error" ? (
                    <img loading="lazy" key={post.imageUrl} src={post.imageUrl} alt={post.imageAlt || post.title || "Cover image"} className="h-full w-full object-cover" onLoad={() => setImageStatus("loaded")} onError={() => setImageStatus("error")} data-testid="img-cover-preview" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center" data-testid="img-cover-placeholder">
                      <ImageIcon size={20} className={post.imageUrl ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--muted-foreground))]"} />
                      <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{post.imageUrl ? (post.imageAlt || "Image load nahi ho payi") : "No cover image yet"}</p>
                    </div>
                  )}
                </div>
                {post.imageUrl && <button type="button" onClick={() => { setImageStatus("idle"); update({ imageUrl: undefined }); }} className="text-xs font-bold text-[hsl(var(--destructive))]">Remove image</button>}
                <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">Preview matches the real blog image size (16:9).</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-dashed border-[hsl(var(--border))] p-4">
            <div className="flex items-center justify-between"><span className={labelClass + " mb-0"}>Tags</span><span className="inline-flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))]"><Tag size={13} /> {post.tags?.length ?? 0}</span></div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(post.tags ?? []).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--secondary)/.6)] px-3 py-1 text-xs font-bold text-[hsl(var(--primary))]">{tag}<button type="button" aria-label={`Remove ${tag}`} onClick={() => patchTagList((post.tags ?? []).filter((t) => t !== tag))} className="hover:text-[hsl(var(--destructive))]"><X size={12} /></button></span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={tagText} onChange={(event) => setTagText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(tagText); setTagText(""); } }} className={inputClass} placeholder="Type a tag and press Enter" data-testid="admin-input-tag" />
              <button type="button" onClick={() => { addTag(tagText); setTagText(""); }} className="btn-press shrink-0 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-xs font-bold">Add</button>
            </div>
            <div className="mt-3 rounded-xl bg-[hsl(var(--secondary)/.4)] p-3">
                <button type="button" onClick={generateTags} disabled={aiTagsBusy} className="btn-press inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 text-xs font-bold text-[hsl(var(--primary-foreground))] disabled:opacity-60" data-testid="button-ai-tags"><Sparkles size={14} /> {aiTagsBusy ? "Generating tags..." : "Generate tags (AI)"}</button>
                {aiTagsError && <p className="mt-2 text-xs font-semibold text-[hsl(var(--destructive))]" data-testid="ai-tags-error">{aiTagsError}</p>}
              </div>
          </div>

          <div className="rounded-xl border border-dashed border-[hsl(var(--border))] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><span className={labelClass + " mb-0"}>FAQ</span><button type="button" onClick={generateFaq} disabled={aiFaqBusy} className="btn-press inline-flex min-h-8 items-center gap-2 rounded-lg bg-[hsl(var(--secondary)/.5)] px-3 text-xs font-bold text-[hsl(var(--primary))]" data-testid="button-ai-faq"><Sparkles size={13} /> {aiFaqBusy ? "Generating FAQ..." : "Generate FAQ (AI)"}</button></div>
            {aiFaqError && <p className="mt-2 text-xs font-semibold text-[hsl(var(--destructive))]" data-testid="ai-faq-error">{aiFaqError}</p>}
            <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Questions are suggested automatically from the title. You can edit or add your own.</p>
            <div className="mt-4 space-y-3">
              {(post.faq ?? []).map((item, index) => (
                <div key={`${item.question}-${index}`} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <input value={item.question} onChange={(event) => { const faq = [...(post.faq ?? [])]; faq[index] = { ...item, question: event.target.value }; update({ faq }); }} className={inputClass} placeholder="Question" data-testid={`admin-input-faq-q-${index}`} />
                    <button type="button" aria-label="Delete FAQ item" onClick={() => update({ faq: (post.faq ?? []).filter((_, i) => i !== index) })} className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"><Trash2 size={15} /></button>
                  </div>
                  <textarea value={item.answer} onChange={(event) => { const faq = [...(post.faq ?? [])]; faq[index] = { ...item, answer: event.target.value }; update({ faq }); }} className={`${inputClass} min-h-20 resize-y leading-6`} placeholder="Answer" data-testid={`admin-input-faq-a-${index}`} />
                </div>
              ))}
              {(post.faq ?? []).length === 0 && <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">No FAQ items yet.</p>}
              <div className="flex flex-wrap gap-2">
                <input value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)} className={inputClass} placeholder="Add your own question" data-testid="admin-input-faq-new-q" />
                <button type="button" onClick={() => { if (!faqQuestion.trim()) return; update({ faq: [...(post.faq ?? []), { question: faqQuestion.trim(), answer: faqAnswer.trim() }] }); setFaqQuestion(""); setFaqAnswer(""); }} className="btn-press shrink-0 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-xs font-bold">Add</button>
              </div>
              <textarea value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)} className={`${inputClass} min-h-16 resize-y leading-6`} placeholder="Answer for the question above (optional)" data-testid="admin-input-faq-new-a" />
            </div>
          </div>

          <div className="rounded-xl border border-[hsl(var(--border))] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-bold"><Globe size={15} className="text-[hsl(var(--primary))]" /> SEO</p>
              <button type="button" onClick={generateSeo} disabled={seoBusy} className="btn-press inline-flex min-h-8 items-center gap-2 rounded-lg bg-[hsl(var(--secondary)/.5)] px-3 text-xs font-bold text-[hsl(var(--primary))]" data-testid="button-ai-seo"><Sparkles size={13} /> {seoBusy ? "Generating..." : "Generate (AI)"}</button>
            </div>
            {seoError && <p className="mt-2 text-xs font-semibold text-[hsl(var(--destructive))]" data-testid="ai-seo-error">{seoError}</p>}
            <div className="mt-4 space-y-4">
              <label className="block"><span className={labelClass}>Meta title <span className="font-normal">(overrides the post title in search results)</span></span><input value={post.seo?.metaTitle ?? ""} onChange={(event) => update({ seo: { ...post.seo, metaTitle: event.target.value } })} className={inputClass} data-testid="admin-input-seo-title" /><span className="mt-1 block text-right text-[10px] font-semibold" data-testid="seo-title-count">{(post.seo?.metaTitle ?? "").length} / 60</span></label>
              <label className="block"><span className={labelClass}>Meta description</span><textarea value={post.seo?.metaDescription ?? ""} onChange={(event) => update({ seo: { ...post.seo, metaDescription: event.target.value } })} className={`${inputClass} min-h-24 resize-y`} data-testid="admin-input-seo-description" /><span className="mt-1 block text-right text-[10px] font-semibold" data-testid="seo-desc-count">{(post.seo?.metaDescription ?? "").length} / 160</span></label>
              {seoOptions && (
                <div className="space-y-3 rounded-lg bg-[hsl(var(--secondary)/.3)] p-3">
                  <p className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Generated options - click to fill</p>
                  <div className="space-y-1.5">
                    {seoOptions.meta_titles.map((option, index) => (
                      <button key={`mt-${index}`} type="button" onClick={() => update({ seo: { ...post.seo, metaTitle: option } })} className="flex w-full items-center justify-between gap-2 rounded-lg bg-[hsl(var(--card))] px-2.5 py-2 text-left text-xs font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--primary)/.08)]" data-testid={`seo-title-option-${index}`}><span className="min-w-0 flex-1 truncate">{option}</span><span className="shrink-0 text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{option.length} / 60</span></button>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {seoOptions.meta_descriptions.map((option, index) => (
                      <button key={`md-${index}`} type="button" onClick={() => update({ seo: { ...post.seo, metaDescription: option } })} className="flex w-full items-center justify-between gap-2 rounded-lg bg-[hsl(var(--card))] px-2.5 py-2 text-left text-xs font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--primary)/.08)]" data-testid={`seo-desc-option-${index}`}><span className="min-w-0 flex-1 truncate">{option}</span><span className="shrink-0 text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{option.length} / 160</span></button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-[hsl(var(--muted)/.6)] p-4">
            <label className="flex items-center justify-between">
              <span className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Published</span>
              <Switch checked={post.published !== false} onCheckedChange={(checked) => update({ published: checked })} data-testid="switch-published" />
            </label>
            <button type="button" onClick={onSaveDraft} className="btn-press inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-sm font-bold" data-testid="button-admin-save-draft"><Save size={15} /> Save as draft</button>
            <button type="button" onClick={onSave} className="btn-press inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-admin-save"><Save size={15} /> Save changes</button>
          </div>
        </div>

        <div className="order-1 space-y-5 lg:order-2">
          <div>
            <span className={labelClass}>Content <span className="font-normal">(bold, italic, alignment — paste anywhere here to auto-convert)</span></span>
            {pasteInfo && <span className="mb-1.5 block text-xs font-semibold text-[hsl(var(--primary))]">{pasteInfo}</span>}
            <RichTextEditor initial={post.content} onChange={(html) => update({ content: html })} onPasteText={convertPaste} />
          </div>
          <label className="block">
            <span className={labelClass}>Excerpt <span className="font-normal">(big summary shown on cards)</span></span>
            <textarea value={post.excerpt} onChange={(event) => update({ excerpt: event.target.value })} className={`${inputClass} min-h-44 resize-y leading-6`} data-testid="admin-input-excerpt" />
          </label>
        </div>
      </div>
    </section>
  );
}

function RichTextEditor({ initial, onChange, onPasteText }: { initial: string; onChange: (html: string) => void; onPasteText?: (text: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== initial) ref.current.innerHTML = initial;
  }, [initial]);

  const sync = () => onChange(ref.current?.innerHTML ?? "");
  const run = (command: string, value?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, value);
    sync();
  };

  const insertHtml = (html: string) => {
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    sync();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const html = event.clipboardData?.getData("text/html") ?? "";
    const text = event.clipboardData?.getData("text/plain") ?? "";
    event.preventDefault();
    if (html.trim()) {
      insertHtml(sanitizePasteHtml(html));
    } else if (text.trim()) {
      insertHtml(plainTextToBlogHtml(text));
    }
    if (text.trim()) onPasteText?.(text);
  };

  const ToolButton = ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" title={title} aria-label={title} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="grid size-8 place-items-center rounded-lg text-sm font-bold hover:bg-[hsl(var(--secondary))]">{children}</button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] focus-within:ring-2 focus-within:ring-[hsl(var(--ring)/.25)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[hsl(var(--border))] px-2 py-1.5">
        <ToolButton title="Bold" onClick={() => run("bold")}><Bold size={15} /></ToolButton>
        <ToolButton title="Italic" onClick={() => run("italic")}><Italic size={15} /></ToolButton>
        <span className="mx-1 h-5 w-px bg-[hsl(var(--border))]" />
        <ToolButton title="Align left" onClick={() => run("justifyLeft")}><AlignLeft size={15} /></ToolButton>
        <ToolButton title="Align center" onClick={() => run("justifyCenter")}><AlignCenter size={15} /></ToolButton>
        <ToolButton title="Align right" onClick={() => run("justifyRight")}><AlignRight size={15} /></ToolButton>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning className="max-h-[700px] min-h-[400px] overflow-y-auto p-4 text-[15px] leading-7 outline-none [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:first:mt-0 [&_ul]:list-disc [&_ul]:pl-6 [&_h2+p]:mt-2 [&_h2+ul]:mt-2" onInput={sync} onBlur={sync} onPaste={handlePaste} data-testid="admin-rich-content" />
    </div>
  );
}

function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      window.location.href = "/admin";
    } catch {
      setError("Could not reach the admin service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <><ContentMeta title="Admin login" description="Sign in to manage Office Toolkit journal posts." robots="noindex, nofollow" /><main className="grid min-h-screen place-items-center bg-[hsl(var(--muted))] px-5 py-12"><section className="w-full max-w-md rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7 shadow-sm md:p-9"><div className="grid size-12 place-items-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><LockKeyhole size={21} /></div><p className="mt-7 font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">Restricted workspace</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em]">Admin sign in</h1><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Sign in to edit journal posts from your blog dashboard.</p><form onSubmit={submit} className="mt-7 space-y-4"><input type="text" name="username" value="admin" readOnly autoComplete="username" tabIndex={-1} aria-hidden="true" className="sr-only" /><label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Admin password</span><div className="relative"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={showPassword ? "off" : "current-password"} required className="h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.25)]" data-testid="input-admin-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} data-testid="button-toggle-admin-password" className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <p className="rounded-xl bg-[hsl(var(--destructive)/.1)] px-3 py-2.5 text-sm text-[hsl(var(--destructive))]" role="alert">{error}</p>}<button type="submit" disabled={submitting} className="btn-press inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] text-sm font-bold text-[hsl(var(--primary-foreground))] disabled:cursor-wait disabled:opacity-60" data-testid="button-admin-login"><LogIn size={16} /> {submitting ? "Signing inâ€¦" : "Sign in"}</button></form><ForgotPasswordButton /></section></main></>;
}

function ForgotPasswordButton() {
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [error, setError] = useState("");

  const recover = async () => {
    setError("");
    setTempPassword("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/reset", { method: "POST", credentials: "include" });
      const body = (await response.json()) as { error?: string; tempPassword?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not reset the password.");
        return;
      }
      setTempPassword(body.tempPassword ?? "");
    } catch {
      setError("Could not reach the admin service.");
    } finally {
      setBusy(false);
    }
  };

  if (tempPassword) {
    return (
      <div className="rounded-xl border border-dashed border-[hsl(var(--primary)/.5)] bg-[hsl(var(--secondary)/.4)] p-4">
        <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Temporary password</p>
        <p className="mt-2 break-all font-mono text-lg font-bold tracking-tight text-[hsl(var(--primary))]" data-testid="login-temp-password">{tempPassword}</p>
        <p className="mt-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">Copy this password and use it to sign in. It will not be shown again.</p>
        <button type="button" onClick={() => { setTempPassword(""); setError(""); }} className="btn-press mt-3 inline-flex min-h-9 items-center rounded-lg bg-[hsl(var(--primary))] px-4 text-xs font-bold text-[hsl(var(--primary-foreground))]">I have copied it</button>
        {error && <p className="mt-3 text-xs font-bold text-[hsl(var(--destructive))]" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={recover} disabled={busy} className="btn-press inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-xs font-bold text-[hsl(var(--primary))] hover:underline disabled:opacity-60" data-testid="button-forgot-password"><RefreshCcw size={13} /> {busy ? "Generating..." : "Forgot password?"}</button>
      {error && <p className="text-xs font-bold text-[hsl(var(--destructive))]" role="alert">{error}</p>}
    </div>
  );
}

function AdminInput({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  const className = "w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.25)]";
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">{label}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${className} min-h-24 resize-y`} /> : <input value={value} onChange={(event) => onChange(event.target.value)} className={className} />}</label>;
}

function AdminUpload({ accept, label, onUploaded, onError }: { accept: string; label: string; onUploaded: (url: string) => void; onError?: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resizeCoverImage = (file: File) => new Promise<File>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const width = 1280;
      const height = 720;
      const scale = Math.max(width / img.width, height / img.height);
      const sw = width / scale;
      const sh = height / scale;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) { resolve(file); return; }
      context.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        resolve(new File([blob], name, { type: "image/jpeg" }));
      }, "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const image = file.type.startsWith("image/") ? await resizeCoverImage(file) : file;
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": image.type || "application/octet-stream", "X-File-Name": encodeURIComponent(image.name) },
        body: image,
      });
      if (!response.ok) throw new Error("Upload failed. Try again.");
      const result = (await response.json()) as { url?: string };
      if (!result.url) throw new Error("Upload returned no URL.");
      onUploaded(result.url);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  return (
    <div>
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="btn-press inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--secondary)/.5)] px-3 py-2 text-xs font-bold text-[hsl(var(--primary))] disabled:opacity-60"><Upload size={14} /> {busy ? "Uploadingâ€¦" : label}</button>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file).catch(() => undefined); }} />
    </div>
  );
}

const STOP_WORDS = new Set("a an the and or but not just get got can for with from your our theirs this that these those about into onto over under again once then some any all each few more most other be been being have has had do does doing will would should could may might must make makes made making use used using know need needs work works wrote written write good great new thing things small point points part parts place day days time form clear very much many still even want".split(" "));

const isKeyword = (word: string) => word.length > 3 && !STOP_WORDS.has(word) && !/^\d+$/.test(word);

function titleCase(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function keywordFrequencies(...texts: string[]): [string, number][] {
  const freq: Record<string, number> = {};
  for (const text of texts) {
    for (const word of text.toLowerCase().replace(/[^a-z0-9'-]+/g, " ").split(/[\s'-]+/)) {
      if (isKeyword(word)) freq[word] = (freq[word] ?? 0) + 1;
    }
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function cleanTopic(value: string) {
  return value.replace(/[^\w\s-]+/g, "").trim();
}

function suggestTags(topic: string, title: string, content: string): string[] {
  const titleWords = title.toLowerCase().replace(/[^a-z0-9'-]+/g, " ").split(/\s+/).filter(isKeyword);
  const contentWords = keywordFrequencies(content).map(([word]) => word);
  const topicParts = cleanTopic(topic).split(/\s+/).map((word) => word.toLowerCase()).filter(isKeyword);
  const raw: string[] = [];
  for (const word of [...topicParts, ...titleWords, ...contentWords]) {
    if (!raw.some((existing) => existing.toLowerCase() === word)) raw.push(word);
  }
  return raw.slice(0, 10).map(titleCase);
}

const CATEGORY_OPTIONS = ["Work habits", "Career", "Documents", "Productivity", "Signatures", "Invoices", "Resumes", "Templates", "Finance", "Freelancing", "AI tools", "Writing", "Design", "Business", "Personal growth"];

function sentences(text: string): string[] {
  return (text.match(/[^.!?\n]+[.!?]*/g) ?? []).map((sentence) => sentence.trim().replace(/\s+/g, " ")).filter(Boolean);
}

function titleCasePhrase(value: string) {
  return value.split(/\s+/).map(titleCase).join(" ");
}

function suggestFaq(title: string, content = ""): BlogFaq[] {
  const base = cleanTopic(title).split(/\s+/).slice(0, 6).join(" ");
  const key = (keywordFrequencies(title)[0]?.[0] ?? (base || "this topic")).toLowerCase();
  const labelled = titleCasePhrase(key);
  const all = sentences(content);
  const first = all[0] ?? "";
  const pickContaining = (words: string[]) => all.find((sentence) => words.some((word) => sentence.toLowerCase().includes(word)));

  const answerFor = (fallback: string) => {
    const found = pickContaining(["important", "benefit", "help", "helps", "make", "makes", "easier", "faster", "faster", "simple", "start", "begin", "first", "step", "include", "add", "write", "use", "avoid", "mistake", "instead", "not"]);
    return found ?? fallback;
  };

  return [
    { question: `What is ${labelled}?`, answer: first ? `${first}` : `This post explains ${labelled} in practical terms.` },
    { question: `Why is ${labelled} important?`, answer: answerFor(`Getting ${labelled} right saves time and removes friction from your workday.`) },
    { question: `How do I get started with ${labelled}?`, answer: answerFor(`Start by reading the post and applying the first suggestion you can complete today.`) },
    { question: `What should I avoid with ${labelled}?`, answer: answerFor(`The post points out the most common mistakes so you can steer clear of them.`) },
  ];
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || `note-${Date.now()}`;
}

function toolCtaForPost(post: BlogPost): { href: string; title: string; label: string; icon: "signature" | "invoice" } | null {
  const hay = `${post.title ?? ""}\n${post.excerpt ?? ""}\n${post.category ?? ""}\n${(post.tags ?? []).join(" ")}`.toLowerCase();
  const invoiceMatch = /invoice|gst|bill|billing|paid|payment|quotation|quote|freelanc/.test(hay);
  const signMatch = /sign|signing|signature|contract|offer letter|approval/.test(hay);
  if (invoiceMatch) return { href: "/invoice-generator", title: "Create a clear invoice, ready to send", label: "Open the free invoice generator", icon: "invoice" };
  if (signMatch) return { href: "/e-signature-maker", title: "Sign a document in minutes, in your browser", label: "Use the free e-signature online tool", icon: "signature" };
  return null;
}

const GENERIC_WORDS = new Set("business tool tools tips guide things stuff make makes making use using need needs know good great best simple quick easy learn learning online new work works ways way step steps start starting get getting important important best practices best-practices".split(" "));

const isString = (value: unknown): value is string => typeof value === "string";

const uniqueNonEmpty = (values: string[]) => Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const PASTE_ALLOWED_TAGS = new Set(["h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "table", "thead", "tbody", "tr", "td", "th", "strong", "em", "a", "pre", "code", "blockquote", "br"]);

function sanitizePasteHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rendered: string[] = [];
  const renderNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent ?? "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (el.hasAttribute("data-mce-style")) return "";
    if (tag === "img" || tag === "script" || tag === "style" || tag === "iframe" || tag === "svg") return "";
    const inner = Array.from(el.childNodes).map(renderNode).join("");
    const inlineWrapper: Record<string, string | null> = { b: "strong", strong: "strong", i: "em", em: "em", u: "u", s: "del", strike: "del", del: "del", font: null, span: null, mark: null };
    if (tag in inlineWrapper) {
      const mapped = inlineWrapper[tag];
      return mapped ? `<${mapped}>${inner}</${mapped}>` : inner;
    }
    if (!PASTE_ALLOWED_TAGS.has(tag)) return inner;
    if (tag === "a") {
      const href = el.getAttribute("href")?.trim();
      return href ? `<a href="${escapeHtml(href)}">${inner}</a>` : inner;
    }
    if (tag === "br") return "<br>";
    return `<${tag}>${inner}</${tag}>`;
  };
  for (const child of Array.from(doc.body.childNodes)) {
    const block = renderNode(child);
    if (block.trim()) rendered.push(block);
  }
  return rendered.join("\n").replace(/(<ul>[^]*?<\/ul>)/g, (m) => m).replace(/\n{3,}/g, "\n\n");
}

function plainTextToBlogHtml(text: string): string {
  const clean = text.replace(/\r\n/g, "\n").replace(/\t /g, "\t");
  const lines = clean.split("\n");
  const trimmed = lines.map((line) => line.trim()).filter((line) => line.length > 0);

  const tabCounts = trimmed.map((line) => (line.includes("\t") ? line.split("\t").length : 0)).filter((count) => count >= 2);
  const pipeDone = trimmed.filter((line) => line.startsWith("|") || line.includes(" | "));
  if ((tabCounts.length >= 2 && new Set(tabCounts).size === 1) || pipeDone.length >= 2) {
    const rows = (tabCounts.length >= 2 ? trimmed : pipeDone).map((line) =>
      line.startsWith("|") || line.includes(" | ") ? line.replace(/^\s*\||\|\s*$/g, "").split("|").map((cell) => cell.trim()) : line.split("\t").map((cell) => cell.trim()),
    );
    const head = rows[0];
    const body = rows.slice(1).filter((r) => r.some((cell) => /[A-Za-z0-9]/.test(cell)));
    const cell = (value: string, tag: "th" | "td") => `<${tag}>${escapeHtml(value.replace(/[*#_`]/g, ""))}</${tag}>`;
    return `<table><thead><tr>${head.map((c) => cell(c, "th")).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => cell(c, "td")).join("")}</tr>`).join("")}</tbody></table>`;
  }

  const blocks: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: string[] | null = null;
  const flushList = () => {
    if (list) {
      const tagList = list.ordered ? "ol" : "ul";
      blocks.push(`<${tagList}>${list.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tagList}>`);
      list = null;
    }
  };
  const flushCode = () => {
    if (code) {
      blocks.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      code = null;
    }
  };

  for (const line of trimmed) {
    if (line.startsWith("```")) {
      flushList();
      if (code) { flushCode(); continue; }
      code = [];
      continue;
    }
    if (code) { code.push(line); continue; }
    const bullet = line.match(/^(?:[-*\u2022]\s+)(.*)$/)?.[1];
    const numbered = line.match(/^(?:\d+[.)]\s+)(.*)$/)?.[1];
    if (bullet || numbered) {
      flushCode();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; }
      list.items.push((bullet ?? numbered ?? "").trim());
      continue;
    }
    flushList();
    flushCode();
    const isHeading = line.length <= 90 && line.split(/\s+/).length <= 9 && !/[.!?:;,]$/.test(line) && /[A-Za-z0-9]/.test(line);
    blocks.push(isHeading && blocks.length ? `<h2>${escapeHtml(line)}</h2>` : `<p>${escapeHtml(line)}</p>`);
  }
  flushList();
  flushCode();
  return blocks.join("\n");
}

const pLooksLikeHeading = (text: string) => {
  const t = text.trim();
  return t.length > 0 && t.length <= 90 && t.split(/\s+/).length <= 9 && !/[.!:,;]$/.test(t) && /[A-Za-z0-9]/.test(t) && !/^\d+[.)]/.test(t);
};

const STEP_LEADIN_RE = /(look like this|workflow(?: can| could| would)?(?: look)? like|as follows|steps?(?: below)? to(?: follow)?|checklist|can look like|process looks like|such as|sample steps|example)\s*[;:]?$/i;
const STEP_SUMMARY_RE = /^(this|that|these|those|it|so|in short|overall|in the end|in summary|ultimately)\b/i;

function healContentHtml(content: string): string {
  let html = String(content ?? "").replace(/\r\n/g, "\n").trim();
  if (!html) return "";
  if (!/<\/?[a-z][^>]*>/i.test(html)) return plainTextToBlogHtml(html);

  html = html.replace(/<h([23])[^>]*>([^<]*?)<\/h(?![0-9a-z])/gi, (_m, lvl, attrs, text) => `<h${lvl}${attrs}>${text}</h${lvl}>`);
  html = html.replace(/<h1([^>]*)>([^<]*?)<\/h1>/gi, (_m, attrs, text) => `<h2${attrs}>${text}</h2>`);
  html = html.replace(/<p[^>]*>\s*<\/p>/g, "");
  html = html.replace(/<li>\s*<\/li>/g, "");
  html = html.replace(/<(?:ul|ol)>\s*<\/(?:ul|ol)>/g, "");

  html = html.replace(/<p[^>]*>([^<]*)<\/p>/g, (match, text) => (pLooksLikeHeading(text) ? `<h2>${text.trim()}</h2>` : match));

  const parts = html.split(/(<\/?p(?:\s[^>]*)?>)/g);
  const out: string[] = [];
  let awaiting = false;
  let listItems: string[] | null = null;
  const shortLine = (text: string) => {
    const t = text.trim();
    return t.length > 0 && t.length <= 110 && t.split(/\s+/).length <= 13 && !/^\s*$/.test(t);
  };
  const flush = () => {
    if (listItems && listItems.length >= 3) out.push(`<ol>${listItems.map((item) => `<li>${item}</li>`).join("")}</ol>`);
    else if (listItems) for (const item of listItems) out.push(`<p>${item}</p>`);
    listItems = null;
  };
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const open = /^<p(?:\s[^>]*)?>$/.test(part) && i + 2 < parts.length && /^<\/p>$/.test(parts[i + 2]);
    if (open) {
      const text = parts[i + 1] ?? "";
      const isLeadIn = STEP_LEADIN_RE.test(text.trim());
      if (isLeadIn) {
        flush();
        out.push(`<p>${text}</p>`);
        awaiting = true;
      } else if (awaiting && shortLine(text) && !STEP_SUMMARY_RE.test(text.trim())) {
        listItems = listItems ?? [];
        listItems.push(text.trim());
      } else {
        flush();
        awaiting = false;
        out.push(`<p>${text}</p>`);
      }
      i += 2;
    } else {
      if (/^<h[23][^>]*>/.test(part)) {
        flush();
        awaiting = false;
      }
      out.push(part);
    }
  }
  flush();
  return out.join("");
}

function buildSpecificTags(title: string, content: string): string[] {
  const source = `${title} ${content}`.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = source.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9'-]/g, "")).filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  const bigrams: string[] = [];
  for (let i = 0; i + 1 < words.length; i += 1) {
    if (!GENERIC_WORDS.has(words[i]) && !GENERIC_WORDS.has(words[i + 1])) bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  const singles = [...new Set(words.filter((w) => !GENERIC_WORDS.has(w)))];
  const ranked = [...new Set(bigrams)].slice(0, 6);
  const fillers = singles.filter((w) => !ranked.some((r) => r.includes(w))).slice(0, Math.max(0, 8 - ranked.length));
  const combined = [...ranked, ...fillers];
  const out: string[] = [];
  for (const tag of combined) {
    const label = titleCasePhrase(tag);
    if (!out.some((existing) => existing.toLowerCase() === label.toLowerCase())) out.push(label.length > 28 ? `${label.slice(0, 25).trim()}...` : label);
    if (out.length >= 8) break;
  }
  if (!out.length) {
    const fallback = title.toLowerCase().replace(/\s+/g, " ").split(/\s+/).slice(0, 4);
    out.push(...fallback.map(titleCase));
  }
  return out.slice(0, 8);
}

const TOPIC_STOP = new Set([...GENERIC_WORDS, "simplify", "simplifies", "simplified", "improve", "improves", "improving", "improvement", "important", "benefit", "benefits", "help", "helps", "easy", "easier", "faster", "better", "guide", "guided", "manual", "manually", "process", "processes", "workflow", "workflows", "typical", "simple", "simpler", "management", "manage", "managing", "start", "starter", "practice", "practical", "practically", "introduction", "step", "steps", "digital", "online", "best", "great", "need", "needs", "want", "wants", "know", "thing", "things", "way", "ways", "point", "points", "get", "make", "made", "use", "used", "using", "work", "works", "write", "paper", "print", "create", "send", "sign", "review", "read", "reading", "examples", "example", "values"]);

function bestSubject(title: string, plain: string): { subject: string; angle: string } {
  const titleTokens = title.toLowerCase().replace(/[^a-z0-9'-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const freq = new Map<string, number>();
  for (const word of plain.toLowerCase().replace(/[^a-z0-9'-]+/g, " ").split(/\s+/)) {
    const w = word.replace(/^'|'$/g, "");
    if (!w || w.length <= 2 || STOP_WORDS.has(w) || TOPIC_STOP.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const stem = (w: string) => w.replace(/ies$/, "y").replace(/s$/, "");
  const countOf = (w: string) => {
    const s = stem(w);
    let n = 0;
    for (const [key, val] of freq) {
      const k = stem(key);
      if (k === s || key.includes(s) || s.includes(k)) n += val;
    }
    return n;
  };
  const scored = titleTokens
    .map((token, index) => ({ token, index, count: countOf(token) }))
    .filter((entry) => entry.count >= 1 && !STOP_WORDS.has(entry.token) && !TOPIC_STOP.has(entry.token));
  if (!scored.length) return { subject: "this topic", angle: "" };
  const max = Math.max(...scored.map((entry) => entry.count));
  const cut = max * 0.55;
  const eligible = scored.filter((entry) => entry.count >= cut).sort((a, b) => a.index - b.index);
  const subject = eligible[0].token;
  const rest = scored
    .filter((entry) => entry.token !== subject)
    .sort((a, b) => b.count - a.count || a.index - b.index);
  const angle = rest.find((entry) => entry.count >= 2)?.token ?? "";
  return { subject, angle };
}

const plainTextOf = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function extractSections(html: string): { heading: string; level: 2 | 3; text: string }[] {
  const healed = healContentHtml(html).replace(/<ol[^>]*>[\s\S]*?<\/ol>/g, (list) => list.replace(/<li>\s*([^<]*)\s*<\/li>/g, (_mm, t) => `<p>${t.trim()}</p>`));
  const matches = Array.from(healed.matchAll(/<h([23])[^>]*>([^<]*)<\/h[23]>/gi));
  const sections: { heading: string; level: 2 | 3; text: string }[] = [];
  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? healed.length) : healed.length;
    const raw = healed.slice(start, end);
    sections.push({ heading: match[2].trim(), level: Number(match[1]) as 2 | 3, text: raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() });
  });
  return sections;
}

const capFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const decapFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const singularOf = (w: string) => (w.length > 3 ? w.replace(/([^aeiou])s$/i, "$1") : w);
const toArticle = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");

function headingToQuestion(heading: string, subject: string): string | null {
  const h = heading.trim();
  if (!h) return null;
  if (/^(conclusion|summary|next steps?|recap|wrap[ -]?up|introduction|references?|faqs?)$/i.test(h)) return null;
  if (/\?\s*$/.test(h)) return h.replace(/\s+$/, "");
  if (/^how\s+/i.test(h)) return `How do ${decapFirst(h.replace(/^how\s+/i, "")).toLowerCase()}?`;
  if (/^(save|reduce|avoid|keep|improve|cancel|update|track|organize|simplify|speed[ ]?up)\s+/i.test(h)) {
    const verb = ((h.match(/^(save|reduce|avoid|keep|improve|cancel|update|track|organize|simplify|speed[ ]?up)\s+/i) ?? [])[0] as string).toLowerCase().trim();
    const rest = decapFirst(h.replace(new RegExp(`^${verb}\\s+`, "i"), "")).toLowerCase();
    return `How can ${subject} ${verb} ${rest}?`;
  }
  if (h.split(/\s+/).length <= 9 && !/[.;:,]$/.test(h)) return `What is ${decapFirst(h)}?`;
  return null;
}

function uniqueSentences(sents: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sents) {
    const key = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (key.length >= 12 && !seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
  }
  return out;
}

function bestSentsForQuestion(question: string, plain: string): string[] {
  const words = question.toLowerCase().replace(/[^a-z0-9'-]+/g, " ").split(/\s+/).filter((w) => w.length > 3);
  const sents = uniqueSentences(sentences(plain));
  return sents
    .map((s) => ({ s, n: words.reduce((acc, w) => acc + (s.toLowerCase().includes(w) ? 1 : 0), 0) }))
    .sort((a, b) => b.n - a.n)
    .map((x) => x.s);
}

function buildFaqs(title: string, content: string): BlogFaq[] {
  const plain = plainTextOf(content);
  const sents = uniqueSentences(sentences(plain));
  const sections = extractSections(content);
  const { subject, angle } = bestSubject(title, plain);
  const used = new Set<string>();
  const faqs: BlogFaq[] = [];
  const push = (question: string, candidates: string[]): boolean => {
    const q = question.replace(/\s{2,}/g, " ").trim();
    if (!q || faqs.some((f) => f.question.toLowerCase() === q.toLowerCase())) return false;
    let answer: string | null = null;
    for (const candidate of uniqueSentences(candidates)) {
      const key = candidate.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!used.has(key)) {
        used.add(key);
        answer = candidate.length > 260 ? `${candidate.slice(0, 256).trimEnd()}...` : candidate;
        break;
      }
    }
    if (!answer) return false;
    faqs.push({ question: q, answer });
    return true;
  };

  for (const section of sections) {
    const question = headingToQuestion(section.heading, subject);
    if (question) push(question, uniqueSentences(sentences(section.text)).concat(sents));
  }

  if (subject !== "this topic") {
    const singular = singularOf(subject);
    const fallbacks: Array<[string, string[]]> = [
      [`What is ${toArticle(singular)} ${singular}?`, sents],
      [angle ? `How do ${subject} help with ${angle}?` : `How do ${subject} help?`, bestSentsForQuestion(`how ${subject} help`, plain)],
      [`How do I get started with ${subject}?`, bestSentsForQuestion(`get started ${subject}`, plain)],
      [`Who benefits most from using ${subject}?`, bestSentsForQuestion(`benefit ${subject}`, plain)],
      [`How much time can using ${subject} save?`, bestSentsForQuestion(`save time ${subject}`, plain)],
      [`What should I avoid when working with ${subject}?`, bestSentsForQuestion(`avoid mistake ${subject}`, plain)],
    ];
    for (const [q, pool] of fallbacks) {
      if (faqs.length >= 4) break;
      push(q, pool);
    }
  }

  let guard = 0;
  while (faqs.length < 4 && sents.length > 0 && guard < sents.length * 2) {
    const candidate = sents[guard % sents.length];
    push(`What else should I know about ${subject === "this topic" ? "this topic" : subject}?`, [candidate]);
    guard += 1;
  }

  return faqs.slice(0, 6);
}

function buildSeoOptions(title: string, content: string): { meta_titles: string[]; meta_descriptions: string[] } {
  const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const sents = sentences(text);
  const cleanTitle = title.replace(/\s+/g, " ").trim();
  const topic = titleCasePhrase(cleanTopic(title).split(/\s+/).slice(0, 5).join(" ")) || cleanTitle || "this guide";
  const clampTitle = (value: string) => (value.length > 60 ? `${value.slice(0, 57).trim()}...` : value);
  const titles = uniqueNonEmpty([
    clampTitle(cleanTitle),
    clampTitle(`${topic}: Step-by-Step Guide`),
    clampTitle(`${topic} - How to Get It Right`),
    clampTitle(`Guide: ${cleanTitle}`),
  ]).slice(0, 3);
  const d1 = sents[0] ?? `Learn everything about ${topic} in one practical, step-by-step guide.`;
  const d2 = sents.length > 1 ? `${sents[0]} ${sents[1]}` : d1;
  const d3 = `Practical guide covering ${topic} with clear steps, real examples and common mistakes to avoid.`;
  const clampDesc = (value: string) => {
    const one = value.replace(/\s+/g, " ").trim();
    return one.length > 160 ? `${one.slice(0, 156).trim()}...` : one;
  };
  const descriptions = uniqueNonEmpty([d1, d2, d3]).map(clampDesc).slice(0, 3);
  return { meta_titles: titles, meta_descriptions: descriptions };
}

function buildAiPrompt(request: { kind: "tags" | "faq" | "seo"; title: string; content: string; excerpt?: string }): string {
  const { kind, title, content, excerpt } = request;
  const body = `Title:\n${title}\n\n${excerpt ? `Excerpt:\n${excerpt}\n\n` : ""}Content:\n${content}`;
  if (kind === "tags") {
    return `You are a blog topic-tagging assistant. Study the title and content below and return ONLY a valid JSON array of 5 to 8 short, specific, content-relevant tags (2-3 word phrases preferred; avoid generic single words like "business" or "tool"). No extra text.\n\n${body}`;
  }
  if (kind === "faq") {
    return `You are a blog FAQ writer working from the FULL article content provided below.

Rules:
- Identify the real subject of the article from the title and the content itself. For a post about e-signatures and invoice management, use topics like "e-signature", "invoice approval", "paperwork", "customer sign-off" — never treat a generic placeholder word such as "Business" as the topic.
- Write 4 to 6 distinct, practical FAQ items that are specific to THIS article (e.g. what the subject is, how it helps, how much time it saves, how to get started, who benefits, what to avoid).
- Every answer must be accurate to the content and written for its OWN question. Never reuse the same answer for two different questions.
- Return ONLY valid JSON matching [{"question": string, "answer": string}], with 2-3 sentence answers. No extra text.\n\n${body}`;
  }
  return `You are a blog SEO copywriter. Study the title and content below and return ONLY valid JSON matching {"meta_titles": [3 strings that are clear to read near 50-60 characters], "meta_descriptions": [3 strings near 150-160 characters]}. No extra text.\n\n${body}`;
}

function respondOfflineAi(request: { kind: "tags" | "faq" | "seo"; title: string; content: string }): string {
  if (request.kind === "tags") return JSON.stringify(buildSpecificTags(request.title, request.content));
  if (request.kind === "faq") return JSON.stringify(buildFaqs(request.title, request.content));
  return JSON.stringify(buildSeoOptions(request.title, request.content));
}

async function runAi(request: { kind: "tags" | "faq" | "seo"; title: string; content: string; excerpt?: string }): Promise<unknown> {
  buildAiPrompt(request);
  const isValidFaq = (value: unknown): boolean => {
    if (!Array.isArray(value)) return false;
    const items = value as Array<{ question?: unknown; answer?: unknown }>;
    if (items.length < 4 || items.length > 6) return false;
    if (!items.every((item) => item && typeof item.question === "string" && item.question.trim() && typeof item.answer === "string" && item.answer.trim())) return false;
    const answers = items.map((item) => (item.answer as string).toLowerCase().replace(/[^a-z0-9]/g, ""));
    return new Set(answers).size >= 4;
  };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = await new Promise<string>((resolve) => {
      const result = respondOfflineAi(request);
      window.setTimeout(() => resolve(result), 350);
    });
    const parsed = JSON.parse(raw);
    if (request.kind !== "faq" || isValidFaq(parsed)) return parsed;
  }
  throw new Error("FAQ output rejected: duplicate or generic answers after retries");
}

function blogDraftFromPaste(raw: string) {
  const text = raw.replace(/\r\n/g, "\n").trim();
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 1);
  const intro = lines[0] ?? "";
  const title = (intro.length > 90 ? `${intro.slice(0, 88).trim()}â€¦` : intro) || "Untitled post";
  const body = lines.slice(1);

  type Block = { tag: "h2"; text: string } | { tag: "p"; text: string } | { tag: "ul"; items: string[] };
  const blocks: Block[] = [];
  let list: string[] | null = null;
  const flush = () => {
    if (list && list.length) blocks.push({ tag: "ul", items: list.slice() });
    list = null;
  };
  const looksLikeHeading = (line: string) => line.length <= 90 && line.split(/\s+/).length <= 9 && !/[.!?:;,]$/.test(line) && /[A-Za-z0-9]/.test(line);
  for (const line of body) {
    const item = line.match(/^(?:[-*\u2022]\s+|\d+[.)]\s+)(.*)$/)?.[1].trim();
    if (item) {
      list = list ?? [];
      list.push(item);
      continue;
    }
    flush();
    blocks.push(looksLikeHeading(line) && blocks.length ? { tag: "h2", text: line } : { tag: "p", text: line });
  }
  flush();

  const content = blocks.length
    ? blocks.map((block) => block.tag === "h2" ? `<h2>${escapeHtml(block.text)}</h2>` : block.tag === "p" ? `<p>${escapeHtml(block.text)}</p>` : `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`).join("")
    : `<p>${escapeHtml(intro)}</p>`;
  const listed = sentences(text || intro);
  const excerpt = (listed[1] ?? listed[0] ?? intro).slice(0, 160);
  const words = body.join(" ").split(/\s+/).filter(Boolean).length || text.split(/\s+/).filter(Boolean).length;
  const readTime = `${Math.max(1, Math.round(words / 200))} min read`;
  return { title, slug: slugify(title), content, excerpt, readTime };
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

function useLocalBlogPosts(base: BlogPost[]) {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    try {
      const saved = localStorage.getItem("office-toolkit-local-blogs");
      return saved ? JSON.parse(saved) as BlogPost[] : [];
    } catch {
      return [];
    }
  });
  const addPost = (post: BlogPost) => {
    const next = [post, ...posts];
    setPosts(next);
    try { localStorage.setItem("office-toolkit-local-blogs", JSON.stringify(next)); } catch { /* ignore */ }
  };
  const deletePost = (slug: string) => {
    const next = posts.filter((p) => p.slug !== slug);
    setPosts(next);
    try { localStorage.setItem("office-toolkit-local-blogs", JSON.stringify(next)); } catch { /* ignore */ }
  };
  const allPosts = [...posts, ...base];
  return { posts: allPosts, localPosts: posts, addPost, deletePost };
}


function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export { AdminPage, BlogPage, AdminLoginPage };
