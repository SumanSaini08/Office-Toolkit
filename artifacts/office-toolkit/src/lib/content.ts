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
      seo: { metaTitle: "How to Make a Resume Easier to Read", metaDescription: "Recruiters skim first. Learn a simple resume hierarchy that helps the right details survive the first pass, with clear sections, strong bullets and calm formatting." },
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
      seo: { metaTitle: "Professional E-signature Tips – How to Sign", metaDescription: "A professional e-signature needs to be legible, consistent and easy to place. Simple tips to draw, type and export digital signatures that look clean on contracts." },
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