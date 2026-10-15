import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

export const SITE_URL = "https://office-toolkit.vercel.app";

const staticRoutes = [
  {
    path: "/",
    title: "Free Digital Signature & Invoice Maker Online - No Signup",
    description: "Create a free online signature and make professional PDF invoices in seconds. No signup, no uploads, works right in your browser.",
    image: "/og/home.png",
    type: "website",
  },
  {
    path: "/e-signature-maker",
    title: "Free Online Signature Maker - Draw or Type E-Sign",
    description: "Draw or type your signature online and download it as a transparent PNG. 100% free, no signup, private and instant.",
    image: "/og/e-signature.png",
    type: "website",
  },
  {
    path: "/invoice-generator",
    title: "Free Invoice Generator - Make a PDF Invoice Online",
    description: "Create professional invoices with your logo, tax and currency. Download as PDF, PNG or JPG. Free, no signup, nothing is uploaded.",
    image: "/og/invoice.png",
    type: "website",
  },
  {
    path: "/blog",
    title: "Blog & Guides on E-Signatures and Invoices",
    description: "Practical, ad-free guides on e-signatures, invoices, GST and getting paid faster — plus resume tips. Free to read, no signup, from the Office Toolkit team.",
    image: "/og/default.png",
    type: "website",
  },
  { path: "/tools", title: "Free Online Office Tools - All in One Place", description: "Browse every free Office Toolkit tool in one place — e-signatures for PDF, Word, Excel and contracts, plus invoice, GST, quotation and freelance billing tools. No signup.", image: "/og/default.png", type: "website" },
  { path: "/about", title: "About Office Toolkit - Free Browser Tools, No Signup", description: "Office Toolkit is a free, browser-first suite of tools for e-signatures and invoices. No account, no uploads, no data harvesting — your work stays on your device.", image: "/og/default.png", type: "website" },
  { path: "/contact", title: "Contact Us - Office Toolkit Help & Feedback", description: "Questions, feedback, bug reports or ideas — reach the Office Toolkit team and we reply personally within one to two business days. Free tools, no account.", image: "/og/default.png", type: "website" },
  { path: "/privacy", title: "Privacy Policy - Local-First, Nothing Uploaded", description: "Your documents stay yours. Office Toolkit is local-first: no account, no uploads, and nothing is processed on a server. See how we keep your work private.", image: "/og/default.png", type: "website" },
];

const toolRoutes = [
  { slug: "esignature-for-pdf", title: "Sign PDF Online Free – No Account Needed", description: "Sign a PDF online for free — upload the document, draw or type your mark, place it and download a clean signed copy. Fast, private and no account needed.", image: "/og/e-signature.png" },
  { slug: "esignature-for-word", title: "Add Signature to Word Document Free - E-Sign Docx", description: "Add a signature to a Word document free — draw, type or upload your mark, place it, and download a clean signed PDF. No signup, nothing uploaded.", image: "/og/e-signature.png" },
  { slug: "esignature-for-excel", title: "Sign Excel Online – E-signature for XLSX", description: "Sign an Excel (.xlsx) file online for free — add an electronic signature without touching the data, then export a clean signed PDF. No account or.", image: "/og/e-signature.png" },
  { slug: "esignature-for-contracts", title: "Sign Contracts Online Free – E-signature", description: "Sign a contract online free — place signatures, party names and dates on every page, then export a clean signed PDF. A digital signature for agreements.", image: "/og/e-signature.png" },
  { slug: "esignature-for-offer-letter", title: "Sign Offer Letter Online – E-signature", description: "Sign an offer letter online — company and candidate signatures, role details and dates, exported as one clean PDF. Electronic signatures for HR.", image: "/og/e-signature.png" },
  { slug: "gst-invoice-generator", title: "GST Invoice Generator – Free Online", description: "Free GST invoice generator — item rows, HSN codes, taxable value and tax on separate lines. Use the same clean GST invoice format every time and export.", image: "/og/invoice.png" },
  { slug: "invoice-format-excel", title: "Invoice Format in Excel – Free Download", description: "Download a free invoice format in Excel — item rows, a GST column and auto-calculating totals. Create consistent bills, reuse the template and export.", image: "/og/invoice.png" },
  { slug: "invoice-format-word", title: "Invoice Format in Word – Free Download", description: "Download a free invoice format in Word — logo, item table, GST and total in a reusable layout. Make clean bills for small business and export PDF copies.", image: "/og/invoice.png" },
  { slug: "invoice-for-freelancers", title: "Freelancer Invoice Generator – No Signup", description: "An invoice generator for freelancers with no signup — client, project, line items, due date and payment terms exported as a clean PDF. Free, fast and.", image: "/og/invoice.png" },
  { slug: "quotation-format", title: "Quotation Format – Free Download Template", description: "Get a quotation format free download — client name, items, rates, total and validity in a clean template. Works as a proforma invoice format too, no.", image: "/og/invoice.png" },
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