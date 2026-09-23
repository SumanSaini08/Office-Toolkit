import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";

const STATIC_DIR = path.resolve("./dist/public");
const API_TARGET = "http://127.0.0.1:4000";
const PORT = 4173;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".txt": "text/plain",
  ".pdf": "application/pdf",
  ".map": "application/json",
};

const REMOVED_CITY_SLUGS = ["pehowa", "pundri", "kalayat", "siwan", "cheeka", "rajound", "guhla", "kurukshetra", "jind"];
const CITY_TO_TOOL = new Map([
  ["gurugram", "esignature-for-word"],
  ["faridabad", "esignature-for-excel"],
  ["panipat", "esignature-for-pdf"],
  ["sonipat", "esignature-for-contracts"],
  ["karnal", "esignature-for-offer-letter"],
  ["hisar", "invoice-format-excel"],
  ["ambala", "invoice-format-word"],
  ["rohtak", "gst-invoice-generator"],
  ["yamunanagar", "invoice-for-freelancers"],
  ["panchkula", "quotation-format"],
]);

const OLD_CITY_REDIRECTS = new Map([
  ...REMOVED_CITY_SLUGS.map((slug) => [`/locations/${slug}`, "/"]),
  ...[...CITY_TO_TOOL.entries()].flatMap(([city, tool]) => [
    [`/locations/${city}`, `/tools/${tool}`],
    [`/locations/${city}-invoice-e-signature`, `/tools/${tool}`],
  ]),
]);

function serveStatic(req, res) {
  const parsed = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(parsed.pathname);
  if (OLD_CITY_REDIRECTS.has(pathname)) {
    res.writeHead(301, { Location: OLD_CITY_REDIRECTS.get(pathname), "Cache-Control": "no-store" });
    res.end();
    return;
  }
  if (pathname === "/") pathname = "/index.html";
  let filePath = path.join(STATIC_DIR, pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(STATIC_DIR, "index.html");
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
}

function proxyApi(req, res) {
  const target = new URL(req.url, API_TARGET);
  const proxyReq = http.request(
    target,
    { method: req.method, headers: { ...req.headers, host: new URL(API_TARGET).host } },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "API proxy failed" }));
  });
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  if (req.url?.startsWith("/api/")) {
    proxyApi(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen({ port: PORT, host: "::", ipv6Only: false }, () => {
  console.log(`Preview serving at http://localhost:${PORT}`);
});
