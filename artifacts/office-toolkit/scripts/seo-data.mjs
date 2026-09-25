import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

export const SITE_URL = "https://office-toolkit.vercel.app";

const staticRoutes = [
  {
    path: "/",
    title: "Free Invoice and E-signature Tool – Online Office Tools, No Signup",
    description: "A free invoice and e-signature tool that runs in your browser — no signup, no uploads. Draw or type a signature, build a GST invoice, and export instantly. Simple online office tools for a calmer workday.",
    image: "/og/home.png",
    type: "website",
  },
  {
    path: "/e-signature-maker",
    title: "Free E-signature Online – Sign Documents Without an Account",
    description: "Use a free e-signature online tool to sign PDFs in minutes — upload, draw or type your mark, place it, download. Electronic signature online free, private and instant in your browser.",
    image: "/og/e-signature.png",
    type: "website",
  },
  {
    path: "/invoice-generator",
    title: "Free Invoice Generator Online – GST Invoice, Tax & PDF Export",
    description: "Free invoice generator online — create and download an invoice online free, with GST, tax, line items and your logo. No signup. Private, in your browser.",
    image: "/og/invoice.png",
    type: "website",
  },
  {
    path: "/blog",
    title: "Blog & Guides — Invoice & Signature Tips",
    description: "Practical, ad-free notes on e-signatures, invoices, GST, resumes, and calmer workdays. Fresh guides from the Office Toolkit team, free to read.",
    image: "/og/default.png",
    type: "website",
  },
  { path: "/about", title: "About Us — Local-First Office Tools", description: "Learn why Office Toolkit is a private, browser-first suite of free tools for signatures, invoices, and everyday paperwork. No account, no uploads, local-first.", image: "/og/default.png", type: "website" },
  { path: "/contact", title: "Contact Us — Help, Feedback & Support", description: "Reach the Office Toolkit team with questions, feedback, bug reports, and ideas. We reply personally within one to two business days. Free tools, no account.", image: "/og/default.png", type: "website" },
  { path: "/privacy", title: "Privacy Policy — Your Documents Stay Yours", description: "Learn how Office Toolkit keeps your work private. Our tools are local-first: documents stay on your device and are never uploaded to our servers. No account.", image: "/og/default.png", type: "website" },
];

const toolRoutes = [
  { slug: "esignature-for-pdf", title: "Sign PDF Online Free – No Account Needed", description: "Sign pdf online free — upload the document, draw or type your mark, place it and download a clean signed copy. Fast, private, and no account needed.", image: "/og/e-signature.png" },
  { slug: "esignature-for-word", title: "E-signature for Word Document – Digital Signature Online Free", description: "Add an e-signature for word document in the browser — draw, type or upload your mark, place it anywhere, and export a clean signed PDF. A digital signature online free, private and account-free.", image: "/og/e-signature.png" },
  { slug: "esignature-for-excel", title: "Sign Excel File Online – Electronic Signature Online", description: "Sign Excel file online for free — add an electronic signature online to your .xlsx without touching the data, then export a clean signed PDF. No account or install needed.", image: "/og/e-signature.png" },
  { slug: "esignature-for-contracts", title: "Sign Contract Online Free – Digital Signature for Agreements", description: "Sign contract online free — place signatures, party names and dates on every page, then export a clean signed PDF. A digital signature for agreements that needs no printing or account.", image: "/og/e-signature.png" },
  { slug: "esignature-for-offer-letter", title: "Sign Offer Letter Online – Electronic Signature for HR Documents", description: "Sign offer letter online — company and candidate signatures, role details and date, exported as one clean PDF. An electronic signature for HR documents that keeps hiring fast and paper-free.", image: "/og/e-signature.png" },
  { slug: "gst-invoice-generator", title: "GST Invoice Generator – Free Online", description: "Free GST invoice generator — item rows, HSN codes, taxable value and tax on separate lines. Use the same clean GST invoice format every time and export a PDF. Private, runs in your browser.", image: "/og/invoice.png" },
  { slug: "invoice-format-excel", title: "Invoice Format in Excel – Free Download Template", description: "Download a free invoice format in excel — item rows, GST column and auto-calculating totals. Create consistent bills, reuse the template, and export PDF copies for clients.", image: "/og/invoice.png" },
  { slug: "invoice-format-word", title: "Invoice Format in Word – Free Download Template", description: "Download a free invoice format in word — logo, item table, GST and total in a reusable layout. Make clean bills for small business and export PDF copies for clients.", image: "/og/invoice.png" },
  { slug: "invoice-for-freelancers", title: "Invoice Generator for Freelancers – No Signup, Free", description: "An invoice generator for freelancers that needs no signup — client, project, line items, due date and payment terms exported as a clean PDF. Free to use and ready in minutes.", image: "/og/invoice.png" },
  { slug: "quotation-format", title: "Quotation Format Free Download – Proforma Invoice Template", description: "Get a quotation format free download — client name, items, rates, total and validity in a clean template. Also workable as a proforma invoice format, exported as a PDF with no account.", image: "/og/invoice.png" },
];

function readContent() {
  const file = resolve(root, "../api-server/data/content.json");
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return { blogPosts: [] };
  }
}

export function buildRoutes() {
  const routes = [...staticRoutes];
  for (const tool of toolRoutes) {
    routes.push({ path: `/tools/${tool.slug}`, title: tool.title, description: tool.description, image: tool.image, type: "website" });
  }
  const content = readContent();
  for (const post of content.blogPosts || []) {
    if (post.published === false) continue;
    routes.push({
      path: `/blog/${post.slug}`,
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.excerpt,
      image: post.imageUrl || "/og/default.png",
      type: "article",
      article: {
        publishedTime: post.publishedAt,
        modifiedTime: post.publishedAt,
        author: post.author,
      },
    });
  }
  routes.push({ path: "/404", title: "Page Not Found", description: "The page you are looking for does not exist. Visit Office Toolkit for free e-signature and invoice tools.", image: "/og/default.png", type: "website", robots: "noindex, nofollow" });
  return routes;
}