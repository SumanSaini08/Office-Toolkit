import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRoutes } from "./seo-data.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const distDir = resolve(root, "dist/public");

function generateSitemap() {
  const routes = buildRoutes();
  const publicRoutes = routes.filter(r =>
    !r.path.startsWith("/admin") && r.path !== "/404"
  );

  const today = new Date().toISOString().split("T")[0];

  const urls = publicRoutes.map(route => {
    const url = `https://office-toolkit.vercel.app${route.path}`;
    const lastmod = route.article?.publishedTime
      ? route.article.publishedTime.split("T")[0]
      : today;
    const changefreq = route.path === "/" ? "weekly" : route.path.startsWith("/blog/") ? "monthly" : "monthly";
    const priority = route.path === "/" ? "1.0" : route.path.startsWith("/blog/") ? "0.8" : "0.9";

    return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  writeFileSync(resolve(distDir, "sitemap.xml"), sitemap);
  console.log(`Generated sitemap.xml with ${publicRoutes.length} URLs`);
}

generateSitemap();