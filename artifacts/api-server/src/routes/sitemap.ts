import { Router, type IRouter } from "express";
import { readContent, type BlogPost } from "./content";

// Canonical public origin. Override with SITE_URL if the domain ever changes.
const SITE_URL = (process.env.SITE_URL ?? "https://officetoolkit.app").replace(/\/+$/, "");

// Tool-format/use-case pages mirror src/lib/tools.ts in the web client.
const toolSlugs = [
  "esignature-for-word",
  "esignature-for-excel",
  "esignature-for-pdf",
  "esignature-for-contracts",
  "esignature-for-offer-letter",
  "invoice-format-excel",
  "invoice-format-word",
  "gst-invoice-generator",
  "invoice-for-freelancers",
  "quotation-format",
];

// Static pages and tools use the deploy/build date (server start).
const DEPLOY_DATE = new Date().toISOString().slice(0, 10);

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function url(loc: string, lastmod: string) {
  return `  <url>\n    <loc>${SITE_URL}${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(lastmod ?? DEPLOY_DATE)}</lastmod>\n  </url>`;
}

const router: IRouter = Router();

router.get("/sitemap.xml", async (_req, res) => {
  try {
    const content = await readContent();
    const blogEntries = content.blogPosts
      .filter((post: BlogPost) => post.published !== false)
      .map((post: BlogPost) => url(`/blog/${post.slug}`, post.publishedAt || DEPLOY_DATE));

    const body = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      url("/", DEPLOY_DATE),
      url("/e-signature-maker", DEPLOY_DATE),
      url("/invoice-generator", DEPLOY_DATE),
      ...toolSlugs.map((slug) => url(`/tools/${slug}`, DEPLOY_DATE)),
      url("/blog", DEPLOY_DATE),
      ...blogEntries,
      url("/about", DEPLOY_DATE),
      url("/contact", DEPLOY_DATE),
      url("/privacy", DEPLOY_DATE),
      "</urlset>",
    ].join("\n");

    res.type("application/xml");
    res.send(body);
  } catch {
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?>\n<error>could not generate sitemap</error>');
  }
});

export default router;