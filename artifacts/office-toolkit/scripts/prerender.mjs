import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRoutes } from "./seo-data.mjs";
import { generateSitemap } from "./generate-sitemap.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const distDir = resolve(root, "dist/public");
const indexHtmlPath = resolve(distDir, "index.html");

const baseHtml = readFileSync(indexHtmlPath, "utf8");

function renderRouteHtml(route) {
  const { path, title, description, image, type, article, robots } = route;
  const canonical = `https://office-toolkit.vercel.app${path}`;
  const ogImage = `https://office-toolkit.vercel.app${image}`;
  const robotsContent = robots ?? (path.startsWith("/admin") ? "noindex, nofollow" : "index, follow");
  const jsonLd = generateJsonLd(route);
  const staticBody = generateStaticBody(route);

  let html = baseHtml
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:type" content=".*?" \/>/, `<meta property="og:type" content="${type}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${ogImage}" />`)
    .replace(/<meta property="og:image:secure_url" content=".*?" \/>/, `<meta property="og:image:secure_url" content="${ogImage}" />`)
    .replace(/<meta name="twitter:card" content=".*?" \/>/, `<meta name="twitter:card" content="summary_large_image" />`)
    .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${ogImage}" />`)
    .replace(/<meta name="robots" content=".*?" \/>/, `<meta name="robots" content="${robotsContent}" />`)
    .replace(
      /<meta property="og:site_name" content=".*?" \/>/,
      `<meta property="og:site_name" content="Office Toolkit" />`
    )
    .replace(
      /<meta property="og:locale" content=".*?" \/>/,
      `<meta property="og:locale" content="en_US" />`
    )
    .replace(/<html lang="en">/, `<html lang="en">`)
    .replace(/<div id="root"><\/div>/, `<div id="root">${staticBody}</div>`)
    .replace(/<\/head>/, `<script type="application/ld+json">${jsonLd}</script>\n  </head>`);

  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "'");
}

function generateJsonLd(route) {
  const { path, title, description, image, type, article } = route;
  const canonical = `https://office-toolkit.vercel.app${path}`;
  const ogImage = `https://office-toolkit.vercel.app${image}`;

  if (path === "/") {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "name": "Office Toolkit",
          "url": "https://office-toolkit.vercel.app",
          "logo": "https://office-toolkit.vercel.app/og/home.png",
          "sameAs": []
        },
        {
          "@type": "WebSite",
          "name": "Office Toolkit",
          "url": "https://office-toolkit.vercel.app",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://office-toolkit.vercel.app/tools?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        }
      ]
    });
  }

  if (path === "/blog") {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Office Toolkit Blog",
      "description": description,
      "url": canonical,
      "publisher": {
        "@type": "Organization",
        "name": "Office Toolkit",
        "logo": { "@type": "ImageObject", "url": "https://office-toolkit.vercel.app/og/home.png" }
      }
    });
  }

  if (path.startsWith("/blog/") && article) {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "image": ogImage,
      "datePublished": article.publishedTime,
      "dateModified": article.modifiedTime,
      "author": {
        "@type": "Person",
        "name": article.author
      },
      "publisher": {
        "@type": "Organization",
        "name": "Office Toolkit",
        "logo": { "@type": "ImageObject", "url": "https://office-toolkit.vercel.app/og/home.png" }
      },
      "mainEntityOfPage": { "@type": "WebPage", "@id": canonical }
    });
  }

  if (path.startsWith("/tools/") || path === "/e-signature-maker" || path === "/invoice-generator") {
    const toolName = title.split(" - ")[0].split(" – ")[0];
    const category = path.startsWith("/tools/") || path === "/e-signature-maker" ? "E-Signature" : "Invoice";
    const features = getToolFeatures(path);

    const softwareApp = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": title,
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Any (web browser)",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "description": description,
      "featureList": features,
      "image": ogImage,
      "url": canonical,
      "publisher": {
        "@type": "Organization",
        "name": "Office Toolkit",
        "url": "https://office-toolkit.vercel.app"
      }
    };

    const faq = generateFaq(path);
    const howTo = generateHowTo(path);

    return JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [softwareApp, faq, howTo, generateBreadcrumb(path, title)]
    });
  }

  if (path === "/tools") {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": title,
      "description": description,
      "url": canonical,
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": getToolRoutes().map((t, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "item": {
            "@type": "SoftwareApplication",
            "name": t.title,
            "url": `https://office-toolkit.vercel.app/tools/${t.slug}`,
            "description": t.description
          }
        }))
      }
    });
  }

  if (["/about", "/contact", "/privacy"].includes(path)) {
    const pageType = path === "/contact" ? "ContactPage" : path === "/privacy" ? "PrivacyPolicy" : "AboutPage";
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": pageType,
      "name": title,
      "description": description,
      "url": canonical,
      "publisher": { "@type": "Organization", "name": "Office Toolkit" }
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", "name": title, "description": description, "url": canonical });
}

function getToolFeatures(path) {
  const featureMap = {
    "/e-signature-maker": ["Draw signature", "Type signature", "Upload signature image", "Place on PDF", "Download as PNG", "Download signed PDF"],
    "/invoice-generator": ["Line items with tax", "GST support", "Logo upload", "Multiple currencies", "PDF export", "PNG/JPG export"],
    "/tools/esignature-for-pdf": ["Sign PDF online", "Draw or type signature", "Place anywhere on pages", "Download signed PDF"],
    "/tools/esignature-for-word": ["Sign Word document", "Draw/type/upload signature", "Place in docx", "Download signed PDF"],
    "/tools/esignature-for-excel": ["Sign Excel file", "Preserve data integrity", "Export signed PDF"],
    "/tools/esignature-for-contracts": ["Multi-party signatures", "Date fields", "Page-by-page signing", "Download signed PDF"],
    "/tools/esignature-for-offer-letter": ["Candidate + company signatures", "Role details", "Date fields", "Download PDF"],
    "/tools/gst-invoice-generator": ["GST-compliant format", "HSN codes", "Tax breakdown", "PDF export"],
    "/tools/invoice-format-excel": ["Excel template", "Auto-calculating totals", "GST column", "Reusable"],
    "/tools/invoice-format-word": ["Word template", "Logo placeholder", "Item table", "Export PDF"],
    "/tools/invoice-for-freelancers": ["Project-based billing", "Payment terms", "Client details", "PDF export"],
    "/tools/quotation-format": ["Quotation template", "Validity period", "Proforma support", "PDF export"]
  };
  return featureMap[path] || ["Free to use", "No signup required", "Runs in browser", "Nothing uploaded"];
}

function generateFaq(path) {
  const faqMap = {
    "/e-signature-maker": [
      { q: "Is the e-signature maker really free?", a: "Yes, completely free. No account, no payment, no limits." },
      { q: "Can I use the signature on legal documents?", a: "Our signatures meet e-signature standards for most everyday use. For high-stakes legal matters, consult a lawyer." },
      { q: "Is my document uploaded to your servers?", a: "No. Everything happens in your browser. Your PDF and signature never leave your device." },
      { q: "What formats can I download?", a: "Transparent PNG for the signature alone, or a signed PDF with the signature placed on your document." },
      { q: "Do I need to create an account?", a: "No signup required. Open the tool, create your signature, and download instantly." }
    ],
    "/invoice-generator": [
      { q: "Is the invoice generator free?", a: "Yes, 100% free with no hidden charges." },
      { q: "Does it support GST invoices?", a: "Yes, includes HSN codes, taxable value, CGST/SGST/IGST breakdown." },
      { q: "Can I add my company logo?", a: "Yes, upload your logo and it appears on the generated invoice." },
      { q: "What currencies are supported?", a: "Multiple currencies including INR, USD, EUR, GBP, and more." },
      { q: "Is my invoice data stored anywhere?", a: "No. All data stays in your browser. Nothing is saved on our servers." }
    ],
    "/tools/esignature-for-word": [
      { q: "Can I sign a .docx file directly?", a: "Yes, upload your Word document, add your signature, and download a signed PDF." },
      { q: "Does the original Word file get modified?", a: "No, your original .docx is unchanged. You get a new signed PDF." },
      { q: "Is there a file size limit?", a: "Files up to 10 MB work reliably in the browser." },
      { q: "Can I place the signature on a specific page?", a: "Yes, drag and drop the signature to any position on any page." }
    ]
  };
  const faqs = faqMap[path] || [
    { q: `Is ${path.split("/").pop().replace(/-/g, " ")} free?`, a: "Yes, all Office Toolkit tools are completely free with no signup." },
    { q: "Do I need to upload my files?", a: "No. All processing happens locally in your browser." },
    { q: "Is my data private?", a: "Yes. Nothing leaves your device. We don't store or see your documents." }
  ];
  return {
    "@type": "FAQPage",
    "mainEntity": faqs.map(({ q, a }) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": a }
    }))
  };
}

function generateHowTo(path) {
  const stepMap = {
    "/e-signature-maker": [
      "Upload your PDF or start with a blank page",
      "Create your signature: draw, type, or upload an image",
      "Drag the signature to the desired position on the page",
      "Download the signed PDF or the signature as a transparent PNG"
    ],
    "/invoice-generator": [
      "Fill in your business details and client information",
      "Add line items with descriptions, quantities, rates, and tax",
      "Upload your logo and configure currency/GST settings",
      "Preview the invoice and download as PDF, PNG, or JPG"
    ],
    "/tools/esignature-for-word": [
      "Upload your Word (.docx) document",
      "Create or upload your signature",
      "Place the signature on the desired page and position",
      "Download the signed PDF"
    ]
  };
  const steps = stepMap[path] || [
    "Open the tool in your browser",
    "Follow the on-screen instructions",
    "Download your result"
  ];
  return {
    "@type": "HowTo",
    "name": `How to use ${path.split("/").pop().replace(/-/g, " ")}`,
    "step": steps.map((text, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "text": text
    }))
  };
}

function generateBreadcrumb(path, title) {
  const parts = path.split("/").filter(Boolean);
  const items = [{ "@type": "ListItem", "position": 1, "item": { "@type": "WebPage", "@id": "https://office-toolkit.vercel.app", "name": "Home" } }];
  let currentPath = "";
  parts.forEach((part, i) => {
    currentPath += `/${part}`;
    const isLast = i === parts.length - 1;
    items.push({
      "@type": "ListItem",
      "position": i + 2,
      "item": { "@type": "WebPage", "@id": `https://office-toolkit.vercel.app${currentPath}`, "name": isLast ? title : part.replace(/-/g, " ") }
    });
  });
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items };
}

function getToolRoutes() {
  const routes = buildRoutes();
  return routes.filter(r => r.path.startsWith("/tools/") && r.slug).map(r => ({ slug: r.path.replace("/tools/", ""), title: r.title, description: r.description }));
}

function generateStaticBody(route) {
  const { path, title, description } = route;
  const canonical = `https://office-toolkit.vercel.app${path}`;
  const features = getToolFeatures(path);
  const faqs = generateFaq(path).mainEntity;
  const howToSteps = generateHowTo(path).step;

  if (path === "/") {
    return `
      <h1>Free Digital Signature & Invoice Maker Online</h1>
      <p>Create a free online signature and make professional PDF invoices in seconds. No signup, no uploads, works right in your browser.</p>
      <h2>How it works</h2>
      <ol>
        <li>Open the e-signature maker or invoice generator</li>
        <li>Follow the simple on-screen steps</li>
        <li>Download your signed PDF or invoice instantly</li>
      </ol>
      <h2>Key features</h2>
      <ul>${features.map(f => `<li>${f}</li>`).join("")}</ul>
      <h2>FAQ</h2>
      <dl>${faqs.slice(0, 4).map(f => `<dt>${f.name}</dt><dd>${f.acceptedAnswer.text}</dd>`).join("")}</dl>
    `.trim();
  }

  if (path === "/blog") {
    return `
      <h1>Blog & Guides on E-Signatures and Invoices</h1>
      <p>Practical, ad-free guides on e-signatures, invoices, GST and getting paid faster — plus resume tips. Free to read, no signup.</p>
      <h2>Latest articles</h2>
      <p>Browse our collection of practical guides written by the Office Toolkit team.</p>
      <h2>FAQ</h2>
      <dl>
        <dt>Are the guides free?</dt><dd>Yes, all articles are free to read with no signup.</dt>
        <dt>Who writes these guides?</dt><dd>The Office Toolkit team, based on real user questions.</dt>
      </dl>
    `.trim();
  }

  if (["/about", "/contact", "/privacy"].includes(path)) {
    return `
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <h2>What you&apos;ll find here</h2>
      <ul>${features.map(f => `<li>${f}</li>`).join("")}</ul>
    `.trim();
  }

  return `
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
    <h2>How it works</h2>
    <ol>${howToSteps.map(s => `<li>${escapeHtml(s.text)}</li>`).join("")}</ol>
    <h2>Key features</h2>
    <ul>${features.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
    <h2>FAQ</h2>
    <dl>${faqs.slice(0, 5).map(f => `<dt>${escapeHtml(f.name)}</dt><dd>${escapeHtml(f.acceptedAnswer.text)}</dd>`).join("")}</dl>
  `.trim();
}

function main() {
  if (!existsSync(indexHtmlPath)) {
    console.error("Built index.html not found. Run 'vite build' first.");
    process.exit(1);
  }

  const routes = buildRoutes();
  const publicRoutes = routes.filter(r => !r.path.startsWith("/admin") && r.path !== "/404");

  let created = 0;
  for (const route of publicRoutes) {
    const routeDir = route.path === "/" ? distDir : resolve(distDir, route.path.replace(/^\//, ""));
    mkdirSync(routeDir, { recursive: true });
    const html = renderRouteHtml(route);
    writeFileSync(resolve(routeDir, "index.html"), html);
    created++;
    console.log(`Generated ${route.path}/index.html`);
  }

  // Also write 404.html at root for Vercel
  const notFoundRoute = routes.find(r => r.path === "/404");
  if (notFoundRoute) {
    writeFileSync(resolve(distDir, "404.html"), renderRouteHtml(notFoundRoute));
    console.log("Generated 404.html");
  }

  console.log(`\nPrerender complete: ${created} route pages + 404.html`);

  // Generate sitemap.xml
  generateSitemap();
}

main();