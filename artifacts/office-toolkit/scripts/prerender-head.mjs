import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRoutes, SITE_URL } from "./seo-data.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "../dist/public");

const STOCK_HEAD = [
  '<meta charset="UTF-8" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1" />',
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHead(route) {
  const url = `${SITE_URL}${route.path}`;
  const image = /^https?:\/\//i.test(route.image) ? route.image : `${SITE_URL}${route.image}`;
  const title = route.title;
  const lines = [
    "<title>" + esc(title) + "</title>",
    '<meta name="description" content="' + esc(route.description) + '" />',
    '<meta name="robots" content="' + esc(route.robots || "index, follow") + '" />',
    '<link rel="canonical" href="' + esc(url) + '" />',
    '<meta property="og:site_name" content="Office Toolkit" />',
    '<meta property="og:locale" content="en_US" />',
    '<meta property="og:title" content="' + esc(title) + '" />',
    '<meta property="og:description" content="' + esc(route.description) + '" />',
    '<meta property="og:type" content="' + esc(route.type || "website") + '" />',
    '<meta property="og:url" content="' + esc(url) + '" />',
    '<meta property="og:image" content="' + esc(image) + '" />',
    '<meta property="og:image:secure_url" content="' + esc(image) + '" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:image:alt" content="' + esc(title) + '" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="twitter:title" content="' + esc(title) + '" />',
    '<meta name="twitter:description" content="' + esc(route.description) + '" />',
    '<meta name="twitter:image" content="' + esc(image) + '" />',
  ];
  if (route.article) {
    lines.push('<meta property="article:published_time" content="' + esc(route.article.publishedTime) + '" />');
    lines.push('<meta property="article:modified_time" content="' + esc(route.article.modifiedTime || route.article.publishedTime) + '" />');
    lines.push('<meta property="article:author" content="' + esc(route.article.author || "Office Toolkit") + '" />');
  }
  return lines.join("\n    ");
}

const base = readFileSync(resolve(dist, "index.html"), "utf8");

const stripMeta = (html) =>
  html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta name="description"[^>]*\/?>/i, "")
    .replace(/<meta name="robots"[^>]*\/?>/i, "")
    .replace(/<link rel="canonical"[^>]*\/?>/i, "")
    .replace(/<meta property="og:[^>]*\/?>/gi, "")
    .replace(/<meta name="twitter:[^>]*\/?>/gi, "")
    .replace(/<meta property="article:[^>]*\/?>/gi, "");

const routes = buildRoutes();
const metaByPath = new Map(routes.map((r) => [r.path, r]));

function writeRoute(targetHtml, route, extraBodyHtml = "") {
  const head = buildHead(route);
  const stripped = stripMeta(targetHtml);
  const final = stripped.replace(/(<meta charset="UTF-8" \/>)/, "$1\n    " + head).replace("</body>", extraBodyHtml + "\n  </body>");
  const filePath = route.path === "/" ? resolve(dist, "index.html") : resolve(dist, route.path.slice(1), "index.html");
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, final, "utf8");
  console.log("wrote", filePath.replace(dist, "dist/public"));
}

const NOSCRIPT_404 = "\n    <div style=\"max-width:34rem;margin:10vh auto;padding:0 1.25rem;font-family:system-ui,sans-serif;text-align:center\"><h1 style=\"font-size:2.25rem;margin:0\">Page not found</h1><p style=\"font-size:1rem;line-height:1.6;color:#555\">This page has moved or no longer exists. Keep working: return to the <a href=\"/\">Office Toolkit homepage</a>, browse the <a href=\"/blog\">blog</a>, or open the <a href=\"/e-signature-maker\">e-signature maker</a> or <a href=\"/invoice-generator\">invoice generator</a>.</p></div>\n  ";

for (const route of routes) {
  if (route.path === "/404") continue;
  writeRoute(base, route);
}

const notFoundRoute = routes.find((r) => r.path === "/404");
writeRoute(base, notFoundRoute, NOSCRIPT_404);

writeFileSync(resolve(dist, "404.html"), stripMeta(base).replace(/(<meta charset="UTF-8" \/>)/, "$1\n    " + buildHead(notFoundRoute)).replace("</body>", NOSCRIPT_404 + "</body>"), "utf8");
console.log("wrote dist/public/404.html (noindex, 404 custom page)");
console.log(`\nPrerendered ${routes.length} routes + 404 fallback.`);