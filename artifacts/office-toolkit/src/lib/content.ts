export type BlogFaq = { question: string; answer: string };

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  content: string;
  author?: string;
  tags?: string[];
  imageUrl?: string;
  imageAlt?: string;
  pdfUrl?: string;
  coverEnabled?: boolean;
  faq?: BlogFaq[];
  seo?: { metaTitle?: string; metaDescription?: string };
  published?: boolean;
};

export type SignatureTemplate = {
  id: string;
  name: string;
  font: string;
  description: string;
};

export type CurrencyOption = {
  code: string;
  symbol: string;
  name: string;
};

export type OfficeToolkitContent = {
  blogPosts: BlogPost[];
  signatureTemplates: SignatureTemplate[];
  currencies: CurrencyOption[];
};

import { useEffect, useState } from "react";

const signatureFamilies = [
  ["Cursive", "cursive", "A fluid, handwritten feel"],
  ["Classic", "serif", "A confident formal line"],
  ["Modern", "display", "Clean and unmistakable"],
  ["Monogram", "mono", "Compact and distinctive"],
  ["Ledger", "serif", "Measured and professional"],
  ["Studio", "display", "Bold with a creative edge"],
];
export const generatedSignatureTemplates: SignatureTemplate[] = Array.from({ length: 24 }, (_, index) => {
  const [family, font, description] = signatureFamilies[index % signatureFamilies.length];
  const number = Math.floor(index / signatureFamilies.length) + 1;
  return { id: `signature-${index + 1}`, name: number === 1 ? family : `${family} ${number}`, font, description };
});

export const professionalSignatureFonts = [
  ["Great Vibes", "Great Vibes, cursive", "Graceful, flowing calligraphy"],
  ["Dancing Script", "Dancing Script, cursive", "Playful yet refined handwriting"],
  ["Allura", "Allura, cursive", "Elegant slim script"],
  ["Pacifico", "Pacifico, cursive", "Warm rounded signature"],
  ["Sacramento", "Sacramento, cursive", "Light and airy cursive"],
  ["Parisienne", "Parisienne, cursive", "Sophisticated calligraphic"],
  ["Playball", "Playball, cursive", "Bold sporting script"],
  ["Tangerine", "Tangerine, cursive", "Intricate elegant flourishes"],
  ["Alex Brush", "Alex Brush, cursive", "Smooth connected brushstroke"],
  ["Italianno", "Italianno, cursive", "Refined flowing italic"],
  ["Eagle Lake", "Eagle Lake, cursive", "Distinctive handwritten stroke"],
  ["Mrs Saint Delafield", "Mrs Saint Delafield, cursive", "Delicate formal calligraphy"],
] as const;

export const fallbackContent: OfficeToolkitContent = {
  blogPosts: [
    {
      id: "getting-paid-faster",
      slug: "getting-paid-faster",
      title: "A better invoice is a better handoff",
      excerpt: "Small details in your invoice can remove the uncertainty that slows down payment.",
      category: "Work habits",
      readTime: "5 min read",
      publishedAt: "2026-08-30",
      content: "A good invoice answers the next question before your client has to ask it.\n\nInclude a clear invoice number, a specific due date, plain-language line items, and the payment details your client needs. The goal is not to make a document look complicated. The goal is to make the next action obvious.\n\nWhen the invoice feels considered, it quietly communicates that the work behind it is considered too.",
      seo: { metaTitle: "Better Invoices Get Paid Faster – 3 Tips", metaDescription: "Small invoice details remove the uncertainty that slows down payment. Learn what to include so your client acts fast, plus a free invoice generator." },
    },
    {
      id: "resume-that-gets-read",
      slug: "resume-that-gets-read",
      title: "How to make a resume easier to read",
      excerpt: "Recruiters skim first. A thoughtful hierarchy helps the right details survive the first pass.",
      category: "Career",
      readTime: "6 min read",
      publishedAt: "2026-08-30",
      content: "A resume is not a full autobiography. It is a clear invitation to continue the conversation.\n\nUse familiar section labels, keep your strongest experience near the top, and make every bullet earn its space. A strong bullet usually starts with an action, names the work, and gives the reader a result or useful scale.\n\nKeep the formatting calm. One readable typeface, consistent dates, and generous line spacing will do more for comprehension than a crowded collection of decorative elements.",
      seo: { metaTitle: "How to Make a Resume Easier to Read", metaDescription: "Recruiters skim first. Learn a simple resume hierarchy that helps the right details survive the first pass, with clear sections, strong bullets and calm." },
    },
    {
      id: "signing-with-confidence",
      slug: "signing-with-confidence",
      title: "The small details of a professional signature",
      excerpt: "A signature does not need to be elaborate. It needs to be legible, consistent, and easy to place.",
      category: "Documents",
      readTime: "4 min read",
      publishedAt: "2026-08-30",
      content: "The best digital signature is the one that works wherever you need it. Leave enough breathing room around the mark, choose a dark ink for light documents, and test it at the size it will actually appear.\n\nTyping your name can be a useful alternative when you need a repeatable sign-off. Choose a style that feels like you, keep the color consistent, and export with transparency so the image sits naturally on a contract, invoice, or letter.",
      seo: { metaTitle: "Professional E-signature Tips – How to Sign", metaDescription: "A professional e-signature needs to be legible, consistent and easy to place. Simple tips to draw, type and export digital signatures that look clean on." },
    },
    {
      id: "how-to-create-free-electronic-signature",
      slug: "how-to-create-free-electronic-signature",
      title: "How to create a free electronic signature online (step by step)",
      excerpt: "A complete walkthrough of drawing, typing, or uploading a signature and placing it on any document — free, no signup, nothing uploaded.",
      category: "Documents",
      readTime: "8 min read",
      publishedAt: "2026-10-11",
      content: "An electronic signature is simply a mark you make electronically to show agreement. It can be a drawing of your handwritten signature, your typed name in a signature font, or an uploaded image of your wet-ink signature. In most everyday situations — contracts, invoices, offer letters, permission forms — a clear electronic signature is accepted and legally recognized.\n\nOffice Toolkit's E-Signature Maker lets you create and use a signature in three ways, all running locally in your browser with no account required.\n\n## Method 1: Draw your signature\n\n1. Open the E-Signature Maker at https://office-toolkit.vercel.app/e-signature-maker\n2. Select the **Draw** tab\n3. Use your mouse, trackpad, stylus, or finger to draw your signature on the canvas\n4. Adjust the color if needed (black is standard)\n5. Click **Use this signature**\n\n**Tip**: Draw slightly larger than you think you need — you can scale it down when placing on a document, but scaling up loses quality.\n\n## Method 2: Type your signature\n\n1. Select the **Type** tab\n2. Type your full name or initials\n3. Choose from 12 professional signature fonts (Great Vibes, Dancing Script, Allura, Pacifico, Sacramento, Parisienne, Playball, Tangerine, Alex Brush, Italianno, Eagle Lake, Mrs Saint Delafield)\n4. Click **Use this signature**\n\n**Tip**: Typed signatures are ideal when you need a consistently legible mark across many documents.\n\n## Method 3: Upload a signature image\n\n1. Select the **Upload** tab\n2. Click or drag a PNG, JPG, or WebP file of your signature\n3. For best results, use a transparent PNG with a clean white background removed\n4. The tool automatically cleans up the background if needed\n5. Click **Use this signature**\n\n## Placing your signature on a document\n\nOnce you have a signature ready:\n\n1. Click **Upload a document** and select a PDF, PNG, JPG, or WebP file\n2. Your document appears in the viewer — navigate pages if it's a multi-page PDF\n3. Click and drag your signature to the desired position on the page\n4. Use the size slider to scale the signature appropriately\n5. For multi-page PDFs, navigate to other pages and add signatures as needed\n6. Click **Download signed document** and choose PNG, JPG, or PDF\n\n## Using the signature on Word or Excel files\n\nIf your document is a .docx or .xlsx file, use the dedicated tools:\n- **Sign Word Document**: https://office-toolkit.vercel.app/tools/esignature-for-word\n- **Sign Excel File**: https://office-toolkit.vercel.app/tools/esignature-for-excel\n\nThese tools convert your file to PDF with the signature placed, preserving the original layout.\n\n## Key facts to remember\n\n- **Free forever** — no trial, no subscription, no hidden costs\n- **No signup required** — open the tool and start immediately\n- **Private by design** — your documents and signature never leave your browser\n- **Works offline** — after first visit, the tool works without internet\n- **Export formats** — transparent PNG (signature only), signed PDF (signature on document)\n- **No file size limit** — practical limit ~10 MB for browser performance\n\n## FAQ\n\n**Is an electronic signature legally valid?**\nFor most commercial agreements, yes. Electronic signatures meet standards like ESIGN (US) and eIDAS (EU) for everyday contracts. For high-stakes legal matters, consult a lawyer.\n\n**Can I use this for government forms?**\nMany government portals accept electronically signed PDFs. Check the specific agency's requirements.\n\n**Does Office Toolkit store my signature?**\nNo. Everything stays in your browser's memory. Close the tab and nothing remains.\n\n**Can I sign on my phone?**\nYes. The tool works on mobile browsers — draw with your finger, type, or upload from your camera roll.\n\n**What's the best free online signature maker without signup?**\nOffice Toolkit's E-Signature Maker — draw, type, or upload; place on any document; download as PNG or PDF. Completely free, no account, runs locally.",
      author: "Office Toolkit Team",
      tags: ["e-signature", "digital signature", "how-to", "free tools"],
      imageUrl: "/og/e-signature.png",
      imageAlt: "Drawing a signature on a tablet screen",
      seo: { metaTitle: "How to Create a Free Electronic Signature Online (Step by Step)", metaDescription: "Complete guide: draw, type, or upload a signature and place it on any document. Free, no signup, nothing uploaded. Works on PDF, Word, Excel." },
    },
    {
      id: "how-to-make-professional-invoice-free",
      slug: "how-to-make-professional-invoice-free",
      title: "How to make a professional invoice for free (with checklist)",
      excerpt: "Everything you need to create a clean, compliant invoice that gets paid — from line items to GST, currencies to payment terms. Free tool included.",
      category: "Work habits",
      readTime: "9 min read",
      publishedAt: "2026-10-11",
      content: "An invoice is more than a request for payment — it's a record of work delivered, a tax document, and a professional touchpoint. A well-structured invoice answers three questions instantly: what was delivered, how much is owed, and how to pay.\n\nOffice Toolkit's Invoice Generator (https://office-toolkit.vercel.app/invoice-generator) creates professional invoices in your browser — free, no signup, nothing uploaded.\n\n## Invoice checklist — include every item\n\n### 1. Header\n- [ ] **Invoice number** — unique, sequential (e.g., INV-2026-001)\n- [ ] **Date issued** — today's date\n- [ ] **Due date** — e.g., \"Due within 14 days\" or specific date\n- [ ] **Your business name, address, contact**\n- [ ] **Client name, address, contact**\n\n### 2. Line items\nFor each deliverable:\n- [ ] Description (clear, specific)\n- [ ] Quantity\n- [ ] Unit rate\n- [ ] Line total (qty × rate)\n\n### 3. Tax (GST/VAT)\n- [ ] Taxable value (subtotal before tax)\n- [ ] Tax rate per item (e.g., 18% GST)\n- [ ] Tax amount per line\n- [ ] **HSN/SAC codes** (required for GST invoices in India)\n\n### 4. Totals\n- [ ] Subtotal (sum of line totals)\n- [ ] Total tax (CGST + SGST for intrastate, or IGST for interstate)\n- [ ] **Grand total** (subtotal + tax)\n- [ ] **Rounding** (note if rounded, e.g., \"Rounded off: ₹0.50\")\n\n### 5. Payment details\n- [ ] Bank account / UPI ID / payment link\n- [ ] Account holder name\n- [ ] Currency (INR, USD, EUR, GBP, etc.)\n\n### 6. Terms & branding\n- [ ] Payment terms (e.g., \"Payment due within 14 days of invoice date\")\n- [ ] Late payment policy if any\n- [ ] **Your logo** (upload in the generator)\n- [ ] Thank you note or reference to contract/PO\n\n## Step-by-step in the Invoice Generator\n\n1. Open https://office-toolkit.vercel.app/invoice-generator\n2. Fill **Business details** (your name, address, GSTIN if applicable)\n3. Fill **Client details** (name, address, GSTIN)\n4. Add **line items** — description, quantity, rate, GST rate\n5. Upload **logo** (optional but recommended)\n6. Select **currency** (INR, USD, EUR, GBP, CAD, AUD, etc.)\n7. Set **invoice number** and **dates**\n8. Review **live preview** — totals, tax breakdown, layout\n9. Click **Download** — choose PDF, PNG, or JPG\n\n## GST-specific notes (India)\n\n- **B2B invoices**: Must include buyer's GSTIN, HSN codes, CGST/SGST/IGST split\n- **B2C invoices**: Simplified — buyer GSTIN optional, HSN for turnover >5 Cr\n- **Export invoices**: Mark as \"Export without payment of IGST\" or \"With IGST\"\n- **Composition scheme**: Different format — mention \"Composition taxable person\"\n\nThe generator handles all these cases — just pick the right GST rate per item.\n\n## Why use Office Toolkit's Invoice Generator?\n\n- **Free forever** — no subscription, no per-invoice fee\n- **No account** — create and download immediately\n- **Local-first** — financial data never leaves your browser\n- **Multiple currencies** — 15+ supported\n- **GST compliant** — HSN, taxable value, tax on separate lines\n- **Export options** — PDF (print), PNG (email), JPG (compact)\n- **Works offline** after first load\n\n## Free vs paid invoice tools\n\n| Feature | Office Toolkit (Free) | Paid (QuickBooks, Zoho, FreshBooks) |\n|---------|----------------------|--------------------------------------|\n| Cost | $0 | $15–50/month |\n| Recurring invoices | Manual duplicate | Automatic |\n| Payment links (Stripe/PayPal) | No | Yes |\n| Client portal | No | Yes |\n| GST return filing (GSTR-1) | No | Yes |\n| Inventory tracking | No | Yes |\n| Multi-user/team | No | Yes |\n\n**Honest assessment**: Office Toolkit is perfect for freelancers, small businesses, and anyone who needs professional invoices without recurring costs. If you need automation (recurring bills, payment collection, accounting integration, GST return filing), a paid platform is the right choice.\n\n## FAQ\n\n**Can I make an invoice online for free without registering?**\nYes. Office Toolkit's Invoice Generator — fill in details, download PDF/PNG/JPG. No signup.\n\n**Does it support GST invoices with HSN codes?**\nYes. Add HSN per item, set GST rate, see taxable value and tax split on separate lines.\n\n**Can I send the invoice directly to clients?**\nDownload the PDF and email it. The generator creates the document; delivery is up to you.\n\n**What currencies are supported?**\nINR, USD, EUR, GBP, CAD, AUD, SGD, CHF, JPY, CNY, and more.\n\n**Is my invoice data private?**\nYes. All data stays in your browser. Nothing is saved on our servers.\n\n**Can I create a quotation instead?**\nYes. Use the same generator — add a validity date, label it \"Quotation\" or \"Proforma Invoice\", and export. Approved quotes convert to invoices without re-typing.",
      author: "Office Toolkit Team",
      tags: ["invoice", "GST", "billing", "freelancer", "small business", "how-to", "free tools"],
      imageUrl: "/og/invoice.png",
      imageAlt: "Invoice generator preview with line items and tax breakdown",
      seo: { metaTitle: "How to Make a Professional Invoice for Free (With Checklist)", metaDescription: "Step-by-step guide to creating compliant invoices with line items, GST, multiple currencies. Free tool, no signup, exports PDF/PNG/JPG." },
    },
  ],
  signatureTemplates: generatedSignatureTemplates,
  currencies: [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  ],
};

export function useOfficeToolkitContent() {
  const [content, setContent] = useState<OfficeToolkitContent>(fallbackContent);

  useEffect(() => {
    let active = true;
    fetch("/api/content")
      .then((response) => {
        if (!response.ok) throw new Error("Content API unavailable");
        return response.json() as Promise<OfficeToolkitContent>;
      })
      .then((remote) => {
        if (active) setContent({
          ...fallbackContent,
          ...remote,
          blogPosts: remote.blogPosts ?? fallbackContent.blogPosts,
          signatureTemplates: remote.signatureTemplates ?? fallbackContent.signatureTemplates,
          currencies: remote.currencies ?? fallbackContent.currencies,
        });
      })
      .catch(() => {
        // Client-side defaults keep the tools usable if the content service is offline.
      });
    return () => {
      active = false;
    };
  }, []);

  return content;
}

export async function fetchOfficeToolkitContent() {
  const response = await fetch("/api/content");
  if (!response.ok) throw new Error("Content API unavailable");
  return (await response.json()) as OfficeToolkitContent;
}

export async function saveOfficeToolkitContent(content: OfficeToolkitContent) {
  const response = await fetch("/api/content", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  if (!response.ok) throw new Error("Content could not be saved");
  return (await response.json()) as OfficeToolkitContent;
}